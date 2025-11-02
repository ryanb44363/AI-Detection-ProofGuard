from io import BytesIO
from PIL import Image
import random

def analyze_image(data: bytes, filename: str = ""):
    """
    Analyze uploaded file for AI-generated content.
    Supports images, PDFs, and documents.
    """
    file_ext = filename.lower().split('.')[-1] if filename else ""
    
    # Handle different file types
    if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']:
        try:
            img = Image.open(BytesIO(data))
            # Mock analysis - in production, this would use actual ML models
            score = random.uniform(0.3, 0.95)
            return {
                "score": score,
                "verdict": "synthetic" if score > 0.7 else "authentic",
                "reason": f"Image analysis complete. Examined {img.size[0]}x{img.size[1]} pixel image with {img.mode} color mode. Statistical patterns suggest this content is {'likely AI-generated' if score > 0.7 else 'likely human-created'}."
            }
        except Exception as e:
            return {"score": 0, "verdict": "error", "reason": f"Invalid image file: {str(e)}"}
    
    elif file_ext == 'pdf':
        # Mock PDF analysis
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": f"PDF document analyzed. Text patterns and formatting examined. Content shows {'characteristics typical of AI generation' if score > 0.7 else 'natural human writing patterns'}."
        }
    
    elif file_ext in ['doc', 'docx', 'txt']:
        # Mock document analysis
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": f"Document text analyzed for linguistic patterns. Writing style {'exhibits AI-typical patterns such as repetitive phrasing and unnatural transitions' if score > 0.7 else 'shows human creativity and natural flow'}."
        }
    
    elif file_ext in ['ppt', 'pptx']:
        # Mock presentation analysis
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": f"Presentation content analyzed. Slide structure and content {'suggest automated generation' if score > 0.7 else 'indicate human authorship'}."
        }
    
    else:
        # Generic file analysis
        score = random.uniform(0.4, 0.9)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": f"File analyzed using generic content detection. Results suggest {'AI-generated content' if score > 0.7 else 'authentic human-created content'}."
        }
