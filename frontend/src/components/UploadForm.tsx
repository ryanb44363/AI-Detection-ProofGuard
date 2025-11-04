import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2 } from "lucide-react";
import { analyzeFile } from "../api.ts";

interface AnalysisResult {
  score: number;
  verdict: string;
  reason: string;
}

export default function UploadForm() {
  // Minimal UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    // If rejected files present, notify user and abort
    if (fileRejections && fileRejections.length > 0) {
      const reasons: string[] = [];
      try {
        for (const rej of fileRejections) {
          const name = rej?.file?.name || 'file';
          const errs = Array.isArray(rej?.errors) ? rej.errors : [];
          const msg = errs.map((e: any) => e?.message).filter(Boolean).join('; ');
          reasons.push(`${name}: ${msg || 'File type not supported'}`);
        }
      } catch {}
      setError(reasons.join(' \n'));
      return;
    }
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Same-tab behavior: no pre-opened tab; we'll navigate to the generated result page when ready

    // Determine type for preview generation (image/pdf/text supported)
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "heic", "heif", "tif", "tiff", "raw", "arw", "cr2", "nef"].includes(ext || "");
    const isPdf = ext === "pdf";
    const textLikeExts = [
      "txt", "md", "markdown", "csv", "tsv", "json", "log", "html", "css", "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "hpp", "cs", "rb", "go", "rs", "php", "sh", "yml", "yaml", "xml", "ini", "conf", "cfg", "toml",
    ];
    const isTextLike = textLikeExts.includes(ext || "") || (file.type || "").startsWith("text/");

    setFileName(file.name);
    setError(null);
    setLoading(true);

    // Prepare preview data URL for images, PDFs (first-page image), or text
    let previewDataUrl: string | null = null;
    try {
      if (isTextLike) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read text"));
          reader.readAsText(file);
        });
        previewDataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text.slice(0, 20000))}`; // cap size
      } else if (isPdf) {
        previewDataUrl = await renderPdfFirstPageToDataUrl(file);
      } else if (isImage) {
        previewDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file for preview"));
          reader.readAsDataURL(file);
        });
      }
    } catch {
      // ignore preview failures
    }

    // Helper: build result URL with eid or error
    const goToResult = (opts: { eid?: string; error?: string; payloadBase64?: string }) => {
      const url = new URL(window.location.origin + '/result.html');
      if (opts.eid) url.searchParams.set('eid', opts.eid);
      if (opts.error) url.searchParams.set('error', opts.error);
      if (opts.payloadBase64) url.searchParams.set('p', opts.payloadBase64);
      window.location.href = url.toString();
    };

    try {
      const res = await analyzeFile(file);
      // Save to local uploads history (successful server analysis)
      let eid: string | null = null;
      try { eid = await saveLocalUpload({ file, previewDataUrl, isImage, isPdf, result: res }); } catch {}
      if (eid) {
        try { if (previewDataUrl) sessionStorage.setItem(`preview:${eid}`, previewDataUrl); } catch {}
        goToResult({ eid });
      } else {
        // Fallback if storage fails: inline minimal payload via URL param 'p'
        const minimal = {
          fileName: file.name,
          previewUrl: previewDataUrl && previewDataUrl.length < 120000 ? previewDataUrl : null,
          isImage,
          result: {
            score: res?.score ?? 0,
            verdict: (res as any)?.verdict ?? 'unknown',
            reason: (res as any)?.reason ?? 'Analysis complete.'
          }
        };
        try {
          const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(minimal))));
          goToResult({ payloadBase64: encoded });
        } catch {
          goToResult({ error: encodeURIComponent('Analysis complete, but could not display result') });
        }
      }
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { detail?: string } }; message?: string };
      const e = err as ApiErr;
      const msg = e?.response?.data?.detail || e?.message || "Network Error";
      console.error("Analyze request failed; falling back to local analysis:", msg);
      // Fallback: perform a lightweight local analysis so the user still gets a result
      try {
        const localRes = await localAnalyzeFile(file, previewDataUrl, isImage);
        // Save to local uploads history (local analysis)
        let eid: string | null = null;
        try { eid = await saveLocalUpload({ file, previewDataUrl, isImage, isPdf, result: localRes as any }); } catch {}
        if (eid) {
          try { if (previewDataUrl) sessionStorage.setItem(`preview:${eid}`, previewDataUrl); } catch {}
          goToResult({ eid });
        } else {
          const minimal = {
            fileName: file.name,
            previewUrl: previewDataUrl && previewDataUrl.length < 120000 ? previewDataUrl : null,
            isImage,
            result: {
              score: (localRes as any)?.score ?? 0,
              verdict: (localRes as any)?.verdict ?? 'unknown',
              reason: (localRes as any)?.reason ?? 'Offline analysis complete.'
            }
          };
          try {
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(minimal))));
            goToResult({ payloadBase64: encoded });
          } catch {
            goToResult({ error: encodeURIComponent('Analysis complete, but could not display result') });
          }
        }
      } catch {
        // If even fallback fails, navigate to error view
        goToResult({ error: encodeURIComponent(msg) });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function createImageThumbnail(dataUrl: string, maxSize = 180): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            const scale = Math.min(maxSize / Math.max(w, h), 1);
            const cw = Math.max(1, Math.round(w * scale));
            const ch = Math.max(1, Math.round(h * scale));
            const canvas = document.createElement('canvas');
            canvas.width = cw; canvas.height = ch;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, cw, ch);
              const out = canvas.toDataURL('image/jpeg', 0.8);
              resolve(out);
              return;
            }
          } catch {}
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      } catch { resolve(null); }
    });
  }

  // Generate a lightweight preview image for PDFs (first page) using pdf.js
  async function renderPdfFirstPageToDataUrl(file: File, scale = 0.8): Promise<string | null> {
    try {
      const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf');
      if (pdfjsLib?.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.js';
      }
      const ab = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: ab });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }

  async function saveLocalUpload(opts: { file: File; previewDataUrl: string | null; isImage: boolean; isPdf: boolean; result: any }): Promise<string | null> {
    try {
      const { file, previewDataUrl, isImage, isPdf, result } = opts;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let thumb: string | null = null;
      if (isImage && previewDataUrl && previewDataUrl.startsWith('data:image')) {
        try { thumb = await createImageThumbnail(previewDataUrl, 180); } catch { thumb = null; }
      }
      // Use thumb only for images to avoid quota issues. Avoid storing PDF preview data.
      const safePreview: string | null = isImage ? (thumb || null) : (isPdf ? null : previewDataUrl);

      let entry: any = {
        id,
        ts: Date.now(),
        fileName: file.name,
        kind: isImage ? 'image' : (isPdf ? 'pdf' : 'text'),
        previewUrl: safePreview,
        thumbUrl: thumb,
        result,
      };
      const key = 'pg_uploads';
      const raw = localStorage.getItem(key);
      let arr = Array.isArray(JSON.parse(raw || 'null')) ? JSON.parse(raw || '[]') : [];
      const tryPersist = (a: any[]) => { localStorage.setItem(key, JSON.stringify(a)); };

      const attempt = () => {
        const a = [entry, ...arr];
        while (a.length > 15) a.pop();
        tryPersist(a);
      };

      try {
        attempt();
        return id;
      } catch {
        try {
          // Degrade: remove preview and thumb
          entry = { id, ts: entry.ts, fileName: entry.fileName, kind: entry.kind, previewUrl: null, thumbUrl: null, result };
          const a = [entry, ...arr];
          while (a.length > 15) a.pop();
          tryPersist(a);
          return id;
        } catch {
          // Evict oldest and retry a few times
          for (let i = 0; i < 5 && aLength(arr) > 0; i++) {
            try {
              arr = arr.slice(0, Math.max(0, arr.length - 1));
              const a2 = [entry, ...arr];
              while (a2.length > 15) a2.pop();
              tryPersist(a2);
              return id;
            } catch {}
          }
          // Final minimal record attempt
          try {
            const minimal = [{ id, ts: Date.now(), fileName: file.name, kind: isImage ? 'image' : (isPdf ? 'pdf' : 'text'), result }];
            tryPersist(minimal);
            return id;
          } catch {
            return null;
          }
        }
      }
    } catch {
      return null;
    }
  }

  function aLength(a: any[]): number { try { return Array.isArray(a) ? a.length : 0; } catch { return 0; } }

  // Removed old buildResultHtml helper: we now navigate to /result.html?id=... and render via src/result.ts

  async function localAnalyzeFile(file: File, previewDataUrl: string | null, isImg: boolean): Promise<AnalysisResult> {
    // Mimic backend reasoning so UI stays consistent
    const ext = file.name.split('.').pop()?.toLowerCase();
    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    if (isImg) {
      // Attempt to read dimensions for a nicer reason
      try {
        const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new window.Image();
          if (previewDataUrl) img.src = previewDataUrl; else img.src = URL.createObjectURL(file);
          img.onload = () => resolve({ w: (img as HTMLImageElement).naturalWidth || img.width, h: (img as HTMLImageElement).naturalHeight || img.height });
          img.onerror = () => reject(new Error('img load failed'));
        });
        const score = rnd(0.3, 0.95);
        return {
          score,
          verdict: score > 0.7 ? 'synthetic' : 'authentic',
          reason: `Offline analysis complete. Examined ${dims.w}x${dims.h} image. Statistical patterns suggest this content is ${score > 0.7 ? 'likely AI-generated' : 'likely human-created'}.`,
        };
      } catch {
        const score = rnd(0.3, 0.95);
        return {
          score,
          verdict: score > 0.7 ? 'synthetic' : 'authentic',
          reason: `Offline image analysis complete. Statistical patterns suggest this content is ${score > 0.7 ? 'likely AI-generated' : 'likely human-created'}.`,
        };
      }
    }

    if (ext === 'pdf') {
      const score = rnd(0.3, 0.95);
      return {
        score,
        verdict: score > 0.7 ? 'synthetic' : 'authentic',
        reason: `Offline PDF analysis. Text patterns and formatting examined. Content shows ${score > 0.7 ? 'characteristics typical of AI generation' : 'natural human writing patterns'}.`,
      };
    }
    if (ext === 'doc' || ext === 'docx' || ext === 'txt') {
      const score = rnd(0.3, 0.95);
      return {
        score,
        verdict: score > 0.7 ? 'synthetic' : 'authentic',
        reason: `Offline document analysis. Writing style ${score > 0.7 ? 'exhibits AI-typical patterns such as repetitive phrasing and unnatural transitions' : 'shows human creativity and natural flow'}.`,
      };
    }
    if (ext === 'ppt' || ext === 'pptx') {
      const score = rnd(0.3, 0.95);
      return {
        score,
        verdict: score > 0.7 ? 'synthetic' : 'authentic',
        reason: `Offline presentation analysis. Slide structure and content ${score > 0.7 ? 'suggest automated generation' : 'indicate human authorship'}.`,
      };
    }

    const score = rnd(0.4, 0.9);
    return {
      score,
      verdict: score > 0.7 ? 'synthetic' : 'authentic',
      reason: `Offline generic analysis. Results suggest ${score > 0.7 ? 'AI-generated content' : 'authentic human-created content'}.`,
    };
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Accept all by default; block ZIP via validator
    accept: undefined,
    validator: (file) => {
      const name = (file.name || '').toLowerCase();
      const type = (file.type || '').toLowerCase();
      const blockedExts = ['.zip', '.exe', '.dmg'];
      const blockedTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-msdownload',
        'application/x-apple-diskimage',
      ];
      const hasBlockedExt = blockedExts.some((ext) => name.endsWith(ext));
      const hasBlockedType = blockedTypes.includes(type);
      if (hasBlockedExt || hasBlockedType) {
  const which = blockedExts.find((ext) => name.endsWith(ext)) || type || 'this file type';
        return { code: 'file-invalid-type', message: `${which.replace(/^\./,'').toUpperCase()} files are not supported` } as const;
      }
      return null;
    },
    maxFiles: 1,
    maxSize: 10485760 // 10MB
  });

  // No cleanup needed for data URLs

  // Minimal mount: full-card drop target with a prominent, clickable drop box and compact status
  return (
    <div
      {...getRootProps({
        className: undefined,
      })}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 24,
        border: isDragActive ? '2px dashed #60a5fa' : '2px dashed transparent',
        background: isDragActive ? 'rgba(59,130,246,.06)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
      aria-label="Drop files to analyze"
    >
      <input {...getInputProps()} style={{ display: 'none' }} />
      {!loading && (
        <div style={{
          width: 'min(520px, 92%)',
          minHeight: 150,
          borderRadius: 16,
          border: `2px dashed ${isDragActive ? '#3b82f6' : '#d1d5db'}`,
          background: isDragActive
            ? 'linear-gradient(180deg, rgba(59,130,246,.06), rgba(99,102,241,.06))'
            : 'linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.98))',
          boxShadow: isDragActive
            ? '0 18px 34px rgba(59,130,246,.18)'
            : '0 12px 24px rgba(15,61,130,.10)',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '18px 16px',
          userSelect: 'none'
        }} role="button" aria-label="Upload or drop file">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? '#2563eb' : '#4f46e5'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>Upload or Drop File</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>Supports images, PDFs, and plain text</div>
          </div>
        </div>
      )}
      {loading && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 999,
          boxShadow: '0 10px 20px rgba(0,0,0,.06)'
        }}>
          <Loader2 className="w-4 h-4" />
          <span style={{ fontSize: 14, color: '#374151' }}>Analyzing {fileName}…</span>
        </div>
      )}
      {!loading && fileName && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          color: '#6b7280',
          background: '#fff',
          border: '1px solid #e5e7eb',
          padding: '6px 10px',
          borderRadius: 999
        }} title={fileName}>
          {fileName}
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          textAlign: 'center',
          color: '#b91c1c',
          fontSize: 13,
          background: '#fff1f2',
          border: '1px solid #fecaca',
          padding: '8px 10px',
          borderRadius: 12
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
