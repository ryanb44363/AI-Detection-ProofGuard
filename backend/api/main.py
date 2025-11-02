from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from analyzer.image_detector import analyze_image

app = FastAPI(title="ProofGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    data = await file.read()
    result = analyze_image(data)
    return result
