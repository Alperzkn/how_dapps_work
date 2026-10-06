# How Dapps Work

An interactive course on blockchains, consensus, L1 and L2 chains, smart
contracts, tokens, dapps, Uniswap v2 / v3 / v4 and MEV, taught through animated
isometric three.js scenes you can play with.

- Three levels per lesson: Beginner, Intermediate, Expert. One switch, same scene.
- English and Turkish. In Turkish, technical terms stay in English in quotes.
- Every technical term opens an in-app explanation (tooltip, then dialog).
- Light and dark themes, phone to projector, with a presentation mode.
- Static site: no backend, no wallet, no network calls at runtime.

## Run

```
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + static build in dist/
npm run preview
```

`dist/` can be hosted on any static host; routes use the URL hash.

## Test

```
npm test                         # unit tests + content consistency check
npx playwright install chromium  # once
npm run e2e                      # browser checks against the production build
```

## Structure

```
src/app        shell, routes, home
src/lesson     lesson page, level switch, step controls
src/glossary   term markup, tooltip, dialog, glossary page
src/scene      canvas, isometric camera, label overlay, scene kit
src/scenes     one scene per lesson
src/content    lesson text (en/tr), glossary terms, registry, content check
src/sim        tested math: SHA-256, PoW search, Uniswap v2/v3, v4 helpers
src/theme      color tokens shared by CSS and 3D
```

Adding or editing a lesson: see `docs/authoring-lessons.md`.
After changing scenes, refresh the no-WebGL still images with a dev server
running: `BASE=http://localhost:5173 npm run capture`.

Design and plan: `docs/superpowers/`.
