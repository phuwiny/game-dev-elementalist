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
 * ข้ามค่าที่ไม่ใช่ action ที่รู้จัก หรือไม่ใช่ array ของ string ที่ไม่ว่าง
 */
export function mergeBindings(saved: unknown): Bindings {
  const result: Bindings = cloneBindings(DEFAULT_BINDINGS);
  if (!saved || typeof saved !== 'object') return result;
  const actions = new Set<string>(Object.values(Action));
  for (const [action, keys] of Object.entries(saved as Record<string, unknown>)) {
    if (!actions.has(action)) continue;
    if (!Array.isArray(keys)) continue;
    const valid = keys.filter((k): k is string => typeof k === 'string' && k.length > 0);
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
