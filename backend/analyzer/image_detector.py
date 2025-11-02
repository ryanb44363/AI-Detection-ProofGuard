from io import BytesIO
from PIL import Image
import random

def analyze_image(data: bytes):
    try:
        Image.open(BytesIO(data))
    except Exception:
        return {"score": 0, "type": "invalid", "reason": "Not an image"}

    score = random.uniform(0, 1)
    return {
        "score": score,
        "verdict": "synthetic" if score > 0.7 else "authentic",
        "reason": "Mock ML analysis"
    }
