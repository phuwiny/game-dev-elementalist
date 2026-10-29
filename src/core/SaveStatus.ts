/**
 * สถานะการบันทึกล่าสุดของทั้งเกม (GDD หัวข้อ 8): บันทึกไม่ได้เมื่อ localStorage ถูกบล็อก เต็ม หรือ throw
 * SaveStore รายงานผลทุกครั้งที่เขียน ส่วน UI อ่านค่านี้เพื่อแสดงข้อความแจ้งผู้เล่น
 */
export class SaveStatus {
  private _failed = false;
  private readonly listeners = new Set<(failed: boolean) => void>();

  /** true ถ้าการบันทึกครั้งล่าสุดล้มเหลว หรือ browser ไม่ให้ใช้ storage เลย */
  get failed(): boolean {
    return this._failed;
  }

  report(ok: boolean): void {
    const failed = !ok;
    if (failed === this._failed) return;
    this._failed = failed;
    for (const cb of [...this.listeners]) cb(failed);
  }

  /** คืนฟังก์ชันยกเลิกการติดตาม */
  subscribe(cb: (failed: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

/** ตัวกลางที่ SaveStore ทุกตัวในเกมใช้ร่วมกัน */
export const saveStatus = new SaveStatus();
