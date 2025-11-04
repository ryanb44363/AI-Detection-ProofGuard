/**
 * Generate 1000 SEO pages under frontend/seo with consistent header/footer and helpful content.
 * Usage: node frontend/scripts/generate-seo.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // frontend/
const OUT_DIR = path.join(ROOT, 'seo');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function unique(array) { return Array.from(new Set(array)); }

function header(active = '') {
  return `
<header class="app-header">
  <div class="brand">
    <img src="/favicon.svg?v=2" alt="ProofGuard logo" class="logo-img" />
    <a href="/" class="brand-name">Proof<span class="muted-2">Guard</span></a>
  </div>
  <nav class="nav">
    <a href="/" class="nav-link">Home</a>
    <a href="/uploads.html" class="nav-link">Uploads</a>
    <a href="/api.html" class="nav-link">API</a>
    <a href="/plugins.html" class="nav-link">Plugins</a>
    <a href="/pricing.html" class="nav-link">Pricing</a>
    <a href="/docs.html" class="nav-link">Docs</a>
    <a href="/blog.html" class="nav-link">Blog</a>
  </nav>
  <div class="actions-inline">
    <a href="/signup.html" class="btn-link">Log in</a>
    <a href="/signup.html" class="btn-ghost">Sign up</a>
  </div>
  <button id="mobile-menu-button" class="mobile-toggle" aria-controls="mobile-menu" aria-expanded="false">Menu</button>
</header>
<nav id="mobile-menu" class="mobile-menu" hidden>
  <a href="/">Home</a>
  <a href="/uploads.html">Uploads</a>
  <a href="/api.html">API</a>
  <a href="/plugins.html">Plugins</a>
  <a href="/pricing.html">Pricing</a>
  <a href="/docs.html">Docs</a>
  <a href="/blog.html">Blog</a>
  <a href="/signup.html">Log in</a>
  <a href="/signup.html">Sign up</a>
</nav>`;
}

const STYLE = `
:root { --bg:#f9fafb; --card:#ffffff; --border:#e5e7eb; --text:#111827; --muted:#6b7280; --blue:#2563eb; }
* { box-sizing:border-box; }
body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--text); }
.container { max-width: 1100px; margin: 0 auto; padding: 24px 20px; }
.app-header{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-bottom:1px solid #edf0f2;background:#fff;position:sticky;top:0;z-index:20}
.brand{display:flex;align-items:center;gap:10px}
.logo-img{width:34px;height:34px;border-radius:8px;display:block}
.brand-name{font-size:20px;font-weight:700;color:#111827;text-decoration:none}
.muted-2{color:#7f8790}
.nav{display:flex;gap:18px;color:#3a424a}
.nav-link{font-size:14px;font-weight:500;color:#3a424a;text-decoration:none}
.nav-link:hover{color:#111827}
.nav-link.active{color:#111827;text-decoration:underline;text-underline-offset:6px}
.actions-inline{display:flex;gap:12px;align-items:center}
.btn-link{background:transparent;border:none;font-weight:600;cursor:pointer;color:#2d3a45;text-decoration:none}
.btn-link:hover{color:#111827}
.btn-ghost{background:#fff;color:#2d3a45;border:1px solid #e0e4e8;border-radius:999px;padding:8px 18px;font-weight:700;text-decoration:none}
.btn-ghost:hover{background:#f0f4f7}
/* Mobile nav */
[hidden]{display:none !important}
.mobile-toggle{display:none;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;font-weight:700}
.mobile-menu{display:none;border-top:1px solid #edf0f2;background:#fff}
.mobile-menu a{display:block;padding:10px 16px;color:#3a424a;text-decoration:none;border-bottom:1px solid #f1f5f9}
.mobile-menu a:hover{background:#f8fafc;color:#111827}
@media (max-width: 720px){ .nav, .actions-inline { display:none } .mobile-toggle{display:block} .mobile-menu{display:block} }
/* Page */
.h1{ font-size:28px; margin:0 0 8px 0; }
.muted{ color: var(--muted); }
.grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
.card{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:14px; box-shadow:0 6px 14px rgba(0,0,0,.04); }
.card h2{ margin:0 0 6px 0; font-size:18px; }
.card p{ margin:0; color:#374151; font-size:14px; line-height:1.55; }
.list{ list-style:none; padding:0; margin:0; }
.list li{ margin:6px 0; }
/* Footer */
.site-footer{background:#fff;border-top:1px solid #edf0f2;margin-top:24px}
.foot-wrap{max-width:1100px;margin:0 auto;padding:20px}
.foot-brand{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.foot-brand .logo-img{width:28px;height:28px}
.fb-name{font-weight:800;font-size:16px}
.fb-tag{font-size:12px;color:#6b7280}
.foot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.foot-title{font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.foot-link{display:block;color:#3a424a;font-size:13px;margin:4px 0;text-decoration:none}
.foot-link:hover{color:#111827;text-decoration:underline}
.foot-bar{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #edf0f2;font-size:12px;color:#6b7280}
@media (max-width:720px){.foot-grid{grid-template-columns:1fr 1fr}.foot-bar{flex-direction:column;align-items:flex-start;gap:8px}}
`;

function footer(yearVar) {
  return `
<footer class="site-footer">
  <div class="foot-wrap">
    <div class="foot-brand">
      <img src="/favicon.svg?v=2" alt="ProofGuard" class="logo-img"/>
      <div>
        <div class="fb-name">ProofGuard</div>
        <div class="fb-tag">Detect AI content — fast and free.</div>
      </div>
    </div>
    <div class="foot-grid">
      <div>
        <div class="foot-title">Product</div>
        <a class="foot-link" href="/uploads.html">Uploads</a>
        <a class="foot-link" href="/pricing.html">Pricing</a>
      </div>
      <div>
        <div class="foot-title">Developers</div>
        <a class="foot-link" href="/api.html">API</a>
        <a class="foot-link" href="/plugins.html">Plugins</a>
        <a class="foot-link" href="/docs.html">Docs</a>
      </div>
      <div>
        <div class="foot-title">Company</div>
        <a class="foot-link" href="/docs.html#privacy">Privacy</a>
        <a class="foot-link" href="/docs.html#terms">Terms</a>
        <a class="foot-link" href="/signup.html">Sign up</a>
      </div>
    </div>
    <div class="foot-bar">
      <div>© <span id="${yearVar}"></span> ProofGuard</div>
      <div>Made for reliable AI-content checks</div>
    </div>
  </div>
</footer>
<script>document.getElementById('${yearVar}').textContent = String(new Date().getFullYear());</script>
<script src="/site.js" defer></script>`;
}

function pageShell(title, bodyHTML) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} – ProofGuard</title>
    <meta name="description" content="${title} – practical guidance and resources from ProofGuard." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
    <style>${STYLE}</style>
  </head>
  <body>
    ${header('')}
    <main class="container">${bodyHTML}</main>
    ${footer('yr-seo')}
  </body>
</html>`;
}

function sectionHTML(title, content) {
  return `<section class="card"><h2>${title}</h2><p>${content}</p></section>`;
}

function makeContent(topic) {
  const t = topic;
  return `
    <h1 class="h1">${t}</h1>
    <p class="muted" style="margin-top:0">Actionable tips, step-by-step checks, and context for ${t.toLowerCase()}.</p>
    <div class="grid">
      ${sectionHTML('Overview', `This guide explains how to approach ${t.toLowerCase()} using ProofGuard. You\'ll learn what signals to look for, how to interpret results, and how to combine automated checks with human judgment.`)}
      ${sectionHTML('Step-by-step', '1) Prepare your file or text. 2) Upload via the homepage. 3) Review the score and the breakdown. 4) Check metadata, OCR hits, and visual cues. 5) Consider context and source. 6) Save or export findings as needed.')}
      ${sectionHTML('Tips & pitfalls', 'Beware of overly smooth textures, missing EXIF in camera-like photos, or repetitive phrasing in text. Low confidence does not always mean authentic; cross-check with source credibility and history.')}
      ${sectionHTML('FAQs', 'Q: What file types are supported? A: Images, PDFs, and text. Q: How is the score computed? A: It aggregates signals like metadata, OCR terms, and image forensics. Q: Does ProofGuard store my files? A: Recent uploads are saved locally in your browser for convenience.')}
      ${sectionHTML('Related', 'See Uploads for your history, Docs for limitations and privacy, and Blog for updates and analysis notes.')}
    </div>
  `;
}

// Build 1000 topic titles algorithmically
const CATEGORIES = [
  'Detect AI in Images', 'Detect AI in PDFs', 'Detect AI in Text', 'Metadata Analysis', 'OCR Keyword Checks',
  'Image Forensics', 'ELA Analysis', 'Edge Density Signals', 'Laplacian Sharpness', 'Color Uniqueness',
  'Academic Integrity', 'Journalism Workflows', 'Legal Evidence', 'Education Guidance', 'Enterprise Controls',
  'Content Moderation', 'Social Media Images', 'Marketing Assets', 'E-commerce Photos', 'Newsroom Photos'
];
const MODIFIERS = [
  'Beginner Guide', 'Advanced Guide', 'Checklist', 'Best Practices', 'Common Pitfalls', 'How-To', 'Tutorial',
  'FAQs', 'Field Manual', 'Playbook', 'Workflow', 'Policy Template', 'Quickstart', 'Deep Dive', 'Case Study'
];
const FORMATS = [
  'JPEG', 'PNG', 'WebP', 'HEIC', 'SVG', 'Scanned PDFs', 'Multi-page PDFs', 'Handwritten Notes', 'Screenshots',
  'Slides', 'Academic Essays', 'Blog Posts', 'Press Releases', 'Compliance Reports', 'Contracts'
];
const AUDIENCES = [
  'for Educators', 'for Journalists', 'for Lawyers', 'for IT Teams', 'for Compliance', 'for Investigators',
  'for Designers', 'for Photographers', 'for Editors', 'for Students', 'for Teams', 'for Founders'
];

function buildTopics(maxCount = 1000) {
  const titles = [];
  outer: for (const c of CATEGORIES) {
    for (const m of MODIFIERS) {
      for (const f of FORMATS) {
        const t1 = `${c}: ${m} (${f})`;
        titles.push(t1);
        if (titles.length >= maxCount) break outer;
        for (const a of AUDIENCES) {
          const t2 = `${c}: ${m} (${f}) ${a}`;
          titles.push(t2);
          if (titles.length >= maxCount) break outer;
        }
      }
    }
  }
  return unique(titles).slice(0, maxCount);
}

function buildIndex(topics) {
  const items = topics.map((t) => {
    const slug = slugify(t);
    return `<li><a href="/seo/${slug}.html">${t}</a></li>`;
  }).join('\n');
  const body = `
    <h1 class="h1">Resources</h1>
    <p class="muted" style="margin-top:0">Explore ${topics.length} practical guides and checklists for AI-content detection.</p>
    <section class="card">
      <h2 style="margin-bottom:8px">All Guides</h2>
      <ul class="list">${items}</ul>
    </section>
  `;
  return pageShell('Resources', body);
}

function main() {
  ensureDir(OUT_DIR);
  const topics = buildTopics(1000);

  // Write index
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildIndex(topics), 'utf8');

  // Write each page
  let written = 0;
  for (const t of topics) {
    const slug = slugify(t) || `page-${written+1}`;
    const html = pageShell(t, makeContent(t));
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf8');
    written++;
  }
  console.log(`Generated ${written} SEO pages at ${OUT_DIR}`);
}

if (require.main === module) {
  main();
}
