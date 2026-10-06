# How Dapps Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, bilingual (EN/TR), three-level interactive web app that teaches blockchains, consensus, L1s, dapps and Uniswap v2/v3/v4 through isometric three.js scenes.

**Architecture:** Content (typed data files per lesson per language) is separate from scenes (one react-three-fiber component per lesson) and from pure simulation math (`src/sim`). A lesson page reads route + store, loads content and a lazily imported scene module, and passes `step`, `level`, `lang` down. A shared scene kit and theme token table keep all scenes visually consistent in light and dark.

**Tech Stack:** Vite, React 19, TypeScript strict, three + @react-three/fiber + @react-three/drei, zustand (persist), react-router-dom (HashRouter), @radix-ui/react-dialog + react-tooltip, plain CSS with variables, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-06-how-dapps-work-design.md`

**Execution:** The owner waived plan review and further approvals. Tasks 1–5 are done inline. Task 6 (lessons 2–11) is fanned out to parallel agents, one per lesson pair, using lesson 1 as the reference; agents do not commit. Tasks 7–8 inline.

## Global Constraints

- Languages: `en`, `tr`. Every user-visible string exists in both.
- In Turkish text, technical terms stay in English inside double quotes. Authors write `[[term-id]]`; the renderer adds the quotes. Suffixes go after the token: `[[liquidity-pool]]'a`.
- Every technical term used in lesson text is a `[[term-id]]` with a glossary entry.
- Levels: `beginner`, `intermediate`, `expert`. Level switch never changes the step.
- Camera: orthographic, isometric default in every scene.
- Colors come only from theme tokens (`src/theme/tokens.ts`); no hard-coded colors in scenes or CSS.
- Fixed color meaning: `tx`, `block`, `valid`, `invalid`, `actor` (miner/validator), `tokenA`, `tokenB`, `contract`.
- Interactive controls are HTML, not 3D objects. Touch targets ≥ 44px. No horizontal page scroll at 360px width.
- No network calls at runtime; no backend; no wallet.
- Scenes do not read the store or router.
- Hash routes: `/#/:lang`, `/#/:lang/lesson/:lessonId/:step?level=`, `/#/:lang/glossary/:termId?`.
- Reduced-motion: transitions cut, loops stop.

## Review Focus

1. **Deep link with bad parameters** (`/#/tr/lesson/uniswap-v3/99?level=guru`, unknown lesson, unknown lang): step clamps, level falls back to stored, unknown lesson shows not-found, unknown lang redirects. Test in Task 1 (route parsing).
2. **Turkish suffix after a quoted term and a term at sentence end** (`[[hash]]'i.`, `[[tick|ticks]]`): quotes wrap only the term; punctuation stays outside. Test in Task 2 (markup parser).
3. **Phone in landscape / very short viewport** (e.g. 740×360): scene and text both remain reachable, controls not covered. Browser check in Task 8.
4. **Extreme interaction inputs** (swap amount 0 or larger than reserves; v3 range with lower ≥ upper; PoW difficulty at max): sim functions return finite values or clamp; UI never shows `NaN`/`Infinity`. Tests in Task 5.
5. **WebGL unavailable or scene chunk error**: lesson text, levels, glossary and navigation still work with the fallback image. Browser check in Task 8.

---

## Shared interfaces (all tasks rely on these)

```ts
// src/types.ts
export type Lang = 'en' | 'tr';
export type Level = 'beginner' | 'intermediate' | 'expert';
export type ThemeName = 'light' | 'dark';
export type ChapterId = 'basics' | 'consensus' | 'l1' | 'dapps';

export interface LessonMeta { id: string; chapter: ChapterId; steps: string[] }   // ordered step ids
export interface StepContent {
  title: string;
  body: Record<Level, string>;          // markup: paragraphs split by blank line, **bold**, `code`, [[term]]
  alt: string;                          // what the scene shows, for screen readers and fallback
  code?: { lang: string; source: string }; // shown at expert level only
}
export interface LessonContent {
  title: string; summary: string;
  steps: Record<string, StepContent>;   // keys === meta.steps
  labels: Record<string, string>;       // strings used inside the scene and its controls
}
export interface GlossaryTerm {
  id: string; name: string;             // canonical English name
  category: 'basics' | 'crypto' | 'consensus' | 'chains' | 'dapps' | 'defi';
  related: string[]; lesson: string;
  en: { short: string; long: string }; tr: { short: string; long: string };
}

// src/scene/types.ts
export interface StepView { target: [number, number, number]; zoom: number }
export interface SceneProps { stepId: string; stepIndex: number; level: Level; lang: Lang; labels: Record<string, string>; reducedMotion: boolean }
export interface SceneModule {
  default: React.ComponentType<SceneProps>;         // rendered inside <Canvas>
  views: Record<string, StepView>;                   // one per step id
  Controls?: React.ComponentType<SceneProps>;       // optional HTML controls, rendered outside the canvas
}
```

