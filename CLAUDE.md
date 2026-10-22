# CLAUDE.md — กติกาสำหรับ Claude

Repo นี้คือเกม **Elemental Spirit** (2D action platformer, pixel art 16-bit) บน browser desktop

- **Claude:** ระบบเกมและโค้ดทั้งหมด
- **Codex:** concept art และ visual asset ทั้งหมด (กติกาของ Codex อยู่ใน `AGENTS.md`)

## เอกสารอ้างอิง

- `docs/GDD.md` — game design ทั้งหมด
- `ART_HANDOFF.md` — สัญญาระหว่างโค้ดกับ asset (path, ขนาด frame, ชื่อ frame, animation) โค้ดต้องโหลด asset ตามเอกสารนี้

## ขอบเขตที่แก้ไขได้

| แก้ได้ | ห้ามแก้ |
| --- | --- |
| `src/`, `tests/`, `docs/` | `art/` ทั้งหมด |
| `public/assets/maps/`, `public/assets/audio/` | `public/assets/` ส่วนอื่น (ของ Codex) |
| config ของโปรเจกต์ (`package.json`, `tsconfig.json`, `vite.config.ts`, ...) | `tools/art/`, `tools/validate_assets.py` |
| `ART_HANDOFF.md`, `AGENTS.md`, `CLAUDE.md`, `README.md` (เมื่อผู้ใช้ขอ) | |

## Stack

- Phaser 4, TypeScript (strict), Vite, Vitest
- ความละเอียดฐาน 640×360, pixelArt, Arcade Physics, tile 16×16
- ค่าตัวเลขที่ใช้ปรับสมดุลเกมทั้งหมดอยู่ใน `src/config/balance.ts` ห้าม hard-code ในที่อื่น
- Logic ที่ไม่ต้องใช้ Phaser อยู่ใน `src/core/` และต้องมี unit test ใน `tests/`

## Asset contract

- Path และ key ของ asset ทั้งหมดประกาศใน `src/assets/manifest.ts` ที่เดียว
- ถ้าไฟล์จริงยังไม่มี `src/assets/placeholders.ts` จะสร้าง texture แทนโดยใช้ชื่อ frame และขนาดตาม `ART_HANDOFF.md` เพื่อให้วางไฟล์จริงแทนได้โดยไม่ต้องแก้โค้ด
- เมื่อเปลี่ยนสเปก asset ต้องแก้ทั้ง `ART_HANDOFF.md` และ `manifest.ts` ใน PR เดียวกัน

## วิธีทำงาน

- Branch: `feat/<ชื่อ>`, `fix/<ชื่อ>`, `docs/<ชื่อ>` แล้วเปิด PR เข้า `main`
- Commit message ใช้ Conventional Commits
- ก่อนเปิด PR ต้องรัน `npm run check` (typecheck + lint ของ TS + test + build) ให้ผ่าน
- งานใหญ่หลายขั้นตอน ให้อธิบายแผนและรอผู้ใช้ยืนยันก่อนเริ่ม
- เอกสารเขียนเป็นภาษาไทย คงศัพท์เทคนิคและชื่อในโค้ดเป็นภาษาอังกฤษ
- ไฟล์ข้อความทั้งหมดเป็น UTF-8 **ไม่มี BOM** และ LF เพราะ BOM ทำให้ `JSON.parse` และ tooling ฝั่ง web ทำงานผิด
