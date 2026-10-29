import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import type { LevelArt } from '../core/LevelParser';
import { gidToTileId, isFlippedH } from '../core/TiledLevel';

/** depth ของชั้นตกแต่ง (หลัง terrain และหลังตัวละครทุกตัว) */
const DECOR_DEPTH = -1;

function createLayer(scene: Phaser.Scene, art: LevelArt, grid: readonly (readonly number[])[]): Phaser.Tilemaps.TilemapLayer {
  const data = grid.map((row) => row.map((gid) => gidToTileId(gid, art.firstgid)));
  const map = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
  const tileset = map.addTilesetImage(art.tileset, art.tileset, TILE_SIZE, TILE_SIZE, art.margin, art.spacing);
  if (!tileset) throw new Error(`Cannot create tileset "${art.tileset}"`);
  const layer = map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
  if (!layer) throw new Error(`Cannot create tile layer for "${art.tileset}"`);
  grid.forEach((row, r) =>
    row.forEach((gid, c) => {
      if (isFlippedH(gid)) {
        const tile = layer.getTileAt(c, r);
        if (tile) tile.flipX = true;
      }
    }),
  );
  return layer;
}

/**
 * วาด terrain และ decor ของด่าน Tiled ด้วย tileset จริง (ตาม gid ในไฟล์แผนที่)
 * terrain ชนเฉพาะ tile ที่มี property `collides` ส่วน one-way และ hazard แยกไปสร้าง hitbox เอง
 */
export function buildArtTerrain(scene: Phaser.Scene, art: LevelArt): Phaser.Tilemaps.TilemapLayer {
  if (art.decor.some((row) => row.some((gid) => gid !== 0))) {
    createLayer(scene, art, art.decor).setDepth(DECOR_DEPTH);
  }
  const terrain = createLayer(scene, art, art.terrain);
  terrain.setCollision(art.collidingIds);
  return terrain;
}
