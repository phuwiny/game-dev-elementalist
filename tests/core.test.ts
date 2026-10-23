import { describe, expect, it } from 'vitest';
import { Vitals } from '../src/core/Vitals';
import { JumpAssist } from '../src/core/JumpAssist';
import { Combo } from '../src/core/Combo';
import { damageMultiplier, ElementType } from '../src/core/Element';
import { parseLevel, LevelParseError, Tile } from '../src/core/LevelParser';
import { SaveStore, type KeyValueStorage } from '../src/core/SaveStore';
import { Action, DEFAULT_BINDINGS, mergeBindings, allBoundKeys } from '../src/core/Bindings';
import { AttackBalance, VitalsBalance } from '../src/config/balance';
import { GRAYBOX_LEVEL } from '../src/levels/graybox';

describe('Vitals', () => {
  const make = () => new Vitals(VitalsBalance);

  it('starts with full HP and 3 lives', () => {
    const v = make();
    expect(v.snapshot()).toEqual({ hp: 5, maxHp: 5, lives: 3, coins: 0 });
  });

  it('reports died when HP reaches zero and ignores further damage', () => {
    const v = make();
    expect(v.damage(4)).toBe('hurt');
    expect(v.damage(3)).toBe('died');
    expect(v.hp).toBe(0);
    expect(v.damage(1)).toBe('ignored');
  });

  it('refills HP on losing a life while lives remain, and ends at game over', () => {
    const v = make();
    v.damage(5);
    expect(v.loseLife()).toBe(true);
    expect(v.hp).toBe(5);
    expect(v.loseLife()).toBe(true);
    expect(v.loseLife()).toBe(false);
    expect(v.isGameOver).toBe(true);
  });

  it('heal never exceeds max HP', () => {
    const v = make();
    v.damage(2);
    v.heal(10);
    expect(v.hp).toBe(5);
  });

  it('grants a life per 100 coins and caps lives at 9', () => {
    const v = make();
    expect(v.addCoins(250)).toBe(2);
    expect(v.coins).toBe(50);
    expect(v.lives).toBe(5);
    v.addCoins(10_000);
    expect(v.lives).toBe(9);
  });

  it('resetForContinue restores start lives, full HP and zero coins', () => {
    const v = make();
    v.addCoins(40);
    v.damage(5);
    v.loseLife();
    v.loseLife();
    v.loseLife();
    v.resetForContinue();
    expect(v.snapshot()).toEqual({ hp: 5, maxHp: 5, lives: 3, coins: 0 });
  });
});

describe('JumpAssist', () => {
  it('jumps immediately when grounded and pressed', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, true);
    j.press();
    expect(j.consume()).toBe(true);
    expect(j.consume()).toBe(false);
  });

  it('allows a jump within coyote time after leaving the ground', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, true);
    j.update(80, false);
    j.press();
    expect(j.consume()).toBe(true);
  });

  it('rejects a jump after coyote time expires', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, true);
    j.update(120, false);
    j.press();
    expect(j.consume()).toBe(false);
  });

  it('buffers a press made just before landing', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, false);
    j.press();
    expect(j.consume()).toBe(false);
    j.update(60, true);
    expect(j.consume()).toBe(true);
  });

  it('drops a buffered press that is too old', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, false);
    j.press();
    j.update(150, true);
    expect(j.consume()).toBe(false);
  });
});

describe('Combo', () => {
  const run = (c: Combo, ms: number, step = 10) => {
    const started: number[] = [];
    for (let t = 0; t < ms; t += step) {
      const s = c.update(step);
      if (s >= 0) started.push(s);
    }
    return started;
  };

  it('chains three steps when pressed during each step', () => {
    const c = new Combo(AttackBalance);
    expect(c.press()).toBe(true);
    expect(c.step).toBe(0);
    c.press();
    expect(run(c, 270)).toEqual([1]);
    c.press();
    expect(run(c, 270)).toEqual([2]);
    run(c, 400);
    expect(c.isAttacking).toBe(false);
  });

  it('continues the combo if pressed within the combo window after a step ends', () => {
    const c = new Combo(AttackBalance);
    c.press();
    run(c, 300);
    expect(c.isAttacking).toBe(false);
    c.press();
    expect(c.step).toBe(1);
  });

  it('restarts from step 0 after the combo window expires', () => {
    const c = new Combo(AttackBalance);
    c.press();
    run(c, 300 + AttackBalance.comboWindowMs + 50);
    c.press();
    expect(c.step).toBe(0);
  });

  it('restarts from step 0 after the final step', () => {
    const c = new Combo(AttackBalance);
    c.press();
    c.press();
    run(c, 270);
    c.press();
    run(c, 270);
    run(c, 360);
    c.press();
    expect(c.step).toBe(0);
  });

  it('is active only inside the hit window', () => {
    const c = new Combo(AttackBalance);
    c.press();
    expect(c.isActive).toBe(false);
    run(c, 70);
    expect(c.isActive).toBe(true);
    run(c, 120);
    expect(c.isActive).toBe(false);
  });

  it('registers each target once per step', () => {
    const c = new Combo(AttackBalance);
    c.press();
    expect(c.registerHit(7)).toBe(true);
    expect(c.registerHit(7)).toBe(false);
    c.press();
    run(c, 270);
    expect(c.registerHit(7)).toBe(true);
  });
});

