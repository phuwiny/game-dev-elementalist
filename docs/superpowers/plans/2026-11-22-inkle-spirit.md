# Inkle Spirit (งานศิลป์วันเกิด) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เขียน character sheet ของภูต Inkle และสั่งงาน concept art ให้ Codex โดยไม่แตะระบบเกม

**Architecture:** เอกสารล้วน 3 ไฟล์ ไม่มีโค้ด ไม่มี test ใหม่

**Tech Stack:** Markdown (UTF-8 ไม่มี BOM, LF)

**Spec:** `docs/superpowers/specs/2026-11-22-inkle-spirit-design.md`

## Global Constraints

- ห้ามแตะ `public/assets/`, `src/`, master palette (หัวข้อ 2 ของ `ART_HANDOFF.md`), ระบบ 4 ธาตุ
- Palette ที่เสนอ: `#3b1f5e` / `#6b3fa0` / `#9b6fd0` / `#d2b8f0`, ทอง `#ffd36b`, รอยสี `#e8572a` `#2f9ed9` `#48c9a0` `#a8772f`
- ภาพของผู้ใช้: `art/reference/spirit_ink_inkle.jpg` · concept ของ Codex: `art/concept/2026-11-22_inkle_concept_source.png`

## Review Focus

- Codex อ่านหัวข้อ 8.2 แล้วไม่ควรเข้าใจผิดว่าต้องทำ sprite/atlas ลง `public/assets/`
- ถ้าภาพผู้ใช้มีก่อน Codex ต้องยึดภาพนั้น

---

### Task 1: Character sheet

**Files:** Create `docs/spirits/inkle.md`

- [ ] เขียนหัวข้อ: ภาพรวม, ลักษณะ/สัดส่วน, palette (ตาราง hex + หน้าที่), นิสัย, idle, expression 3 แบบ (ปกติ / ตั้งใจวาด / ดีใจ), เทียบขนาดกับภูตเดิม, easter egg (ยังไม่ทำ), ไฟล์ภาพที่เกี่ยวข้อง
- [ ] ตรวจ: `file docs/spirits/inkle.md` ต้องไม่มี BOM และไม่มี CRLF

### Task 2: สั่งงาน Codex + STATUS

**Files:** Modify `ART_HANDOFF.md` (เพิ่ม 8.2 ต่อท้าย 8.1), `docs/STATUS.md` (งานถัดไปฝั่ง Codex)

- [ ] เพิ่มหัวข้อ 8.2: ไฟล์ส่ง, ขนาดอย่างน้อย 1024×1024, เนื้อหาเหมือน `spirits_sheet.png` สำหรับ 1 ตน (เต็มตัว + expression 3 แบบ + pixel study 64×64), อ้าง character sheet, ห้ามลง `public/assets/`
- [ ] เพิ่มข้อ 3 ใน "งานถัดไป ฝั่ง Codex" ของ STATUS
- [ ] รัน `npm run check` ให้ผ่าน แล้ว commit + push
