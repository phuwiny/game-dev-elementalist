import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { ElementType, type IElementReactive } from '../core/Element';
import { OBJECT_SIZE, type LevelObject, type ObjectKind } from '../core/LevelParser';
import { animKey } from '../assets/manifest';

const objAnim = (name: string) => animKey('objects', name);

/** ประเภทกลุ่ม physics ที่วัตถุอยู่ */
export type BodyGroup = 'solid' | 'water' | 'sensor';

/**
 * บริการที่วัตถุ puzzle ต้องใช้จาก scene (หาเพื่อนบ้านเพื่อลามไฟ/น้ำแข็ง, สร้างแท่นเหยียบ)
 */
export interface PuzzleHost {
  /** scene ที่วัตถุอยู่ (ไม่ใช้ชื่อ scene เพราะชนกับ Phaser.Scene#scene) */
  readonly puzzleScene: Phaser.Scene;
  objectAt(col: number, row: number): PuzzleObject | undefined;
  addOneWayPlatform(x: number, y: number, width: number): void;
  onChanged(): void;
}

/**
 * พื้นฐานวัตถุ puzzle: sprite สำหรับแสดงผล + zone static body สำหรับ physics
 * ตำแหน่งยึดมุมล่างซ้ายตาม LevelParser
 */
export abstract class PuzzleObject implements IElementReactive {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly zone: Phaser.GameObjects.Zone;
  abstract readonly group: BodyGroup;
  removed = false;

  constructor(
    protected readonly host: PuzzleHost,
    readonly kind: ObjectKind,
    readonly col: number,
    readonly row: number,
    frame: string,
  ) {
    const [w, h] = OBJECT_SIZE[kind];
    const left = col * TILE_SIZE;
    const bottom = (row + 1) * TILE_SIZE;
    const scene = host.puzzleScene;
    this.sprite = scene.add.sprite(left + (w * TILE_SIZE) / 2, bottom, 'objects', frame).setOrigin(0.5, 1).setDepth(2);
    this.zone = scene.add.zone(left + (w * TILE_SIZE) / 2, bottom - (h * TILE_SIZE) / 2, w * TILE_SIZE, h * TILE_SIZE);
    this.zone.setData('puzzle', this);
  }

  get bounds(): Phaser.Geom.Rectangle {
    return this.zone.getBounds();
  }

  /** กระสุนธาตุหยุดที่วัตถุนี้หรือทะลุผ่าน */
  absorbs(_element: ElementType): boolean {
    return this.group !== 'sensor';
  }

  abstract onElementHit(element: ElementType, power: number): void;

  protected setBodyEnabled(enabled: boolean): void {
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = enabled;
  }

  /** ปิด physics และลบ sprite หลังเล่น animation จบ */
  protected removeAfter(animName: string): void {
    if (this.removed) return;
    this.removed = true;
    this.setBodyEnabled(false);
    this.sprite.play(objAnim(animName));
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.sprite.destroy());
    this.host.onChanged();
  }

  /** ลามไปยังวัตถุชนิดเดียวกันที่ติดกัน 4 ทิศ */
  protected spread(action: (o: PuzzleObject) => void, delayMs = 90): void {
    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    this.host.puzzleScene.time.delayedCall(delayMs, () => {
      for (const [dc, dr] of neighbors) {
        const o = this.host.objectAt(this.col + dc, this.row + dr);
        if (o && o.kind === this.kind && !o.removed) action(o);
      }
    });
  }
}

/** เถาวัลย์และลังไม้: ไฟเผาแล้วลามไปชิ้นที่ติดกัน */
export class Burnable extends PuzzleObject {
  readonly group = 'solid';
  private readonly base: string;

  constructor(host: PuzzleHost, o: LevelObject) {
    const base = o.kind === 'vine' ? 'burnable_vine' : 'wooden_crate';
    super(host, o.kind, o.col, o.row, `${base}_idle_000`);
    this.base = base;
  }

  onElementHit(element: ElementType): void {
    if (element === ElementType.Fire) this.burn();
  }

