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
  projects.html   #   projects id="projects"
  projects/
    atlassian-documentation.html   # -> /projects/atlassian-documentation.html
partials/         # shared chrome injected at build time
  header.html     #   compact breadcrumb bar + collapsible nav dropdown
  footer.html     #   social row + READY> status
data/             # JSON that feeds data-driven pages
  atlassian-documentation.json     # the doc-link table rows
build.js          # stitches partials + data into pages/ -> repo root

index.html                          # GENERATED — do not edit by hand
projects.html                       # GENERATED — do not edit by hand
projects/atlassian-documentation.html   # GENERATED — do not edit by hand
css/styles.css    # green-phosphor terminal styling (design option 1c)
js/game.js        # platformer engine (window.createGame)
js/main.js        # wires the engine to canvas + keyboard/touch controls
js/nav.js         # header menu-dropdown toggle
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
- `{{DOC_TABLE:<name>}}` renders a terminal-style table from
  `data/<name>.json` (each item: `title`, `url`, `description`, `product`,
  `hosting`). Edit the JSON and re-run the build to update the table.

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
