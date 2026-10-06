# How Dapps Work — Design Spec

Date: 2026-10-06
Status: awaiting review

## 1. Purpose

An interactive web app that teaches how blockchains and dapps work, from first
principles up to Uniswap v4, through animated isometric three.js scenes rather
than text alone.

It serves two uses:

- **Self-study:** anyone opens it and works through lessons at their own pace.
- **Presenting:** the owner drives it in front of an audience (workshop, meetup,
  colleagues) in a full-screen presentation mode.

It serves three knowledge levels with the same lessons:

- **Beginner:** no prior knowledge. Plain analogies, no jargon without explanation.
- **Intermediate:** knows the words, wants the mechanics. Labels, numbers, flows.
- **Expert:** developers and technical readers. Formulas, data structures, Solidity.

Success means: a beginner can finish a lesson without leaving the app to look
anything up; an expert finds the Expert level correct and non-trivial; the
presenter can run any lesson from a clicker on a projector; everything works on
a phone.

## 2. Requirements

Stated by the owner:

- Topics: how blockchains work; Bitcoin vs Ethereum vs other L1s; PoW and PoS;
  how dapps work; Uniswap v2, v3, v4 and their differences.
- Three levels of understanding.
- three.js isometric illustrations for everything; not text only.
- Turkish and English.
- In Turkish, technical terms are not translated: they stay in English inside
  double quotes.
- Technical terms are explained inside the app with tooltips or modals.
- Mobile responsive.
- Self-study and presentation use.
- One level switch; the same scene gains detail per level.
- Light and dark themes.
- Vite + React + TypeScript + react-three-fiber.
- All eleven lessons delivered in one spec and one plan.

Out of scope: accounts or login, quizzes, certificates, live blockchain data,
wallet connection, L2s and rollups, DeFi protocols other than Uniswap, a CMS,
server-side rendering.

## 3. Lessons

Eleven lessons in four chapters. Each lesson has 4–7 steps. A step is one scene
state (camera position, visible objects, running animation) plus a short text at
each level.

For each lesson below: the scene, the steps, what each level adds, and the
interaction if any.

### Chapter 1 — Blockchain basics

**1. `blockchain` — What is a blockchain**
Scene: a row of block cubes on a platform, joined by chain links.
Steps: a shared ledger page → pages become blocks → each block carries the
previous block's fingerprint → tampering breaks the chain → why that makes
history hard to rewrite.
Levels: Beginner: notebook-page analogy. Intermediate: block header fields
(prev hash, timestamp, tx list). Expert: SHA-256, Merkle root, header layout.
Interaction: edit a block's data; its hash changes and every later block turns
invalid. Hashes are computed for real in the browser.

**2. `transactions` — Transactions and wallets**
Scene: two wallets, a transaction packet travelling to a mempool tray, then into
a block.
Steps: a wallet is a key pair → signing → broadcast → waiting in the mempool →
inclusion in a block → confirmations.
Levels: Beginner: key and signature as lock and wax seal. Intermediate: public
key, address, nonce, fee. Expert: ECDSA over secp256k1, tx fields, gas and
EIP-1559 fee fields.

**3. `network` — Nodes and the network**
Scene: a cluster of node towers on an isometric map, messages hopping between them.
Steps: many copies of the ledger → gossip → every node checks the rules → a bad
block is rejected → forks and the longest/heaviest chain.
Levels: Beginner: nobody is in charge, everyone has a copy. Intermediate: full
vs light nodes, propagation. Expert: P2P gossip, fork choice, reorgs, finality.

### Chapter 2 — Consensus

**4. `pow` — Proof of Work**
Scene: miner rigs racing; a nonce counter spinning over a candidate block.
Steps: who gets to add the next block → the puzzle → the race → winner broadcasts
→ difficulty adjusts → cost of attacking.
Levels: Beginner: lottery where tickets cost electricity. Intermediate: nonce,
target, difficulty, block reward, halving. Expert: `hash(header) < target`,
retarget formula, 51% attack economics, selfish mining mention.
Interaction: a difficulty slider and a "mine" button running a real (tiny)
hash search, showing attempts and time.

**5. `pos` — Proof of Stake**
Scene: validator pillars with stacked coins; a spotlight choosing a proposer;
attestation ticks flowing to a block.
Steps: stake replaces electricity → proposer selection → attestations →
finality → slashing → PoW vs PoS side by side.
Levels: Beginner: deposit you lose if you cheat. Intermediate: validators,
epochs and slots, rewards, slashing. Expert: Ethereum's Gasper (LMD-GHOST +
Casper FFG), 32 ETH, 2/3 supermajority, nothing-at-stake, long-range attacks.

### Chapter 3 — L1 chains