Scene/controls shared state lives in a small module-local zustand store inside the scene's folder.

### Scene kit (`src/scene/kit`)

- `Anim({ position?, rotation?, scale?, show?, speed?, children })` — eases a group toward its props; `show={false}` scales to 0 then hides. Cuts instantly when reduced motion is on.
- `Label({ position, minLevel?, show?, tone?, children })` — HTML label anchored in 3D; hidden below `minLevel`.
- `useLevel()` → `{ level, atLeast(l) }`; `useTokens()` → theme tokens; `useLoop(cb)` — per-frame callback that keeps the on-demand loop alive and stops under reduced motion.
- Pieces: `Platform`, `Block`, `ChainLink`, `NodeTower`, `Wallet`, `Packet`, `MinerRig`, `ValidatorPillar`, `CoinStack`, `PoolBasin`, `ContractMachine`, `FlowLine`, `Person`, `Screen`. Each takes `color?: keyof SceneColors` plus size props, never raw hex.

### Glossary allocation

Each lesson owns `src/content/glossary/terms/<lessonId>.ts`. Any lesson may reference any id below.

| Lesson | Term ids |
|---|---|
| blockchain | blockchain, block, hash, sha-256, ledger, block-header, merkle-root, genesis-block, immutability, timestamp |
| transactions | transaction, wallet, private-key, public-key, address, digital-signature, ecdsa, mempool, account-nonce, confirmation, gas, gas-fee, eip-1559, seed-phrase |
| network | node, full-node, light-node, p2p, gossip, fork, reorg, finality, decentralization, consensus, fork-choice |
| pow | proof-of-work, miner, mining, nonce, difficulty, target, block-reward, halving, hashrate, 51-attack |
| pos | proof-of-stake, validator, stake, staking, slashing, attestation, epoch, slot, proposer, casper-ffg, lmd-ghost, nothing-at-stake |
| btc-vs-eth | bitcoin, ethereum, utxo, account-model, smart-contract, evm, bitcoin-script, opcode, state-trie, ether, satoshi, turing-complete |
| other-l1s | layer-1, scalability-trilemma, tps, solana, proof-of-history, avalanche, subnet, cosmos, tendermint, ibc, bft, parallel-execution |
| dapp | dapp, frontend, rpc, json-rpc, abi, calldata, event-log, indexer, token-approval, erc-20, token, solidity |
| uniswap-v2 | uniswap, dex, amm, liquidity-pool, liquidity-provider, lp-token, constant-product, reserves, swap, slippage, price-impact, impermanent-loss, twap, flash-swap, order-book, arbitrage |
| uniswap-v3 | concentrated-liquidity, tick, price-range, fee-tier, nft-position, sqrt-price-x96, liquidity-l, virtual-reserves, capital-efficiency, tick-spacing, out-of-range |
| uniswap-v4 | singleton, pool-manager, hook, flash-accounting, transient-storage, pool-key, dynamic-fee, erc-6909, native-eth, twamm, limit-order, multi-hop |

---

### Task 1: Project setup, state, routing, themes, layout shells

