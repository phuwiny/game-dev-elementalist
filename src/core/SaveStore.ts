/**
 * อ่าน/เขียน localStorage อย่างปลอดภัย (GDD หัวข้อ 8)
 * บาง browser หรือโหมด private บล็อก localStorage หรือ throw ตอนเข้าถึง
 * ถ้าใช้ไม่ได้ เกมต้องเล่นต่อได้ตามปกติ
 */

import { SaveStatus, saveStatus } from './SaveStatus';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PREFIX = 'elemental-spirit:';

export class SaveStore {
  private readonly storage: KeyValueStorage | null;

  constructor(
    storageProvider: () => KeyValueStorage | null = defaultStorage,
    private readonly status: SaveStatus = saveStatus,
  ) {
    let storage: KeyValueStorage | null = null;
    try {
      storage = storageProvider();
    } catch {
      storage = null;
    }
    this.storage = storage;
    // ใช้ storage ไม่ได้เลย: แจ้งตั้งแต่เริ่มเกม ไม่ต้องรอให้ผู้เล่นเสียความคืบหน้าก่อน
    if (!storage) status.report(false);
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

  /** คืนค่า false ถ้าบันทึกไม่สำเร็จ (และรายงานผลไปที่ SaveStatus) */
  save<T>(key: string, value: T): boolean {
    let ok = false;
    if (this.storage) {
      try {
        this.storage.setItem(PREFIX + key, JSON.stringify(value));
        ok = true;
      } catch {
        ok = false;
      }
    }
    this.status.report(ok);
    return ok;
  }
}

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
