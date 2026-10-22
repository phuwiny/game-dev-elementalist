/**
 * ธาตุและวงจรแพ้ทาง (GDD หัวข้อ 3)
 * น้ำ ชนะ ไฟ, ไฟ ชนะ ลม, ลม ชนะ ดิน, ดิน ชนะ น้ำ
 */

export enum ElementType {
  Fire = 'fire',
  Water = 'water',
  Wind = 'wind',
  Earth = 'earth',
}

export interface IElementReactive {
  onElementHit(element: ElementType, power: number): void;
}

const BEATS: Record<ElementType, ElementType> = {
  [ElementType.Water]: ElementType.Fire,
  [ElementType.Fire]: ElementType.Wind,
  [ElementType.Wind]: ElementType.Earth,
  [ElementType.Earth]: ElementType.Water,
};

export const ADVANTAGE_MULTIPLIER = 2;
export const DISADVANTAGE_MULTIPLIER = 0.5;

/**
 * ตัวคูณ damage เมื่อโจมตีด้วยธาตุ attack ใส่เป้าธาตุ defend
 * null = การโจมตีปกติหรือเป้าไม่มีธาตุ
 */
export function damageMultiplier(attack: ElementType | null, defend: ElementType | null): number {
  if (attack === null || defend === null || attack === defend) return 1;
  if (BEATS[attack] === defend) return ADVANTAGE_MULTIPLIER;
  if (BEATS[defend] === attack) return DISADVANTAGE_MULTIPLIER;
  return 1;
}
