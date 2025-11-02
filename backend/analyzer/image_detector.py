from io import BytesIO
import math
import re
from typing import Dict, List, Tuple

from PIL import Image, ImageStat
import random

# Optional OCR dependency: easyocr (uses torch/torchvision already present)
_ocr_reader = None

AI_KEYWORDS = [
    # Common tools and pipelines
    "stable diffusion", "sdxl", "automatic1111", "a1111", "comfyui", "invokeai",
    "midjourney", "dall-e", "dalle", "openai image", "novelai", "leonardo", "firefly",
    "runwayml", "ideogram", "craiyon", "image creator", "bing image creator",
    # Generic markers
    "ai-generated", "ai generated", "generative", "diffusion", "latent",
    # SD metadata fields
    "parameters:", "negative prompt:", "sampler", "cfg scale", "steps:", "seed:",
]


def _shannon_entropy(img: Image.Image) -> float:
    try:
        gray = img.convert("L")
        hist = gray.histogram()
        total = sum(hist)
        entropy = 0.0
        for count in hist:
            if count == 0:
                continue
            p = count / total
            entropy -= p * math.log2(p)
        return float(entropy)
    except Exception:
        return 0.0


def _extract_metadata_text(img: Image.Image) -> Tuple[str, Dict[str, str]]:
    parts: List[str] = []
    meta: Dict[str, str] = {}
    try:
        # PNG/Text info and generic Pillow info
        for k, v in (img.info or {}).items():
            s = str(v)
            meta[str(k)] = s
            parts.append(f"{k}: {s}")
    except Exception:
        pass
    try:
        exif = img.getexif()
        if exif:
            for tag, value in exif.items():
                # Tag numbers to text names are optional; store numeric if unavailable
                try:
                    from PIL.ExifTags import TAGS
                    name = TAGS.get(tag, str(tag))
                except Exception:
                    name = str(tag)
                s = str(value)
                meta[str(name)] = s
                parts.append(f"{name}: {s}")
    except Exception:
        pass
    return "\n".join(parts), meta


def _ocr_text(img: Image.Image) -> str:
    global _ocr_reader
    try:
        if _ocr_reader is None:
            try:
                import easyocr  # type: ignore
            except Exception:
                return ""
            _ocr_reader = easyocr.Reader(["en"], gpu=False)
        import numpy as np  # type: ignore
        arr = np.array(img.convert("RGB"))
        results = _ocr_reader.readtext(arr, detail=0)  # just strings
        return "\n".join([s for s in results if isinstance(s, str)])
    except Exception:
        return ""


def _find_hits(text: str) -> List[str]:
    hits = []
    lower = text.lower()
    for kw in AI_KEYWORDS:
        if kw in lower:
            hits.append(kw)
    # also look for "prompt:" pattern typical in SD metadata
    if re.search(r"\b(prompt|negative\s+prompt)\s*:\s*", lower):
        hits.append("prompt field")
    return hits


def analyze_image(data: bytes, filename: str = ""):
    """In-depth content analysis for images and basic mocks for other types.

    Returns:
      { score: float[0..1], verdict: 'synthetic'|'authentic'|'error', reason: str, details?: {...} }
    """
    file_ext = (filename or "").lower().split(".")[-1]

    if file_ext in ["png", "jpg", "jpeg", "gif", "bmp", "webp"]:
        try:
            img = Image.open(BytesIO(data))
            width, height = img.size
            mode = img.mode

            # 1) Metadata scan (EXIF + PNG text)
            meta_text, meta_map = _extract_metadata_text(img)
            meta_hits = _find_hits(meta_text)

            # 2) OCR text scan
            ocr = _ocr_text(img)
            ocr_hits = _find_hits(ocr)

            # 3) Simple signal metrics
            entropy = _shannon_entropy(img)
            edge_hint = "high" if entropy > 7.0 else ("medium" if entropy > 6.0 else "low")

            # 4) Scoring heuristic
            score = 0.45
            if meta_hits:
                score += 0.35
            if ocr_hits:
                score += 0.25
            # Slight bump for very low entropy (over-smoothed visuals can indicate generations)
            if entropy < 5.5:
                score += 0.05
            score = max(0.0, min(0.98, score))
            verdict = "synthetic" if score > 0.7 else "authentic"

            reasons: List[str] = [
                f"Examined {width}x{height} image in {mode} mode.",
                f"Signal entropy: {entropy:.2f} ({edge_hint}).",
            ]
            if meta_hits:
                reasons.append(f"Metadata indicators found: {', '.join(sorted(set(meta_hits)))}.")
            else:
                reasons.append("No explicit AI markers in EXIF or PNG text.")
            if ocr_hits:
                reasons.append(f"OCR detected AI-related terms: {', '.join(sorted(set(ocr_hits)))}.")
            elif ocr:
                reasons.append("OCR text present but no AI-specific keywords matched.")
            else:
                reasons.append("No visible text detected via OCR.")

            reason = " ".join(reasons)
            return {
                "score": score,
                "verdict": verdict,
                "reason": reason,
                "details": {
                    "meta_hits": meta_hits,
                    "ocr_hits": ocr_hits,
                    "ocr_preview": (ocr[:300] + ("…" if len(ocr) > 300 else "")) if ocr else "",
                    "entropy": entropy,
                    "width": width,
                    "height": height,
                    "mode": mode,
                    "meta": {k: (str(v)[:200]) for k, v in meta_map.items()},
                },
            }
        except Exception as e:
            return {"score": 0, "verdict": "error", "reason": f"Invalid image file: {str(e)}"}

    # Basic mocks for non-image files (extend as needed)
    if file_ext == "pdf":
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": "PDF analyzed (mock). Text patterns and formatting examined.",
        }
    if file_ext in ["doc", "docx", "txt"]:
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": "Document analyzed (mock). Linguistic patterns assessed.",
        }
    if file_ext in ["ppt", "pptx"]:
        score = random.uniform(0.3, 0.95)
        return {
            "score": score,
            "verdict": "synthetic" if score > 0.7 else "authentic",
            "reason": "Presentation analyzed (mock). Structure and content assessed.",
        }

    # Unknown types
    score = random.uniform(0.4, 0.9)
    return {
        "score": score,
        "verdict": "synthetic" if score > 0.7 else "authentic",
        "reason": "Generic file analyzed (mock).",
    }