describe('damageMultiplier', () => {
  it('follows water > fire > wind > earth > water', () => {
    expect(damageMultiplier(ElementType.Water, ElementType.Fire)).toBe(2);
    expect(damageMultiplier(ElementType.Fire, ElementType.Wind)).toBe(2);
    expect(damageMultiplier(ElementType.Wind, ElementType.Earth)).toBe(2);
    expect(damageMultiplier(ElementType.Earth, ElementType.Water)).toBe(2);
    expect(damageMultiplier(ElementType.Fire, ElementType.Water)).toBe(0.5);
  });

  it('is neutral for same element, non-adjacent pairs and plain attacks', () => {
    expect(damageMultiplier(ElementType.Fire, ElementType.Fire)).toBe(1);
    expect(damageMultiplier(ElementType.Fire, ElementType.Earth)).toBe(1);
    expect(damageMultiplier(null, ElementType.Fire)).toBe(1);
    expect(damageMultiplier(ElementType.Fire, null)).toBe(1);
  });
});

describe('parseLevel', () => {
  it('parses tiles and spawn points', () => {
    const level = parseLevel(['P.c.G', '#^#s#', 'K.h..']);
    expect(level.width).toBe(5);
    expect(level.height).toBe(3);
    expect(level.player).toEqual({ col: 0, row: 0 });
    expect(level.goal).toEqual({ col: 4, row: 0 });
    expect(level.tiles[1]).toEqual([Tile.Solid, Tile.Spike, Tile.Solid, Tile.Empty, Tile.Solid]);
    expect(level.coins).toEqual([{ col: 2, row: 0 }]);
    expect(level.enemies).toEqual([{ kind: 'moss_slime', col: 3, row: 1 }]);
    expect(level.checkpoints).toEqual([{ col: 0, row: 2 }]);
    expect(level.hearts).toEqual([{ col: 2, row: 2 }]);
  });

  it('rejects ragged rows, unknown symbols and missing P/G', () => {
    expect(() => parseLevel(['P.G', '##'])).toThrow(LevelParseError);
    expect(() => parseLevel(['PxG'])).toThrow(/Unknown symbol/);
    expect(() => parseLevel(['..G'])).toThrow(/player start/);
    expect(() => parseLevel(['P..'])).toThrow(/goal/);
    expect(() => parseLevel(['PPG'])).toThrow(/more than one/);
  });

  it('the bundled graybox level is valid', () => {
    const level = parseLevel(GRAYBOX_LEVEL);
    expect(level.checkpoints.length).toBeGreaterThanOrEqual(1);
    expect(level.enemies.length).toBeGreaterThanOrEqual(1);
    expect(level.goal.col).toBeGreaterThan(level.player.col);
  });
});

describe('SaveStore', () => {
  class MemoryStorage implements KeyValueStorage {
    data = new Map<string, string>();
    getItem(key: string) {
      return this.data.get(key) ?? null;
    }
    setItem(key: string, value: string) {
      this.data.set(key, value);
    }
  }

  it('round-trips JSON values', () => {
    const store = new SaveStore(() => new MemoryStorage());
    expect(store.save('progress', { stage: 2 })).toBe(true);
    expect(store.load('progress', null)).toEqual({ stage: 2 });
  });

  it('falls back when storage is unavailable or throws', () => {
    const blocked = new SaveStore(() => {
      throw new Error('SecurityError');
    });
    expect(blocked.available).toBe(false);
    expect(blocked.save('x', 1)).toBe(false);
    expect(blocked.load('x', 42)).toBe(42);

    const failing = new SaveStore(() => ({
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('quota');
      },
    }));
    expect(failing.save('x', 1)).toBe(false);
    expect(failing.load('x', 'default')).toBe('default');
  });

  it('falls back on corrupt JSON', () => {
    const mem = new MemoryStorage();
    mem.setItem('elemental-spirit:x', '{not json');
    expect(new SaveStore(() => mem).load('x', 'ok')).toBe('ok');
  });
});

describe('Bindings', () => {
  it('keeps defaults for invalid saved data', () => {
    expect(mergeBindings(null)).toEqual(DEFAULT_BINDINGS);
    expect(mergeBindings({ jump: 'SPACE', unknown: ['X'], attack: [] })).toEqual(DEFAULT_BINDINGS);
  });

  it('overrides only valid actions', () => {
    const merged = mergeBindings({ [Action.Jump]: ['W', 42] });
    expect(merged[Action.Jump]).toEqual(['W']);
    expect(merged[Action.Attack]).toEqual(['J']);
  });

  it('lists unique bound keys', () => {
    const keys = allBoundKeys(DEFAULT_BINDINGS);
    expect(keys).toContain('SPACE');
    expect(new Set(keys).size).toBe(keys.length);
  });
});
