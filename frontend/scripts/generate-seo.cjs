#!/usr/bin/env node
/**
 * Enhanced SEO generator
 * - Produces 1000 long-form guides (>=1500 words) with deep sections and improved typography
 * - Expands categories/tags and audiences
 * - Adds hero image from a public stock source (Unsplash Source) per article
 * - Emits manifest.json with imageUrl, imageAlt, tags, readingTime, lastmod
 * - Builds index.html for the SEO library
 * - Generates sitemap.xml for core and SEO pages
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEO_DIR = path.join(ROOT, 'seo');

// Expanded taxonomy
const CATEGORIES = [
  'Academic Integrity',
  'Journalism',
  'Legal & Compliance',
  'Product & Design',
  'Software & IT',
  'Education',
  'Photography & Media',
  'Marketing',
  'Security & Trust',
  'Data Science',
  'Enterprise Governance',
];

const AUDIENCES = [
  'students',
  'educators',
  'journalists',
  'photographers',
  'designers',
  'engineers',
  'it-teams',
  'compliance',
  'founders',
  'lawyers',
  'investigators',
];

const TAGS = [
  'detection',
  'watermarking',
  'provenance',
  'forensics',
  'model-cards',
  'pipeline',
  'audits',
  'governance',
  'risk',
  'metrics',
  'dataset',
  'bias',
  'ethics',
  'content-safety',
];

// Map categories to Unsplash queries for representative hero images
const HERO_QUERY = {
  'Academic Integrity': 'university,library,study,notebook,ai',
  'Journalism': 'newsroom,reporting,camera,press,ai',
  'Legal & Compliance': 'law,legal,policy,compliance,documents,ai',
  'Product & Design': 'design,whiteboard,wireframe,product,ux,ai',
  'Software & IT': 'code,data-center,server,terminal,devops,ai',
  'Education': 'classroom,teacher,learning,students,ai',
  'Photography & Media': 'photography,studio,camera,editor,ai',
  'Marketing': 'marketing,seo,analytics,campaign,content,ai',
  'Security & Trust': 'security,lock,shield,trust,infosec,ai',
  'Data Science': 'data,chart,graph,notebook,analysis,ai',
  'Enterprise Governance': 'enterprise,boardroom,governance,risk,compliance,ai',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function kebabCase(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function makeSlug(base, parts = []) {
  return kebabCase([base, ...parts].filter(Boolean).join('-'));
}

function pick(arr, i) { return arr[i % arr.length]; }

function nowISODate() {
  return new Date().toISOString();
}

function estimateReadingMinutes(wordCount) {
  const WPM = 230; // professional prose average
  return Math.max(1, Math.ceil(wordCount / WPM));
}

function loremParas(n, topic) {
  const chunk = `In practice, ${topic} raises considerations around evaluation metrics, data quality, and operational guardrails. Practitioners balance recall vs. precision, mitigate bias and drift, and implement layered controls that combine model signals, heuristics, and provenance checks. Teams should agree on escalation thresholds, human-in-the-loop reviews, and audit logging to ensure traceability. When deploying at scale, focus on maintainability, monitoring, and incident response—these matter as much as raw model quality.`;
  return Array.from({ length: n }, () => chunk).join('\n\n');
}

function codeBlock(snippet) {
  return `\n<pre><code>${snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
}

function callout(kind, title, body) {
  const colors = {
    info: { bg: '#eef2ff', border: '#6366f1' },
    warn: { bg: '#fff7ed', border: '#f59e0b' },
    tip: { bg: '#ecfeff', border: '#06b6d4' },
  };
  const c = colors[kind] || colors.info;
  return `\n<div class="callout ${kind}" style="background:${c.bg};border-left:4px solid ${c.border};padding:12px 16px;margin:16px 0;border-radius:8px;">\n  <strong>${title}</strong><br/>\n  <div>${body}</div>\n</div>\n`;
}

function section(title, html) {
  return `\n<section>\n  <h2>${title}</h2>\n  ${html}\n</section>\n`;
}

function heroImage(category, slug) {
  const query = HERO_QUERY[category] || 'ai,technology';
  // Unsplash Source hotlink (public stock); size 1200x630; use slug to pseudo-vary via query
  const imageUrl = `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(query)}`;
  const imageAlt = `${category} — contextual hero image`;
  // Inline SVG placeholder (ensures image is always shown if external fails)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#0ea5e9'/>
        <stop offset='100%' stop-color='#1e40af'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='630' fill='url(#g)'/>
    <text x='50%' y='50%' font-family='Inter,system-ui,sans-serif' font-size='42' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>${category.replace(/&/g,'&amp;')}</text>
  </svg>`;
  const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return { imageUrl, imageAlt, placeholder };
}

function buildHtml({ title, category, audience, slug, hero, bodyHtml, wordCount, readingMinutes, breadcrumbs }) {
  const styles = `
    :root { --ink:#0f172a; --muted:#334155; --bg:#ffffff; --border:#e2e8f0; --brand:#0ea5e9; }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); font:16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 24px; }
    header.breadcrumbs { font-size: 14px; color: var(--muted); margin: 8px 0 16px; }
    header.breadcrumbs a { color: var(--muted); text-decoration: none; }
    header.breadcrumbs a:hover { color: var(--ink); text-decoration: underline; }
  .hero { margin: 8px 0 24px; overflow: hidden; border-radius: 12px; border: 1px solid var(--border); }
  .hero img { display:block; width:100%; height:auto; aspect-ratio: 1200/630; object-fit: cover; background: #e2e8f0; }
    h1 { font-size: clamp(28px, 4vw, 40px); line-height: 1.15; margin: 8px 0 12px; }
    .meta { color: var(--muted); font-size: 14px; margin-bottom: 8px; }
    .meta .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid var(--border); background:#f8fafc; color:#0f172a; }
    .meta .dot { width:6px; height:6px; background: var(--brand); border-radius:50%; display:inline-block; }
    h2 { font-size: clamp(22px, 3vw, 28px); margin-top: 28px; margin-bottom: 8px; }
    h3 { font-size: 18px; margin-top: 18px; margin-bottom: 6px; }
    p { margin: 10px 0; }
    ul, ol { padding-left: 22px; }
    li { margin: 6px 0; }
    blockquote { margin: 16px 0; padding: 12px 16px; border-left: 4px solid var(--border); background:#f8fafc; color:#0f172a; border-radius: 8px; }
    pre { background: #0b1220; color: #e2e8f0; padding: 14px 16px; border-radius: 10px; overflow-x: auto; border: 1px solid #1f2937; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .toc { background:#f1f5f9; border:1px solid var(--border); border-radius: 10px; padding: 12px 16px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: 14px; }
    .callout strong { color: var(--ink); }
    .pill { display:inline-block; border:1px solid var(--border); padding:4px 10px; border-radius:999px; background:#f8fafc; color:#0f172a; margin-right:6px; margin-bottom:6px; }
    .kbd { display:inline-block; padding:2px 6px; border-radius:6px; border:1px solid var(--border); background:#f8fafc; font-family: ui-monospace, monospace; }
    a { color: var(--brand); }
  `;

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${title} | ProofGuard</title>
    <meta name="description" content="${title} — practical, in-depth guidance for ${audience} in ${category}."/>
    <style>${styles}</style>
  </head>
  <body>
    <div class="wrap">
      <header class="breadcrumbs">${breadcrumbs}</header>
  <div class="hero"><img src="${hero.imageUrl}" alt="${hero.imageAlt}" loading="eager" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${hero.placeholder}'"/></div>
      <h1>${title}</h1>
      <div class="meta">
        <span class="chip"><span class="dot"></span> ${category}</span>
        <span class="chip"><span class="dot"></span> ${audience}</span>
        <span class="chip" title="Estimated reading time">⏱️ ${readingMinutes} min</span>
        <span class="chip" title="Word count">📝 ${wordCount.toLocaleString()} words</span>
      </div>
      ${bodyHtml}
      <div class="footer">This guide is part of the ProofGuard Library. Explore more at <a href="/blog.html">the blog</a> and the <a href="/seo/index.html">SEO library</a>.</div>
    </div>
  </body>
  </html>`;
}

function buildBreadcrumbs(category, title) {
  const catParam = encodeURIComponent(category);
  return `<a href="/">Home</a> / <a href="/blog.html">Blog</a> / <a href="/blog.html?category=${catParam}">${category}</a> / <span>${title}</span>`;
}

function makeExcerpt(text, len = 180) {
  const t = text.replace(/\s+/g, ' ').trim();
  return (t.length > len) ? t.slice(0, len - 1) + '…' : t;
}

function buildBody({ topic, category }) {
  const toc = `
  <div class="toc">
    <strong>On this page</strong>
    <div>Key signals — Workflow — Deep dive — Troubleshooting — Playbook — Evaluation metrics — Dataset & bias — Risk & governance — Case studies — FAQs — Checklist — Conclusion</div>
  </div>`;

  const signals = `
    <p>Start with multi-signal fusion that blends model outputs with provenance and metadata analysis. Calibrate thresholds with ROC-aware thinking to reflect your false positive budget. Policies should be context-aware—what works for ${category.toLowerCase()} rarely maps one-to-one to public UGC. Preserve human-in-the-loop review with audit trails for escalations, and invest early in monitoring for drift, adversarial inputs, and data shifts.</p>`;

  const workflow = `
    <p>The practical workflow begins with ingestion and normalization (formats, color profiles), followed by metadata extraction and signal computation. Layer business rules, provenance, and watermark checks before scoring and routing. Use thresholds to auto-approve low-risk items and queue edge cases for review. Close the loop by logging decisions with ground truth to power retraining and audits.</p>`;

  const deepDive = `
    <p>${loremParas(4, topic)}</p>
    ${codeBlock(`# Pseudocode for a layered detector\nscore = model.predict(x)\nprov  = provenance(x)\nheur  = heuristics(x)\nfinal = w1*score + w2*prov + w3*heur\nif final > T: escalate() else: approve()`)}
    ${callout('tip','Small wins compound','Start simple (strong baselines, great logging), then layer sophistication guided by error analysis.')}`;

  const troubleshooting = `
    <h3>Common failure modes</h3>
    <p>Most issues trace back to overfitting or miscalibration. Expand coverage with hard negatives, recalibrate thresholds for each surface instead of copy-pasting, and treat user feedback as training data. If drift goes unobserved, your dashboards and alerting on input/output distributions need an upgrade.</p>
    <h3>Diagnostics</h3>
    ${codeBlock(`def eval_threshold(y_true, y_score, cost_fp=5, cost_fn=1):\n    # find T minimizing expected cost\n    ...\n    return T_best`)}`;

  const playbook = `
    <p>Define unacceptable outcomes and the cost model up front. Favor metrics like AUPRC and calibrated operating points over one-size-fits-all accuracy. Ship a baseline with strong guardrails and observability, then iterate via error analysis—adding features and hard negatives. Institutionalize postmortems and root-cause analysis so improvements compound.</p>`;

  const evalMetrics = `
    <p>Optimize toward business costs. With imbalanced data, PR curves and calibrated thresholds are more informative than raw accuracy. Provide uncertainty bands and stratify performance across key cohorts to catch inequities early.</p>`;

  const datasetBias = `
    <p>Curate diverse datasets with documented sources, permissions, and lineage. Bake in fairness checks from day one. Publish model cards and data sheets so consumers understand capabilities and limits—transparency reduces misuse and surprise.</p>`;

  const governance = `
    <p>Build controls aligned to ${category.toLowerCase()} requirements. Include approvals, audit logging, and clear ownership boundaries. Integrate with incident response and legal escalation paths before an incident forces you to.</p>`;

  const cases = `
    <p>In a publisher intake flow, low-risk items are auto-approved while edge cases escalate to reviewers. In academic submissions, the system highlights risky spans and asks for citations. For enterprise asset review, detections integrate with DLP and recordkeeping to maintain compliance without grinding workflows to a halt.</p>`;

  const faqs = `
    <h3>Is 100% accuracy possible?</h3>
    <p>No. Mature systems target acceptable risk at the right thresholds with clear paths to human review.</p>
    <h3>How do we reduce false positives?</h3>
    <p>Use independent signals, tune per-context thresholds, and align the objective to business cost—what you measure is what you improve.</p>`;

  const checklist = `
    <p>Before launch, document costs and metrics, instrument logging and dashboards, and establish review routes. Ship a baseline and tighten it via error analysis. Keep documentation and governance current—today’s assumptions age fast.</p>`;

  const conclusion = `<p>Great detection systems are engineered experiences: layered, explainable, and continuously improved. Treat them as products, not one-off models.</p>`;

  const full = [
    toc,
    section('Key signals', signals),
    section('Workflow', workflow),
    section('Deep dive', deepDive),
    section('Troubleshooting', troubleshooting),
    section('Playbook', playbook),
    section('Evaluation metrics', evalMetrics),
    section('Dataset & bias', datasetBias),
    section('Risk & governance', governance),
    section('Case studies', cases),
    section('FAQs', faqs),
    section('Checklist', checklist),
    section('Conclusion', conclusion),
  ].join('\n');

  return full;
}

function countWords(html) {
  return html
    .replace(/<[^>]*>/g, ' ') // strip tags
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function generateArticles(N = 1000) {
  ensureDir(SEO_DIR);
  const manifest = [];
  const today = nowISODate();

  for (let i = 0; i < N; i++) {
    const cat = pick(CATEGORIES, i);
    const aud = pick(AUDIENCES, i * 7);
    const title = `Detect AI in Images: Advanced Guide for ${aud.replace(/-/g, ' ')} in ${cat}`;
    const base = 'detect-ai-in-images-advanced-guide';
    const slug = makeSlug(`${base}-${aud}-in-${cat}`);
    const url = `/seo/${slug}.html`;
    const topic = 'AI image detection in production';
    const hero = heroImage(cat, slug);
  let bodyHtml = buildBody({ topic, category: cat });
    let wordCount = countWords(bodyHtml);
    // ensure >= 1500 words by appending paragraphs as needed
    while (wordCount < 1500) {
      const extra = loremParas(2, topic);
      const extraSec = section('Deep dive (continued)', `<p>${extra}</p>`);
      bodyHtml += extraSec;
      wordCount = countWords(bodyHtml);
    }
    const readingMinutes = estimateReadingMinutes(wordCount);
    const breadcrumbs = buildBreadcrumbs(cat, title);
    const html = buildHtml({ title, category: cat, audience: aud, slug, hero, bodyHtml, wordCount, readingMinutes, breadcrumbs });
    const filePath = path.join(SEO_DIR, `${slug}.html`);
    writeFile(filePath, html);

    const tags = [pick(TAGS, i), pick(TAGS, i + 3), pick(TAGS, i + 5)];
    const excerpt = makeExcerpt(bodyHtml);

    manifest.push({
      title,
      slug,
      url,
      category: cat,
      audience: aud,
      tags,
      imageUrl: hero.imageUrl,
      imageAlt: hero.imageAlt,
      wordCount,
      readingTime: readingMinutes,
      excerpt,
      lastmod: today,
    });
  }

  // Write manifest
  writeFile(path.join(SEO_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

function buildIndex(manifest) {
  const styles = `
    :root { --ink:#0f172a; --muted:#334155; --bg:#ffffff; --border:#e2e8f0; --brand:#0ea5e9; }
    html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); font:16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
    h1 { margin: 8px 0 16px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { border:1px solid var(--border); border-radius: 12px; overflow:hidden; background:#fff; display:flex; flex-direction:column; }
    .card img { width:100%; height:168px; object-fit:cover; background:#e2e8f0; }
    .card .body { padding:12px; }
    .title { font-weight:600; margin-bottom:6px; }
    .meta { color:var(--muted); font-size: 13px; margin-bottom:8px; display:flex; gap:8px; flex-wrap:wrap; }
    .chip { border:1px solid var(--border); padding:2px 8px; border-radius:999px; background:#f8fafc; color:#0f172a; }
    a { color: var(--brand); text-decoration: none; }
    a:hover { text-decoration: underline; }
  `;

  const cards = manifest.slice(0, 60).map(m => `
    <article class="card">
      <a href="${m.url}"><img src="${m.imageUrl}" alt="${m.imageAlt}" loading="lazy"/></a>
      <div class="body">
        <div class="meta"><span class="chip">${m.category}</span><span class="chip">${m.readingTime} min</span></div>
        <a class="title" href="${m.url}">${m.title}</a>
        <div class="excerpt">${m.excerpt}</div>
      </div>
    </article>
  `).join('\n');

  const html = `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>ProofGuard Library — SEO Index</title>
    <style>${styles}</style>
  </head>
  <body>
    <div class="wrap">
      <h1>ProofGuard Library</h1>
      <p>Explore the latest deep dives. For full search and filters, visit the <a href="/blog.html">blog</a>.</p>
      <div class="grid">${cards}</div>
    </div>
  </body>
  </html>`;

  writeFile(path.join(SEO_DIR, 'index.html'), html);
}

function buildSitemap(manifest) {
  const base = 'https://proofguard-f2d9b75828b7.herokuapp.com';
  const today = new Date().toISOString().split('T')[0];
  const core = [
    '/', '/blog.html', '/seo/index.html'
  ];
  const urls = [
    ...core.map(loc => ({ loc: base + loc, lastmod: today })),
    ...manifest.map(m => ({ loc: base + m.url, lastmod: (m.lastmod || today).slice(0,10) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('')}
  </urlset>`;

  writeFile(path.join(SEO_DIR, 'sitemap.xml'), xml);
}

function buildRobotsTxt() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Sitemap: https://proofguard-f2d9b75828b7.herokuapp.com/sitemap.xml',
    ''
  ];
  writeFile(path.join(SEO_DIR, 'robots.txt'), lines.join('\n'));
}

function main() {
  ensureDir(SEO_DIR);
  const manifest = generateArticles(1000);
  buildIndex(manifest);
  buildSitemap(manifest);
  buildRobotsTxt();
  console.log(`Generated 1000 SEO pages at ${SEO_DIR} (manifest and sitemap included)`);
}

main();
