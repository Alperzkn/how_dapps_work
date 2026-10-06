import { describe, expect, it } from 'vitest';
import {
  addBlock,
  buildGraph,
  checkBlock,
  CUT_AFTER,
  DEFECTS,
  demoView,
  followers,
  FORK_START,
  gossip,
  ledgerStatus,
  makeBlock,
  MAX_BRANCH,
  offlineSet,
  peerStanding,
  staleBlocks,
  type ForkState,
  type NodeKind,
  type Pt,
  type Side,
} from './logic';

const PTS: Pt[] = [
  { x: -4.6, z: -0.8 }, { x: -1.6, z: -3.6 }, { x: 2.2, z: -3.2 }, { x: 4.8, z: 0 }, { x: 2.4, z: 3.4 },
  { x: -1.8, z: 3.2 }, { x: 0.2, z: 0 }, { x: -5.4, z: 2.6 }, { x: 5.6, z: -3 },
];
const KINDS: NodeKind[] = ['full', 'full', 'full', 'full', 'full', 'full', 'full', 'light', 'light'];
const ORDER = [1, 7, 5, 3, 0, 8, 4, 6];

describe('offline nodes', () => {
  it('switches off the first nodes in the order', () => {
    expect(offlineSet(9, ORDER, 0)).toEqual(Array(9).fill(false));
    const three = offlineSet(9, ORDER, 3);
    expect(three.filter(Boolean)).toHaveLength(3);
    expect([1, 7, 5].every((i) => three[i])).toBe(true);
  });
  it('always leaves one node on, even past the maximum', () => {
    for (const count of [8, 9, 50, Number.NaN, -3]) {
      for (const extra of [null, 2]) {
        const off = offlineSet(9, ORDER, count, extra);
        expect(off.filter((o) => !o).length).toBeGreaterThanOrEqual(1);
      }
    }
    expect(offlineSet(9, ORDER, 8).filter(Boolean)).toHaveLength(8);
    expect(offlineSet(9, ORDER, 8, 2).filter(Boolean)).toHaveLength(8);
    expect(offlineSet(9, ORDER, Number.NaN).filter(Boolean)).toHaveLength(0);
  });
  it('the extra node goes down first', () => {
    const off = offlineSet(9, ORDER, 0, 2);
    expect(off[2]).toBe(true);
    expect(off.filter(Boolean)).toHaveLength(1);
  });
  it('the ledger stays available while one full node is up', () => {
    expect(ledgerStatus(KINDS, offlineSet(9, ORDER, 0))).toEqual({ online: 9, fullOnline: 7, lightOnline: 2, available: true });
    expect(ledgerStatus(KINDS, offlineSet(9, ORDER, 8))).toEqual({ online: 1, fullOnline: 1, lightOnline: 0, available: true });
    expect(ledgerStatus(KINDS, offlineSet(9, ORDER, 8, 2))).toEqual({ online: 1, fullOnline: 1, lightOnline: 0, available: true });
    // Only light nodes left: headers survive, the full ledger does not.
    expect(ledgerStatus(KINDS, [true, true, true, true, true, true, true, false, false]).available).toBe(false);
    expect(ledgerStatus([], []).available).toBe(false);
  });
});

describe('gossip', () => {
  it('floods a line in n - 1 hops and a complete graph in one', () => {
    const line = gossip(4, [[0, 1], [1, 2], [2, 3]], 0);
    expect(line).toEqual({ dist: [0, 1, 2, 3], reached: [1, 2, 3, 4], hops: 3, all: true });
    expect(gossip(4, [[0, 1], [1, 2], [2, 3]], 1).hops).toBe(2);
    const full = gossip(3, [[0, 1], [0, 2], [1, 2]], 2);
    expect(full.reached).toEqual([1, 3]);
    expect(full.hops).toBe(1);
  });
  it('reports nodes it cannot reach and survives bad input', () => {
    const r = gossip(3, [[0, 1]], 0);
    expect(r.all).toBe(false);
    expect(r.dist).toEqual([0, 1, -1]);
    expect(gossip(3, [[0, 9], [1, 1]], 77).dist).toEqual([-1, -1, 0]);
    expect(gossip(0, [], 0).hops).toBe(0);
    expect(gossip(1, [], Number.NaN)).toEqual({ dist: [0], reached: [1], hops: 0, all: true });
  });
  it('the peer graph is connected for every fan-out and grows with it', () => {
    let previous = 0;
    for (let k = 1; k <= 8; k++) {
      const edges = buildGraph(PTS, k);
      expect(edges.length).toBeGreaterThanOrEqual(previous);
      previous = edges.length;
      for (let origin = 0; origin < PTS.length; origin++) {
        const r = gossip(PTS.length, edges, origin);
        expect(r.all).toBe(true);
        expect(r.reached[r.reached.length - 1]).toBe(9);
        expect(r.hops).toBeGreaterThanOrEqual(1);
      }
    }
    expect(buildGraph(PTS, 1)).toHaveLength(8); // a tree
    expect(buildGraph(PTS, 8)).toHaveLength(36); // everyone knows everyone
    expect(buildGraph(PTS, 99)).toHaveLength(36);
    expect(buildGraph(PTS, Number.NaN)).toHaveLength(8);
    expect(buildGraph([], 3)).toEqual([]);
  });
  it('more peers never means more hops', () => {
    for (let origin = 0; origin < PTS.length; origin++) {
      let last = Number.POSITIVE_INFINITY;
      for (let k = 1; k <= 8; k++) {
        const h = gossip(PTS.length, buildGraph(PTS, k), origin).hops;
        expect(h).toBeLessThanOrEqual(last);
        last = h;
      }
      expect(last).toBe(1);
    }
    const hopsAt = (k: number) => gossip(9, buildGraph(PTS, k), 0).hops;
    expect(hopsAt(1)).toBeGreaterThan(hopsAt(3));
  });
});

