# valk.nu

A personal landing page styled as a green-phosphor CRT terminal, featuring a
terminal-style nav, social links, and an original playable 8-bit platformer
rendered in a `<canvas>`.

Pure HTML/CSS/vanilla JS — no frameworks, no bundler. The only tooling is one
zero-dependency Node script (`build.js`) that stitches shared partials into each
page; its output is plain static HTML deployable as-is to GitHub Pages.

## Structure

```
pages/            # SOURCE templates (edit these); subfolders map to URLs
  index.html      #   home id="home"
  blog.html       #   blog id="blog" (placeholder)
  contact.html    #   contact id="contact" (animated boot sequence)
  404.html        #   not-found id="404" (base="/valk-nu/", standalone)
  projects.html   #   projects id="projects"
  projects/
    atlassian-documentation.html   # -> /projects/atlassian-documentation.html
    toolbox.html                   # -> /projects/toolbox.html
    atlassian-features-tracker/    # -> /projects/atlassian-features-tracker/...
      index.html                   #   all features
      new-this-week.html
      coming-soon.html
      rolling-out.html
      completed.html
      how-this-works.html
partials/         # shared chrome injected at build time
  header.html     #   compact breadcrumb bar + collapsible nav dropdown
  footer.html     #   social row + READY> status
data/             # JSON that feeds data-driven pages
  atlassian-documentation.json     # doc-link table (columns + items)
  toolbox.json                     # toolbox table (columns + items)
  atlassian-features.json          # tracker snapshot (see scripts/ below)
scripts/
  import-atlassian-features.js     # refresh the tracker snapshot from the
                                   # sibling atlassian-features repo
build.js          # stitches partials + data into pages/ -> repo root

index.html                          # GENERATED — do not edit by hand
projects.html                       # GENERATED — do not edit by hand
projects/atlassian-documentation.html   # GENERATED — do not edit by hand
css/styles.css    # green-phosphor terminal styling (design option 1c)
js/game.js        # platformer engine (window.createGame)
js/main.js        # wires the engine to canvas + keyboard/touch controls
js/nav.js         # header menu-dropdown toggle
js/contact.js     # contact page boot-sequence animation (contact.html only)
js/notfound.js    # 404 page: glitch cycle, fact reroll, requested-path inject
js/pagination.js  # client-side search ([data-search]) + pagination
                  #   ([data-paginate]); search filters across all pages
avatar-rik.png    # portrait asset (tinted green via CSS)
```

## Build

Edit templates in `pages/` and partials in `partials/`, then regenerate the
root HTML:

```bash
node build.js
```

Each template starts with a directive that drives the shared header:

```html
<!--@page id="projects" title="atlassian documentation" parent="projects" parenturl="projects.html"-->
```

- `id` marks the matching nav item as current.
- `title` / `parent` / `parenturl` build the breadcrumb trail
  (`valk.nu > projects > atlassian documentation`).
- The build injects the partials at `<!--@header-->` / `<!--@footer-->`.
- `{{ROOT}}` in any template/partial resolves to the correct relative prefix
  for that page's depth, so pages in subfolders link correctly.
- `{{TABLE:<name>}}` renders a terminal-style table from `data/<name>.json`.
  The JSON is schema-driven — it declares its own `columns`, so the same token
  works for any dataset:

  ```json
  {
    "count_label": "tools",
    "columns": [
      { "header": "CATEGORY", "field": "category", "class": "doc-meta" },
      { "header": "TOOL", "field": "title", "link": "url", "class": "doc-link" },
      { "header": "DESCRIPTION", "field": "description", "class": "doc-desc" }
    ],
    "items": [ { "category": "...", "title": "...", "url": "...", "description": "..." } ]
  }
  ```

  A column with `link` renders its `field` as a link to `item[link]`. Rows
  render in JSON order — reorder/add items in the JSON and re-run the build.
- `{{TRACKER_NAV:<view>}}` / `{{FEATURES:<view>}}` build the Atlassian features
  tracker views (`all`, `new-this-week`, `coming-soon`, `rolling-out`,
  `completed`) from `data/atlassian-features.json`.
- `crumbs="label=url|label=url"` in the directive builds a multi-level
  breadcrumb (URLs are site-root-relative; `{{ROOT}}` is applied per page).
- `base="/"` in the directive forces `{{ROOT}}` to an absolute base instead of
  a relative prefix. Used by `404.html`, which GitHub Pages serves for unmatched
  URLs at any depth (relative paths would break). The site is served at the
  `valk.nu` root via CNAME, so the base is `/`; if it ever moves back to a
  project subpath, set `base="/valk-nu/"`.

## Atlassian features tracker

The tracker pages are generated from a snapshot of the separate
[atlassian-features](https://github.com/925963/atlassian-features) repo (which
scrapes the Atlassian Cloud weekly release notes). To refresh:

```bash
node scripts/import-atlassian-features.js   # reads ../atlassian-features/data/features
node build.js
```

`import-atlassian-features.js` writes a trimmed `data/atlassian-features.json`
(no per-feature history, capped descriptions). Feature titles link out to their
Atlassian source page — the tracker doesn't generate per-feature detail pages.

The generated `*.html` files are committed so GitHub Pages can serve them
directly (no CI required); re-run `node build.js` and commit after any change.

## Run locally

```bash
node build.js                 # (re)generate the pages
python3 -m http.server 8000   # then visit http://localhost:8000
```

## The game

- Arrows move, Up or Space to jump (click the screen first to focus it).
- Collect 3 gems (+10 each) and the star (7s overclock: faster + higher jump).
- Stomp the bug from above (+20) — touching it from the side kills you.
- Reach the flag on the far right to clear the level.
- On touch devices, use the on-screen `[<] [^] [>]` and `[RESET]` buttons.

## Deployment

Hosted on GitHub Pages from the repository root (`main` branch).
