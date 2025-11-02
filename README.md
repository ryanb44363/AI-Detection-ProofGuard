# ProofGuard

Detect AI-generated content across images, PDFs, and text documents with a fast, privacy-conscious stack: FastAPI on the backend and React + Vite on the frontend.

<p align="center">
  <img src="frontend/public/favicon.svg?v=2" width="96" height="96" alt="ProofGuard"/>
</p>

---

## Highlights

- Accurate, heuristic-based analysis with conservative scoring
- Works even when heavy dependencies are missing (graceful degradation)
- Rich image signals: entropy, edge density, ELA, EXIF completeness, laplacian variance, flat-block ratio, blockiness, chroma/luma ratio, brightness/saturation stats, grayscale skewness, dark/bright pixel ratios, megapixels, aspect ratio
- Robust text analysis for PDFs and text: TTR, avg sentence length, repetition share, stopword ratio, digit/punct ratios
- Client-side failsafe transcription for images and PDFs (Tesseract.js + PDF.js)
- Clean result UI with per-factor score breakdown and detailed metrics

---

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    U[UploadForm]
    R[Result Page]
  end
  subgraph Frontend (Vite/React)
    A[api.ts]
  end
  subgraph Backend (FastAPI)
    E[(/analyze)]
    D[[Analyzer]]
    S[(Storage - optional)]
  end

  U -- multipart/form-data --> E
  E -- JSON {score, verdict, details} --> R
  E --> D
  D --> E
  R -. client-side OCR/PDF fallback .-> R
```

---

## Quickstart

### Option A: Docker Compose

```bash
# From the repository root
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Option B: Local Dev

Backend (FastAPI):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

Frontend (Vite + React):

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` (optional) if the backend is not on `:8000`.

---

## Configuration

- Frontend: `VITE_API_URL` (optional) – override the API base. Defaults to `http://<host>:8000`.
- Backend: optional heavy deps like Pillow/easyocr/torch are handled gracefully; the API stays responsive and returns clear messages if a feature is unavailable.

---

## API

POST `/analyze`

- Body: multipart/form-data with `file`
- Response example:

```json
{
  "score": 0.68,
  "verdict": "synthetic",
  "reason": "Low entropy and metadata markers detected",
  "details": {
    "entropy": 5.12,
    "edge_density": 0.031,
    "ela_mean": 2.44,
    "color_unique_ratio": 0.12,
    "exif_missing": ["Make", "Model"],
    "laplacian_var": 10.1,
    "flat_block_ratio": 0.24,
    "blockiness_score": 0.18,
    "chroma_luma_ratio": 0.74,
    "brightness_mean": 122.3,
    "brightness_std": 34.7,
    "saturation_mean": 0.21,
    "saturation_std": 0.09,
    "gray_skewness": -0.12,
    "dark_ratio": 0.03,
    "bright_ratio": 0.09,
    "megapixels": 2.1,
    "aspect_ratio": 1.33,
    "meta_field_count": 7,
    "text_features": {
      "ttr": 0.63,
      "avg_sentence_len": 17.4,
      "repetition_top5_share": 0.18,
      "stopword_ratio": 0.42,
      "digit_ratio": 0.03,
      "punct_ratio": 0.06,
      "word_count": 524,
      "char_count": 3381
    },
    "score_breakdown": {
      "base": 0.45,
      "metadata_hits": 0.05,
      "ocr_hits": 0.02,
      "low_entropy": 0.03
    },
    "final_score": 0.68
  }
}
```

---

## Frontend UX

- Drag-and-drop or click to upload. Unsupported files (e.g., .exe, .zip, .dmg) show a clear error and are not uploaded.
- A new tab opens immediately (avoids popup blockers) and shows a live loading screen.
- If the API is unreachable, a lightweight local analysis runs so users still get a reasoned result.
- If server-side text extraction is missing, client-side OCR/PDF extraction attempts run with quality filtering and timeouts.

---

## Development Tips

- Favicons and logo use `frontend/public/favicon.svg` (cache-busted with `?v=2`). Update this single file to change both.
- Analyzer returns many optional fields; defensively check types before rendering.
- For large PDFs, only the first few pages are extracted client-side to keep UX snappy.

---

## Troubleshooting

<details>
<summary><strong>Favicon didn't update</strong></summary>

Browsers cache favicons aggressively. We use `?v=2` cache-busting in HTML and result views. If still stale, hard refresh (Cmd+Shift+R) or clear site data.
</details>

<details>
<summary><strong>Frontend can’t reach backend</strong></summary>

Ensure the backend is running on port 8000 or set `VITE_API_URL` to the correct origin. Watch the browser console and network tab for CORS or connection errors.
</details>

<details>
<summary><strong>PDF or OCR extraction is blank</strong></summary>

The client-side fallback applies quality filters and timeouts. Try a clearer scan or ensure text layer exists in the PDF. For images, high-contrast text works better.
</details>

<details>
<summary><strong>Missing heavy dependencies</strong></summary>

The backend handles missing heavy libs (e.g., Pillow, easyocr) gracefully, returning limited results with an explanatory reason. Install optional deps for full fidelity.
</details>

<details>
<summary><strong>Blocked file types</strong></summary>

Executables, archives, and disk images (e.g., .exe, .zip, .dmg) are blocked for safety and to reduce noise.
</details>

---

## Roadmap

- Optional ML ensemble for stronger detection
- Readability metrics (Flesch/FK) for documents
- Batch and API token flows
- Audit export (CSV/JSON) and signed results

---

## Contributing

1. Fork the repo and create a feature branch.
2. Run frontend and backend locally.
3. Add tests where appropriate.
4. Open a PR with a clear description and screenshots.

---

## License

This project’s license is not specified here. If you need a license, add one at the repository root (e.g., `LICENSE`).
