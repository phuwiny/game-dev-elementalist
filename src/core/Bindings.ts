/**
 * การผูกปุ่มกับ action (GDD หัวข้อ 7)
 * เก็บเป็นชื่อปุ่มตาม KeyboardEvent.code-style ของ Phaser (เช่น 'A', 'LEFT', 'SPACE')
 */

export enum Action {
  Left = 'left',
  Right = 'right',
  Jump = 'jump',
  Attack = 'attack',
  Cast = 'cast',
  PrevElement = 'prevElement',
  NextElement = 'nextElement',
  Element1 = 'element1',
  Element2 = 'element2',
  Element3 = 'element3',
  Element4 = 'element4',
  Pause = 'pause',
}

export type Bindings = Record<Action, string[]>;

/** key ใน localStorage (ผ่าน SaveStore) */
export const BINDINGS_SAVE_KEY = 'bindings';
/** จำนวนปุ่มสูงสุดต่อ action (ช่อง 1 และ 2 ในหน้า Settings) */
export const MAX_KEYS_PER_ACTION = 2;

export const DEFAULT_BINDINGS: Readonly<Bindings> = {
  [Action.Left]: ['A', 'LEFT'],
  [Action.Right]: ['D', 'RIGHT'],
  [Action.Jump]: ['SPACE'],
  [Action.Attack]: ['J'],
  [Action.Cast]: ['K'],
  [Action.PrevElement]: ['Q'],
  [Action.NextElement]: ['E'],
  [Action.Element1]: ['ONE'],
  [Action.Element2]: ['TWO'],
  [Action.Element3]: ['THREE'],
  [Action.Element4]: ['FOUR'],
  [Action.Pause]: ['ESC'],
};

/**
 * รวมค่าที่ผู้เล่นบันทึกไว้กับค่าเริ่มต้น
 * ข้ามค่าที่ไม่ใช่ action ที่รู้จัก หรือไม่ใช่ array ของ string ที่ไม่ว่าง ตัดซ้ำและเหลือไม่เกิน 2 ปุ่มต่อ action
 * ส่วน Pause ใช้ ESC ตายตัวเสมอ
 */
export function mergeBindings(saved: unknown): Bindings {
  const result: Bindings = cloneBindings(DEFAULT_BINDINGS);
  if (!saved || typeof saved !== 'object') return result;
  const actions = new Set<string>(Object.values(Action));
  for (const [action, keys] of Object.entries(saved as Record<string, unknown>)) {
    if (!actions.has(action) || action === Action.Pause) continue;
    if (!Array.isArray(keys)) continue;
    const valid = [...new Set(keys.filter((k): k is string => typeof k === 'string' && k.length > 0))].slice(0, MAX_KEYS_PER_ACTION);
    if (valid.length > 0) result[action as Action] = valid;
  }
  return result;
}

export function cloneBindings(bindings: Readonly<Bindings>): Bindings {
  const out = {} as Bindings;
  for (const action of Object.values(Action)) out[action] = [...bindings[action]];
  return out;
}

/** รายชื่อปุ่มทั้งหมดที่ถูกใช้ ใช้สำหรับ addCapture กันหน้าเว็บเลื่อน */
export function allBoundKeys(bindings: Readonly<Bindings>): string[] {
  return [...new Set(Object.values(bindings).flat())];
}

// ---------------------------------------------------------------------------
// Key rebinding (หน้า Settings)
// ---------------------------------------------------------------------------

/** action ที่ผู้เล่นตั้งปุ่มเองได้ ตามลำดับที่แสดง (Pause ผูกกับ ESC ตายตัว) */
export const REBINDABLE_ACTIONS: readonly Action[] = [
  Action.Left,
  Action.Right,
  Action.Jump,
  Action.Attack,
  Action.Cast,
  Action.PrevElement,
  Action.NextElement,
  Action.Element1,
  Action.Element2,
  Action.Element3,
  Action.Element4,
];

export const ACTION_LABELS: Readonly<Record<Action, string>> = {
  [Action.Left]: 'Move left',
  [Action.Right]: 'Move right',
  [Action.Jump]: 'Jump',
  [Action.Attack]: 'Sword',
  [Action.Cast]: 'Element power',
  [Action.PrevElement]: 'Previous element',
  [Action.NextElement]: 'Next element',
  [Action.Element1]: 'Fire',
  [Action.Element2]: 'Water',
  [Action.Element3]: 'Wind',
  [Action.Element4]: 'Earth',
  [Action.Pause]: 'Pause',
};

/** ปุ่มที่มีความหมายตายตัวในเมนูและตอนเล่น ห้ามผูกกับ action */
export const RESERVED_KEYS: readonly string[] = ['ESC', 'ENTER', 'M', 'BACKSPACE', 'DELETE'];

