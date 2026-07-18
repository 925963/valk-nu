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
 *   {{DOC_TABLE:<name>}}       a terminal-style table generated from
 *                              data/<name>.json
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

function buildBreadcrumb(attrs) {
  const sep = ' <span class="breadcrumb-sep">&gt;</span> ';
  const parts = ['<a href="{{ROOT}}index.html">valk.nu</a>'];
  if (attrs.parent && attrs.parenturl) {
    parts.push(`<a href="{{ROOT}}${esc(attrs.parenturl)}">${esc(attrs.parent)}</a>`);
  }
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
function renderDocTable(name, file) {
  const dataPath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(dataPath)) {
    console.warn(`  ! ${file}: data/${name}.json not found`);
    return `<!-- missing data/${name}.json -->`;
  }
  const data = JSON.parse(read(dataPath));
  const rows = data.items.map((it) => (
    '        <tr>\n' +
    `          <td class="doc-link"><a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a></td>\n` +
    `          <td class="doc-desc">${esc(it.description || '')}</td>\n` +
    `          <td class="doc-meta">${esc(it.product || '')}</td>\n` +
    `          <td class="doc-meta">${esc(it.hosting || '')}</td>\n` +
    '        </tr>'
  )).join('\n');
  return (
    '<div class="doc-table-wrap">\n' +
    '      <table class="doc-table">\n' +
    '        <thead><tr><th>LINK</th><th>BESCHRIJVING</th><th>PRODUCT</th><th>HOSTING</th></tr></thead>\n' +
    '        <tbody>\n' +
    rows + '\n' +
    '        </tbody>\n' +
    '      </table>\n' +
    `    </div>\n    <p class="doc-count">// ${data.items.length} entries</p>`
  );
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

    // Inject shared chrome.
    let head = header.replace('{{BREADCRUMB}}', () => buildBreadcrumb(attrs));
    head = markCurrentNav(head, attrs.id, rel);
    html = html.replace('<!--@header-->', () => head);
    html = html.replace('<!--@footer-->', () => footer);

    // Data-driven tables.
    html = html.replace(/\{\{DOC_TABLE:([\w-]+)\}\}/g, (_, name) => renderDocTable(name, rel));

    // Resolve relative paths for this page's depth (must run last).
    html = html.replace(/\{\{ROOT\}\}/g, rootPrefix(rel));

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
