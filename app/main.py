import os
import uuid
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from model import pipeline, UPLOAD_DIR, OUTPUT_DIR

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Job-ID", "Content-Disposition"],
)


@app.get("/")
def home():
    return {"message": "3D Generation API is running. Go to /docs to test."}


@app.get("/health")
def health():
    return {"status": "ok", "service": "3d-generation-api"}


@app.get("/models/{filename}")
def get_model_file(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Model file not found")
    return FileResponse(
        path=str(file_path),
        media_type="model/gltf-binary",
        filename=filename,
    )


@app.post("/generate")
def generate_mesh(
    image: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
):
    job_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(image.filename or "")[1] or ".png"
    input_path = UPLOAD_DIR / f"{job_id}{ext}"

    # Save uploaded image
    with open(input_path, "wb") as f:
        f.write(image.file.read())

    # Run pipeline with explicit error reporting
    try:
        state = pipeline.invoke({
            "job_id": job_id,
            "input_image_path": str(input_path),
            "preprocessed_path": None,
            "user_prompt": prompt,
            "enhanced_prompt": None,
            "raw_mesh_path": None,
            "final_mesh_path": None,
            "face_count": 0,
            "is_valid": False,
            "retry_count": 0,
            "max_retries": 1,
        })
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"3D Pipeline execution error: {str(exc)}"
        )

    final_path = state.get("final_mesh_path")
    if not final_path or not os.path.exists(final_path):
        raise HTTPException(status_code=500, detail="Failed to generate 3D model: output GLB missing.")

    # Return the generated .glb file directly
    return FileResponse(
        path=final_path,
        media_type="model/gltf-binary",
        filename=f"{job_id}.glb",
        headers={
            "X-Job-ID": job_id,
            "Access-Control-Expose-Headers": "X-Job-ID, Content-Disposition",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
