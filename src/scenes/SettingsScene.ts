import Phaser from 'phaser';
import { GAME_WIDTH, SceneKey } from '../config/constants';
import { PALETTE } from '../assets/palette';
import {
  ACTION_LABELS,
  type Action,
  type Bindings,
  DEFAULT_BINDINGS,
  MAX_KEYS_PER_ACTION,
  REBINDABLE_ACTIONS,
  clearBinding,
  cloneBindings,
  isDefaultBindings,
  keyLabel,
  loadBindings,
  saveBindings,
  setBinding,
} from '../core/Bindings';
import { SaveStore } from '../core/SaveStore';
import { sfx } from '../systems/Sfx';
import { textStyle } from '../ui/text';
import { useUiCamera } from '../ui/screen';
import { addSaveWarning } from '../ui/saveWarning';

const ROW_Y = 58;
const ROW_H = 18;
const LABEL_X = 150;
const SLOT_X = [330, 450];
const RESET_ROW = REBINDABLE_ACTIONS.length;
const BACK_ROW = RESET_ROW + 1;

/** ชื่อปุ่มของ Phaser จาก keyCode (ใช้ตอนรอรับปุ่มใหม่) */
const CODE_TO_NAME = new Map<number, string>(Object.entries(Phaser.Input.Keyboard.KeyCodes).map(([name, code]) => [code as number, name]));

/**
 * ตั้งปุ่ม (GDD หัวข้อ 7): แต่ละ action มีได้ 2 ปุ่ม บันทึกทันทีที่เปลี่ยน
 * เปิดจากเมนู Title (เต็มจอ) หรือจากหน้า Pause (ซ้อนบนเกมที่หยุดอยู่ ตัวเกมอ่านปุ่มใหม่ตอนปิด)
 */
export class SettingsScene extends Phaser.Scene {
  private store = new SaveStore();
  private bindings!: Bindings;
  private row = 0;
  private slot = 0;
  private listening = false;
  private message!: Phaser.GameObjects.Text;
  private labels: Phaser.GameObjects.Text[] = [];
  private cells: Phaser.GameObjects.Text[][] = [];
  private resetText!: Phaser.GameObjects.Text;
  private backText!: Phaser.GameObjects.Text;
  private overlay = false;

  constructor() {
    super(SceneKey.Settings);
  }

  create(data?: { overlay?: boolean }): void {
    this.overlay = data?.overlay === true;
    this.store = new SaveStore();
    this.bindings = loadBindings(this.store);
    this.row = 0;
    this.slot = 0;
    this.listening = false;

    useUiCamera(this).setBackgroundColor(PALETTE.outline);
    addSaveWarning(this);
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 28, 'SETTINGS', textStyle(20, PALETTE.gold)).setOrigin(0.5);
    this.add.text(LABEL_X, ROW_Y - 14, 'ACTION', textStyle(10, PALETTE.neutral3));
    SLOT_X.forEach((x, i) => this.add.text(x, ROW_Y - 14, `KEY ${i + 1}`, textStyle(10, PALETTE.neutral3)));

