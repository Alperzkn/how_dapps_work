import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { Anim, Ball, Box, CoinStack, ContractMachine, Cyl, FlowLine, Label, Mat, NodeTower, Packet, Person, Platform, ShadowGround, Token, Wallet, useLevel, useLoop, useScene, type Vec3 } from '../../scene/kit';
import type { ColorKey } from '../../theme/tokens';
import type { SceneProps } from '../../scene/types';
import type { Lang } from '../../types';
import { selector } from '../../sim/keys';
import { ALICE, BOB, DEX, MAX_UINT256, ZERO, allowanceOf, balanceOf, formatUnits, groupDigits, nftBalanceOf, ownerOf, parseRaw, parseUnits, wethSupply, type Erc20Result } from './logic';
import { DECIMALS, DECIMAL_CHOICES, MAX_ALLOW, MAX_RAW_DIGITS, MINT_STEP, PULL, TOKEN_IDS, UNIT, WALLET_ETH, WHO, useTokens, type Who } from './state';

// The camera looks along the diagonal, so the scene is laid out in screen
// terms: `u` runs to the right of the screen, `v` towards the viewer.
const R = Math.SQRT1_2;
const at = (u: number, v = 0, y = 0): Vec3 => [(u + v) * R, y, (v - u) * R];
/** Rotation that turns a board to face the camera; its local x then runs along `u`. */
const FACE: Vec3 = [0, Math.PI / 4, 0];