**6. `btc-vs-eth` — Bitcoin vs Ethereum**
Scene: split platform; Bitcoin side shows coins as discrete UTXO chips, Ethereum
side shows account boxes with balances and a contract machine.
Steps: different goals → UTXO vs accounts → Script vs EVM → fees and gas →
block time and supply → summary table.
Levels: Beginner: digital gold vs world computer. Intermediate: the two ledger
models, smart contracts, gas. Expert: UTXO set vs state trie, opcodes, EVM
execution, EIP-1559 burn, issuance.

**7. `other-l1s` — Other L1s**
Scene: several island chains of different shapes with throughput lanes.
Steps: the scalability trilemma → Solana (PoH, parallel execution) → Avalanche
(subnets, repeated sampling) → Cosmos-style app chains (Tendermint, IBC) →
trade-off comparison.
Levels: Beginner: faster and cheaper, at what cost. Intermediate: TPS, finality
time, validator count, hardware needs. Expert: consensus families, execution
models, state growth.
Figures quoted here are approximate and labelled as such, with an "as of" date.

### Chapter 4 — Dapps and Uniswap

**8. `dapp` — How a dapp works**
Scene: layered stack: browser frontend, wallet, RPC node, smart contract on chain.
Steps: a normal app vs a dapp → the frontend is just a website → the wallet signs
→ RPC carries the call → the contract executes → events come back to the UI.
Levels: Beginner: the app has no owner-run server deciding the rules.
Intermediate: read calls vs transactions, ABI, events, approvals. Expert:
JSON-RPC methods, calldata encoding, `eth_call` vs `eth_sendRawTransaction`,
logs and indexers.

**9. `uniswap-v2` — Uniswap v2**
Scene: a pool basin holding two token stacks with a price curve drawn on its wall.
Steps: no order book → the pool and LPs → `x · y = k` → a swap moves the price →
fees and LP tokens → slippage and impermanent loss.
Levels: Beginner: a vending machine that reprices itself. Intermediate: reserves,
0.3% fee, LP shares, slippage. Expert: `getAmountOut` formula, price impact,
impermanent loss formula, TWAP oracle, flash swaps.
Interaction: a swap-amount slider; the point slides along the curve, reserves
and price update using the tested AMM functions.

**10. `uniswap-v3` — Uniswap v3**
Scene: the v2 basin sliced into price-range bins of differing depth.
Steps: v2's idle capital → concentrated liquidity → ticks and ranges → a swap
crossing ticks → fee tiers and positions as NFTs → capital efficiency vs risk.
Levels: Beginner: put your money only where trades happen. Intermediate:
price ranges, in/out of range, fee tiers, NFT positions. Expert: `sqrtPriceX96`,
tick math (`p = 1.0001^tick`), liquidity `L`, virtual reserves, tick bitmap.
Interaction: drag a range's lower and upper bounds; see capital efficiency vs a
v2 position and when the position goes out of range.

**11. `uniswap-v4` — Uniswap v4 and comparison**
Scene: one large singleton vault holding many pools, with hook plugs around a
swap pipeline.
Steps: one contract per pool vs the singleton → flash accounting → hooks →
native ETH and dynamic fees → v2 / v3 / v4 side by side → which to use when.
Levels: Beginner: one building for all pools, with plug-in rules. Intermediate:
`PoolManager`, hook points, cheaper multi-hop swaps, custom fees. Expert:
`PoolKey`, hook permission bits in the hook address, `unlock` callback and
transient storage (EIP-1153), ERC-6909 claims, hook examples (dynamic fee, TWAMM,
limit orders).
The final step is a comparison table of v2, v3 and v4.

## 4. User experience

### 4.1 Level switch

A three-way switch, Beginner / Intermediate / Expert, visible on every lesson.
Changing it never changes the step or reloads the scene. It changes:

- the step text, and
- the scene's detail layer: Beginner shows shapes and motion only; Intermediate
  adds labels and numbers on objects; Expert adds formulas, field names and a
  collapsible code panel in the text column.

The chosen level is global and remembered.

### 4.2 Steps

Previous / Next buttons, a step indicator, and keyboard arrows. Moving between
steps animates the camera and objects from one state to the next rather than
cutting. Each step is addressable by URL.

### 4.3 Layout

**Desktop (≥ 1024px):** scene about two thirds of the width, text panel on the
right, step controls under the scene, lesson menu in a collapsible left sidebar,
top bar with level switch, language, theme, glossary, presentation mode.

**Tablet (640–1023px):** scene on top at about 55% height, text below, menu in a
drawer.

**Mobile (< 640px):** scene pinned to the top ~45% of the viewport; text in a
scrollable sheet below; step controls in a bottom bar within thumb reach; lesson
menu in a drawer; the level switch stays visible above the text; language,
theme and glossary collapse into one settings button. Touch targets at least
44px. No horizontal page scroll.

