#!/usr/bin/env node
'use strict';

/*
 * valk.nu static site builder — zero dependencies, plain Node.
 *
 * Stitches partials/header.html and partials/footer.html into each source
 * template under pages/ (recursively) and writes the final page to the same
 * relative path at the repo root (index.html, projects.html,
 * projects/atlassian-documentation.html, ...). No runtime fetch(), no
 * framework, no bundler — the output is plain static HTML deployable as-is to
 * GitHub Pages.
 *
 * Usage:  node build.js
 *
 * Each source template starts with a directive, e.g.:
 *   <!--@page id="projects" title="atlassian documentation" parent="projects" parenturl="projects.html"-->
 * and contains <!--@header--> / <!--@footer--> placeholders.
 *
 * Tokens the build fills:
 *   {{ROOT}}                    relative prefix back to the site root
 *                              ("" for root pages, "../" one level deep, ...)
 *   {{BREADCRUMB}}             the header breadcrumb trail (built from the
 *                              directive: valk.nu > [parent >] current)
 *   {{TABLE:<name>}}           a terminal-style table generated from
 *                              data/<name>.json (schema-driven: the JSON
 *                              declares its own `columns`)
 * The build also marks the nav item whose data-nav matches `id` as current.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PAGES_DIR = path.join(ROOT, 'pages');
const PARTIALS_DIR = path.join(ROOT, 'partials');
const DATA_DIR = path.join(ROOT, 'data');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Strip the leading HTML-comment banner from a partial so it doesn't ship.
function stripBanner(html) {
  return html.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
}

// Recursively collect page templates as paths relative to pages/.
function findPages(dir, base) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...findPages(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

function parseDirective(src, file) {
  const m = src.match(/<!--@page\s+([^>]*?)-->/);
  if (!m) throw new Error(`${file}: missing <!--@page ...--> directive`);
  const attrs = {};
  const re = /(\w+)="([^"]*)"/g;
  let a;
  while ((a = re.exec(m[1]))) attrs[a[1]] = a[2];
  if (!attrs.id) throw new Error(`${file}: @page directive needs an id`);
  return { attrs, raw: m[0] };
}

// Relative prefix from an output file back to the site root.
function rootPrefix(relPath) {
  const depth = relPath.split(path.sep).length - 1;
  return '../'.repeat(depth);
}

// Breadcrumb trail from the directive. Two forms:
//   parent="projects" parenturl="projects.html"        (single level)
//   crumbs="projects=projects.html|tracker=projects/tracker/"  (multi level)
// URLs are site-root-relative; {{ROOT}} is prepended and resolved per page.
function buildBreadcrumb(attrs) {
  const sep = ' <span class="breadcrumb-sep">&gt;</span> ';
  const parts = ['<a href="{{ROOT}}index.html">valk.nu</a>'];
  let crumbs = [];
  if (attrs.crumbs) {
    crumbs = attrs.crumbs.split('|').map((s) => {
      const i = s.indexOf('=');
      return { label: s.slice(0, i).trim(), url: s.slice(i + 1).trim() };
    });
  } else if (attrs.parent && attrs.parenturl) {
    crumbs = [{ label: attrs.parent, url: attrs.parenturl }];
  }
  for (const c of crumbs) parts.push(`<a href="{{ROOT}}${esc(c.url)}">${esc(c.label)}</a>`);
  parts.push(`<span class="breadcrumb-current">${esc(attrs.title || attrs.id)}</span>`);
  return parts.join(sep);
}

function markCurrentNav(html, id, file) {
  const needle = `data-nav="${id}"`;
  if (html.includes(needle)) return html.replace(needle, `${needle} data-current`);
  console.warn(`  ! ${file}: no nav item matches id="${id}" (breadcrumb only)`);
  return html;
}

// Terminal-style table generated from data/<name>.json.
// The JSON declares its own layout:
//   {
//     "count_label": "tools",              // optional, default "entries"
//     "columns": [
//       { "header": "TOOL", "field": "title", "link": "url", "class": "doc-link" },
//       { "header": "DESCRIPTION", "field": "description", "class": "doc-desc" }
//     ],
//     "items": [ { "title": "...", "url": "...", "description": "..." }, ... ]
//   }
// A column with `link` renders its `field` as an anchor to item[link].
function renderTable(name, file) {
  const dataPath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(dataPath)) {
    console.warn(`  ! ${file}: data/${name}.json not found`);
    return `<!-- missing data/${name}.json -->`;
  }
  const data = JSON.parse(read(dataPath));
  const cols = data.columns || [];
  if (!cols.length) console.warn(`  ! ${name}.json: no "columns" declared`);

  const thead = cols.map((c) => `<th>${esc(c.header || '')}</th>`).join('');
  const rows = data.items.map((it) => {
    const tds = cols.map((c) => {
      const cls = c.class ? ` class="${c.class}"` : '';
      let val = esc(it[c.field] != null ? it[c.field] : '');
      if (c.link && it[c.link]) {
        val = `<a href="${esc(it[c.link])}" target="_blank" rel="noopener">${val}</a>`;
      }
      return `<td${cls}>${val}</td>`;
    }).join('');
    return `        <tr>${tds}</tr>`;
  }).join('\n');

  const unit = data.count_label || 'entries';
  return (
    '<div class="doc-table-wrap" data-search>\n' +
    '      <table class="doc-table">\n' +
    `        <thead><tr>${thead}</tr></thead>\n` +
    '        <tbody>\n' +
    rows + '\n' +
    '        </tbody>\n' +
    '      </table>\n' +
    `    </div>\n    <p class="doc-count">// ${data.items.length} ${unit}</p>`
  );
}

/* ===================================================================
   Atlassian features tracker (data/atlassian-features.json)
   =================================================================== */

