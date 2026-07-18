#!/usr/bin/env node
'use strict';

/*
 * import-atlassian-features.js — zero-dependency Node.
 *
 * Reads the per-feature JSON files from the sibling `atlassian-features` repo
 * (https://github.com/925963/atlassian-features) and writes a single trimmed
 * snapshot to data/atlassian-features.json, which build.js turns into the
 * terminal-style tracker pages under projects/atlassian-features-tracker/.
 *
 * Usage:
 *   node scripts/import-atlassian-features.js [path-to/data/features]
 * Default source: ../atlassian-features/data/features (sibling checkout).
 *
 * Re-run this after the tracker repo re-scrapes, then `node build.js`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SRC = path.join(ROOT, '..', 'atlassian-features', 'data', 'features');
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
const OUT = path.join(ROOT, 'data', 'atlassian-features.json');

const DESC_CAP = 280;

function collapse(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source not found: ${SRC}`);
    console.error('Pass the path to the atlassian-features data/features directory.');
    process.exit(1);
  }

  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json'));
  const features = [];
  let dataThrough = null;

  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
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

  // Stable ordering in the file: newest announced first.
  features.sort((a, b) => (b.announced_date || '').localeCompare(a.announced_date || ''));

  const out = {
    source_repo: '925963/atlassian-features',
    data_through: dataThrough,
    feature_count: features.length,
    features,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${features.length} features -> ${path.relative(ROOT, OUT)} (data through ${dataThrough})`);
}

main();
