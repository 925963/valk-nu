#!/usr/bin/env node
'use strict';

/*
 * valk.nu static site builder — zero dependencies, plain Node.
 *
 * Stitches partials/header.html and partials/footer.html into each source
 * template in pages/*.html and writes the final page to the repo root
 * (index.html, projects.html, ...). No runtime fetch(), no framework, no
 * bundler — the output is plain static HTML deployable as-is to GitHub Pages.
 *
 * Usage:  node build.js
 *
 * Each source template must start with a directive line, e.g.:
 *   <!--@page id="projects" title="projects"-->
 * and contain <!--@header--> / <!--@footer--> placeholders where the shared
 * partials should be injected. The build fills the header's {{PAGE_TITLE}}
 * breadcrumb and marks the nav item whose data-nav matches `id` as current.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PAGES_DIR = path.join(ROOT, 'pages');
const PARTIALS_DIR = path.join(ROOT, 'partials');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

// Strip the leading HTML-comment banner from a partial so it doesn't ship.
function stripBanner(html) {
  return html.replace(/^\s*<!--[\s\S]*?-->\s*/, '');
}

function parseDirective(src, file) {
  const m = src.match(/<!--@page\s+([^>]*?)-->/);
  if (!m) {
    throw new Error(`${file}: missing <!--@page id="..." title="..."--> directive`);
  }
  const attrs = {};
  const re = /(\w+)="([^"]*)"/g;
  let a;
  while ((a = re.exec(m[1]))) attrs[a[1]] = a[2];
  if (!attrs.id) throw new Error(`${file}: @page directive needs an id`);
  return { attrs, raw: m[0] };
}

function buildHeader(headerHtml, id, title) {
  let out = headerHtml.replace(/\{\{PAGE_TITLE\}\}/g, title);
  // Mark the current nav item. data-nav values are unique, so a plain
  // string replace is safe and avoids per-page hardcoding in the partial.
  const needle = `data-nav="${id}"`;
  if (out.includes(needle)) {
    out = out.replace(needle, `${needle} data-current`);
  } else {
    console.warn(`  ! no nav item matches id="${id}" (breadcrumb only)`);
  }
  return out;
}

function build() {
  const header = stripBanner(read(path.join(PARTIALS_DIR, 'header.html')));
  const footer = stripBanner(read(path.join(PARTIALS_DIR, 'footer.html')));

  const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html'));
  if (files.length === 0) throw new Error('no templates found in pages/');

  console.log('Building valk.nu ...');
  for (const file of files) {
    const src = read(path.join(PAGES_DIR, file));
    const { attrs, raw } = parseDirective(src, file);
    const title = attrs.title || attrs.id;

    let html = src.replace(raw, '').replace(/^\s*\n/, '');
    html = html.replace('<!--@header-->', () => buildHeader(header, attrs.id, title));
    html = html.replace('<!--@footer-->', () => footer);

    const leftover = html.match(/\{\{[^}]+\}\}/);
    if (leftover) console.warn(`  ! ${file}: unfilled placeholder ${leftover[0]}`);
    if (html.includes('<!--@header-->') || html.includes('<!--@footer-->')) {
      console.warn(`  ! ${file}: a partial placeholder was not replaced`);
    }

    const outPath = path.join(ROOT, file);
    fs.writeFileSync(outPath, html);
    console.log(`  + ${file}  (id=${attrs.id})`);
  }
  console.log('Done.');
}

build();
