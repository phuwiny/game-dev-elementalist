import Phaser from 'phaser';
import { Action, allBoundKeys, type Bindings, mergeBindings } from '../core/Bindings';
import { SaveStore } from '../core/SaveStore';

const SAVE_KEY = 'bindings';

/**
 * อ่าน input ตาม action แทนการอ้างปุ่มตรงๆ เพื่อรองรับ key rebinding (GDD หัวข้อ 7)
 * Gamepad จะเพิ่มใน Phase 5
 */
export class InputManager {
  private readonly keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();

  constructor(scene: Phaser.Scene, store = new SaveStore()) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');

    const bindings: Bindings = mergeBindings(store.load<unknown>(SAVE_KEY, null));
    for (const action of Object.values(Action)) {
      const list: Phaser.Input.Keyboard.Key[] = [];
      for (const name of bindings[action]) {
        const code = Phaser.Input.Keyboard.KeyCodes[name as keyof typeof Phaser.Input.Keyboard.KeyCodes];
        if (code === undefined) {
          console.warn(`[input] Unknown key "${name}" for action "${action}"`);
          continue;
        }
        list.push(keyboard.addKey(code, true));
      }
      this.keys.set(action, list);
    }

    // กันไม่ให้ Space/ลูกศรเลื่อนหน้าเว็บ
    const codes = allBoundKeys(bindings)
      .map((n) => Phaser.Input.Keyboard.KeyCodes[n as keyof typeof Phaser.Input.Keyboard.KeyCodes])
      .filter((c): c is number => c !== undefined);
    keyboard.addCapture(codes);
  }

  isDown(action: Action): boolean {
    return (this.keys.get(action) ?? []).some((k) => k.isDown);
  }

  justPressed(action: Action): boolean {
    return (this.keys.get(action) ?? []).some((k) => Phaser.Input.Keyboard.JustDown(k));
  }

  /** แกนแนวนอน -1, 0, 1 */
  horizontal(): number {
    return (this.isDown(Action.Right) ? 1 : 0) - (this.isDown(Action.Left) ? 1 : 0);
  }
}
