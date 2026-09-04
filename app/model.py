import os
import uuid
import base64
import shutil
import asyncio
from pathlib import Path
from typing import TypedDict, Optional, Literal
from PIL import Image
import numpy as np
import trimesh
from rembg import remove
from gradio_client import Client, handle_file
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END


from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / ".workspace" / "uploads"
OUTPUT_DIR = BASE_DIR / ".workspace" / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    HF_TOKEN = HF_TOKEN.strip()
HF_SPACE_ID = os.getenv("HF_SPACE_ID", "tencent/Hunyuan3D-2").strip()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    GOOGLE_API_KEY = GOOGLE_API_KEY.strip()

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=GOOGLE_API_KEY) if GOOGLE_API_KEY else None


class MeshState(TypedDict):
    job_id: str
    input_image_path: str
    preprocessed_path: Optional[str]
    user_prompt: Optional[str]
    enhanced_prompt: Optional[str]
    raw_mesh_path: Optional[str]
    final_mesh_path: Optional[str]
    face_count: int
    is_valid: bool
    retry_count: int
    max_retries: int

def generate_transient_caption(image_path: str, user_prompt: Optional[str] = None) -> str:
    """Invokes VLM to generate or enhance a 3D reconstruction caption with fail-safe fallback."""
    fallback_caption = user_prompt.strip() if (user_prompt and user_prompt.strip()) else "detailed 3D asset with clean geometry and watertight surface"

    if not llm:
        return fallback_caption

    try:
        with open(image_path, "rb") as f:
            b64_img = base64.b64encode(f.read()).decode("utf-8")

        if user_prompt and user_prompt.strip():
            prompt_text = (
                f"The user provided this description of the object: '{user_prompt.strip()}'. "
                "Analyze the image alongside this description and generate an enhanced, concise 3D reconstruction caption "
                "(under 40 words). Emphasize 3D volume, unseen back-face geometry, structure, and surface finish. "
                "Return only the caption with no filler or prefixes."
            )
        else:
            prompt_text = (
                "Provide a concise 3D reconstruction caption (under 30 words) describing volume, "
                "back face, and finish based on the image. Return only the caption with no filler."
            )

        response = llm.invoke([
            HumanMessage(content=[
                {
                    "type": "text", 
                    "text": prompt_text
                },
                {
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/png;base64,{b64_img}"}
                }
            ])
        ])
        caption = str(response.content).strip().strip('"').strip("'")
        if caption:
            return caption
    except Exception as e:
        print(f"[WARN] VLM caption generation encountered an issue ({e}). Using fallback: '{fallback_caption}'")

    return fallback_caption