**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/types.ts`, `src/theme/tokens.ts`, `src/theme/applyTheme.ts`, `src/state/store.ts`, `src/app/routes.tsx`, `src/app/parseRoute.ts`, `src/app/AppShell.tsx`, `src/app/TopBar.tsx`, `src/app/LessonMenu.tsx`, `src/i18n/ui.ts`, `src/styles/*.css`. Test: `src/app/parseRoute.test.ts`, `src/state/store.test.ts`.

**Produces:** `useStore` (`lang, level, theme, completed: string[], lastVisited, set*`), `tokens[theme]` (`ui` → CSS variables, `scene` → `SceneColors`), `parseLessonRoute(params, search, meta, stored) → { lang, stepIndex, level } | 'not-found'`, `ui(lang, key)`.

- [ ] Scaffold Vite React-TS; install deps; Vitest config; branch `build-app`.
- [ ] Tests first: `parseLessonRoute` — step `99` clamps to last, `0`/`abc` → first, bad level → stored level, unknown lesson → `'not-found'`; store works when `localStorage` throws.
- [ ] Implement tokens, store (persist, guarded storage, first-visit lang from `navigator.language`, theme from `prefers-color-scheme`), routes, responsive shell per spec 4.3 (breakpoints 640 / 1024), top bar, lesson menu drawer.
- [ ] `npm test` passes; `npm run build` passes; commit.

### Task 2: Markup, glossary engine, content checks

**Files:** `src/glossary/parseMarkup.ts`, `src/glossary/Rich.tsx`, `src/glossary/Term.tsx`, `src/glossary/TermDialog.tsx`, `src/glossary/GlossaryPage.tsx`, `src/content/glossary/index.ts`, `src/content/glossary/terms/blockchain.ts`, `src/content/registry.ts`, `src/content/check.ts`, `src/content/check.test.ts`. Test: `src/glossary/parseMarkup.test.ts`.

**Produces:** `parseMarkup(text) → Block[]` (`Block = Inline[]`, `Inline = {t:'text'|'bold'|'code', v} | {t:'term', id, shown?}`), `<Rich text lang />`, `glossary: Record<string, GlossaryTerm>`, `lessons: LessonEntry[]` (`{ meta, content: Record<Lang, LessonContent>, load: () => Promise<SceneModule> }`), `checkContent() → string[]` (list of problems, empty when clean).

- [ ] Tests first: parser handles `[[hash]]'i.`, `[[tick|ticks]]`, bold, inline code, two paragraphs, unknown token left as a term node (checker reports it); Turkish render wraps the term in `"…"` with the suffix outside.
- [ ] Implement parser, `Rich`, `Term` (Radix tooltip on hover/focus at ≥ 1024px; click/tap opens dialog), `TermDialog` (centered modal on desktop, bottom sheet on mobile; short text, "more" on mobile, related terms with back stack, link to lesson; opening never changes the route).
- [ ] `checkContent` implements spec 5.5; `check.test.ts` asserts it returns `[]`.
- [ ] Glossary page with search and category filter.
- [ ] Tests pass; commit.

### Task 3: Scene canvas, camera, kit

**Files:** `src/scene/types.ts`, `src/scene/SceneCanvas.tsx`, `src/scene/CameraRig.tsx`, `src/scene/context.ts`, `src/scene/SceneBoundary.tsx`, `src/scene/Fallback.tsx`, `src/scene/kit/*.tsx`, `src/scene/kit/index.ts`.

- [ ] `SceneCanvas`: orthographic camera at iso offset `(20, 20, 20)`; `frameloop="demand"`, switched to `never` when off-screen or tab hidden; dpr cap 2 / 1.5 below 640px; shadows off below 640px; lights from tokens; sets `data-scene-ready` after first frame; WebGL detection → `Fallback`.
- [ ] `CameraRig`: eases look-at target and zoom to the step's `StepView`; zoom scaled by `min(width, height) / 600`; OrbitControls limited to ±30° azimuth, clamped polar and zoom, no pan; user input cancels easing; `resetView()` exposed for the reset button.
- [ ] Kit pieces and helpers as listed above.
- [ ] `SceneBoundary` error boundary with retry → `Fallback` (`/fallback/<lesson>/<step>.png` + `alt` text).
- [ ] Build passes; commit.

### Task 4: Lesson page and lesson 1 (style checkpoint)

**Files:** `src/lesson/LessonPage.tsx`, `StepControls.tsx`, `LevelSwitch.tsx`, `TextPanel.tsx`, `CodePanel.tsx`, `src/content/lessons/blockchain/{meta,en,tr}.ts`, `src/scenes/blockchain/{Scene.tsx,state.ts}`, `src/sim/sha256.ts` (+ test).

- [ ] `sha256(text) → hex` synchronous; test against `""`, `"abc"` and a 56-byte NIST vector.
- [ ] Lesson page: steps via buttons, arrow keys, swipe on text sheet; step in URL; marks lesson complete at last step; `aria-live` region with step `alt`.
- [ ] Lesson 1 scene with the tamper interaction (edit block data → real hashes recompute → later blocks invalid).
- [ ] Content for all steps, three levels, EN + TR; glossary terms for `blockchain`.
- [ ] Screenshot desktop + phone, light + dark; fix what looks wrong. Commit.

### Task 5: Simulation math

**Files:** `src/sim/pow.ts`, `ammV2.ts`, `ammV3.ts`, `v4Hook.ts` + tests.

**Produces:**
```ts
mineStep(header: string, startNonce: number, zeros: number, budget: number): { found: boolean; nonce: number; hash: string; tried: number }
getAmountOut(amountIn: number, reserveIn: number, reserveOut: number, feeBps?: number): number   // 0 for non-positive input
swapV2(x: number, y: number, dx: number, feeBps?: number): { x: number; y: number; out: number; priceBefore: number; priceAfter: number; impact: number }
impermanentLoss(priceRatio: number): number           // 2√r/(1+r) − 1
tickToPrice(tick: number): number; priceToTick(price: number): number
amountsForLiquidity(L: number, p: number, pa: number, pb: number): { x: number; y: number }
capitalEfficiency(p: number, pa: number, pb: number): number   // vs full-range; clamps invalid ranges to 1
dynamicFeeBps(volatility: number, baseBps?: number, maxBps?: number): number
```

- [ ] Tests first with known values: v2 `getAmountOut(1000, 100000, 100000) ≈ 987.158`; `k` never decreases after a swap; `impermanentLoss(4) ≈ −0.2`; `tickToPrice(0) = 1`, round-trip tick ↔ price; v3 amounts all-x below range and all-y above; efficiency for ±~10% range ≈ 21×; zero/negative/oversized inputs return finite numbers.
- [ ] Implement; tests pass; commit.

### Task 6: Lessons 2–11

Per lesson: `src/content/lessons/<id>/{meta,en,tr}.ts`, `src/scenes/<id>/Scene.tsx` (+ `state.ts` if interactive), `src/content/glossary/terms/<id>.ts`, one entry in `src/content/registry.ts`. Scene, steps, levels and interaction exactly as spec section 3. Follow lesson 1's file shapes and kit usage.

Done per lesson when: `npm test` (content check included) passes; the lesson renders at 1440×900 and 390×844 in both themes with no console errors; every step visibly differs from the previous; Intermediate and Expert add visible labels.

- [ ] transactions, network
- [ ] pow, pos
- [ ] btc-vs-eth, other-l1s
- [ ] dapp, uniswap-v2
- [ ] uniswap-v3, uniswap-v4

### Task 7: Home, progress, presentation mode

**Files:** `src/app/HomePage.tsx`, `src/lesson/PresentationMode.tsx`, `src/app/NotFound.tsx`.

- [ ] Home: chapters, lessons, completion marks, continue button.
- [ ] Presentation mode per spec 4.5 (≥ 640px; arrows, space, PageUp/PageDown, `L`, `Esc`).
- [ ] Commit.

### Task 8: Fallbacks, performance, browser checks

**Files:** `scripts/capture-fallbacks.ts`, `e2e/lessons.spec.ts`, `e2e/flows.spec.ts`, `playwright.config.ts`.

- [ ] Capture `public/fallback/<lesson>/<step>.png` for every step.
- [ ] Matrix: every lesson × first/last step × {1440×900, 390×844} × {en, tr} × {light, dark}: canvas ready, no console errors, no horizontal overflow.
- [ ] Flows: level switch keeps step; language switch keeps position; term tooltip + dialog; presentation keys; v2 slider changes numbers; bad deep links; landscape phone 740×360; WebGL disabled shows fallback and text.
- [ ] Check chunk sizes (home loads no scene chunk). Fix findings. Commit.
