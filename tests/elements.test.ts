import { describe, expect, it } from 'vitest';
import { SpiritEnergy } from '../src/core/SpiritEnergy';
import { ElementSelector } from '../src/core/ElementSelector';
import { StatusEffects } from '../src/core/StatusEffects';
import { linkTriggers, isGateOpen } from '../src/core/TriggerLinks';
import { JumpAssist } from '../src/core/JumpAssist';
import { ElementType } from '../src/core/Element';
import { parseLevel, LevelParseError } from '../src/core/LevelParser';
import { ElementBalance, EnergyBalance } from '../src/config/balance';

describe('SpiritEnergy', () => {
  it('starts full and spends only when affordable', () => {
    const e = new SpiritEnergy(EnergyBalance);
    expect(e.value).toBe(100);
    expect(e.trySpend(30)).toBe(true);
    expect(e.value).toBe(70);
    expect(e.trySpend(80)).toBe(false);
    expect(e.value).toBe(70);
  });

  it('regenerates only after the delay', () => {
    const e = new SpiritEnergy(EnergyBalance);
    e.trySpend(50);
    e.update(1400);
    expect(e.value).toBe(50);
    e.update(100); // 1500 ms: delay reached, regen starts from this frame
    e.update(1000);
    expect(e.value).toBeCloseTo(55.5, 1);
  });

  it('never exceeds max and gains on melee hits', () => {
    const e = new SpiritEnergy(EnergyBalance);
    e.trySpend(3);
    e.gainFromMelee();
    expect(e.value).toBe(100);
  });

  it('drains continuously and reports empty', () => {
    const e = new SpiritEnergy(EnergyBalance);
    e.trySpend(90);
    expect(e.drain(20, 400)).toBe(true);
    expect(e.value).toBeCloseTo(2);
    expect(e.drain(20, 400)).toBe(false);
    expect(e.value).toBe(0);
  });

  it('spending resets the regen delay', () => {
    const e = new SpiritEnergy(EnergyBalance);
    e.trySpend(50);
    e.update(1400);
    e.drain(10, 100);
    e.update(1000);
    expect(e.value).toBeCloseTo(49);
  });
});

describe('ElementSelector', () => {
  const ms = ElementBalance.switchCooldownMs;

  it('has nothing selected until a spirit is unlocked, then selects it', () => {
    const s = new ElementSelector(ms);
    expect(s.selected).toBeNull();
    expect(s.unlock(ElementType.Water)).toBe(true);
    expect(s.selected).toBe(ElementType.Water);
    expect(s.unlock(ElementType.Water)).toBe(false);
  });

  it('skips locked slots and respects the cooldown', () => {
    const s = new ElementSelector(ms);
    s.unlock(ElementType.Fire);
    s.unlock(ElementType.Earth);
    s.update(ms);
    expect(s.selectSlot(1)).toBe(false); // water locked
    expect(s.selectSlot(0)).toBe(true);
    expect(s.cycle(1)).toBe(false); // cooldown
    s.update(ms);
    expect(s.cycle(1)).toBe(true);
    expect(s.selected).toBe(ElementType.Earth);
    s.update(ms);
    expect(s.cycle(1)).toBe(true);
    expect(s.selected).toBe(ElementType.Fire);
    s.update(ms);
    expect(s.cycle(-1)).toBe(true);
    expect(s.selected).toBe(ElementType.Earth);
  });

  it('lists unlocked elements in HUD order', () => {
    const s = new ElementSelector(ms);
    s.unlock(ElementType.Earth);
    s.unlock(ElementType.Fire);
    expect(s.unlocked).toEqual([ElementType.Fire, ElementType.Earth]);
  });
});

describe('StatusEffects', () => {
  const cfg = ElementBalance.fire;

  it('burn deals one tick per second for its duration', () => {
    const st = new StatusEffects(cfg);
    st.ignite();
    let dmg = 0;
    for (let t = 0; t < 4000; t += 100) dmg += st.update(100);
    expect(dmg).toBe(3);
    expect(st.isBurning).toBe(false);
  });

  it('freeze expires and fire/ice cancel each other', () => {
    const st = new StatusEffects(cfg);
    st.ignite();
    st.freeze(2000);
    expect(st.isBurning).toBe(false);
    expect(st.isFrozen).toBe(true);
    st.update(1999);
    expect(st.isFrozen).toBe(true);
    st.update(1);
    expect(st.isFrozen).toBe(false);
    st.freeze(2000);
    st.ignite();
    expect(st.isFrozen).toBe(false);
    expect(st.isBurning).toBe(true);
  });
});

describe('linkTriggers', () => {
  it('links each trigger to the nearest gate on its right', () => {
    const triggers = [
      { col: 2, row: 10 },
      { col: 5, row: 10 },
      { col: 12, row: 10 },
      { col: 30, row: 10 },
    ];
    const gates = [
      { col: 8, row: 10 },
      { col: 20, row: 10 },
    ];
    expect(linkTriggers(triggers, gates)).toEqual([[0, 1], [2]]);
  });

  it('opens only when every linked trigger is active, never with no triggers', () => {
    expect(isGateOpen([0, 1], [true, false])).toBe(false);
    expect(isGateOpen([0, 1], [true, true])).toBe(true);
    expect(isGateOpen([], [])).toBe(false);
  });
});

describe('JumpAssist.canGroundJump', () => {
  it('is true on the ground and during coyote time only', () => {
    const j = new JumpAssist(100, 100);
    j.update(16, true);
    expect(j.canGroundJump).toBe(true);
    j.update(90, false);
    expect(j.canGroundJump).toBe(true);
    j.update(20, false);
    expect(j.canGroundJump).toBe(false);
  });
});

describe('parseLevel objects', () => {
  it('parses puzzle objects and spirits', () => {
    const level = parseLevel(['....', 'P.1G', 'vt~#']);
    expect(level.objects).toEqual([
      { kind: 'spirit', col: 2, row: 1, slot: 0 },
      { kind: 'vine', col: 0, row: 2 },
      { kind: 'torch', col: 1, row: 2 },
      { kind: 'water', col: 2, row: 2 },
    ]);
  });

  it('rejects multi-tile objects that overlap other symbols or leave the level', () => {
    expect(() => parseLevel(['P.#.', '..D.', 'G...'])).toThrow(LevelParseError);
    expect(() => parseLevel(['P.G', '..X'])).toThrow(/outside/);
  });
});

describe('Elements Lab level', () => {
  it('is valid, has all four spirits and every gate has a trigger', async () => {
    const { LAB_LEVEL } = await import('../src/levels/lab');
    const level = parseLevel(LAB_LEVEL);
    const spirits = level.objects.filter((o) => o.kind === 'spirit').map((o) => o.slot);
    expect(spirits).toEqual([0, 1, 2, 3]);
    const triggers = level.objects.filter((o) => o.kind === 'torch' || o.kind === 'windmill' || o.kind === 'plate');
    const gates = level.objects.filter((o) => o.kind === 'gate');
    const links = linkTriggers(triggers, gates);
    expect(links.every((l) => l.length > 0)).toBe(true);
  });
});