/** A token amount for display: exact, grouped, without trailing zeros. */
const amt = (raw: bigint, lang: Lang, decimals = DECIMALS) => groupDigits(formatUnits(raw, decimals), lang);
/** Whole tokens as a plain number, for sizing shapes only. */
const size = (raw: bigint) => Number(raw / (UNIT / 100n)) / 100;
const short = (hex: string, head = 6, tail = 4) => (hex.length <= head + tail + 3 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`);

/** Calldata with the zero padding of each argument collapsed. */
function shortCalldata(data: string): string {
  const body = data.slice(2);
  const words: string[] = [];
  for (let i = 8; i < body.length; i += 64) {
    const w = body.slice(i, i + 64).replace(/^0+/, '');
    // Addresses and all-ones words are shortened; amounts are shown in full.
    words.push(w.length === 64 ? `${w.slice(0, 4)}…${w.slice(-4)}` : `0…${w.length > 20 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w || '0'}`);
  }
  return [`0x${body.slice(0, 8)}`, ...words].join(' ');
}

const nameOf = (address: string, labels: Record<string, string>) =>
  address === ALICE ? labels.alice : address === BOB ? labels.bob : address === DEX ? 'DEX' : address === ZERO ? '0x0' : short(address);

/** What the last ERC-20 call did, as one line: the event it emitted or why it reverted. */
function outcome(last: Erc20Result | null, labels: Record<string, string>, lang: Lang): { text: string; ok: boolean } | null {
  if (!last) return null;
  if (!last.ok) return { ok: false, text: `revert: ${labels[last.error === 'insufficient-allowance' ? 'errAllowance' : 'errBalance']}` };
  const e = last.events[0];
  const value = e.value === MAX_UINT256 ? '2²⁵⁶−1' : amt(e.value, lang);
  return { ok: true, text: `${e.name}(${nameOf(e.from, labels)}, ${nameOf(e.to, labels)}, ${value})` };
}

// ---------------------------------------------------------------- small pieces

/** A parcel that flies along `path` once, every time `trigger` changes while `active`. */
function OneShot({ trigger, active, path, duration = 0.9, arc = 0.9, children }: { trigger: number; active: boolean; path: Vec3[]; duration?: number; arc?: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const seen = useRef(trigger);
  const [playing, setPlaying] = useState(false);
  const pts = useMemo(() => path.map((p) => new Vector3(...p)), [path]);
  useEffect(() => {
    if (trigger === seen.current) return;
    seen.current = trigger;
    // A change that happened while this parcel was not the one to show is only noted, not replayed.
    if (!active) return;
    start.current = null;
    setPlaying(trigger > 0);
  }, [trigger, active]);
  useLoop((time) => {
    const g = ref.current;
    if (!g) return;
    start.current ??= time;
    const t = (time - start.current) / duration;
    if (t >= 1) {
      g.visible = false;
      setPlaying(false);
      return;
    }
    g.visible = true;
    const e = t * t * (3 - 2 * t);
    g.position.lerpVectors(pts[0], pts[pts.length - 1], e);
    g.position.y += Math.sin(e * Math.PI) * arc;
  }, playing);
  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}

const ROW_COLOR: Record<Who, ColorKey> = { alice: 'actor', bob: 'tokenB', dex: 'contract' };
/** Balance that fills the whole width of a row on the board. */
const FULL_ROW = 200;

/** The contract's balances table: one bar per address. */
function Board({ values, names, lang, highlight }: { values: Record<Who, bigint>; names: Record<Who, string>; lang: Lang; highlight: Who | null }) {
  return (
    <group rotation={FACE}>
      <Box size={[5.9, 2.9, 0.14]} position={[0, 1.6, 0]} color="platform" radius={0.08} />
      <Box size={[0.16, 0.5, 0.16]} position={[-2.4, 0.2, 0]} color="neutral" radius={0.04} />
      <Box size={[0.16, 0.5, 0.16]} position={[2.4, 0.2, 0]} color="neutral" radius={0.04} />
      {WHO.map((w, i) => {
        const y = 2.45 - i * 0.82;
        const len = Math.max(0.03, Math.min(size(values[w]) / FULL_ROW, 1) * 3.6);
        return (
          <group key={w}>
            <Box size={[3.6, 0.1, 0.04]} position={[0.95, y - 0.27, 0.08]} color="neutral" radius={0.02} />
            <Anim position={[-0.85, y, 0.1]} scale={[len, 1, 1]} speed={7}>
              <Box size={[1, 0.44, 0.12]} position={[0.5, 0, 0]} color={ROW_COLOR[w]} glow={highlight === w} radius={0.02} />
            </Anim>
            <Label position={[-1.95, y, 0.12]} tone={w === 'alice' ? 'actor' : w === 'bob' ? 'tokenB' : 'default'}>
              {names[w]} {amt(values[w], lang)}
            </Label>
          </group>
        );
      })}
    </group>
  );
}

const TILES = MAX_RAW_DIGITS;
const TILE_GAP = 0.27;
const tileX = (fromRight: number) => ((TILES - 1) / 2 - fromRight) * TILE_GAP;

/** The raw integer as a strip of digit tiles; the point marker shows where `decimals` puts the decimal point. */
function DigitStrip({ digits, decimals }: { digits: number; decimals: number }) {
  return (
    <group rotation={FACE}>
      <Box size={[TILES * TILE_GAP + 0.4, 1.3, 0.12]} position={[0, 1.2, 0]} color="platform" radius={0.06} />
      {Array.from({ length: TILES }, (_, i) => {
        const has = i < digits;
        const frac = i < decimals;
        const color: ColorKey = has ? (frac ? 'tokenB' : 'tokenA') : 'neutral';
        return <Box key={i} size={[0.21, has ? 0.5 : frac ? 0.3 : 0.12, 0.1]} position={[tileX(i), 1.3, 0.1]} color={color} opacity={has ? 1 : frac ? 0.75 : 0.5} radius={0.03} />;
      })}
      <Anim position={[tileX(decimals) + TILE_GAP / 2, 0.86, 0.14]} speed={8}>
        <Ball radius={0.1} color="tx" glow />
        <Box size={[0.05, 0.75, 0.05]} position={[0, 0.42, 0]} color="tx" glow radius={0.02} />
      </Anim>
    </group>
  );
}

/** One of four deliberately different shapes: each token id is its own thing. */
function Art({ id, glow }: { id: number; glow: boolean }) {
  const color: ColorKey = (['tokenA', 'tokenB', 'tx', 'valid'] as const)[(id - 1) % 4];
  return (
    <group>
      <Cyl radius={0.42} height={0.12} position={[0, 0.06, 0]} color="neutral" />
      {id === 1 && <Box size={[0.52, 0.52, 0.52]} position={[0, 0.42, 0]} rotation={[0, 0.5, 0]} color={color} glow={glow} radius={0.06} />}
      {id === 2 && <Ball radius={0.3} position={[0, 0.44, 0]} color={color} glow={glow} />}
      {id === 3 && <Cyl radius={0.24} height={0.6} position={[0, 0.44, 0]} color={color} glow={glow} />}
      {id === 4 && (
        <mesh position={[0, 0.46, 0]} castShadow>
          <coneGeometry args={[0.32, 0.64, 4]} />
          <Mat color={color} glow={glow} />
        </mesh>
      )}
    </group>
  );
}

const NFT_OFFSET: [number, number][] = [
  [-0.95, -0.45],
  [0.25, -0.75],
  [-0.25, 0.75],
  [0.95, 0.45],
];
const OWNER_U: Record<string, number> = { [ALICE]: -3.3, [BOB]: 3.3 };
const nftSpot = (id: number, owner: string | null): [number, number] => {
  const [du, dv] = NFT_OFFSET[(id - 1) % 4];
  return [(OWNER_U[owner ?? ALICE] ?? 0) + du, 0.3 + dv];
};

// ---------------------------------------------------------------- the scene

export default function Scene({ stepId, labels, lang }: SceneProps) {
  const s = useTokens();
  const { compact } = useScene();
  const { atLeast } = useLevel();
  const expert = atLeast('expert');
  const nums = atLeast('intermediate');

  const ledger = stepId === 'ledger';
  const erc20 = stepId === 'erc20';
  const supply = stepId === 'supply';
  const approve = stepId === 'approve';
  const kinds = stepId === 'kinds';
  const nft = stepId === 'nft';
  const table = ledger || supply || approve;

  const values = { alice: balanceOf(s.token, ALICE), bob: balanceOf(s.token, BOB), dex: balanceOf(s.token, DEX) };
  const names = { alice: labels.alice, bob: labels.bob, dex: 'DEX' };
  const out = outcome(s.last, labels, lang);
  const lastOk = s.last?.ok === true;
  const moved: Who | null = !lastOk || !s.last ? null : s.last.action === 'transferFrom' ? 'dex' : s.last.action === 'transfer' ? (s.last.events[0].to === BOB ? 'bob' : 'dex') : s.last.action === 'approve' ? null : 'alice';

  // Paths for the one-shot parcels.
  const sendPath = useMemo(() => [at(-3.4, 1.4, 1.2), at(-1.2, -0.8, 2.2)], []);
  const mintPath = useMemo(() => [at(-0.2, -0.8, 5.4), at(-0.2, -0.8, 2.7)], []);
  const burnPath = useMemo(() => [at(-0.2, -0.8, 2.7), at(-4.3, 1.5, 0.3)], []);
  const pullPath = useMemo(() => [at(-0.2, -0.8, 2.5), at(4.4, 1.1, 1.4)], []);
  const wrapIn = useMemo(() => [at(-3.2, 0.6, 1.2), at(1.4, 0, 1.6)], []);
  const wrapOut = useMemo(() => [at(1.4, 0, 1.6), at(-3.2, 0.6, 1.2)], []);

  const pending = parseUnits(s.amountText, DECIMALS);
  const pendingText = `transfer(${s.to === 'dex' ? 'DEX' : labels.bob}, ${pending === null ? '?' : amt(pending, lang)})`;

  // --- decimals
  const raw = parseRaw(s.rawText, MAX_RAW_DIGITS);
  const rawDigits = raw === 0n ? 1 : raw.toString().length;

  // --- allowance
  const allowance = allowanceOf(s.token, ALICE, DEX);
  const infinite = allowance === MAX_UINT256;
  const gauge = infinite ? 2.6 : Math.min(size(allowance) / MAX_ALLOW, 1) * 1.8;

  // --- wrap
  const w = s.weth;
  const coins = (wei: bigint) => Number(wei / UNIT);
  const unwrapping = s.lastWeth?.signature === 'withdraw(uint256)';

  // --- nft
  const owner = ownerOf(s.nft, BigInt(s.tokenId));
  const [su, sv] = nftSpot(s.tokenId, owner);
  const uriLine = useMemo<Vec3[]>(() => [at(su, sv, 1.3), at(0, -2, 0.9)], [su, sv]);
  const nftFailed = s.lastNft !== null && !s.lastNft.ok;

  return (
    <>
      <ShadowGround />

      {/* ------------------------------------------------ the token contract and its table (steps 1, 3, 4) */}
      <Anim show={table} position={at(0.3, -0.8)}>
        <Board values={values} names={names} lang={lang} highlight={moved} />
      </Anim>
      <Anim show={table} position={at(-4.4, -0.8)}>
        <Platform size={[1.9, 1.9]} position={[0, 0, 0]} color="ground" height={0.14} />
        <ContractMachine size={0.9} color={out && !out.ok ? 'invalid' : 'contract'} glow={out !== null && !out.ok} />
        <Label position={[0, 2.05, 0]} tone="block">
          {labels.tokenContract}
          {expert && !compact ? ' · _balances' : ''}
        </Label>
      </Anim>
      <Label position={at(0.3, 0.6, 0)} tone={out?.ok ? 'valid' : 'invalid'} show={table && out !== null}>
        {out?.text ?? ''}
      </Label>

      {/* ------------------------------------------------ 1. a number in a table */}
      <Anim show={ledger}>
        <group position={at(-3.4, 1.5)}>
          <Wallet color="actor" />
        </group>
        <group position={at(3.6, 1.5)}>
          <Wallet color="tokenB" />
        </group>
        <Label position={at(-3.4, 2.4, -0.25)} tone={compact && pending === null ? 'invalid' : 'actor'}>
          {compact ? `${labels.alice}: ${pendingText}` : labels.aliceWallet}
        </Label>
        <Label position={at(3.6, 2.4, -0.25)} tone="tokenB">
          {labels.bobWallet}
        </Label>
        <Label position={at(0.1, 2.4, -0.25)} tone="plain" show={!compact}>
          {labels.walletCaption}
        </Label>
        {/* What Alice is about to send: follows the amount box and the recipient buttons. */}
        <Label position={at(-1.3, 1.6, -0.25)} tone={pending === null ? 'invalid' : 'tx'} show={!compact}>
          {pendingText}
        </Label>
        <OneShot trigger={s.seq} active={ledger && s.last?.action === 'transfer'} path={sendPath}>
          <Packet color={out && !out.ok ? 'invalid' : 'tx'} />
        </OneShot>
      </Anim>

      {/* ------------------------------------------------ 2. one interface, any token; decimals */}
      <Anim show={erc20}>
        {(['tokenA', 'tokenB', 'tx'] as const).map((c, i) => (
          <group key={c} position={at(-5.2 + i * 1.3, -1)}>
            <ContractMachine size={0.62} active={false} />
            <group position={[0, 1.15, 0]} rotation={FACE}>
              <Token color={c} radius={0.3} />
            </group>
          </group>
        ))}
        <group position={at(-3.9, 1.6)}>
          <Wallet color="actor" />
        </group>
        {[-5.2, -3.9, -2.6].map((u) => (
          <FlowLine key={u} points={[at(-3.9, 1.3, 1), at(u, -0.5, 0.9)]} color="chain" width={2} />
        ))}
        <Label position={at(-3.9, -1, 2.55)} tone="block">
          {labels.anyToken}
        </Label>
        <Label position={at(-3.9, 2.5, -0.25)} tone="actor">
          {labels.oneWallet}
        </Label>
        <Label position={at(-3.9, 3.15, -0.25)} minLevel="expert" tone="mono" show={!compact}>
          balanceOf · transfer · approve
        </Label>
        {/* The stored integer and where `decimals` puts the point. */}
        <group position={at(2.9, -0.2)}>
          <DigitStrip digits={rawDigits} decimals={s.decimals} />
        </group>
        <Label position={at(2.9, -0.2, 2.35)} tone="mono">
          {labels.stored}: {groupDigits(raw.toString(), lang)}
        </Label>
        <Label position={at(2.9, 1.1, -0.25)} tone="tx">
          {labels.shown}: {amt(raw, lang, s.decimals)}
        </Label>
        <Label position={at(2.9, 1.8, -0.25)} minLevel="intermediate" tone="plain" show={!compact}>
          decimals = {s.decimals}
        </Label>
      </Anim>

      {/* ------------------------------------------------ 3. mint and burn */}
      <Anim show={supply}>
        <group position={at(4.5, -0.5)}>
          <Platform size={[1.3, 1.3]} position={[0, 0.1, 0]} color="ground" height={0.1} />
          <Anim position={[0, 0.1, 0]} scale={[1, Math.max(0.02, Math.min(size(s.token.totalSupply) / 400, 1) * 3.4), 1]} speed={7}>
            <Box size={[0.8, 1, 0.8]} position={[0, 0.5, 0]} color="tx" glow={lastOk && (s.last?.action === 'mint' || s.last?.action === 'burn')} radius={0.02} />
          </Anim>
        </group>
        <Label position={at(4.5, 0.6, -0.25)} tone="tx">
          {expert ? 'totalSupply' : labels.supply} {amt(s.token.totalSupply, lang)}
        </Label>
        {/* Burned tokens go nowhere: a pit. */}
        <group position={at(-4.3, 1.5)}>
          <Cyl radius={0.55} height={0.12} position={[0, 0.06, 0]} color="neutral" />
          <Cyl radius={0.42} height={0.14} position={[0, 0.07, 0]} color="ink" />
        </group>
        <Label position={at(-4.3, 2.4, -0.25)} tone="plain">
          {expert ? 'address(0)' : labels.burnPit}
        </Label>
        <OneShot trigger={s.seq} active={supply && s.last?.action === 'mint'} path={mintPath} arc={0}>
          <group rotation={FACE}>
            <Token color="actor" radius={0.3} />
          </group>
        </OneShot>
        <OneShot trigger={s.seq} active={supply && s.last?.action === 'burn' && lastOk} path={burnPath}>
          <group rotation={FACE}>
            <Token color="actor" radius={0.3} />
          </group>
        </OneShot>
      </Anim>

      {/* ------------------------------------------------ 4. approve and transferFrom */}
      <Anim show={approve}>
        <group position={at(-3.6, 1.5)}>
          <Person color="actor" />
        </group>
        <Label position={at(-3.6, 2.4, -0.25)} tone="actor">
          {labels.alice}
        </Label>
        <group position={at(4.6, 1.2)}>
          <Platform size={[1.7, 1.7]} position={[0, 0, 0]} color="ground" height={0.14} />
          <ContractMachine size={0.8} color="tokenB" />
        </group>
        <Label position={at(4.6, 1.2, 1.7)} tone="tokenB">
          {labels.dex}
        </Label>
        {/* How much the exchange may still take from Alice. */}
        <group position={at(2.5, 1.6)}>
          <Box size={[0.7, 0.08, 0.7]} position={[0, 0.04, 0]} color="neutral" radius={0.02} />
          <Anim position={[0, 0.08, 0]} scale={[1, Math.max(gauge, 0.02), 1]} speed={8}>
            <Box size={[0.5, 1, 0.5]} position={[0, 0.5, 0]} color={infinite ? 'invalid' : 'valid'} glow={infinite} radius={0.02} />
          </Anim>
        </group>
        <Label position={at(2.6, 2.5, -0.25)} tone={infinite ? 'invalid' : 'valid'}>
          {expert && !compact ? 'allowance[Alice][DEX]' : labels.allowance}: {infinite ? labels.unlimitedShort : amt(allowance, lang)}
        </Label>
        <OneShot trigger={s.seq} active={approve && s.last?.action === 'transferFrom'} path={pullPath}>
          <group rotation={FACE}>
            <Token color={lastOk ? 'actor' : 'invalid'} radius={0.3} />
          </group>
        </OneShot>
      </Anim>

      {/* ------------------------------------------------ 5. wrapping ETH */}
      <Anim show={kinds}>
        <group position={at(-4.8, 0.2)}>
          <Person color="actor" />
        </group>
        <group position={at(-3.7, 0.9)}>
          <CoinStack count={coins(w.walletEth)} radius={0.26} color="tx" />
        </group>
        <group position={at(-2.5, 0.9)}>
          <CoinStack count={coins(w.walletWeth)} radius={0.26} color="tokenA" />
          <Cyl radius={0.3} height={0.04} position={[0, 0.02, 0]} color="neutral" />
        </group>
        <Label position={at(-4.3, 1.9, -0.25)} tone="tx">
          ETH {amt(w.walletEth, lang)}
        </Label>
        <Label position={at(-2.2, 2.6, -0.25)} tone="tokenA">
          WETH {amt(w.walletWeth, lang)}
        </Label>
        <group position={at(1.6, 0)}>
          <Platform size={[2.3, 2.3]} position={[0, 0, 0]} color="ground" height={0.14} />
          <ContractMachine size={1.1} />
        </group>
        <Label position={at(1.6, 0, 2.3)} tone="block">
          {expert ? 'WETH9' : labels.wethContract}
        </Label>
        {/* What the contract holds, next to what it has issued: always the same height. */}
        <group position={at(3.6, 0.6)}>
          <CoinStack count={coins(w.contractEth)} radius={0.26} color="tx" />
        </group>
        <group position={at(4.7, 0.6)}>
          <CoinStack count={coins(wethSupply(w))} radius={0.26} color="tokenA" />
        </group>
        <Label position={at(3.2, 1.6, -0.25)} tone="tx">
          {compact ? 'ETH' : labels.ethInside} {amt(w.contractEth, lang)}
        </Label>
        <Label position={at(5.1, 2.3, -0.25)} tone="tokenA">
          {compact ? 'WETH' : expert ? 'totalSupply' : labels.wethSupply} {amt(wethSupply(w), lang)}
        </Label>
        <OneShot trigger={s.wethSeq} active={kinds && !unwrapping} path={wrapIn}>
          <Packet color="tx" />
        </OneShot>
        <OneShot trigger={s.wethSeq} active={kinds && unwrapping} path={wrapOut}>
          <Packet color="tx" />
        </OneShot>
      </Anim>

      {/* ------------------------------------------------ 6. NFTs: one owner per token id */}
      <Anim show={nft}>
        {[ALICE, BOB].map((who) => (
          <group key={who} position={at(OWNER_U[who], 0.3)}>
            <Platform size={[3.1, 3.1]} position={[0, 0.12, 0]} color="ground" height={0.12} />
          </group>
        ))}
        <Label position={at(-3.3, 2.3, -0.25)} tone="actor">
          {labels.alice}
          {nums ? ` · balanceOf ${nftBalanceOf(s.nft, ALICE)}` : ''}
        </Label>
        <Label position={at(3.3, 2.3, -0.25)} tone="tokenB">
          {labels.bob}
          {nums ? ` · balanceOf ${nftBalanceOf(s.nft, BOB)}` : ''}
        </Label>
        {TOKEN_IDS.map((id) => {
          const [u, v] = nftSpot(id, ownerOf(s.nft, BigInt(id)));
          const picked = id === s.tokenId;
          return (
            <Anim key={id} position={at(u, v, picked ? 0.42 : 0.12)} speed={5}>
              <Art id={id} glow={picked} />
              <Label position={[0, 1.25, 0]} tone={picked ? (nftFailed ? 'invalid' : 'tx') : 'plain'}>
                #{id}
                {picked && nftFailed ? ' revert' : ''}
              </Label>
            </Anim>
          );
        })}
        {/* The picture and description are not on the chain: the contract only stores a link. */}
        <group position={at(0, -2)} scale={0.6}>
          <NodeTower units={2} />
        </group>
        <FlowLine points={uriLine} color="chain" dashed width={2} />
        <Label position={at(0, -2, 1.3)} maxLevel="beginner" tone="plain">
          {labels.offChain}
        </Label>
        <Label position={at(0, -2, 1.3)} minLevel="intermediate" tone="mono">
          {compact ? `tokenURI(${s.tokenId})` : `tokenURI(${s.tokenId}) → ipfs://…/${s.tokenId}.json`}
        </Label>
      </Anim>
    </>
  );
}

