import { describe, expect, it } from 'vitest';
import {
  Action,
  BINDABLE_KEYS,
  DEFAULT_BINDINGS,
  REBINDABLE_ACTIONS,
  RESERVED_KEYS,
  cloneBindings,
  clearBinding,
  controlsHint,
  isDefaultBindings,
  keyLabel,
  loadBindings,
  mergeBindings,
  saveBindings,
  setBinding,
} from '../src/core/Bindings';
import { SaveStatus } from '../src/core/SaveStatus';
import { SaveStore, type KeyValueStorage } from '../src/core/SaveStore';

const ok = <T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> => {
  expect(r.ok).toBe(true);
  return r as Extract<T, { ok: true }>;
};

describe('setBinding', () => {
  it('replaces a key in a free slot without touching the defaults object', () => {
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'W'));
    expect(r.bindings[Action.Jump]).toEqual(['W']);
    expect(r.displaced).toBeUndefined();
    expect(DEFAULT_BINDINGS[Action.Jump]).toEqual(['SPACE']);
  });

  it('adds a second key when the action has one', () => {
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 1, 'W'));
    expect(r.bindings[Action.Jump]).toEqual(['SPACE', 'W']);
  });

  it('never grows past two keys per action', () => {
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Left, 5, 'Z'));
    expect(r.bindings[Action.Left]).toHaveLength(2);
  });

  it('swaps with another action that already uses the key', () => {
    // Jump (SPACE) <- attack key J: Attack gets SPACE
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'J'));
    expect(r.bindings[Action.Jump]).toEqual(['J']);
    expect(r.bindings[Action.Attack]).toEqual(['SPACE']);
    expect(r.displaced).toBe(Action.Attack);
  });

  it('takes the key from an action that has a spare one when the slot was empty', () => {
    // Left has A and LEFT: appending LEFT to Jump leaves Left with just A
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 1, 'LEFT'));
    expect(r.bindings[Action.Jump]).toEqual(['SPACE', 'LEFT']);
    expect(r.bindings[Action.Left]).toEqual(['A']);
    expect(r.displaced).toBe(Action.Left);
  });

  it('refuses to leave another action without any key', () => {
    // Attack has only J; Jump slot 1 is empty so there is nothing to swap in
    expect(setBinding(DEFAULT_BINDINGS, Action.Jump, 1, 'J')).toEqual({ ok: false, reason: 'last-key' });
  });

  it('swaps the two slots of one action', () => {
    const r = ok(setBinding(DEFAULT_BINDINGS, Action.Left, 1, 'A'));
    expect(r.bindings[Action.Left]).toEqual(['LEFT', 'A']);
    expect(r.displaced).toBeUndefined();
  });

  it('rejects reserved and unsupported keys', () => {
    for (const key of RESERVED_KEYS) expect(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, key)).toEqual({ ok: false, reason: 'reserved' });
    expect(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'F5')).toEqual({ ok: false, reason: 'unsupported' });
    expect(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'TAB')).toEqual({ ok: false, reason: 'unsupported' });
  });

  it('keeps every action bound and every key unique across actions after a series of changes', () => {
    let b = cloneBindings(DEFAULT_BINDINGS);
    const keys = ['J', 'K', 'SPACE', 'A', 'LEFT', 'ONE', 'D', 'Q', 'E', 'TWO', 'THREE', 'FOUR', 'W', 'S'];
    let i = 0;
    for (const action of REBINDABLE_ACTIONS) {
      for (const slot of [0, 1]) {
        const r = setBinding(b, action, slot, keys[i++ % keys.length]);
        if (r.ok) b = r.bindings;
      }
    }
    const all = REBINDABLE_ACTIONS.flatMap((a) => b[a]);
    expect(new Set(all).size).toBe(all.length);
    for (const a of REBINDABLE_ACTIONS) expect(b[a].length).toBeGreaterThanOrEqual(1);
    expect(b[Action.Pause]).toEqual(['ESC']);
  });
});

describe('clearBinding', () => {
  it('removes a spare key but never the last one', () => {
    const r = ok(clearBinding(DEFAULT_BINDINGS, Action.Left, 1));
    expect(r.bindings[Action.Left]).toEqual(['A']);
    expect(clearBinding(r.bindings, Action.Left, 0)).toEqual({ ok: false, reason: 'last-key' });
    expect(clearBinding(DEFAULT_BINDINGS, Action.Jump, 1)).toEqual({ ok: false, reason: 'last-key' });
  });
});

describe('defaults and saved data', () => {
  it('every default key is a bindable (or Pause) key and not reserved except the fixed pause key', () => {
    for (const a of REBINDABLE_ACTIONS) for (const k of DEFAULT_BINDINGS[a]) {
      expect(BINDABLE_KEYS).toContain(k);
      expect(RESERVED_KEYS).not.toContain(k);
    }
  });

  it('detects default bindings', () => {
    expect(isDefaultBindings(DEFAULT_BINDINGS)).toBe(true);
    expect(isDefaultBindings(ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'W')).bindings)).toBe(false);
  });

  it('ignores a saved Pause binding and trims saved lists to two unique keys', () => {
    const merged = mergeBindings({ pause: ['P'], left: ['A', 'A', 'B', 'C'] });
    expect(merged[Action.Pause]).toEqual(['ESC']);
    expect(merged[Action.Left]).toEqual(['A', 'B']);
  });

  it('round-trips through SaveStore and reports a failed save', () => {
    const data = new Map<string, string>();
    const storage: KeyValueStorage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
    const store = new SaveStore(() => storage, new SaveStatus());
    const changed = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'W')).bindings;
    expect(saveBindings(store, changed)).toBe(true);
    expect(loadBindings(store)[Action.Jump]).toEqual(['W']);

    const status = new SaveStatus();
    const broken = new SaveStore(() => ({ getItem: () => null, setItem: () => { throw new Error('quota'); } }), status);
    expect(saveBindings(broken, changed)).toBe(false);
    expect(status.failed).toBe(true);
  });
});

describe('labels', () => {
  it('shows digits and punctuation the way players read them', () => {
    expect(keyLabel('ONE')).toBe('1');
    expect(keyLabel('ZERO')).toBe('0');
    expect(keyLabel('COMMA')).toBe(',');
    expect(keyLabel('SPACE')).toBe('SPACE');
  });

  it('builds the Title hint from the bindings', () => {
    expect(controlsHint(DEFAULT_BINDINGS)).toBe('A/D move  SPACE jump  J sword  K element  Q/E or 1-4 switch  ESC pause');
    const b = ok(setBinding(DEFAULT_BINDINGS, Action.Jump, 0, 'W')).bindings;
    expect(controlsHint(b)).toContain('W jump');
    const e = ok(setBinding(DEFAULT_BINDINGS, Action.Element1, 0, 'Z')).bindings;
    expect(controlsHint(e)).toContain('or Z/2/3/4 switch');
  });
});