const FEATURES_FILE = path.join(DATA_DIR, 'atlassian-features.json');

const STATUS_TAG = {
  coming_soon: 'SOON',
  rolling_out_new: 'NEW',
  rolling_out: 'ROLLING',
  rollout_complete: 'COMPLETE',
  released: 'RELEASED',
};

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  if (!d) return '—';
  const p = String(d).split('-');
  if (p.length < 3) return esc(String(d));
  return `${parseInt(p[2], 10)} ${MONTHS[parseInt(p[1], 10) - 1]} ${p[0]}`;
}

let _features = null;
function loadFeatures() {
  if (_features) return _features;
  if (!fs.existsSync(FEATURES_FILE)) {
    console.warn('  ! data/atlassian-features.json not found (run scripts/import-atlassian-features.js)');
    _features = { data_through: null, feature_count: 0, features: [] };
  } else {
    _features = JSON.parse(read(FEATURES_FILE));
  }
  return _features;
}

const TRACKER_VIEWS = [
  { key: 'all', label: 'all features', file: 'index.html' },
  { key: 'new-this-week', label: 'new this week', file: 'new-this-week.html' },
  { key: 'coming-soon', label: 'coming soon', file: 'coming-soon.html' },
  { key: 'rolling-out', label: 'rolling out', file: 'rolling-out.html' },
  { key: 'completed', label: 'completed', file: 'completed.html' },
  { key: 'how-this-works', label: 'how this works', file: 'how-this-works.html' },
];

function renderTrackerNav(current) {
  const items = TRACKER_VIEWS.map((v) => {
    const cur = v.key === current ? ' data-current' : '';
    return `<a class="tracker-tab"${cur} href="${v.file}">${esc(v.label)}</a>`;
  }).join('\n      ');
  return `<nav class="tracker-nav" aria-label="Tracker views">\n      ${items}\n    </nav>`;
}

const byAnnouncedDesc = (a, b) => (b.announced_date || '').localeCompare(a.announced_date || '');

function featuresTable(list, withStatus) {
  const head = withStatus
    ? '<tr><th>FEATURE</th><th>PRODUCT</th><th>STATUS</th><th>ANNOUNCED</th></tr>'
    : '<tr><th>FEATURE</th><th>PRODUCT</th><th>ANNOUNCED</th></tr>';
  const rows = list.map((f) => {
    const link = `<td class="doc-link"><a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.title)}</a></td>`;
    const prod = `<td class="ft-prod">${esc(f.product)}</td>`;
    const status = withStatus
      ? `<td class="doc-meta"><span class="ft-tag ft-${esc(f.status)}">${STATUS_TAG[f.status] || esc(f.status)}</span></td>`
      : '';
    const ann = `<td class="doc-meta">${fmtDate(f.announced_date)}</td>`;
    return `        <tr>${link}${prod}${status}${ann}</tr>`;
  }).join('\n');
  return (
    '<div class="doc-table-wrap" data-paginate="50" data-search>\n' +
    '      <table class="doc-table">\n' +
    `        <thead>${head}</thead>\n` +
    '        <tbody>\n' + rows + '\n        </tbody>\n' +
    '      </table>\n    </div>'
  );
}

const STATUS_OF_VIEW = { 'coming-soon': 'coming_soon', 'rolling-out': 'rolling_out', 'completed': 'rollout_complete' };

