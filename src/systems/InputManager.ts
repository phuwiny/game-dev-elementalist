import Phaser from 'phaser';
import { Action, allBoundKeys, type Bindings, loadBindings } from '../core/Bindings';
import { SaveStore } from '../core/SaveStore';

const codeOf = (name: string): number | undefined =>
  Phaser.Input.Keyboard.KeyCodes[name as keyof typeof Phaser.Input.Keyboard.KeyCodes];

/**
 * อ่าน input ตาม action แทนการอ้างปุ่มตรงๆ เพื่อรองรับ key rebinding (GDD หัวข้อ 7)
 * Gamepad จะเพิ่มใน Phase 5
 */
export class InputManager {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();
  private captured: number[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly store = new SaveStore(),
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');
    this.keyboard = keyboard;
    this.bind(loadBindings(store));
  }

  /** อ่านค่าที่ผู้เล่นตั้งไว้ใหม่ (หลังกลับจากหน้า Settings ระหว่างหยุดเกม) */
  reload(): void {
    for (const list of this.keys.values()) for (const key of list) this.keyboard.removeKey(key, false);
    this.keyboard.removeCapture(this.captured);
    this.keys.clear();
    this.bind(loadBindings(this.store));
  }

  private bind(bindings: Bindings): void {
    for (const action of Object.values(Action)) {
      const list: Phaser.Input.Keyboard.Key[] = [];
      for (const name of bindings[action]) {
        const code = codeOf(name);
        if (code === undefined) {
          console.warn(`[input] Unknown key "${name}" for action "${action}"`);
          continue;
        }
        list.push(this.keyboard.addKey(code, true));
      }
      this.keys.set(action, list);
    }

    // กันไม่ให้ Space/ลูกศรเลื่อนหน้าเว็บ
    this.captured = allBoundKeys(bindings)
      .map(codeOf)
      .filter((c): c is number => c !== undefined);
    this.keyboard.addCapture(this.captured);
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
