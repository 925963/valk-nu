# valk.nu

A personal landing page styled as a green-phosphor CRT terminal, featuring a
terminal-style nav, social links, and an original playable 8-bit platformer
rendered in a `<canvas>`.

Pure HTML/CSS/vanilla JS — no build tooling, no frameworks, no bundler.

## Structure

```
index.html        # single page
css/styles.css    # green-phosphor terminal styling (design option 1c)
js/game.js        # platformer engine (window.createGame)
js/main.js        # wires the engine to canvas + keyboard/touch controls
avatar-rik.png    # portrait asset (tinted green via CSS)
```

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## The game

- Arrows move, Up or Space to jump (click the screen first to focus it).
- Collect 3 gems (+10 each) and the star (7s overclock: faster + higher jump).
- Stomp the bug from above (+20) — touching it from the side kills you.
- Reach the flag on the far right to clear the level.
- On touch devices, use the on-screen `[<] [^] [>]` and `[RESET]` buttons.

## Deployment

Hosted on GitHub Pages from the repository root (`main` branch).
