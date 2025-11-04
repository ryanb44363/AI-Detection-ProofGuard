import os
from fastapi import FastAPI, File, UploadFile, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from analyzer.image_detector import analyze_image
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI(title="ProofGuard API", version="2.0")
api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_router.get("/")
def root():
    return {
        "status": "ok",
        "service": "ProofGuard API",
        "version": "2.0",
        "supported_formats": [
            "images (png, jpg, jpeg, gif, bmp, webp, svg)",
            "documents (pdf, doc, docx, txt)",
            "presentations (ppt, pptx)"
        ]
    }

@api_router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Analyze uploaded file for AI-generated content.
    Supports multiple file formats including images, PDFs, and documents.
    """
    data = await file.read()
    result = analyze_image(data, file.filename or "")
    return result

@api_router.get("/health")
def health_check():
    return {"status": "healthy", "service": "ProofGuard API"}

# Mount API under /api so we can serve the frontend at /
app.include_router(api_router, prefix="/api")

# Serve built frontend (Vite) if present
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.isdir(STATIC_DIR):
    # Serve index.html at root if present (homepage), else fall back to uploads.html
    @app.get("/")
    def serve_root():
        index_path = os.path.join(STATIC_DIR, "index.html")
        uploads_path = os.path.join(STATIC_DIR, "uploads.html")
        if os.path.exists(index_path):
            return FileResponse(index_path, media_type="text/html")
        if os.path.exists(uploads_path):
            return FileResponse(uploads_path, media_type="text/html")
        return {"status": "ok", "message": "Frontend build missing"}

    # Serve all static assets from backend/static
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    # Fallback minimal root for non-static environment (local dev API only)
    @app.get("/")
    def fallback_root():
        return {"status": "ok", "message": "Frontend not built. API available at /api"}