const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/** ปุ่มที่ตั้งได้ (ชื่อตาม Phaser KeyCodes) */
export const BINDABLE_KEYS: readonly string[] = [
  ...LETTERS,
  ...DIGITS,
  'SPACE',
  'LEFT',
  'RIGHT',
  'UP',
  'DOWN',
  'SHIFT',
  'COMMA',
  'PERIOD',
];

export type RebindFailure = 'reserved' | 'unsupported' | 'last-key';
export type RebindResult =
  | { ok: true; bindings: Bindings; /** action ที่เสียปุ่มนี้ไป (ได้ปุ่มเดิมของช่องนี้แทน) */ displaced?: Action }
  | { ok: false; reason: RebindFailure };

/**
 * ตั้งปุ่ม `key` ให้ช่อง `slot` (0 หรือ 1) ของ action
 * - ปุ่มที่ action อื่นใช้อยู่: action นั้นเสียปุ่มไป และได้ปุ่มเดิมของช่องนี้แทน (สลับกัน)
 *   ถ้าสลับให้ไม่ได้ (ช่องนี้ยังว่าง และ action นั้นจะไม่เหลือปุ่มเลย) จะไม่ทำอะไรและคืน 'last-key'
 * - ปุ่มที่ action เดียวกันใช้อยู่ในอีกช่อง: สลับช่องกัน
 */
export function setBinding(bindings: Readonly<Bindings>, action: Action, slot: number, key: string): RebindResult {
  if (RESERVED_KEYS.includes(key)) return { ok: false, reason: 'reserved' };
  if (!BINDABLE_KEYS.includes(key)) return { ok: false, reason: 'unsupported' };
  const next = cloneBindings(bindings);
  const list = next[action];
  const target = Math.min(Math.max(0, slot), Math.min(list.length, MAX_KEYS_PER_ACTION - 1));
  const old = list[target];

  const sameAt = list.indexOf(key);
  if (sameAt === target) return { ok: true, bindings: next };
  if (sameAt >= 0) {
    // ปุ่มซ้ำกับอีกช่องของ action เดียวกัน: สลับกัน (ถ้าช่องนี้ว่าง ไม่ต้องทำอะไร)
    if (old === undefined) return { ok: true, bindings: next };
    list[sameAt] = old;
    list[target] = key;
    return { ok: true, bindings: next };
  }

  let displaced: Action | undefined;
  for (const other of Object.values(Action)) {
    if (other === action) continue;
    const at = next[other].indexOf(key);
    if (at < 0) continue;
    if (old !== undefined) next[other][at] = old;
    else if (next[other].length > 1) next[other].splice(at, 1);
    else return { ok: false, reason: 'last-key' };
    displaced = other;
  }
  list[target] = key;
  return displaced ? { ok: true, bindings: next, displaced } : { ok: true, bindings: next };
}

/** ล้างปุ่มในช่อง ถ้าเป็นปุ่มสุดท้ายของ action จะไม่ล้าง */
export function clearBinding(bindings: Readonly<Bindings>, action: Action, slot: number): RebindResult {
  if (bindings[action].length <= 1 || bindings[action][slot] === undefined) return { ok: false, reason: 'last-key' };
  const next = cloneBindings(bindings);
  next[action].splice(slot, 1);
  return { ok: true, bindings: next };
}

export function isDefaultBindings(bindings: Readonly<Bindings>): boolean {
  return Object.values(Action).every((a) => {
    const b = bindings[a] ?? [];
    const d = DEFAULT_BINDINGS[a];
    return b.length === d.length && b.every((k, i) => k === d[i]);
  });
}

/** ชื่อปุ่มที่แสดงให้ผู้เล่นอ่าน */
export function keyLabel(name: string): string {
  const digit = DIGITS.indexOf(name);
  if (digit >= 0) return String(digit);
  if (name === 'COMMA') return ',';
  if (name === 'PERIOD') return '.';
  return name;
}

/** บรรทัดสรุปปุ่มบนหน้า Title ตามค่าที่ตั้งไว้ (ปุ่มแรกของแต่ละ action) */
export function controlsHint(bindings: Readonly<Bindings>): string {
  const k = (a: Action) => keyLabel(bindings[a][0] ?? '?');
  const elements = [Action.Element1, Action.Element2, Action.Element3, Action.Element4].map(k);
  const numbers = elements.join('') === '1234' ? '1-4' : elements.join('/');
  return `${k(Action.Left)}/${k(Action.Right)} move  ${k(Action.Jump)} jump  ${k(Action.Attack)} sword  ${k(Action.Cast)} element  ${k(Action.PrevElement)}/${k(Action.NextElement)} or ${numbers} switch  ESC pause`;
}

export function loadBindings(store: { load<T>(key: string, fallback: T): T }): Bindings {
  return mergeBindings(store.load<unknown>(BINDINGS_SAVE_KEY, null));
}

/** คืนค่า false ถ้าบันทึกไม่ได้ */
export function saveBindings(store: { save<T>(key: string, value: T): boolean }, bindings: Readonly<Bindings>): boolean {
  return store.save(BINDINGS_SAVE_KEY, bindings);
}