  burn(): void {
    if (this.removed) return;
    this.removeAfter(`${this.base}_burn`);
    this.spread((o) => (o as Burnable).burn());
  }
}

/** ก้อนน้ำแข็ง: ไฟละลาย ลามไปก้อนที่ติดกัน */
export class IceBlock extends PuzzleObject {
  readonly group = 'solid';

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'ice', o.col, o.row, 'ice_block_idle_000');
  }

  onElementHit(element: ElementType): void {
    if (element === ElementType.Fire) this.melt();
  }

  melt(): void {
    if (this.removed) return;
    this.removeAfter('ice_block_melt');
    this.spread((o) => (o as IceBlock).melt(), 70);
  }
}

/**
 * ผิวน้ำ: ตกลงไปตาย ถ้าแช่แข็งแล้วจะเหยียบได้ ไฟละลายกลับเป็นน้ำ
 * ฟองน้ำแช่แข็งรอบจุดที่โดน ± radius ช่อง
 */
export class WaterSurface extends PuzzleObject {
  readonly group = 'water';
  frozen = false;

  constructor(
    host: PuzzleHost,
    o: LevelObject,
    private readonly freezeRadius: number,
  ) {
    super(host, 'water', o.col, o.row, 'water_surface_water_000');
    this.sprite.play(objAnim('water_surface_water'));
  }

  override absorbs(): boolean {
    return true;
  }

  onElementHit(element: ElementType): void {
    if (element === ElementType.Water) this.setFrozenAround(true, this.freezeRadius);
    else if (element === ElementType.Fire) this.setFrozenAround(false, 1);
  }

  private setFrozenAround(frozen: boolean, radius: number): void {
    for (let dc = -radius; dc <= radius; dc += 1) {
      const o = this.host.objectAt(this.col + dc, this.row);
      if (o instanceof WaterSurface) o.setFrozen(frozen);
    }
    this.host.onChanged();
  }

  setFrozen(frozen: boolean): void {
    if (this.frozen === frozen) return;
    this.frozen = frozen;
    if (frozen) {
      this.sprite.stop();
      this.sprite.setFrame('water_surface_frozen_000');
    } else {
      this.sprite.play(objAnim('water_surface_water'));
    }
  }
}

/** ตัวกระตุ้นที่ผูกกับประตู */
export interface Trigger {
  readonly isActive: boolean;
}

/** คบเพลิง: ยิงไฟใส่แล้วติดค้าง */
export class Torch extends PuzzleObject implements Trigger {
  readonly group = 'sensor';
  private lit = false;

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'torch', o.col, o.row, 'torch_unlit_000');
  }

  get isActive(): boolean {
    return this.lit;
  }

  override absorbs(element: ElementType): boolean {
    return element === ElementType.Fire;
  }

  onElementHit(element: ElementType): void {
    if (element !== ElementType.Fire || this.lit) return;
    this.lit = true;
    this.sprite.play(objAnim('torch_lit'));
    this.host.onChanged();
  }
}

/** กังหันลม: โดนลมแล้วหมุนค้าง */
export class Windmill extends PuzzleObject implements Trigger {
  readonly group = 'sensor';
  private spinning = false;

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'windmill', o.col, o.row, 'windmill_idle_000');
  }

  get isActive(): boolean {
    return this.spinning;
  }

  override absorbs(): boolean {
    return false;
  }

  onElementHit(element: ElementType): void {
    if (element !== ElementType.Wind || this.spinning) return;
    this.spinning = true;
    this.sprite.play(objAnim('windmill_spin'));
    this.host.onChanged();
  }
}

