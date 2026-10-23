/**
 * ตัวเลขปรับสมดุลเกมทั้งหมดอยู่ที่ไฟล์นี้ที่เดียว (GDD หัวข้อ 2–4)
 * หน่วย: ความเร็ว px/s, ความเร่ง px/s², เวลา ms
 */

export const PlayerBalance = {
  runSpeed: 150,
  groundAccel: 1400,
  groundDecel: 1800,
  airAccel: 900,
  airDecel: 600,

  gravity: 1100,
  jumpVelocity: 380,
  /** ปล่อยปุ่มกระโดดก่อนถึงจุดสูงสุด ความเร็วขาขึ้นจะถูกคูณด้วยค่านี้ */
  jumpCutMultiplier: 0.45,
  maxFallSpeed: 520,

  coyoteTimeMs: 100,
  jumpBufferMs: 100,

  /** hitbox ตัวละคร (เล็กกว่า frame 32×48) */
  bodyWidth: 14,
  bodyHeight: 38,

  hurtKnockbackX: 160,
  hurtKnockbackY: 220,
  hurtStunMs: 300,
  invulnerableMs: 1000,
} as const;

export const AttackBalance = {
  /** combo 3 จังหวะ: ระยะเวลาของแต่ละจังหวะ (ms) */
  stepDurationsMs: [260, 260, 340],
  /** ช่วงที่ hitbox ทำงานภายในแต่ละจังหวะ [เริ่ม, จบ] (ms) */
  activeWindowsMs: [
    [60, 160],
    [60, 160],
    [100, 220],
  ],
  /** กดซ้ำภายในเวลานี้หลังจังหวะก่อนหน้าจบ จะต่อ combo */
  comboWindowMs: 220,
  damage: [1, 1, 2],
  /** ระยะฟันจากกึ่งกลางตัวละคร */
  reach: 30,
  hitboxHeight: 28,
} as const;

export const VitalsBalance = {
  maxHp: 5,
  startLives: 3,
  maxLives: 9,
  coinsPerExtraLife: 100,
} as const;

export const EnergyBalance = {
  max: 100,
  regenPerSecond: 5,
  regenDelayMs: 1500,
  gainOnMeleeHit: 5,
} as const;

export const EnemyBalance = {
  mossSlime: { hp: 1, speed: 35, contactDamage: 1 },
} as const;

/** GDD หัวข้อ 3 */
export const ElementBalance = {
  switchCooldownMs: 250,
  castCooldownMs: 250,
  fire: {
    cost: 20,
    speed: 260,
    damage: 1,
    lifetimeMs: 1200,
    burnMs: 3000,
    burnTickMs: 1000,
    burnDamage: 1,
  },
  water: {
    cost: 25,
    speedX: 130,
    speedY: -90,
    /** แรงโน้มถ่วงสุทธิของฟองน้ำ (ให้ลอยเป็นวิถีโค้งลงช้าๆ) */
    gravity: 450,
    /** ฟองน้ำเด้งไปตามพื้น ชนพื้นครบจำนวนนี้แล้วแตก (ชนกำแพงแตกทันที) */
    maxBounces: 3,
    bounce: 0.6,
    lifetimeMs: 1800,
    freezeMs: 2000,
    /** แช่แข็งผิวน้ำรอบจุดที่โดน ± จำนวนช่อง */
    freezeRadiusTiles: 2,
  },
  wind: {
    gustCost: 15,
    gustWidth: 48,
    gustHeight: 30,
    gustPushX: 280,
    gustPushY: 180,
    dashCost: 15,
    dashSpeed: 330,
    dashMs: 170,
    glideFallSpeed: 45,
    glideCostPerSecond: 20,
    airJumps: 1,
    doubleJumpVelocity: 340,
  },
  earth: {
    blockCost: 30,
    maxBlocks: 2,
    blockSize: 32,
    /** หาพื้นด้านล่างจุดวางบล็อกได้ลึกสุดกี่ช่อง */
    blockDropTiles: 3,
    slamCost: 30,
    slamSpeed: 560,
    slamDamage: 2,
    slamWidth: 96,
    slamHeight: 36,
  },
} as const;
