/**
 * อ่าน/เขียน localStorage อย่างปลอดภัย (GDD หัวข้อ 8)
 * บาง browser หรือโหมด private บล็อก localStorage หรือ throw ตอนเข้าถึง
 * ถ้าใช้ไม่ได้ เกมต้องเล่นต่อได้ตามปกติ
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PREFIX = 'elemental-spirit:';

export class SaveStore {
  private readonly storage: KeyValueStorage | null;

  constructor(storageProvider: () => KeyValueStorage | null = defaultStorage) {
    let storage: KeyValueStorage | null = null;
    try {
      storage = storageProvider();
    } catch {
      storage = null;
    }
    this.storage = storage;
  }

  get available(): boolean {
    return this.storage !== null;
  }

  load<T>(key: string, fallback: T): T {
    if (!this.storage) return fallback;
    try {
      const raw = this.storage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** คืนค่า false ถ้าบันทึกไม่สำเร็จ */
  save<T>(key: string, value: T): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
