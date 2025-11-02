from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from analyzer.image_detector import analyze_image

app = FastAPI(title="ProofGuard API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
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

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Analyze uploaded file for AI-generated content.
    Supports multiple file formats including images, PDFs, and documents.
    """
    data = await file.read()
    result = analyze_image(data, file.filename or "")
    return result

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ProofGuard API"}