### 4.4 Touch and input

Swipe left/right on the text sheet changes step. On the scene: one finger
rotates within limits (about ±30° around the isometric angle), pinch zooms within
limits, and a reset-view button restores the step's camera. Interactive controls
(sliders, buttons) are HTML controls laid over or under the scene, not 3D
objects, so they work with touch, keyboard and screen readers.

### 4.5 Presentation mode

Scene goes full screen; the text collapses to a single caption line (the step
title plus one sentence at the current level); arrow keys, space and
PageUp/PageDown (clicker keys) move steps; `Esc` exits; `L` cycles level.
Available at ≥ 640px width.

### 4.6 Home and navigation

A home page lists the four chapters and eleven lessons with completion marks and
a "continue" button. The glossary has its own page with search.

### 4.7 Routes

Hash routing, so the static build runs on any host without server config.

- `/#/:lang` — home
- `/#/:lang/lesson/:lessonId/:step` — lesson at step (1-based); `?level=beginner|intermediate|expert`
- `/#/:lang/glossary` and `/#/:lang/glossary/:termId`

`:lang` is `en` or `tr`. A URL's `lang` and `level` override stored preferences.
Unknown lesson or term shows a not-found page; an out-of-range step clamps.

## 5. Language and glossary

### 5.1 Languages

English and Turkish. First visit follows the browser language (Turkish if it
starts with `tr`, otherwise English). The choice is remembered. Switching keeps
the current lesson, step and level.

### 5.2 Term markup

Lesson text marks technical terms with `[[term-id]]`. The renderer replaces the
token with the term's canonical English name as an interactive element.

- In English: rendered as the term, underlined-dotted.
- In Turkish: rendered as the English term inside double quotes, e.g.
  `Bir [[liquidity-pool]] iki token tutar.` → *Bir "liquidity pool" iki token tutar.*
  Turkish suffixes are written by the author after the token:
  `[[liquidity-pool]]'a` → *"liquidity pool"'a*.

`[[term-id|shown text]]` overrides the displayed text (plurals, capitalisation).

### 5.3 Term explanations

- Desktop: hover or keyboard focus opens a tooltip with a one- or two-sentence
  definition in the current language. Click opens the full modal.
- Mobile: tap opens a bottom sheet with the short definition and a "more" button
  that expands to the full content.
- Full content: longer explanation, an optional small diagram (SVG), related
  terms (which open in the same modal with a back button), and a link to the
  lesson that teaches it.

Opening a term never navigates away from the current lesson step.

### 5.4 Glossary data

About 80–100 terms. Each term: `id`, `name` (English, canonical), `aliases`,
`category`, `related` ids, `lesson` id, and per language `short` and `long`
text. `long` may itself contain `[[term-id]]` tokens.

### 5.5 Content checks

A script run in tests and before build fails if:

- a `[[term-id]]` in any text has no glossary entry;
- a lesson, step or level text exists in one language but not the other;
- a lesson's step ids in content do not match its scene's step ids;
- a glossary term lacks `short` or `long` in either language, or references an
  unknown related term or lesson.

## 6. Visual system

- **Camera:** orthographic, true isometric angle as the default for every scene.
- **Scene kit:** shared, reusable pieces: platform/ground tile, block, chain link,
  node tower, wallet, transaction packet, miner rig, validator pillar, coin and
  token stack, pool basin, contract machine, arrow/flow line, 3D label.
- **Themes:** light is the default: pale background, matte surfaces, soft
  shadows. Dark uses the same geometry with darker surfaces and a subtle emissive
  glow on active elements. All colors come from one theme token table used by
  both the HTML UI (CSS variables) and the scenes, so a scene is authored once.
  First visit follows the OS preference; the choice is remembered.
- **Color meaning** is fixed across lessons: transaction, block, valid, invalid,
  validator/miner, token A, token B, contract each have one color.
- **Labels in scenes** are HTML overlays anchored to 3D positions, so they stay
  sharp, translate with the language, and can contain glossary terms.
- **Motion:** step transitions take about 0.6–1s. With the OS "reduce motion"
  setting on, transitions cut instead of animating and looping animations stop.

## 7. Technical design

### 7.1 Stack

- Vite, React 18+, TypeScript (strict).
- three.js via `@react-three/fiber`, helpers from `@react-three/drei`.
- `zustand` for app state with persistence to `localStorage`.
- `react-router-dom` with hash router.
- Radix UI primitives (popover, dialog, tooltip) for accessible tooltips, modals
  and drawers.
- Plain CSS with CSS variables for theming; no CSS framework.
- Vitest for unit and content tests; Playwright for browser checks.

