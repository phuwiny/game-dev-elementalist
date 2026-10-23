/**
 * Coyote time และ jump buffer (GDD หัวข้อ 2)
 *
 * - Coyote time: เดินตกขอบแล้วยังกดกระโดดได้ภายในเวลาที่กำหนด
 * - Jump buffer: กดกระโดดก่อนแตะพื้นเล็กน้อย จะกระโดดทันทีที่แตะพื้น
 */
export class JumpAssist {
  private sinceGroundedMs = Number.POSITIVE_INFINITY;
  private sincePressedMs = Number.POSITIVE_INFINITY;

  constructor(
    private readonly coyoteTimeMs: number,
    private readonly jumpBufferMs: number,
  ) {}

  /** เรียกทุก frame */
  update(deltaMs: number, grounded: boolean): void {
    this.sinceGroundedMs = grounded ? 0 : this.sinceGroundedMs + deltaMs;
    this.sincePressedMs += deltaMs;
  }

  /** ยังกระโดดจากพื้นได้ (อยู่บนพื้นหรืออยู่ในช่วง coyote time) */
  get canGroundJump(): boolean {
    return this.sinceGroundedMs <= this.coyoteTimeMs;
  }

  /** ล้างการกดที่ค้างไว้ (เช่น เมื่อใช้กดนั้นเป็น double jump ไปแล้ว) */
  clearPress(): void {
    this.sincePressedMs = Number.POSITIVE_INFINITY;
  }

  /** เรียกเมื่อผู้เล่นเพิ่งกดปุ่มกระโดด */
  press(): void {
    this.sincePressedMs = 0;
  }

  /** คืนค่า true ถ้าควรกระโดดใน frame นี้ แล้วล้างสถานะเพื่อไม่ให้กระโดดซ้ำ */
  consume(): boolean {
    const canUseGround = this.sinceGroundedMs <= this.coyoteTimeMs;
    const hasBufferedPress = this.sincePressedMs <= this.jumpBufferMs;
    if (canUseGround && hasBufferedPress) {
      this.sinceGroundedMs = Number.POSITIVE_INFINITY;
      this.sincePressedMs = Number.POSITIVE_INFINITY;
      return true;
    }
    return false;
  }
}
