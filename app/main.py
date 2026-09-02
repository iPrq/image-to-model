import os
import uuid
import time
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Literal
from dotenv import load_dotenv

load_dotenv()

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    Form,
    HTTPException,
    BackgroundTasks,
    Query,
    status,
    Request,
)
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import pipeline and dependencies from model.py
from model import (
    pipeline,
    UPLOAD_DIR,
    OUTPUT_DIR,
    MeshState,
    cleanup_temp_files,
    HF_TOKEN,
    HF_SPACE_ID,
    GOOGLE_API_KEY,
)

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("image-to-model")

app = FastAPI(
    title="Image to 3D Model API",
    description=(
        "Production-grade 3D mesh generation API powered by LangGraph, "
        "Gemini 1.5 Flash VLM prompt enhancement, and Tencent Hunyuan3D-2."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for web clients, frontend viewers (Three.js/Babylon.js/ModelViewer)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for async background jobs
jobs_db: Dict[str, Dict[str, Any]] = {}

SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    hf_token_configured: bool = Field(..., example=True)
    google_api_key_configured: bool = Field(..., example=True)
    hunyuan_space_id: str = Field(..., example="tencent/Hunyuan3D-2")


class GenerateResult(BaseModel):
    job_id: str
    status: str
    user_prompt: Optional[str] = None
    enhanced_prompt: Optional[str] = None
    face_count: int = 0
    is_valid: bool = True
    retry_count: int = 0
    download_glb_url: str
    raw_glb_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    elapsed_seconds: float = 0.0


class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    created_at: float
    updated_at: float
    result: Optional[GenerateResult] = None
    error: Optional[str] = None


class MessageResponse(BaseModel):
    message: str
    job_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def validate_image_upload(file: UploadFile) -> str:
    """Validates the uploaded file extension and returns it."""
    ext = Path(file.filename or "upload.png").suffix.lower()
    if ext not in SUPPORTED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Supported formats: {sorted(list(SUPPORTED_IMAGE_EXTENSIONS))}",
        )
    return ext


async def save_upload_file(file: UploadFile, dest_path: Path):
    """Safely saves an uploaded file to disk in chunks."""
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            buffer.write(chunk)


def execute_pipeline(
    job_id: str,
    input_path: str,
    user_prompt: Optional[str],
    max_retries: int = 1,
) -> MeshState:
    """Invokes the LangGraph pipeline synchronously."""
    initial_state: MeshState = {
        "job_id": job_id,
        "input_image_path": input_path,
        "preprocessed_path": None,
        "user_prompt": user_prompt,
        "enhanced_prompt": None,
        "raw_mesh_path": None,
        "final_mesh_path": None,
        "face_count": 0,
        "is_valid": False,
        "retry_count": 0,
        "max_retries": max_retries,
    }
    return pipeline.invoke(initial_state)


async def process_job_in_background(
    job_id: str,
    input_path: str,
    user_prompt: Optional[str],
    max_retries: int,
    base_url: str,
):
    """Background task worker for processing 3D generation jobs."""
    start_time = time.time()
    jobs_db[job_id]["status"] = "processing"
    jobs_db[job_id]["updated_at"] = start_time

    try:
        # Offload blocking pipeline execution to thread pool
        result_state: MeshState = await asyncio.to_thread(
            execute_pipeline, job_id, input_path, user_prompt, max_retries
        )

        final_path = result_state.get("final_mesh_path")
        if not final_path or not Path(final_path).exists():
            raise RuntimeError("Pipeline completed but final mesh was not generated.")

        elapsed = round(time.time() - start_time, 2)
        gen_result = GenerateResult(
            job_id=job_id,
            status="completed",
            user_prompt=result_state.get("user_prompt"),
            enhanced_prompt=result_state.get("enhanced_prompt"),
            face_count=result_state.get("face_count", 0),
            is_valid=result_state.get("is_valid", False),
            retry_count=result_state.get("retry_count", 0),
            download_glb_url=f"{base_url}download/{job_id}",
            raw_glb_url=f"{base_url}download/{job_id}?mesh_type=raw",
            preview_image_url=f"{base_url}preview/{job_id}",
            elapsed_seconds=elapsed,
        )

        jobs_db[job_id]["status"] = "completed"
        jobs_db[job_id]["result"] = gen_result
        jobs_db[job_id]["updated_at"] = time.time()
        logger.info(f"Job {job_id} successfully completed in {elapsed}s")

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["error"] = str(e)
        jobs_db[job_id]["updated_at"] = time.time()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/", summary="API Information")
async def root(request: Request):
    """Returns general service status and documentation endpoints."""
    return {
        "name": "Image to 3D Model API",
        "description": "Convert 2D images to textured 3D GLB meshes with LLM prompt enhancement.",
        "docs": f"{request.base_url}docs",
        "health": f"{request.base_url}health",
    }


@app.get("/health", response_model=HealthResponse, summary="Health Check")
async def health_check():
    """Checks system readiness, credentials, and Hunyuan3D model configuration."""
    return HealthResponse(
        status="healthy",
        hf_token_configured=bool(HF_TOKEN),
        google_api_key_configured=bool(GOOGLE_API_KEY),
        hunyuan_space_id=HF_SPACE_ID,
    )


@app.post(
    "/generate",
    response_model=GenerateResult,
    summary="Generate 3D Model (Synchronous)",
    description=(
        "Upload an image and optional prompt. The API invokes Gemini VLM to enhance "
        "the prompt for 3D geometry, executes Hunyuan3D-2 inference, repairs and simplifies "
        "the mesh, and returns metadata with download links."
    ),
)
async def generate_model(
    request: Request,
    image: UploadFile = File(..., description="Target image file (PNG, JPG, WEBP)"),
    user_prompt: Optional[str] = Form(
        None, description="Optional user prompt describing the object"
    ),
    max_retries: int = Form(
        1, ge=0, le=3, description="Maximum geometry validation retry attempts"
    ),
):
    ext = validate_image_upload(image)
    job_id = uuid.uuid4().hex[:10]
    input_path = UPLOAD_DIR / f"{job_id}_input{ext}"
    await save_upload_file(image, input_path)

    start_time = time.time()
    try:
        # Offload blocking inference to threadpool
        result_state = await asyncio.to_thread(
            execute_pipeline, job_id, str(input_path), user_prompt, max_retries
        )

        final_path = result_state.get("final_mesh_path")
        if not final_path or not Path(final_path).exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Mesh generation failed to produce an output file.",
            )

        elapsed = round(time.time() - start_time, 2)
        base_url = str(request.base_url)

        return GenerateResult(
            job_id=job_id,
            status="completed",
            user_prompt=result_state.get("user_prompt"),
            enhanced_prompt=result_state.get("enhanced_prompt"),
            face_count=result_state.get("face_count", 0),
            is_valid=result_state.get("is_valid", False),
            retry_count=result_state.get("retry_count", 0),
            download_glb_url=f"{base_url}download/{job_id}",
            raw_glb_url=f"{base_url}download/{job_id}?mesh_type=raw",
            preview_image_url=f"{base_url}preview/{job_id}",
            elapsed_seconds=elapsed,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating mesh for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"3D generation failed: {str(e)}",
        )