No backend, no analytics, no network calls at runtime.

### 7.2 Structure

```
src/
  app/            routes, layout shells (desktop, mobile, presentation), top bar
  state/          zustand store: lang, level, theme, progress
  i18n/           UI strings (en, tr), language detection
  content/
    lessons/<lessonId>/meta.ts     id, chapter, ordered step ids
    lessons/<lessonId>/en.ts       title, summary, steps[id].{title, body per level, code?}
    lessons/<lessonId>/tr.ts
    glossary/terms.ts              ids, names, relations
    glossary/en.ts, tr.ts          short and long text
    registry.ts                    lesson order, chapters, lazy scene imports
  glossary/       term-markup parser, Term component, tooltip, modal/sheet, glossary page
  lesson/         LessonPage, StepControls, LevelSwitch, TextPanel, CodePanel
  scene/
    SceneCanvas.tsx                canvas, iso camera, lights, perf settings, fallback
    kit/                           shared 3D pieces
    theme.ts                       theme tokens for scenes
    useStepTransition.ts           interpolates between step states
    Label.tsx                      HTML label anchored in 3D
  scenes/<lessonId>/Scene.tsx      one per lesson
  sim/            pure functions: hashing, pow search, amm v2, amm v3, v4 fee hook
scripts/
  check-content.ts
  capture-fallbacks.ts             renders each step to an image for the no-WebGL fallback
```

### 7.3 Boundaries

- **Content** is data only. It knows step ids and term ids, nothing about 3D.
- **A scene** is a component receiving `{ step, level, theme, lang, reducedMotion }`.
  It declares what each step id looks like and renders it. It does not read the
  store or the router. Interactive scenes also render their own HTML controls
  through a slot the lesson page provides.
- **`sim/`** is pure, framework-free math, used by scenes and tested on its own.
- **Lesson page** joins them: reads route and store, loads content and the lazy
  scene, passes props down.

A new lesson is: a `meta.ts`, two content files, one scene component, one
registry entry.

### 7.4 State

Persisted: `lang`, `level`, `theme`, `completedLessons`, `lastVisited`.
Not persisted: current step (it lives in the URL), presentation mode, open term.
A lesson is marked complete when its last step is reached.

### 7.5 Performance

- Each lesson's scene is a separate lazily loaded chunk; the home page loads no
  scene code.
- Device pixel ratio capped (2 on desktop, 1.5 on phones).
- Shadows simplified or off on small screens and low-power devices.
- Rendering runs on demand: the loop is active during transitions, looping
  animations and interaction, and idle otherwise. It pauses when the canvas is
  off-screen or the tab is hidden.
- Repeated objects use instancing.

### 7.6 Errors and fallbacks

- **No WebGL / context lost:** the scene area shows a pre-rendered image for the
  current step (produced by `capture-fallbacks`) with a short note; text, levels,
  glossary and navigation keep working.
- **Scene chunk fails to load or throws:** an error boundary around the scene
  shows the same fallback and a retry button; the rest of the page stays usable.
- **`localStorage` unavailable:** the app runs with defaults and does not persist.

### 7.7 Accessibility

All controls reachable by keyboard with visible focus; tooltips open on focus;
modals trap focus and close on `Esc`; each step exposes a text description of
what the scene shows for screen readers; color is never the only signal for
valid/invalid; text contrast meets WCAG AA in both themes.

## 8. Testing and verification

- **Unit (Vitest):** `sim/` functions against known values: SHA-256 vectors;
  v2 `getAmountOut` including fee and the `k` invariant; v3 tick↔price
  conversion and amounts for a range; impermanent loss; the v4 example fee hook.
  The term-markup parser, including Turkish quoting and suffixes. Route parsing
  and step clamping.
- **Content check:** the rules in 5.5, run as a test and before build.
- **Browser (Playwright):** every lesson, first and last step, at desktop and
  phone viewport, in both languages and both themes: page loads, canvas renders,
  no console errors, no horizontal overflow. Targeted flows: level switch changes
  text without changing step; language switch keeps position; a term opens its
  tooltip and modal; presentation mode keys work; the v2 swap slider updates the
  displayed numbers.
- **Manual:** the owner reviews the visual style after the scene kit and the
  first lesson are built, before the remaining scenes.

## 9. Build order

Everything ships together, but work is ordered so the look can be judged early:

1. Project setup, state, routing, themes, responsive layout shells.
2. Language handling, glossary engine, content checks.
3. Scene canvas, isometric camera, scene kit, step transitions.
4. Lesson 1 end to end at all levels in both languages — **style checkpoint**.
5. `sim/` math with tests.
6. Lessons 2–11.
7. Presentation mode, glossary page, home page, progress.
8. Fallback images, performance pass, browser checks at all sizes.