// ---------------------------------------------------------------- controls

/** One figure in the control panel: name and value on one line, so the panel stays low on a phone. */
function Stat({ name, tone, wrap = false, children }: { name: string; tone?: 'good' | 'bad'; wrap?: boolean; children: ReactNode }) {
  return (
    <div className="ctl-stat" style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: wrap ? 'normal' : 'nowrap', minWidth: 0 }}>
      <span>{name}</span>
      <strong data-tone={tone} style={{ fontSize: '0.82rem', overflowWrap: wrap ? 'anywhere' : undefined }}>
        {children}
      </strong>
    </div>
  );
}

const panel = { gap: '6px 12px', maxWidth: 600 } as const;
const stats = { gap: '2px 14px', flexBasis: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, flexBasis: '100%' } as const;
const field = { display: 'flex', alignItems: 'center', gap: 10 } as const;
/** Tighter buttons for the one step that needs five of them. */
const small = { minHeight: 32, padding: '0 9px', fontSize: '0.84rem' } as const;

/** The two stats every ERC-20 step ends with: the call's data and what came of it. */
function CallStats({ last, labels, lang, expert, dataAtExpertOnly = false }: { last: Erc20Result | null; labels: Record<string, string>; lang: Lang; expert: boolean; dataAtExpertOnly?: boolean }) {
  const out = outcome(last, labels, lang);
  // Below expert level only the selector is spelled out; the arguments are counted.
  const data = !last ? '—' : expert ? shortCalldata(last.calldata) : `${last.calldata.slice(0, 10)} + ${(last.calldata.length - 10) / 64} × 32 ${labels.bytes}`;
  return (
    <>
      {(expert || !dataAtExpertOnly) && (
        <Stat name="data" wrap>
          {data}
        </Stat>
      )}
      <Stat name={!out || out.ok ? labels.event : labels.result} tone={out ? (out.ok ? 'good' : 'bad') : undefined}>
        {out ? out.text : labels.noCallYet}
      </Stat>
    </>
  );
}