@app.post(
    "/generate/download",
    summary="Generate and Directly Download .GLB",
    description="Upload an image and receive the generated .glb binary file directly in the response.",
    response_class=FileResponse,
)
async def generate_and_download(
    image: UploadFile = File(..., description="Target image file (PNG, JPG, WEBP)"),
    user_prompt: Optional[str] = Form(None, description="Optional prompt describing the object"),
    max_retries: int = Form(1, ge=0, le=3, description="Maximum geometry validation retry attempts"),
):
    ext = validate_image_upload(image)
    job_id = uuid.uuid4().hex[:10]
    input_path = UPLOAD_DIR / f"{job_id}_input{ext}"
    await save_upload_file(image, input_path)

    try:
        result_state = await asyncio.to_thread(
            execute_pipeline, job_id, str(input_path), user_prompt, max_retries
        )

        final_path = result_state.get("final_mesh_path")
        if not final_path or not Path(final_path).exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Mesh generation failed to produce output file.",
            )

        return FileResponse(
            path=final_path,
            media_type="model/gltf-binary",
            filename=f"{job_id}_final.glb",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Direct generation download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"3D generation failed: {str(e)}",
        )


@app.post(
    "/jobs",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit Background 3D Generation Job",
    description="Submits generation task as an asynchronous background job and returns immediately with a job ID.",
)
async def create_background_job(
    request: Request,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(..., description="Target image file (PNG, JPG, WEBP)"),
    user_prompt: Optional[str] = Form(None, description="Optional user prompt"),
    max_retries: int = Form(1, ge=0, le=3, description="Max validation retries"),
):
    ext = validate_image_upload(image)
    job_id = uuid.uuid4().hex[:10]
    input_path = UPLOAD_DIR / f"{job_id}_input{ext}"
    await save_upload_file(image, input_path)

    now = time.time()
    job_record = {
        "job_id": job_id,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "result": None,
        "error": None,
    }
    jobs_db[job_id] = job_record

    base_url = str(request.base_url)
    background_tasks.add_task(
        process_job_in_background,
        job_id=job_id,
        input_path=str(input_path),
        user_prompt=user_prompt,
        max_retries=max_retries,
        base_url=base_url,
    )

    return JobStatusResponse(**job_record)


