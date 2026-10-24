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
  /** กระโดดสูงสุด v²/2g ≈ 66 px (~4 ช่อง) ตัวละครในด่านสูง ~41 px */
  jumpVelocity: 380,
  /** ปล่อยปุ่มกระโดดก่อนถึงจุดสูงสุด ความเร็วขาขึ้นจะถูกคูณด้วยค่านี้ */
  jumpCutMultiplier: 0.45,
  maxFallSpeed: 520,

  coyoteTimeMs: 100,
  jumpBufferMs: 100,

  /** hitbox ตัวละคร px ในด่าน (ภาพ V4 ในด่าน 32×42.7, ผมและหางม้าเกิน hitbox ได้) */
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
    /** กดค้าง K บนพื้นนานเท่านี้ = ยกโล่หิน (ปล่อยก่อน = สร้างบล็อก) */
    shieldHoldMs: 250,
    shieldCostPerSecond: 15,
    shieldMoveFactor: 0.5,
  },
} as const;

export const BossBalance = {
  brambleKing: {
    hpPerPhase: 4,
    shields: [1, 2, 3],
    attackIntervalMs: [3000, 2400, 1900],
    exposedMs: 4500,
    whipTelegraphMs: 700,
    whipSpeed: 420,
    whipHeight: 14,
    seedsPerVolley: [0, 3, 5],
    seedTelegraphMs: 650,
    seedFallSpeed: 260,
    contactDamage: 1,
    /** ระยะห่างจากผู้เล่นที่ทำให้สนามปิดและเริ่มสู้ (px หลังผ่านประตูสนาม) */
    startOffset: 24,
  },
} as const;

/** Leaf Wisp (ลม) และ Thorn Beetle (ดิน) GDD หัวข้อ 5 */
export const W1EnemyBalance = {
  leafWisp: { hp: 1, contactDamage: 1, patrolSpeed: 40, patrolRange: 48, waveAmplitude: 10, diveRange: 96, diveSpeed: 170, diveCooldownMs: 1800, diveTimeoutMs: 1200 },
  thornBeetle: { hp: 3, contactDamage: 1, speed: 28, flippedMs: 4000 },
} as const;
