# Authoring a lesson

A lesson is five files plus glossary terms. Nothing else needs editing: the
registry and glossary pick files up by path. Use lesson `blockchain` as the
reference for every file shape.

```
src/content/lessons/<id>/meta.ts     id, chapter, title + summary (en, tr), ordered step ids
src/content/lessons/<id>/en.ts       LessonContent (English)
src/content/lessons/<id>/tr.ts       LessonContent (Turkish)
src/scenes/<id>/views.ts             camera view per step id
src/scenes/<id>/Scene.tsx            default export: the 3D scene; optional `Controls` export
src/scenes/<id>/state.ts             optional: zustand store shared by Scene and Controls
src/content/glossary/terms/<id>.ts   default export: GlossaryTerm[] owned by this lesson
```

Types are in `src/types.ts` and `src/scene/types.ts`. The lesson's scene, steps,
levels and interaction are specified in section 3 of
`docs/superpowers/specs/2026-10-06-how-dapps-work-design.md`.

## Content

- 4–7 steps. Each step has `title`, `alt` (one or two sentences describing what
  the scene shows), `body.beginner`, `body.intermediate`, `body.expert`, and an
  optional `code` panel (shown at expert level; must exist in both languages,
  comments translated).
- Body markup: blank line between paragraphs; lines starting `- ` form a list;
  `**bold**`, `*italic*`, `` `code` ``, `[[term-id]]`, `[[term-id|shown text]]`.
  Titles, `alt` and `labels` are plain text.
- Length: 2–4 short paragraphs per level. Beginner: an everyday analogy, no
  jargon beyond the terms being introduced. Intermediate: the real mechanism
  with real numbers. Expert: formulas, data structures, field and function
  names, edge cases; be exact.
- Every technical term is a `[[term-id]]` the first time it appears in a
  paragraph (repeat freely; each one is tappable). Term ids are allocated per
  lesson in the table in `docs/superpowers/plans/2026-10-06-how-dapps-work.md`;
  you may reference any id in that table, including other lessons'.
- `labels` holds every string the scene or its controls display. Same keys in
  both languages.

### Turkish

- Technical terms are **not translated**. They stay in English inside double
  quotes. `[[term-id]]` adds the quotes for you; write suffixes after the token:
  `[[block]]'lar` renders as `"block"'lar`, `[[hash]]'i` as `"hash"'i`.
- Do not use `[[id|...]]` to inflect a term in Turkish; that would put the
  suffix inside the quotes.
- English technical words that have no glossary entry are quoted by hand:
  `"light client"`. Product and chain names (Bitcoin, Ethereum, Uniswap,
  Solana) are proper nouns and take no quotes.
- Everything else is natural, fluent Turkish, informal "sen" address, written
  fresh rather than translated word for word.
- Scene `labels` are short tags; keep technical words in English without quotes
  there (`Block 2`, `hash`), translate the rest.

## Glossary terms

Each term: `id`, `name` (canonical English), `category`
(`basics | crypto | consensus | chains | dapps | defi`), `related` (existing
ids), `lesson` (this lesson's id), and `en` / `tr` each with `short` (one
sentence, shown in the tooltip) and `long` (2–3 short paragraphs, may contain
`[[term-id]]`). The Turkish rules above apply.

## Scene

A scene is a React component rendered inside the canvas. It receives
`SceneProps` (`stepId`, `stepIndex`, `level`, `lang`, `labels`,
`reducedMotion`) and must not read the app store or the router.

- World: y is up; the ground is y = 0. The camera looks from (+x, +y, +z), so
  +x runs to the lower right of the screen and +z to the lower left.
- `views.ts`: for each step id, `{ target: [x, y, z], zoom }`. At zoom 1 the
  canvas shows a frame 17.5 units wide by 14 tall on any screen. Compose so
  everything important fits that frame; typical zoom is 0.9–1.6.
- Import everything from `src/scene/kit`:
  - `Anim` — group that eases to its `position` / `rotation` / `scale`;
    `show={false}` shrinks it away. Use it for every change between steps so
    transitions animate instead of cutting.
  - `Label` — text anchored to a 3D point. `minLevel` / `maxLevel` gate it by
    level; `tone` picks a style (`default`, `mono`, `plain`, `tx`, `valid`,
    `invalid`, `actor`, `block`, `tokenA`, `tokenB`). Labels inside a hidden
    `Anim` hide automatically. Keep them short; they must not overlap at
    390px width.
  - `useLoop((time, dt) => …)` — per-frame callback for continuous motion.
    Never call `useFrame` directly: `useLoop` keeps the on-demand render loop
    alive and stops for reduced motion.
  - `Mover` — moves children along a `path` (packets, messages).
  - Primitives `Box`, `Cyl`, `Ball`, `Mat`; pieces `Platform`, `Block`,
    `ChainLink`, `NodeTower`, `Wallet`, `Packet`, `MinerRig`, `CoinStack`,
    `ValidatorPillar`, `Token`, `PoolBasin`, `ContractMachine`, `Person`,
    `Screen`, `FlowLine`; `ShadowGround` once per scene.
  - Build lesson-specific shapes from the primitives inside the scene file.
- Colors: only `ColorKey` names from `src/theme/tokens.ts`, never hex. Fixed
  meaning everywhere: `tx` transaction, `block` block, `valid` / `invalid`,
  `actor` miner / validator / user, `tokenA` / `tokenB`, `contract`,
  `neutral`, `chain`, `platform`, `ground`.
- Levels: Beginner shows shapes and a few plain captions. Intermediate adds
  names and numbers (`minLevel="intermediate"`). Expert adds formulas and field
  names (`minLevel="expert"`, `tone="mono"`).
- Every step must look visibly different from the one before it.
- Interaction: export `Controls` (plain HTML using the `.ctl`, `.ctl-field`,
  `.ctl-stats`, `.ctl-stat`, `.btn` classes), sharing state with the scene
  through a zustand store in `state.ts`. Return `null` on steps without
  controls. Numbers come from `src/sim/*`; never show `NaN` or `Infinity`.

## Checking

```
npx tsc --noEmit
npx vitest run                      # content check lists problems per lesson
node scripts/shot.mjs '/en/lesson/<id>/2?level=expert' out.png 1440 900 dark
node scripts/shot.mjs '/tr/lesson/<id>/2?level=beginner' out.png 390 844
```

`shot.mjs` needs the dev server (`npx vite --port 5273 --strictPort`) and
prints console errors. Look at the image: check composition, overlap and
clipping at both sizes and in both themes.