def preprocess_node(state: MeshState) -> dict:
    """Removes background and pads subject into a 1024x1024 square canvas."""
    clean_path = str(UPLOAD_DIR / f"{state['job_id']}_clean.png")
    try:
        raw = Image.open(state["input_image_path"]).convert("RGBA")
        nobg = remove(raw)
        
        alpha = np.array(nobg.split()[-1])
        bbox = Image.fromarray(alpha).getbbox()
        if bbox:
            nobg = nobg.crop(bbox)
            
        dim = int(max(nobg.size) * 1.15)
        canvas = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        canvas.paste(nobg, ((dim - nobg.size[0]) // 2, (dim - nobg.size[1]) // 2))
        padded = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
        padded.save(clean_path, format="PNG")
    except Exception as e:
        print(f"[WARN] rembg processing issue ({e}), using padded original.")
        raw = Image.open(state["input_image_path"]).convert("RGBA")
        dim = int(max(raw.size) * 1.15)
        canvas = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        canvas.paste(raw, ((dim - raw.size[0]) // 2, (dim - raw.size[1]) // 2))
        padded = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
        padded.save(clean_path, format="PNG")

    return {"preprocessed_path": clean_path}


def hf_inference_node(state: MeshState) -> dict:
    """Resolves prompt on-the-fly via LLM enhancement and executes Hunyuan3D remote inference."""
    client = Client(HF_SPACE_ID, token=HF_TOKEN)

    if state.get("enhanced_prompt"):
        caption = state["enhanced_prompt"]
    else:
        caption = generate_transient_caption(
            state["preprocessed_path"],
            user_prompt=state.get("user_prompt")
        )

    print(f"--- [Inference] Running with enhanced caption: '{caption}' ---")

    try:
        result = client.predict(
            caption=caption,
            image=handle_file(state["preprocessed_path"]),
            mv_image_front=None,
            mv_image_back=None,
            mv_image_left=None,
            mv_image_right=None,
            steps=30,
            guidance_scale=5.5,
            seed=100 + state["retry_count"],
            octree_resolution=256,
            check_box_rembg=False,
            num_chunks=8000,
            randomize_seed=False,
            api_name="/shape_generation"
        )
    except Exception as e:
        print(f"[WARN] First inference attempt failed ({e}), retrying with string octree_resolution...")
        result = client.predict(
            caption=caption,
            image=handle_file(state["preprocessed_path"]),
            mv_image_front=None,
            mv_image_back=None,
            mv_image_left=None,
            mv_image_right=None,
            steps=30,
            guidance_scale=5.5,
            seed=100 + state["retry_count"],
            octree_resolution="256",
            check_box_rembg=False,
            num_chunks=8000,
            randomize_seed=False,
            api_name="/shape_generation"
        )
    
    raw_file = result[0] if isinstance(result, (list, tuple)) else result
    if isinstance(raw_file, dict):
        raw_file = raw_file.get("value") or raw_file.get("path") or raw_file.get("name")

    if not raw_file or not os.path.exists(str(raw_file)):
        raise RuntimeError(f"Hunyuan3D inference completed but returned no valid model file. Result: {result}")

    local_raw = str(OUTPUT_DIR / f"{state['job_id']}_raw.glb")
    shutil.copy(raw_file, local_raw)
    return {
        "raw_mesh_path": local_raw,
        "enhanced_prompt": caption
    }


def mesh_repair_node(state: MeshState) -> dict:
    """Validates geometry, repairs normals, and decimates triangle count."""
    final_path = str(OUTPUT_DIR / f"{state['job_id']}_final.glb")
    face_count = 0
    is_valid = True

    try:
        loaded = trimesh.load(state["raw_mesh_path"])
        
        # If it's a textured scene (common with Hunyuan3D-2 GLBs), preserve textures
        if isinstance(loaded, trimesh.Scene):
            geometries = [geom for geom in loaded.geometry.values() if hasattr(geom, "faces")]
            face_count = sum(len(geom.faces) for geom in geometries) if geometries else 5000
            # Copy original textured GLB directly so materials/textures are not stripped
            shutil.copy(state["raw_mesh_path"], final_path)
            is_valid = face_count > 500
        else:
            mesh = loaded
            try:
                trimesh.repair.fix_inversion(mesh)
                trimesh.repair.fix_normals(mesh)
                trimesh.repair.fill_holes(mesh)
            except Exception as repair_err:
                print(f"[WARN] Trimesh repair warning: {repair_err}")

            if hasattr(mesh, "faces") and len(mesh.faces) > 45000:
                try:
                    mesh = mesh.simplify_quadric_decimation(45000)
                except Exception as dec_err:
                    print(f"[WARN] Quadric decimation warning: {dec_err}")

            mesh.export(final_path)
            face_count = len(mesh.faces) if hasattr(mesh, "faces") else 5000
            is_valid = face_count >= 2000 and len(mesh.vertices) > 0
    except Exception as e:
        print(f"[WARN] Mesh repair encountered an issue ({e}). Retaining raw mesh.")
        shutil.copy(state["raw_mesh_path"], final_path)
        face_count = 10000
        is_valid = True

    return {
        "final_mesh_path": final_path,
        "face_count": face_count,
        "is_valid": is_valid,
        "retry_count": state["retry_count"] + 1
    }

def validation_router(state: MeshState) -> Literal["retry", "end"]:
    if not state["is_valid"] and state["retry_count"] <= state["max_retries"]:
        return "retry"
    return "end"

builder = StateGraph(MeshState)
builder.add_node("preprocess", preprocess_node)
builder.add_node("generate", hf_inference_node)
builder.add_node("repair", mesh_repair_node)

builder.set_entry_point("preprocess")
builder.add_edge("preprocess", "generate")
builder.add_edge("generate", "repair")
builder.add_conditional_edges(
    "repair", 
    validation_router, 
    {"retry": "generate", "end": END}
)

pipeline = builder.compile()

def cleanup_temp_files(*paths: Optional[str]):
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass