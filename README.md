# valk.nu

A calm, Dutch-language personal blog by Rik de Valk — Agile & Atlassian,
reviews, and short "vondsten" (tool tips) — plus a small Projecten section
carrying over the Atlassian features tracker, a toolbox, and a documentation
link list.

Built with [Astro](https://astro.build), static output, zero client JS by
default. No CSS framework — plain CSS on a token system (`src/styles/`).

## Structure

```
src/
  content/posts/*.md          # blog posts (Markdown; frontmatter schema in content.config.ts)
  content.config.ts           # the `posts` collection schema
  config/topics.ts            # the three topics (agile, reviews, vondsten)
  lib/
    content.ts                # reading time, ISO week, isPublished() (draft filtering)
    features.ts                # data/atlassian-features.json access + status categorisation
    rehype-*.mjs               # markdown->HTML transforms (section numbers, callouts, code blocks)
  layouts/Layout.astro        # base HTML shell: head, SiteHeader, SiteFooter, SearchDialog
  components/                 # the design system's components, ported to .astro
  pages/
    index.astro                # home
    [slug].astro                # post pages (artikel/review/vondst)
    onderwerpen/                # topic index + per-topic page/feed
    archief/                    # archive
    projecten/                  # tracker, toolbox, documentation
    feed.xml.js                 # site-wide RSS
    404.astro
  styles/
    tokens.css                  # design tokens (colour/type/space) — light + dark
    components.css              # component styles on those tokens (rv- prefixed classes)
    fonts.css                   # self-hosted Geist/Geist Mono, subset to Latin + Latin Ext
    site.css                    # page layout, tables, search UI — everything not in the
                                 # component bundle above
data/
  atlassian-features.json      # tracker snapshot (refreshed by scripts/import-atlassian-features.js)
  toolbox.json                 # schema-driven link table (columns + items)
  atlassian-documentation.json # schema-driven link table (columns + items)
public/                        # served as-is at the site root (CNAME, old-URL redirect stubs)
scripts/import-atlassian-features.js
```

## Develop

```bash
npm install
npm run dev       # http://localhost:4321, hot reload
npm run build     # astro build, then pagefind indexes dist/ for search
npm run preview   # serve the built dist/ — needed to test search, view
                   # transitions and the reading-progress line, which only
                   # work against the real static output
```

## Content

Posts live in `src/content/posts/*.md`. Frontmatter fields: `title`,
`description`, `date`, `updated?`, `topic` (`agile` | `reviews` | `vondsten`),
`type` (`artikel` | `review` | `vondst`), `lang` (`nl` default | `en`),
`draft`, plus a `review` or `service` block matching the post's `type` (see
`src/content.config.ts` for the exact schema). Reading time, section numbers,
and the table of contents are all derived at build time — nothing to fill in
by hand.

**Drafts** render at their own URL (so a draft can be previewed by direct
link) but are excluded from every listing page, both RSS feeds, and search in
a production build (`isPublished()` in `src/lib/content.ts`). They stay
visible everywhere in `npm run dev`. Every seed post shipped in this rebuild
is `draft: true` — the example bodies are mock copy for layout QA, not
Rik's writing.

## The Atlassian features tracker

`data/atlassian-features.json` is a snapshot from the separate
[atlassian-features](https://github.com/925963/atlassian-features) repo
(which scrapes the Atlassian Cloud weekly release notes). The tracker pages
in `src/pages/projecten/atlassian-features/` render that snapshot at build
time — no runtime fetch, no per-feature detail pages (titles link to their
Atlassian source).

**Automatic:** `.github/workflows/deploy.yml` re-imports the latest data
before every build — on push to `main`, weekly (Mondays 06:00 UTC), and on
manual dispatch. If the import fails, the build continues with whatever
snapshot is already committed (`continue-on-error: true`), so a scraper
hiccup never blocks a deploy.

**Manual refresh:**

```bash
node scripts/import-atlassian-features.js --remote   # shallow-clones the latest data
npm run build
```

## Deployment

GitHub Pages, built by `.github/workflows/deploy.yml`:
checkout → Node 22 → `npm ci` → refresh the tracker data → `npm run build` →
upload `dist/` as the Pages artifact → deploy. Pages source must be set to
"GitHub Actions" (Settings → Pages) for this to run — see the handoff's
switch-over checklist for that one-time change.

Custom domain via `public/CNAME` (`valk.nu`).

## Design system

The tokens and component CSS (`src/styles/tokens.css`,
`src/styles/components.css`) come from a Claude-generated design system
("Rik de Valk") and are imported as-is. If the design system changes,
regenerate those two files from it rather than hand-editing the values here.
