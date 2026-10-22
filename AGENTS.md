# AGENTS.md — กติกาสำหรับ Codex

Repo นี้คือเกม **Elemental Spirit** (2D action platformer, pixel art 16-bit, Phaser 4 + TypeScript) งานแบ่งเป็นสองฝั่ง:

- **Codex (คุณ):** concept art และ visual asset ทั้งหมด
- **Claude:** ระบบเกมและโค้ดทั้งหมด

## เอกสารที่ต้องอ่านก่อนเริ่มทุกครั้ง

1. `ART_HANDOFF.md` — สเปกงานของคุณ (ขนาด, palette, naming, รายการ asset, phase, acceptance criteria) **เอกสารนี้คือคำสั่งหลัก**
2. `docs/GDD.md` — รายละเอียด gameplay ใช้เพื่อเข้าใจบริบท
3. `art/reference/` — ภาพต้นแบบของผู้ใช้ ยึดดีไซน์ตามภาพเหล่านี้

## ขอบเขตที่แก้ไขได้

| แก้ได้ | ห้ามแก้ |
| --- | --- |
| `art/` (ยกเว้น `art/reference/`) | `art/reference/` (อ่านอย่างเดียว) |
| `public/assets/` (ยกเว้น `maps/`, `audio/`) | `public/assets/maps/`, `public/assets/audio/` |
| `tools/art/`, `tools/validate_assets.py` | `src/`, `tests/`, `docs/` |
| | `package.json`, `tsconfig.json`, `vite.config.ts` และไฟล์ config อื่น |
| | `ART_HANDOFF.md`, `AGENTS.md`, `CLAUDE.md` |

ถ้าต้องการให้แก้สิ่งที่อยู่นอกขอบเขต (เช่น path ใน `src/assets/manifest.ts` ไม่ตรงกับสเปก) ให้เขียนในรายงานส่งงาน อย่าแก้เอง

## วิธีทำงาน

- ทำงานบน branch `art/phase-<x>` เช่น `art/phase-a` แล้วเปิด Pull Request เข้า `main`
- 1 PR ต่อ 1 phase (Phase D แยก PR ต่อโลกได้)
- หยุดหลังจบแต่ละ phase และเขียนรายงานที่ `art/reports/phase_<x>.md` ตามหัวข้อ 10 ของ `ART_HANDOFF.md`
- **หลัง Phase A ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase B**
- Commit message ใช้รูปแบบ Conventional Commits เช่น `art(player): add idle and run frames`

## ก่อนเปิด PR

```bash
python3 tools/validate_assets.py   # ต้องจบด้วย exit code 0
npm run dev                        # เปิดเกมดูว่า asset แสดงถูกต้อง (ถ้าติดตั้ง Node แล้ว)
```

- ไฟล์ภาพต้องเป็น PNG ตามสเปก ห้าม commit ไฟล์ทำงานขนาดใหญ่ (เช่น .psd) ลงใน `public/assets/`
- ไฟล์ข้อความทั้งหมดเป็น UTF-8 **ไม่มี BOM** และขึ้นบรรทัดแบบ LF (JSON ที่มี BOM ทำให้เกมโหลดไม่ได้)
