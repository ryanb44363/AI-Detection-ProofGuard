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

(function main() {
  const id = getQueryParam('id');
  if (!id) { qs('empty').classList.remove('hidden'); return; }
  const key = `result:${id}`;

  function render(payload: any) {
    if (!payload) { qs('empty').classList.remove('hidden'); return; }
    const { fileName, previewUrl, isImage, result, status, error } = payload as {
      fileName?: string;
      previewUrl?: string | null;
      isImage?: boolean;
      result?: { score: number; verdict: 'authentic' | 'synthetic'; reason: string };
      status?: 'starting' | 'pending' | 'done' | 'error';
      error?: string;
    };

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
    const imgEl = qs('preview-img') as HTMLImageElement;
    if (isImage && previewUrl) { imgEl.src = previewUrl; imgEl.classList.remove('hidden'); }

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
    const badgeClass = result.verdict === 'authentic' ? 'badge badge-green' : 'badge badge-amber';
    const verdictTitle = result.verdict === 'authentic' ? 'Authentic Content' : 'Potentially AI-Generated';
    verdictCard.innerHTML = `
      <div style="padding:16px;border:1px solid var(--border);border-radius:14px;background:${result.verdict === 'authentic' ? '#ecfdf5' : '#fffbeb'}40;">
        <div class="center" style="margin-bottom:12px;">
          <span class="${badgeClass}">${verdictTitle}</span>
        </div>
        ${gaugeSVG(pct, result.verdict)}
        <div class="title-row">
          <div class="title">${verdictTitle}</div>
        </div>
        <p class="reason">${result.reason}</p>
      </div>
    `;
    qs('loading').classList.add('hidden');
    qs('error').classList.add('hidden');
    qs('content').classList.remove('hidden');
  }

  function getPayload(): any {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // Initial render
  render(getPayload());

  // Listen for updates from the upload page
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      render(getPayload());
    }
  });

  // Poll as a fallback in case 'storage' event doesn't fire (same-tab open)
  let lastRaw = localStorage.getItem(key);
  setInterval(() => {
    const raw = localStorage.getItem(key);
    if (raw !== lastRaw) {
      lastRaw = raw;
      render(getPayload());
    }
  }, 800);
})();
