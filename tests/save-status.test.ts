import { describe, expect, it, vi } from 'vitest';
import { SaveStatus } from '../src/core/SaveStatus';
import { SaveStore, type KeyValueStorage } from '../src/core/SaveStore';
import { Progress } from '../src/core/Progress';
import { ElementType } from '../src/core/Element';

const memory = (): KeyValueStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

describe('SaveStatus', () => {
  it('notifies subscribers only when the state changes', () => {
    const status = new SaveStatus();
    const cb = vi.fn();
    status.subscribe(cb);
    status.report(true);
    status.report(false);
    status.report(false);
    status.report(true);
    expect(cb.mock.calls).toEqual([[true], [false]]);
  });

  it('stops notifying after unsubscribe', () => {
    const status = new SaveStatus();
    const cb = vi.fn();
    const off = status.subscribe(cb);
    off();
    status.report(false);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('SaveStore reports to SaveStatus', () => {
  it('is not failed while saves succeed', () => {
    const status = new SaveStatus();
    const store = new SaveStore(() => memory(), status);
    expect(store.save('k', 1)).toBe(true);
    expect(status.failed).toBe(false);
  });

  it('fails when setItem throws (quota or blocked) and recovers on the next good save', () => {
    const status = new SaveStatus();
    const storage = memory();
    let broken = true;
    storage.setItem = (k, v) => {
      if (broken) throw new Error('QuotaExceededError');
      storage.data.set(k, v);
    };
    const store = new SaveStore(() => storage, status);
    expect(store.save('k', 1)).toBe(false);
    expect(status.failed).toBe(true);
    broken = false;
    expect(store.save('k', 2)).toBe(true);
    expect(status.failed).toBe(false);
  });

  it('is failed from the start when the browser gives no storage', () => {
    const blocked = new SaveStatus();
    new SaveStore(() => {
      throw new Error('SecurityError');
    }, blocked);
    expect(blocked.failed).toBe(true);
    const none = new SaveStatus();
    new SaveStore(() => null, none);
    expect(none.failed).toBe(true);
  });

  it('shows up when progress cannot be written', () => {
    const status = new SaveStatus();
    const storage = memory();
    storage.setItem = () => {
      throw new Error('blocked');
    };
    const progress = new Progress(['a', 'b'], new SaveStore(() => storage, status));
    progress.addSpirit(ElementType.Fire);
    progress.markCleared('a');
    expect(status.failed).toBe(true);
    expect(progress.isCleared('a')).toBe(true); // the game keeps going in memory
  });
});
