/**
 * Master palette ตาม ART_HANDOFF.md หัวข้อ 2 (ใช้กับ placeholder และ UI ที่วาดด้วยโค้ด)
 * ตัวเลขในคอมเมนต์คือ index ใน palette
 */
export const PALETTE = {
  outline: '#0f0b1a', // 0
  neutral1: '#2b2440', // 1
  neutral2: '#4a4466', // 2
  neutral3: '#7b7896', // 3
  neutral4: '#b4b2c9', // 4
  highlight: '#f2efe6', // 5
  wood1: '#5a3a2e', // 6
  wood2: '#9c5f45', // 7
  skin2: '#d99a6c', // 8
  skin3: '#f5d0a9', // 9
  fire1: '#6e1a1a', // 10
  fire2: '#b8321f', // 11
  fire: '#e8572a', // 12 fire identity
  fire3: '#ff9a3c', // 13
  gold: '#ffd36b', // 14
  water1: '#12305a', // 15
  water2: '#1f5f9e', // 16
  water: '#2f9ed9', // 17 water identity
  water3: '#7fd6f5', // 18
  ice: '#d4f4ff', // 19
  wind1: '#12483f', // 20
  wind2: '#1f8a6c', // 21
  wind: '#48c9a0', // 22 wind identity
  wind3: '#a8f0cf', // 23
  earth1: '#3d2a17', // 24
  earth2: '#6e4a26', // 25
  earth: '#a8772f', // 26 earth identity
  earth4: '#d9a94a', // 27
  foliage1: '#1e3d1f', // 28
  foliage2: '#3a6b2e', // 29
  foliage3: '#6fa83c', // 30
  magic: '#6b3fa0', // 31
  pink1: '#8c2a55', // 32
  pink2: '#e0508a', // 33
  pink3: '#ff9ec4', // 34
} as const;

/** แปลง '#rrggbb' เป็นตัวเลขสำหรับ Phaser */
export function hex(color: string): number {
  return Number.parseInt(color.slice(1), 16);
}