function renderFeaturesView(view) {
  const data = loadFeatures();
  const feats = data.features || [];

  if (view === 'all') {
    const count = (k) => feats.filter((f) => f.status === k).length;
    const summary =
      '<ul class="ft-summary">\n' +
      `      <li><span class="ft-tag ft-rolling_out_new">NEW</span> in the latest week feed: ${count('rolling_out_new')}</li>\n` +
      `      <li><span class="ft-tag ft-coming_soon">SOON</span> coming soon: ${count('coming_soon')}</li>\n` +
      `      <li><span class="ft-tag ft-rolling_out">ROLLING</span> rolling out: ${count('rolling_out')}</li>\n` +
      `      <li><span class="ft-tag ft-rollout_complete">COMPLETE</span> completed / released: ${count('rollout_complete') + count('released')}</li>\n` +
      '    </ul>';
    const meta = `<p class="ft-meta">// ${feats.length} features tracked · data through ${fmtDate(data.data_through)}</p>`;
    const table = featuresTable([...feats].sort(byAnnouncedDesc), true);
    return `${summary}\n    ${meta}\n    ${table}`;
  }

  if (view === 'new-this-week') {
    const news = feats.filter((f) => f.status === 'rolling_out_new');
    const latest = news.map((f) => f.last_seen_week).filter(Boolean).sort().reverse()[0];
    const list = (latest ? news.filter((f) => f.last_seen_week === latest) : news)
      .sort((a, b) => (a.product || '').localeCompare(b.product || '') || (a.title || '').localeCompare(b.title || ''));
    const byProduct = {};
    for (const f of list) (byProduct[f.product] = byProduct[f.product] || []).push(f);
    const products = Object.keys(byProduct).sort();

    const jump = products.length
      ? `<nav class="ft-jump" aria-label="Jump to product">jump to: ${products
          .map((p) => `<a href="#prod-${slug(p)}">${esc(p)}</a>`).join(' · ')}</nav>`
      : '';

    const sections = products.map((prod) => {
      const items = byProduct[prod].map((f) => {
        const d = f.description ? ` <span class="ft-li-desc">— ${esc(f.description)}</span>` : '';
        return `      <li><a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.title)}</a>${d}</li>`;
      }).join('\n');
      return `    <h3 class="ft-product" id="prod-${slug(prod)}">${esc(prod)}</h3>\n` +
        `    <ul class="ft-list">\n${items}\n    </ul>\n` +
        `    <a class="ft-backtop" href="#ft-top">[ back to top ]</a>`;
    }).join('\n');

    const header = latest
      ? `<p class="ft-meta">// week of ${fmtDate(latest)} — ${list.length} new feature(s) across ${products.length} products</p>`
      : '<p class="ft-meta">// nothing new.</p>';
    return `<span id="ft-top"></span>\n    ${header}\n    ${jump}\n${sections || '    <p class="ft-meta">// nothing new this week.</p>'}`;
  }

  const st = STATUS_OF_VIEW[view];
  if (st) {
    const list = feats.filter((f) => f.status === st).sort(byAnnouncedDesc);
    const meta = `<p class="ft-meta">// ${list.length} feature(s) · data through ${fmtDate(data.data_through)}</p>`;
    return `${meta}\n    ${featuresTable(list, false)}`;
  }

  console.warn(`  ! unknown FEATURES view: ${view}`);
  return `<!-- unknown view ${view} -->`;
}

function build() {
  const header = stripBanner(read(path.join(PARTIALS_DIR, 'header.html')));
  const footer = stripBanner(read(path.join(PARTIALS_DIR, 'footer.html')));

  const files = findPages(PAGES_DIR, '');
  if (files.length === 0) throw new Error('no templates found in pages/');

  console.log('Building valk.nu ...');
  for (const rel of files) {
    const src = read(path.join(PAGES_DIR, rel));
    const { attrs, raw } = parseDirective(src, rel);

    let html = src.replace(raw, '').replace(/^\s*\n/, '');

    // Inject shared chrome where the placeholders exist (the 404 page opts out).
    if (html.includes('<!--@header-->')) {
      let head = header.replace('{{BREADCRUMB}}', () => buildBreadcrumb(attrs));
      head = markCurrentNav(head, attrs.id, rel);
      html = html.replace('<!--@header-->', () => head);
    }
    if (html.includes('<!--@footer-->')) {
      html = html.replace('<!--@footer-->', () => footer);
    }

    // Data-driven tables.
    html = html.replace(/\{\{TABLE:([\w-]+)\}\}/g, (_, name) => renderTable(name, rel));

    // Atlassian features tracker.
    html = html.replace(/\{\{TRACKER_NAV:([\w-]+)\}\}/g, (_, v) => renderTrackerNav(v));
    html = html.replace(/\{\{FEATURES:([\w-]+)\}\}/g, (_, v) => renderFeaturesView(v));

    // Resolve {{ROOT}} last. Normally the relative prefix for this page's
    // depth; a `base` directive forces an absolute base instead — needed for
    // 404.html, which GitHub Pages serves for unmatched URLs at any depth.
    const rootVal = attrs.base !== undefined ? attrs.base : rootPrefix(rel);
    html = html.replace(/\{\{ROOT\}\}/g, rootVal);

    const leftover = html.match(/\{\{[^}]+\}\}/);
    if (leftover) console.warn(`  ! ${rel}: unfilled placeholder ${leftover[0]}`);
    if (html.includes('<!--@header-->') || html.includes('<!--@footer-->')) {
      console.warn(`  ! ${rel}: a partial placeholder was not replaced`);
    }

    const outPath = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`  + ${rel}  (id=${attrs.id})`);
  }
  console.log('Done.');
}

build();