    this.labels = [];
    this.cells = [];
    REBINDABLE_ACTIONS.forEach((action, i) => {
      const y = ROW_Y + i * ROW_H;
      this.labels.push(this.add.text(LABEL_X, y, ACTION_LABELS[action], textStyle(12)));
      this.cells.push(SLOT_X.map((x) => this.add.text(x, y, '', textStyle(12))));
    });
    this.resetText = this.add.text(LABEL_X, ROW_Y + RESET_ROW * ROW_H + 6, 'Reset to defaults', textStyle(12));
    this.backText = this.add.text(LABEL_X, ROW_Y + BACK_ROW * ROW_H + 6, 'Back', textStyle(12));
    this.message = this.add.text(cx, 304, '', textStyle(10, PALETTE.gold)).setOrigin(0.5);
    this.add
      .text(cx, 322, 'UP/DOWN row  LEFT/RIGHT key slot  ENTER change  DEL clear  ESC back', textStyle(10, PALETTE.neutral3))
      .setOrigin(0.5);
    this.refresh();

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    const name = CODE_TO_NAME.get(e.keyCode) ?? '';
    if (this.listening) {
      this.capture(name);
      return;
    }
    const onAction = this.row < REBINDABLE_ACTIONS.length;
    switch (name) {
      case 'UP':
        this.row = (this.row + BACK_ROW) % (BACK_ROW + 1);
        break;
      case 'DOWN':
        this.row = (this.row + 1) % (BACK_ROW + 1);
        break;
      case 'LEFT':
      case 'RIGHT':
        if (onAction) this.slot = name === 'LEFT' ? 0 : Math.min(1, MAX_KEYS_PER_ACTION - 1);
        break;
      case 'ENTER':
        this.activate();
        return;
      case 'DELETE':
      case 'BACKSPACE':
        if (onAction) this.clear();
        return;
      case 'ESC':
        this.close();
        return;
      default:
        return;
    }
    sfx.play('menu');
    this.message.setText('');
    this.refresh();
  }

  private activate(): void {
    sfx.play('menu');
    if (this.row === BACK_ROW) {
      this.close();
    } else if (this.row === RESET_ROW) {
      this.apply(cloneBindings(DEFAULT_BINDINGS), 'Defaults restored');
    } else {
      this.listening = true;
      this.message.setText('Press a key  (ESC cancels)');
      this.refresh();
    }
  }

  private capture(name: string): void {
    if (name === 'ESC') {
      this.listening = false;
      this.message.setText('');
      this.refresh();
      return;
    }
    const action = REBINDABLE_ACTIONS[this.row];
    const result = setBinding(this.bindings, action, this.slot, name);
    if (!result.ok) {
      sfx.play('deny');
      this.message.setText(
        result.reason === 'reserved'
          ? `${keyLabel(name)} is reserved`
          : result.reason === 'unsupported'
            ? 'That key cannot be used'
            : `${keyLabel(name)} is the only key of another action`,
      );
      return; // keep listening
    }
    this.listening = false;
    const note = result.displaced ? `${keyLabel(name)} swapped with ${ACTION_LABELS[result.displaced]}` : `${ACTION_LABELS[action]}: ${keyLabel(name)}`;
    this.apply(result.bindings, note);
  }

  private clear(): void {
    const result = clearBinding(this.bindings, REBINDABLE_ACTIONS[this.row], this.slot);
    if (!result.ok) {
      sfx.play('deny');
      this.message.setText('An action needs at least one key');
      return;
    }
    this.apply(result.bindings, 'Key cleared');
  }

  private apply(bindings: Bindings, note: string): void {
    this.bindings = bindings;
    saveBindings(this.store, bindings); // ถ้าบันทึกไม่ได้ SaveStatus จะทำให้ข้อความเตือนขึ้นเอง
    sfx.play('switch');
    this.message.setText(note);
    this.refresh();
  }

  private refresh(): void {
    REBINDABLE_ACTIONS.forEach((action: Action, i) => {
      const selectedRow = i === this.row;
      this.labels[i].setText(`${selectedRow ? '>' : ' '} ${ACTION_LABELS[action]}`).setColor(selectedRow ? PALETTE.highlight : PALETTE.neutral3);
      SLOT_X.forEach((_x, s) => {
        const cell = this.cells[i][s];
        const key = this.bindings[action][s];
        const here = selectedRow && s === this.slot;
        const text = here && this.listening ? '< press >' : key ? keyLabel(key) : '-';
        cell.setText(here && !this.listening ? `[${text}]` : text).setColor(here ? PALETTE.gold : key ? PALETTE.neutral4 : PALETTE.neutral2);
      });
    });
    const dim = isDefaultBindings(this.bindings);
    this.resetText
      .setText(`${this.row === RESET_ROW ? '>' : ' '} Reset to defaults`)
      .setColor(this.row === RESET_ROW ? PALETTE.highlight : dim ? PALETTE.neutral2 : PALETTE.neutral3);
    this.backText.setText(`${this.row === BACK_ROW ? '>' : ' '} Back`).setColor(this.row === BACK_ROW ? PALETTE.highlight : PALETTE.neutral3);
  }

  private close(): void {
    sfx.play('menu');
    if (this.overlay) this.scene.stop();
    else this.scene.start(SceneKey.Title);
  }
}