export function Controls({ stepId, labels, lang, level }: SceneProps) {
  const s = useTokens();
  const expert = level === 'expert';

  if (stepId === 'ledger') {
    const value = parseUnits(s.amountText, DECIMALS);
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <label className="ctl-field" style={{ ...field, flex: '1 1 150px', minWidth: 0 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{labels.amount}</span>
            <input id="tk-amount" type="text" inputMode="decimal" value={s.amountText} onChange={(e) => s.setAmountText(e.target.value)} style={{ flex: 1, width: 70, minHeight: 34 }} aria-invalid={value === null} />
          </label>
          <div className="seg" role="group" aria-label={labels.to}>
            {(['bob', 'dex'] as const).map((w) => (
              <button key={w} type="button" data-tk={`to-${w}`} aria-pressed={s.to === w} onClick={() => s.setTo(w)}>
                → {w === 'dex' ? 'DEX' : labels.bob}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" data-tk="transfer" onClick={s.sendTransfer} disabled={value === null}>
            transfer
          </button>
          <button type="button" className="btn" data-tk="reset" onClick={s.resetToken} disabled={s.seq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          {value === null ? (
            <Stat name={labels.amount} tone="bad">
              {labels.badAmount}
            </Stat>
          ) : (
            <CallStats last={s.last} labels={labels} lang={lang} expert={expert} />
          )}
        </div>
      </div>
    );
  }

  if (stepId === 'erc20') {
    const raw = parseRaw(s.rawText, MAX_RAW_DIGITS);
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <label className="ctl-field" style={{ ...field, flex: '1 1 190px', minWidth: 0 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{labels.rawInteger}</span>
            <input id="tk-raw" type="text" inputMode="numeric" value={s.rawText} onChange={(e) => s.setRawText(e.target.value)} style={{ flex: 1, width: 90, minHeight: 34 }} />
          </label>
          <div className="seg" role="group" aria-label="decimals">
            {DECIMAL_CHOICES.map((d) => (
              <button key={d} type="button" data-tk={`dec-${d}`} aria-pressed={s.decimals === d} onClick={() => s.setDecimals(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={`decimals = ${s.decimals}${s.decimals === 6 ? ' (USDC)' : s.decimals === 8 ? ' (WBTC)' : s.decimals === 18 ? ' (ETH, DAI)' : ''}`}>{amt(raw, lang, s.decimals)}</Stat>
          {expert && <Stat name="decimals()">{selector('decimals()')}</Stat>}
          {expert && <Stat name="balanceOf(address)">{selector('balanceOf(address)')}</Stat>}
        </div>
      </div>
    );
  }

  if (stepId === 'supply') {
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <button type="button" className="btn btn-primary" data-tk="mint" onClick={s.doMint}>
            mint {MINT_STEP} → {labels.alice}
          </button>
          <button type="button" className="btn" data-tk="burn" onClick={s.doBurn}>
            burn {MINT_STEP} ({labels.alice})
          </button>
          <button type="button" className="btn" data-tk="reset" onClick={s.resetToken} disabled={s.seq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name="totalSupply">{amt(s.token.totalSupply, lang)}</Stat>
          <CallStats last={s.last} labels={labels} lang={lang} expert={expert} />
        </div>
      </div>
    );
  }

  if (stepId === 'approve') {
    const allowance = allowanceOf(s.token, ALICE, DEX);
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <label className="ctl-field" style={{ ...field, flex: '1 1 200px', minWidth: 0, opacity: s.unlimited ? 0.5 : 1 }}>
            <span style={{ whiteSpace: 'nowrap', minWidth: '6.2em' }}>
              {labels.approveAmount}: {s.unlimited ? '∞' : s.allow}
            </span>
            <input id="tk-allow" type="range" min={0} max={MAX_ALLOW} step={5} value={s.allow} disabled={s.unlimited} onChange={(e) => s.setAllow(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
          </label>
          <label className="ctl-check" style={{ minHeight: 30 }}>
            <input id="tk-unlimited" type="checkbox" checked={s.unlimited} onChange={(e) => s.setUnlimited(e.target.checked)} />
            {labels.unlimited}
          </label>
        </div>
        <div style={row}>
          <button type="button" className="btn btn-primary" style={small} data-tk="approve" onClick={s.doApprove}>
            approve
          </button>
          <button type="button" className="btn" style={small} data-tk="revoke" onClick={s.doRevoke} disabled={allowance === 0n}>
            {labels.revoke}
          </button>
          <button type="button" className="btn" style={small} data-tk="pull" onClick={() => s.doPull(false)}>
            {labels.dexTakes} {PULL}
          </button>
          <button type="button" className="btn" style={small} data-tk="pull-all" onClick={() => s.doPull(true)}>
            {labels.dexTakesAll}
          </button>
          <button type="button" className="btn" style={small} data-tk="reset" onClick={s.resetToken} disabled={s.seq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <CallStats last={s.last} labels={labels} lang={lang} expert={expert} dataAtExpertOnly />
        </div>
      </div>
    );
  }

  if (stepId === 'kinds') {
    const wrapped = Number(s.weth.walletWeth / UNIT);
    const last = s.lastWeth;
    return (
      <div className="ctl" style={panel}>
        <label className="ctl-field" style={{ ...field, flexBasis: '100%' }}>
          <span style={{ whiteSpace: 'nowrap', minWidth: '8.5em' }}>
            {labels.wrapped}: {wrapped} / {WALLET_ETH} ETH
          </span>
          <input id="tk-wrap" type="range" min={0} max={WALLET_ETH} step={1} value={wrapped} onChange={(e) => s.setWrapped(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={labels.lastCall}>{last ? last.signature : '—'}</Stat>
          <Stat name="data" wrap>
            {last ? shortCalldata(last.calldata) : '—'}
          </Stat>
          <Stat name="value">{last ? `${amt(last.value, lang)} ETH` : '—'}</Stat>
          <Stat name={labels.backing} tone="good">
            {amt(s.weth.contractEth, lang)} ETH = {amt(wethSupply(s.weth), lang)} WETH
          </Stat>
        </div>
      </div>
    );
  }

  if (stepId === 'nft') {
    const owner = ownerOf(s.nft, BigInt(s.tokenId));
    const last = s.lastNft;
    const other = s.caller === 'alice' ? labels.bob : labels.alice;
    return (
      <div className="ctl" style={panel}>
        <div style={row}>
          <div className="seg" role="group" aria-label="tokenId">
            {TOKEN_IDS.map((id) => (
              <button key={id} type="button" data-tk={`id-${id}`} aria-pressed={s.tokenId === id} onClick={() => s.setTokenId(id)}>
                #{id}
              </button>
            ))}
          </div>
          <span className="ctl-stat" style={{ fontWeight: 600 }}>
            {labels.asWho}
          </span>
          <div className="seg" role="group" aria-label={labels.caller}>
            {(['alice', 'bob'] as const).map((c) => (
              <button key={c} type="button" data-tk={`as-${c}`} aria-pressed={s.caller === c} onClick={() => s.setCaller(c)}>
                {labels[c]}
              </button>
            ))}
          </div>
        </div>
        <div style={row}>
          <button type="button" className="btn btn-primary" data-tk="nft-transfer" onClick={s.sendNft}>
            transferFrom → {other}
          </button>
          <button type="button" className="btn" data-tk="reset" onClick={s.resetNft} disabled={s.nftSeq === 0}>
            {labels.reset}
          </button>
        </div>
        <div className="ctl-stats" style={stats} role="status">
          <Stat name={`ownerOf(${s.tokenId})`}>{owner ? `${nameOf(owner, labels)}${expert ? ` ${short(owner)}` : ''}` : '—'}</Stat>
          {expert && (
            <Stat name="data" wrap>
              {last ? shortCalldata(last.calldata) : '—'}
            </Stat>
          )}
          <Stat name={labels.result} tone={last ? (last.ok ? 'good' : 'bad') : undefined}>
            {!last ? labels.noCallYet : last.ok && last.event ? `Transfer(${nameOf(last.event.from, labels)}, ${nameOf(last.event.to, labels)}, ${last.event.tokenId})` : `revert: ${labels.errNotOwner}`}
          </Stat>
        </div>
      </div>
    );
  }

  return null;
}