/** เมล็ดวิเศษ: รดน้ำแล้วโตเป็นต้นที่มีใบให้เหยียบขึ้นได้ 2 ชั้น */
export class MagicSeed extends PuzzleObject {
  readonly group = 'sensor';
  private grown = false;

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'seed', o.col, o.row, 'magic_seed_seed_000');
    // ฟองน้ำลอยเป็นวิถีโค้ง จึงขยายพื้นที่รับน้ำขึ้นไปด้านบนให้เล็งง่าย
    const bottom = (o.row + 1) * TILE_SIZE;
    this.zone.setSize(TILE_SIZE * 2, TILE_SIZE * 3).setPosition(this.zone.x, bottom - (TILE_SIZE * 3) / 2);
  }

  override absorbs(element: ElementType): boolean {
    return element === ElementType.Water && !this.grown;
  }

  onElementHit(element: ElementType): void {
    if (element !== ElementType.Water || this.grown) return;
    this.grown = true;
    this.sprite.play(objAnim('magic_seed_grow'));
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.sprite.setFrame('magic_seed_grown_000'));
    const x = this.col * TILE_SIZE + TILE_SIZE / 2;
    const ground = (this.row + 1) * TILE_SIZE;
    this.host.addOneWayPlatform(x, ground - 32, 24);
    this.host.addOneWayPlatform(x, ground - 64, 24);
  }
}

/** กำแพงร้าว: ทุบด้วยพลังดิน (ground slam) */
export class CrackedWall extends PuzzleObject {
  readonly group = 'solid';

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'crackedWall', o.col, o.row, 'cracked_wall_idle_000');
  }

  onElementHit(element: ElementType): void {
    if (element === ElementType.Earth) this.crumble();
  }

  /** พังแล้วลามไปกำแพงร้าวที่ต่อกัน (วัตถุขนาด 2×2 จึงหาเพื่อนบ้านห่าง 2 ช่อง) */
  crumble(): void {
    if (this.removed) return;
    this.removeAfter('cracked_wall_break');
    this.host.puzzleScene.time.delayedCall(80, () => {
      for (const [dc, dr] of [
        [0, -2],
        [0, 2],
        [2, 0],
        [-2, 0],
      ]) {
        const o = this.host.objectAt(this.col + dc, this.row + dr);
        if (o instanceof CrackedWall) o.crumble();
      }
    });
  }
}

/** แผ่นกด: ทำงานขณะมีของหนักทับ (scene เป็นผู้ตรวจและเรียก setPressed) */
export class PressurePlate extends PuzzleObject implements Trigger {
  readonly group = 'sensor';
  private pressed = false;

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'plate', o.col, o.row, 'pressure_plate_up_000');
  }

  get isActive(): boolean {
    return this.pressed;
  }

  /** พื้นที่ด้านบนแผ่นที่ใช้ตรวจว่ามีอะไรทับ */
  get pressArea(): Phaser.Geom.Rectangle {
    const b = this.bounds;
    return new Phaser.Geom.Rectangle(b.x + 2, b.bottom - 10, b.width - 4, 10);
  }

  override absorbs(): boolean {
    return false;
  }

  onElementHit(): void {}

  setPressed(pressed: boolean): void {
    if (this.pressed === pressed) return;
    this.pressed = pressed;
    this.sprite.setFrame(pressed ? 'pressure_plate_down_000' : 'pressure_plate_up_000');
    this.host.onChanged();
  }
}

/** ประตู: เปิดเมื่อตัวกระตุ้นที่ผูกไว้ทำงานครบ ปิดกลับถ้าตัวกระตุ้นหยุด (เช่นยกของออกจากแผ่นกด) */
export class Gate extends PuzzleObject {
  readonly group = 'solid';
  triggers: Trigger[] = [];
  private open = false;

  constructor(host: PuzzleHost, o: LevelObject) {
    super(host, 'gate', o.col, o.row, 'gate_door_closed_000');
  }

  get isOpen(): boolean {
    return this.open;
  }

  onElementHit(): void {}

  /** ปิดประตูได้เฉพาะตอนไม่มีอะไรขวางอยู่ */
  setOpen(open: boolean, blocked: boolean): void {
    if (this.open === open) return;
    if (!open && blocked) return;
    this.open = open;
    if (open) {
      this.setBodyEnabled(false);
      this.sprite.play(objAnim('gate_door_open'));
    } else {
      this.setBodyEnabled(true);
      this.sprite.stop();
      this.sprite.setFrame('gate_door_closed_000');
    }
  }
}
