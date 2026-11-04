import { describe, expect, it } from 'vitest';
import { Progress } from '../src/core/Progress';
import { BossPhases, isFrontHit } from '../src/core/BossPhases';
import { SaveStore, type KeyValueStorage } from '../src/core/SaveStore';
import { ElementType } from '../src/core/Element';
import { BossBalance } from '../src/config/balance';

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}

describe('Progress', () => {
  const order = ['w1_1', 'w1_2', 'w1_3'];

  it('unlocks levels in order and remembers clears and spirits', () => {
    const mem = new MemoryStorage();
    const p = new Progress(order, new SaveStore(() => mem));
    expect(p.isUnlocked('w1_1')).toBe(true);
    expect(p.isUnlocked('w1_2')).toBe(false);
    p.markCleared('w1_1');
    p.addSpirit(ElementType.Fire);
    expect(p.isUnlocked('w1_2')).toBe(true);
    expect(p.nextLevel()).toBe('w1_2');

    const reloaded = new Progress(order, new SaveStore(() => mem));
    expect(reloaded.isCleared('w1_1')).toBe(true);
    expect(reloaded.spiritList).toEqual([ElementType.Fire]);
  });

  it('ignores corrupt save data and can reset', () => {
    const mem = new MemoryStorage();
    mem.setItem('elemental-spirit:progress', JSON.stringify({ cleared: [1, 'w1_1'], spirits: ['lava', 'fire'] }));
    const p = new Progress(order, new SaveStore(() => mem));
    expect(p.toJSON()).toEqual({ cleared: ['w1_1'], spirits: ['fire'], shards: {} });
    p.reset();
    expect(p.isUnlocked('w1_2')).toBe(false);
    expect(p.nextLevel()).toBe('w1_1');
  });

  describe('Spirit Shards', () => {
    const store = () => {
      const mem = new MemoryStorage();
      return { mem, make: () => new Progress(order, new SaveStore(() => mem)) };
    };

    it('adds new shards, counts only first-time ones and survives a reload', () => {
      const { make } = store();
      const p = make();
      expect(p.totalShards).toBe(0);
      expect(p.addShards('w1_1', [2, 0])).toBe(2);
      expect(p.addShards('w1_1', [0, 1])).toBe(1); // 0 was already saved
      expect(p.collectedShards('w1_1')).toEqual([0, 1, 2]);
      expect(p.totalShards).toBe(3);
      expect(p.maxShards).toBe(order.length * 3);
      const again = make();
      expect(again.collectedShards('w1_1')).toEqual([0, 1, 2]);
      expect(again.collectedShards('w1_2')).toEqual([]);
    });

    it('ignores unknown levels and out-of-range slots, saving nothing for them', () => {
      const { mem, make } = store();
      const p = make();
      expect(p.addShards('nope', [0])).toBe(0);
      expect(p.addShards('w1_1', [3, -1, 1.5])).toBe(0);
      expect(mem.getItem('elemental-spirit:progress')).toBeNull();
    });

    it('drops corrupt shard data on load and clears it on reset', () => {
      const { mem, make } = store();
      mem.setItem('elemental-spirit:progress', JSON.stringify({ shards: { w1_1: [0, 9, 'x', 0], nope: [1], w1_2: 'bad' } }));
      const p = make();
      expect(p.collectedShards('w1_1')).toEqual([0]);
      expect(p.totalShards).toBe(1);
      p.reset();
      expect(p.totalShards).toBe(0);
      expect(p.toJSON().shards).toEqual({});
    });
  });

  it('works without storage', () => {
    const p = new Progress(order, null);
    p.markCleared('w1_1');
    expect(p.save()).toBe(false);
    expect(p.isUnlocked('w1_2')).toBe(true);
  });
});

describe('BossPhases', () => {
  const cfg = BossBalance.brambleKing;

  it('needs all shields burned before the weak point takes damage', () => {
    const b = new BossPhases(cfg);
    b.start();
    expect(b.state).toBe('guarded');
    expect(b.hitWeakPoint(4)).toBe('ignored');
    expect(b.shieldsLeft).toBe(cfg.shields[0]);
    for (let i = 0; i < cfg.shields[0] - 1; i += 1) expect(b.shieldBroken()).toBe(false);
    expect(b.shieldBroken()).toBe(true);
    expect(b.state).toBe('exposed');
  });

  it('advances phases, regrows shields, and is defeated after the last phase', () => {
    const b = new BossPhases(cfg);
    b.start();
    expect(b.hp).toBe(b.totalHp);
    for (let phase = 0; phase < b.phaseCount; phase += 1) {
      expect(b.phase).toBe(phase);
      expect(b.shieldsLeft).toBe(cfg.shields[phase]);
      while (b.state === 'guarded') b.shieldBroken();
      const last = phase === b.phaseCount - 1;
      expect(b.hitWeakPoint(cfg.hpPerPhase - 1)).toBe('hurt');
      expect(b.hitWeakPoint(1)).toBe(last ? 'defeated' : 'phase');
    }
    expect(b.state).toBe('defeated');
    expect(b.hp).toBe(0);
  });

  it('closes the weak point when the exposed window ends and attacks on its interval', () => {
    const b = new BossPhases(cfg);
    b.start();
    expect(b.update(cfg.attackIntervalMs[0] - 1)).toBeNull();
    expect(b.update(1)).toBe('attack');
    while (b.state === 'guarded') b.shieldBroken();
    expect(b.update(cfg.exposedMs - 1)).toBeNull();
    expect(b.update(1)).toBe('regrow');
    expect(b.state).toBe('guarded');
    expect(b.shieldsLeft).toBe(cfg.shields[0]);
  });
});

describe('isFrontHit', () => {
  it('compares the attacker side with the facing direction', () => {
    expect(isFrontHit(1, 100, 120)).toBe(true);
    expect(isFrontHit(1, 100, 80)).toBe(false);
    expect(isFrontHit(-1, 100, 80)).toBe(true);
    expect(isFrontHit(-1, 100, 120)).toBe(false);
  });
});
