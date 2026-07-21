#!/usr/bin/env node
'use strict';

/*
 * import-atlassian-features.js — zero-dependency Node (uses system `git`).
 *
 * Builds data/atlassian-features.json, the trimmed snapshot that build.js turns
 * into the terminal-style tracker pages. Feature data comes from the
 * atlassian-features repo (https://github.com/925963/atlassian-features), which
 * re-scrapes the Atlassian Cloud weekly release notes.
 *
 * Usage:
 *   node scripts/import-atlassian-features.js --remote        (recommended)
 *       shallow + sparse clones the repo and imports the latest data. No local
 *       checkout needed — always current. This is what the weekly GitHub Action
 *       runs (.github/workflows/refresh-tracker.yml).
 *
 *   node scripts/import-atlassian-features.js [path/to/data/features]
 *       imports from a local checkout (defaults to ../atlassian-features).
 *
 * Then run `node build.js`.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SRC = path.join(ROOT, '..', 'atlassian-features', 'data', 'features');
const OUT = path.join(ROOT, 'data', 'atlassian-features.json');
const REPO_URL = 'https://github.com/925963/atlassian-features.git';
const DESC_CAP = 280;

function collapse(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// Shallow + sparse clone: fetch only data/features, not node_modules/dist.
function cloneRemote() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atlf-'));
  console.log(`Cloning ${REPO_URL} (shallow, sparse) ...`);
  execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', REPO_URL, tmp], { stdio: 'inherit' });
  execFileSync('git', ['-C', tmp, 'sparse-checkout', 'set', 'data/features'], { stdio: 'inherit' });
  return { dir: path.join(tmp, 'data', 'features'), cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

function resolveSource() {
  const args = process.argv.slice(2);
  if (args.includes('--remote')) return cloneRemote();
  const pathArg = args.find((a) => !a.startsWith('--'));
  const dir = pathArg ? path.resolve(pathArg) : DEFAULT_SRC;
  return { dir, cleanup: () => {} };
}

function main() {
  const src = resolveSource();
  try {
    if (!fs.existsSync(src.dir)) {
      console.error(`Source not found: ${src.dir}`);
      console.error('Pass a path to the atlassian-features data/features dir, or use --remote.');
      process.exit(1);
    }

    const files = fs.readdirSync(src.dir).filter((f) => f.endsWith('.json'));
    const features = [];
    let dataThrough = null;

    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(src.dir, f), 'utf8'));
      let desc = collapse(d.description);
      if (desc.length > DESC_CAP) desc = desc.slice(0, DESC_CAP - 1).trimEnd() + '…';
      features.push({
        id: d.id,
        title: d.title,
        product: d.product,
        status: d.status,
        announced_date: d.announced_date || null,
        rollout_start_date: d.rollout_start_date || null,
        rollout_end_date: d.rollout_end_date || null,
        last_seen_week: d.last_seen_week || null,
        source_url: d.source_url || '',
        description: desc,
      });
      if (d.last_seen_week && (!dataThrough || d.last_seen_week > dataThrough)) {
        dataThrough = d.last_seen_week;
      }
    }

    features.sort((a, b) => (b.announced_date || '').localeCompare(a.announced_date || ''));

    const out = {
      source_repo: '925963/atlassian-features',
      data_through: dataThrough,
      feature_count: features.length,
      features,
    };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote ${features.length} features -> ${path.relative(ROOT, OUT)} (data through ${dataThrough})`);
  } finally {
    src.cleanup();
  }
}

main();