@app.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Get Background Job Status",
    description="Poll status or retrieve results for a background 3D generation job.",
)
async def get_job_status(job_id: str):
    job = jobs_db.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )
    return JobStatusResponse(**job)


@app.get(
    "/download/{job_id}",
    summary="Download Generated 3D Mesh (.glb)",
    description="Download either the final repaired mesh or raw output for a given job ID.",
    response_class=FileResponse,
)
async def download_mesh(
    job_id: str,
    mesh_type: Literal["final", "raw"] = Query("final", description="Mesh version to download"),
):
    target_file = OUTPUT_DIR / f"{job_id}_{mesh_type}.glb"
    if not target_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"3D mesh file '{mesh_type}' not found for job '{job_id}'.",
        )

    return FileResponse(
        path=str(target_file),
        media_type="model/gltf-binary",
        filename=f"{job_id}_{mesh_type}.glb",
    )


@app.get(
    "/preview/{job_id}",
    summary="Get Preprocessed Image",
    description="Retrieve the background-removed, centered preview PNG image used for 3D inference.",
    response_class=FileResponse,
)
async def get_preview_image(job_id: str):
    preview_path = UPLOAD_DIR / f"{job_id}_clean.png"
    if not preview_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preprocessed preview image not found for job '{job_id}'.",
        )

    return FileResponse(
        path=str(preview_path),
        media_type="image/png",
        filename=f"{job_id}_clean.png",
    )


@app.delete(
    "/jobs/{job_id}",
    response_model=MessageResponse,
    summary="Delete Job & Cleanup Files",
    description="Deletes all associated input, preview, and 3D output mesh files from disk.",
)
async def delete_job(job_id: str):
    files_to_clean = [
        UPLOAD_DIR / f"{job_id}_clean.png",
        OUTPUT_DIR / f"{job_id}_raw.glb",
        OUTPUT_DIR / f"{job_id}_final.glb",
    ]
    # Also find any input image with this job_id
    for f in UPLOAD_DIR.glob(f"{job_id}_input.*"):
        files_to_clean.append(f)

    cleanup_temp_files(*[str(p) for p in files_to_clean])
    jobs_db.pop(job_id, None)

    return MessageResponse(
        message=f"All files associated with job '{job_id}' have been deleted.",
        job_id=job_id,
    )


# ---------------------------------------------------------------------------
# Local Dev Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