describe('block checks', () => {
  const view = demoView();
  it('accepts the valid block', () => {
    expect(checkBlock(makeBlock('none'), view)).toEqual({ checks: ['ok', 'ok', 'ok'], failed: -1, valid: true });
  });
  it('stops at the first broken rule', () => {
    expect(checkBlock(makeBlock('parent'), view)).toEqual({ checks: ['bad', 'skipped', 'skipped'], failed: 0, valid: false });
    expect(checkBlock(makeBlock('signature'), view)).toEqual({ checks: ['ok', 'bad', 'skipped'], failed: 1, valid: false });
    expect(checkBlock(makeBlock('balance'), view)).toEqual({ checks: ['ok', 'ok', 'bad'], failed: 2, valid: false });
  });
  it('every defect breaks exactly one rule', () => {
    for (const d of DEFECTS) expect(checkBlock(makeBlock(d), view).valid).toBe(d === 'none');
  });
  it('a tampered amount breaks the real signature', () => {
    const b = makeBlock('none');
    const forged = { ...b, tx: { ...b.tx, message: b.tx.message.replace('pay 2', 'pay 3') } };
    expect(checkBlock(forged, view).failed).toBe(1);
    expect(checkBlock({ ...b, tx: { ...b.tx, amount: Number.NaN } }, view).failed).toBe(2);
  });
});

describe('peer standing', () => {
  it('drops with the square of the invalid count', () => {
    expect(peerStanding(0)).toEqual({ count: 0, score: 0, standing: 'ok' });
    expect(peerStanding(1)).toEqual({ count: 1, score: -1, standing: 'pruned' });
    expect(peerStanding(2).score).toBe(-4);
    expect(peerStanding(CUT_AFTER)).toEqual({ count: 3, score: -9, standing: 'cut' });
    expect(peerStanding(-5).score).toBe(0);
    expect(peerStanding(Number.NaN).standing).toBe('ok');
    expect(Number.isFinite(peerStanding(1e9).score)).toBe(true);
  });
});

describe('fork choice', () => {
  const play = (moves: string, from: ForkState = FORK_START) => [...moves].reduce((s, m) => addBlock(s, m as Side), from);
  it('starts as a tie with each group on the block it saw first', () => {
    expect(followers(FORK_START, 5, 4)).toEqual({ a: 5, b: 4, switched: 0 });
    expect(staleBlocks(FORK_START).total).toBe(0);
  });
  it('the next block decides and the other side reorgs one block', () => {
    const s = play('A');
    expect(s).toEqual({ a: 2, b: 1, follow: ['A', 'A'], reorgDepth: 1, switched: [false, true] });
    expect(followers(s, 5, 4)).toEqual({ a: 9, b: 0, switched: 4 });
    expect(staleBlocks(s)).toEqual({ a: 0, b: 1, total: 1 });
    expect(play('B').switched).toEqual([true, false]);
  });
  it('a tie keeps everyone where they are', () => {
    const s = play('AB');
    expect(s.follow).toEqual(['A', 'A']);
    expect(s.reorgDepth).toBe(0);
    expect(staleBlocks(s).total).toBe(0);
  });
  it('a branch that comes back from behind causes a deeper reorg for everybody', () => {
    const s = play('ABB');
    expect(s).toEqual({ a: 2, b: 3, follow: ['B', 'B'], reorgDepth: 2, switched: [true, true] });
    expect(staleBlocks(s)).toEqual({ a: 2, b: 0, total: 2 });
    expect(play('ABBAA').reorgDepth).toBe(3);
  });
  it('extending the winning branch moves nobody', () => {
    const s = play('AA');
    expect(s.reorgDepth).toBe(0);
    expect(s.switched).toEqual([false, false]);
  });
  it('stops at the maximum branch length', () => {
    const s = play('AAAAAAAA');
    expect(s.a).toBe(MAX_BRANCH);
    expect(s.b).toBe(1);
    const both = play('ABABABABABAB');
    expect(both.a).toBe(MAX_BRANCH);
    expect(both.b).toBe(MAX_BRANCH);
    expect(addBlock(both, 'A')).toEqual({ ...both, reorgDepth: 0, switched: [false, false] });
  });
});
