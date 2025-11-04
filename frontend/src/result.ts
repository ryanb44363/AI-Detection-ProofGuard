function qs(id: string) { return document.getElementById(id)!; }

function getQueryParam(name: string): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function gaugeSVG(pct: number, verdict: 'authentic' | 'synthetic') {
  const color = verdict === 'authentic' ? '#10b981' : '#f59e0b';
  return `
  <div class="gauge-wrap">
    <div class="center">
      <svg viewBox="0 0 200 120" style="width:100%">
        <path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="#e5e7eb" stroke-width="16" pathLength="100" />
        <path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="${color}" stroke-linecap="round" stroke-width="16" pathLength="100" stroke-dasharray="${pct} 100" />
        ${Array.from({ length: 11 }).map((_, i) => {
          const angle = Math.PI * (1 - i / 10);
          const rOuter = 100; const rInner = 90; const cx = 100, cy = 110;
          const x1 = cx + rInner * Math.cos(angle);
          const y1 = cy - rInner * Math.sin(angle);
          const x2 = cx + rOuter * Math.cos(angle);
          const y2 = cy - rOuter * Math.sin(angle);
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f3f4f6" stroke-width="2" />`;
        }).join('')}
      </svg>
      <div style="margin-top:-16px">
        <div style="font-size:32px;font-weight:800;color:${color}">${pct}%</div>
        <div class="muted">Confidence</div>
      </div>
    </div>
  </div>`;
}

interface ResultData {
  score: number;
  verdict: 'authentic' | 'synthetic' | string;
  reason: string;
  details?: Record<string, any>;
}

interface Payload {
  fileName?: string;
  previewUrl?: string | null;
  isImage?: boolean;
  result?: ResultData;
  status?: 'starting' | 'pending' | 'done' | 'error';
  error?: string;
}

(function main() {
  const id = getQueryParam('id');
  const eid = getQueryParam('eid');
  const errParam = getQueryParam('error');
  const key = id ? `result:${id}` : '';

  function render(payload: Payload | null) {
    if (!payload) { qs('empty').classList.remove('hidden'); return; }
  const { fileName, previewUrl, isImage, result, status, error } = payload;

    // Left
    const fileRow = qs('file-row');
    fileRow.textContent = '';
    const icon = (() => {
      const ext = (fileName || '').split('.').pop()?.toLowerCase();
      if (["png","jpg","jpeg","gif","bmp","webp","svg"].includes(ext || '')) return '🖼️';
      if (ext === 'pdf') return '📄';
      return '📎';
    })();
    const spanIcon = document.createElement('span'); spanIcon.textContent = icon;
    const spanName = document.createElement('span'); spanName.textContent = fileName || 'Untitled';
    fileRow.append(spanIcon, spanName);
  const box = qs('preview-box');
    box.innerHTML = '';
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    if (isImage && previewUrl) {
      const img = document.createElement('img');
      img.alt = fileName || 'preview';
      img.src = previewUrl;
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.classList.remove('hidden');
      box.appendChild(img);
  } else if (ext === 'pdf' && previewUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = `${previewUrl}#view=FitH`;
      iframe.title = fileName || 'pdf';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      box.style.paddingTop = '0';
      box.style.height = '520px';
      box.appendChild(iframe);
    } else if (previewUrl && previewUrl.startsWith('data:text')) {
      const iframe = document.createElement('iframe');
      iframe.src = previewUrl;
      iframe.title = fileName || 'text';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      box.style.paddingTop = '0';
      box.style.height = '520px';
      box.appendChild(iframe);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.position = 'absolute';
      placeholder.style.inset = '0';
      placeholder.style.color = '#6b7280';
      placeholder.textContent = 'No preview available';
      box.appendChild(placeholder);
    }

    // Right
    const verdictCard = qs('verdict-card');
    if (status === 'error') {
      qs('error').classList.remove('hidden');
      qs('content').classList.add('hidden');
      qs('loading').classList.add('hidden');
      qs('error-msg').textContent = error || 'Unknown error';
      return;
    }
    if (!result) {
      qs('loading').classList.remove('hidden');
      qs('content').classList.add('hidden');
      return;
    }
    const pct = Math.max(0, Math.min(100, Math.round((result.score || 0) * 100)));
    const isAuthentic = result.verdict === 'authentic';
    const v: 'authentic' | 'synthetic' = isAuthentic ? 'authentic' : 'synthetic';
    const badgeClass = isAuthentic ? 'badge badge-green' : 'badge badge-amber';
    const verdictTitle = isAuthentic ? 'Authentic Content' : 'Potentially AI-Generated';
    verdictCard.innerHTML = `
      <div style="padding:16px;border:1px solid var(--border);border-radius:14px;background:${result.verdict === 'authentic' ? '#ecfdf5' : '#fffbeb'}40;">
        <div class="center" style="margin-bottom:12px;">
          <span class="${badgeClass}">${verdictTitle}</span>
        </div>
        ${gaugeSVG(pct, v)}
        <div class="title-row">
          <div class="title">${verdictTitle}</div>
        </div>
        <p class="reason">${result.reason}</p>
      </div>
    `;

    // Build breakdown/aspects section
    const d = (result as any).details || {};
    const metaHits: string[] = Array.isArray(d.meta_hits) ? d.meta_hits : [];
    const ocrHits: string[] = Array.isArray(d.ocr_hits) ? d.ocr_hits : [];
    const entropy = typeof d.entropy === 'number' ? d.entropy : undefined;
    const width = d.width || '';
    const height = d.height || '';
    const ocrFull: string = d.ocr_full || d.ocr_preview || '';
    const metaMap = d.meta || {};
    const metaFieldCount = typeof d.meta_field_count === 'number' ? d.meta_field_count : (metaMap && typeof metaMap === 'object' ? Object.keys(metaMap).length : 0);
    const ocrWordCount = ocrFull ? ocrFull.trim().split(/\s+/).length : 0;
    const edgeDensity = typeof d.edge_density === 'number' ? d.edge_density : undefined;
    const elaMean = typeof d.ela_mean === 'number' ? d.ela_mean : undefined;
    const colorRatio = typeof d.color_unique_ratio === 'number' ? d.color_unique_ratio : undefined;
    const exifMissing: string[] = Array.isArray(d.exif_missing) ? d.exif_missing : [];
    const lapVar = typeof d.laplacian_var === 'number' ? d.laplacian_var : undefined;
    const flatRatio = typeof d.flat_block_ratio === 'number' ? d.flat_block_ratio : undefined;
    const jpegQtables = typeof d.jpeg_qtables_present === 'boolean' ? d.jpeg_qtables_present : undefined;
    const blockiness = typeof d.blockiness_score === 'number' ? d.blockiness_score : undefined;
    const chromaLuma = typeof d.chroma_luma_ratio === 'number' ? d.chroma_luma_ratio : undefined;
    const bMean = typeof d.brightness_mean === 'number' ? d.brightness_mean : undefined;
    const bStd = typeof d.brightness_std === 'number' ? d.brightness_std : undefined;
    const sMean = typeof d.saturation_mean === 'number' ? d.saturation_mean : undefined;
    const sStd = typeof d.saturation_std === 'number' ? d.saturation_std : undefined;
    const graySkew = typeof d.gray_skewness === 'number' ? d.gray_skewness : undefined;
    const darkRatio = typeof d.dark_ratio === 'number' ? d.dark_ratio : undefined;
    const brightRatio = typeof d.bright_ratio === 'number' ? d.bright_ratio : undefined;
    const aspectRatio = typeof d.aspect_ratio === 'number' ? d.aspect_ratio : undefined;
    const megapixels = typeof d.megapixels === 'number' ? d.megapixels : undefined;
    const scoreBreakdown: Record<string, number> | undefined = d.score_breakdown;
    const breakdownRows = (() => {
      const pretty = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (scoreBreakdown && Object.keys(scoreBreakdown).length) {
        const entries = Object.entries(scoreBreakdown);
        const sum = entries.reduce((acc, [, v]) => acc + (typeof v === 'number' ? v : 0), 0);
        const rows = entries
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .map(([k, v]) => `<div>${pretty(k)}</div><strong>${Math.round((v || 0) * 100)}%</strong>`)
          .join('');
        const final = (result as any).details?.final_score ?? result.score ?? 0;
        const residual = final - sum;
        const residualPct = Math.round(Math.max(0, residual) * 100);
        const residualRow = residualPct > 0 ? `<div>Additional signals</div><strong>${residualPct}%</strong>` : '';
        return rows + residualRow;
      }
      const final = (result as any).details?.final_score ?? result.score ?? 0;
      return `<div>Overall</div><strong>${Math.round(final * 100)}%</strong>`;
    })();

    const aspectsHTML = (() => {
      const sb = scoreBreakdown || {} as Record<string, number>;
      const aspectsBase = [ { key: 'base', label: 'Base score', weight: 0.45 } ];
      const aspectsImg = [
        {key:'metadata_hits', label:'Metadata indicators', weight:0.35},
        {key:'ocr_hits', label:'OCR AI terms', weight:0.25},
        {key:'low_entropy', label:'Low entropy', weight:0.05},
        {key:'low_edge_density', label:'Low edge density', weight:0.04},
        {key:'low_ela_mean', label:'Low ELA mean', weight:0.03},
        {key:'low_color_uniqueness', label:'Low color uniqueness', weight:0.04},
        {key:'missing_exif', label:'Missing EXIF', weight:0.04},
        {key:'low_laplacian', label:'Low Laplacian variance', weight:0.02},
        {key:'flat_blocks', label:'Flat-block ratio', weight:0.03},
        {key:'very_smooth_low_blockiness', label:'Very smooth, low blockiness', weight:0.01},
      ];
      const aspectsText = [
        {key:'ocr_hits', label:'Keyword/AI term hits', weight:0.25},
        {key:'high_repetition_low_ttr', label:'High repetition, low TTR', weight:0.06},
        {key:'avg_sentence_len_mid', label:'Average sentence length (mid)', weight:0.01},
        {key:'keyword_hits', label:'Keyword hits', weight:0.25},
      ];
      const ext = (fileName || '').split('.').pop()?.toLowerCase();
      const isImg = ["png","jpg","jpeg","gif","bmp","webp"].includes(ext || '');
      const pick = isImg ? aspectsImg : aspectsText;
      const aspects = aspectsBase.concat(pick);
      return aspects.map(a => {
        const val = typeof (sb as any)[a.key] === 'number' ? (sb as any)[a.key] : 0;
        const cur = Math.round(val * 100);
        const max = Math.round(a.weight * 100);
        return `<div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;margin:6px 0;">
          <div style="font-size:13px;color:#374151">${a.label}</div>
          <div style="font-weight:700">${cur}% <span class=\"muted\" style=\"font-weight:500\">/ ${max}%</span></div>
        </div>`;
      }).join('');
    })();

    const breakdownCard = qs('breakdown-card');
    breakdownCard.innerHTML = `
      <h2 style="font-size:18px;font-weight:800;margin:0 0 10px 0;">Rating breakdown</h2>
      <div style="font-size:14px;color:#374151">
        <div style="display:grid;grid-template-columns:1fr auto;row-gap:6px;column-gap:12px;">
          ${breakdownRows}
        </div>
        <div style="margin-top:8px;font-size:14px;"><strong>Final score:</strong> ${pct}%</div>
        <hr style="margin:10px 0; border:none; border-top:1px solid #e5e7eb" />
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div style="font-weight:700;margin-bottom:6px;">Indicators detected</div>
            ${metaHits.length ? `<div><strong>Metadata hits:</strong> ${metaHits.map(h => `<code>${h}</code>`).join(', ')}</div>` : '<div>No explicit AI metadata markers found.</div>'}
            ${ocrHits.length ? `<div style=\"margin-top:6px\"><strong>OCR hits:</strong> ${ocrHits.map(h => `<code>${h}</code>`).join(', ')}</div>` : '<div style=\"margin-top:6px\">No AI keywords found in detected text.</div>'}
          </div>
          <div>
            <div style="font-weight:700;margin-bottom:6px;">Signal metrics</div>
            ${typeof entropy === 'number' ? `<div>Entropy: <strong>${entropy.toFixed(2)}</strong></div>` : ''}
            ${width && height ? `<div>Dimensions: <strong>${width}×${height}</strong></div>` : ''}
            ${metaFieldCount ? `<div>Metadata fields: <strong>${metaFieldCount}</strong></div>` : ''}
            ${ocrWordCount ? `<div>Detected words: <strong>${ocrWordCount}</strong></div>` : ''}
            ${typeof edgeDensity === 'number' ? `<div>Edge density: <strong>${edgeDensity.toFixed(3)}</strong></div>` : ''}
            ${typeof elaMean === 'number' ? `<div>ELA mean: <strong>${elaMean.toFixed(2)}</strong></div>` : ''}
            ${typeof colorRatio === 'number' ? `<div>Unique color ratio: <strong>${(colorRatio*100).toFixed(2)}%</strong></div>` : ''}
            ${exifMissing.length ? `<div>Missing EXIF: <strong>${exifMissing.join(', ')}</strong></div>` : ''}
            ${typeof lapVar === 'number' ? `<div>Laplacian variance: <strong>${lapVar.toFixed(2)}</strong></div>` : ''}
            ${typeof flatRatio === 'number' ? `<div>Flat-block ratio: <strong>${(flatRatio*100).toFixed(1)}%</strong></div>` : ''}
            ${typeof jpegQtables === 'boolean' ? `<div>JPEG quantization tables present: <strong>${jpegQtables ? 'yes' : 'no'}</strong></div>` : ''}
            ${typeof blockiness === 'number' ? `<div>Blockiness score: <strong>${blockiness.toFixed(3)}</strong></div>` : ''}
            ${typeof chromaLuma === 'number' ? `<div>Chroma/Luma ratio: <strong>${chromaLuma.toFixed(3)}</strong></div>` : ''}
            ${typeof bMean === 'number' ? `<div>Brightness mean/std: <strong>${(bMean ?? 0).toFixed(1)}</strong> / <strong>${(bStd ?? 0).toFixed(1)}</strong></div>` : ''}
            ${typeof sMean === 'number' ? `<div>Saturation mean/std: <strong>${(sMean ?? 0).toFixed(3)}</strong> / <strong>${(sStd ?? 0).toFixed(3)}</strong></div>` : ''}
            ${typeof graySkew === 'number' ? `<div>Gray skewness: <strong>${graySkew.toFixed(3)}</strong></div>` : ''}
            ${typeof darkRatio === 'number' ? `<div>Dark/Bright pixel ratio: <strong>${(darkRatio*100).toFixed(1)}%</strong> / <strong>${typeof brightRatio === 'number' ? (brightRatio*100).toFixed(1) : '0.0'}%</strong></div>` : ''}
            ${typeof aspectRatio === 'number' ? `<div>Aspect ratio: <strong>${aspectRatio.toFixed(3)}</strong></div>` : ''}
            ${typeof megapixels === 'number' ? `<div>Megapixels: <strong>${megapixels.toFixed(2)}</strong></div>` : ''}
          </div>
        </div>
        <hr style="margin:14px 0; border:none; border-top:1px solid #e5e7eb" />
        <div>
          <div style="font-weight:700;margin-bottom:8px;">Aspects and contributions</div>
          ${aspectsHTML}
        </div>
        <p class="muted" style="margin-top:10px">This is a heuristic breakdown; not definitive proof.</p>
      </div>
    `;
    breakdownCard.classList.remove('hidden');
    qs('loading').classList.add('hidden');
    qs('error').classList.add('hidden');
    qs('content').classList.remove('hidden');
  }

  function getPayload(): Payload | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // If there's an explicit error param, show error immediately
  if (errParam) {
    const msg = decodeURIComponent(errParam);
    (qs('error-msg')).textContent = msg || 'Unknown error';
    qs('error').classList.remove('hidden');
    qs('content').classList.add('hidden');
    qs('loading').classList.add('hidden');
    return;
  }

  // If we have an eid, render from pg_uploads directly
  if (!id && eid) {
    try {
      const raw = localStorage.getItem('pg_uploads');
      const arr = Array.isArray(JSON.parse(raw || 'null')) ? JSON.parse(raw || '[]') : [];
      const entry = arr.find((x: any) => x && x.id === eid);
      if (entry) {
        const payload: Payload = {
          fileName: entry.fileName,
          previewUrl: entry.previewUrl || null,
          isImage: entry.kind === 'image',
          result: entry.result,
        };
        render(payload);
        return;
      }
    } catch {}
    // If eid not found, fall through to latest or empty
  }

  // If no id, try to fallback to the latest upload entry
  if (!id) {
    try {
      const raw = localStorage.getItem('pg_uploads');
      const arr = Array.isArray(JSON.parse(raw || 'null')) ? JSON.parse(raw || '[]') : [];
      if (arr.length) {
        // Sort by timestamp (newest first) in case not already
        arr.sort((a: any, b: any) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
        const entry = arr[0];
        const payload: Payload = {
          fileName: entry.fileName,
          previewUrl: entry.previewUrl || null,
          isImage: entry.kind === 'image',
          result: entry.result,
        };
        render(payload);
        return;
      }
    } catch {}
    qs('empty').classList.remove('hidden');
    return;
  }

  // Initial render
  render(getPayload());

  // Listen for updates from the upload page
  window.addEventListener('storage', (e) => {
    if (id && e.key === key) {
      render(getPayload());
    }
    if (!id && eid && e.key === 'pg_uploads') {
      try {
        const raw = localStorage.getItem('pg_uploads');
        const arr = Array.isArray(JSON.parse(raw || 'null')) ? JSON.parse(raw || '[]') : [];
        const entry = arr.find((x: any) => x && x.id === eid);
        if (entry) {
          const payload: Payload = {
            fileName: entry.fileName,
            previewUrl: entry.previewUrl || null,
            isImage: entry.kind === 'image',
            result: entry.result,
          };
          render(payload);
        }
      } catch {}
    }
  });

  // Poll as a fallback in case 'storage' event doesn't fire (same-tab open)
  if (id) {
    let lastRaw = localStorage.getItem(key);
    setInterval(() => {
      const raw = localStorage.getItem(key);
      if (raw !== lastRaw) {
        lastRaw = raw;
        render(getPayload());
      }
    }, 800);
  }
})();
