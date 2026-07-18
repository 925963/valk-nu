# valk.nu

A personal landing page styled as a green-phosphor CRT terminal, featuring a
terminal-style nav, social links, and an original playable 8-bit platformer
rendered in a `<canvas>`.

Pure HTML/CSS/vanilla JS — no frameworks, no bundler. The only tooling is one
zero-dependency Node script (`build.js`) that stitches shared partials into each
page; its output is plain static HTML deployable as-is to GitHub Pages.

## Structure

```
pages/            # SOURCE templates (edit these), one per page
  index.html      #   home id="home"
  projects.html   #   projects id="projects"
partials/         # shared chrome injected at build time
  header.html     #   compact breadcrumb bar + collapsible nav dropdown
  footer.html     #   social row + READY> status
build.js          # stitches partials into pages/ -> repo root (node build.js)

index.html        # GENERATED — do not edit by hand
projects.html     # GENERATED — do not edit by hand
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
<!--@page id="projects" title="projects"-->
```

`id` marks the matching nav item as current (breadcrumb + `>` cursor); the build
injects the partials at the `<!--@header-->` and `<!--@footer-->` placeholders.
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
