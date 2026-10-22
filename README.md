# Elemental Spirit (working title)

เกม 2D action platformer แนว side-scrolling แบบ pixel art 16-bit เล่นบน browser บน desktop
Aclaire ตะลุยด่านจนถึงเส้นชัย โดยใช้พลังจากภูต 4 ธาตุ ได้แก่ Ignis (ไฟ), Wata (น้ำ), Valvaliz (ลม) และ Eathy (ดิน)

## เอกสาร

| ไฟล์ | เนื้อหา |
| --- | --- |
| `docs/GDD.md` | Game Design Document |
| `ART_HANDOFF.md` | สเปกงานภาพ และสัญญาระหว่างโค้ดกับ asset |
| `AGENTS.md` | กติกาการทำงานของ Codex (งานภาพ) |
| `CLAUDE.md` | กติกาการทำงานของ Claude (ระบบเกม) |
| `art/reference/` | ภาพต้นแบบตัวละคร |

## การแบ่งงาน

| ฝั่ง | รับผิดชอบ | โฟลเดอร์หลัก | Branch |
| --- | --- | --- | --- |
| Claude | ระบบเกม, โค้ด, ด่าน | `src/`, `tests/`, `public/assets/maps/` | `feat/*`, `fix/*` |
| Codex | Concept art, sprite, tileset, background, UI | `art/`, `public/assets/` | `art/phase-*` |

ทั้งสองฝั่งส่งงานผ่าน Pull Request เข้า `main`

## การรันเกม

ต้องใช้ Node.js 20 ขึ้นไป

```bash
npm install
npm run dev      # เปิด dev server
npm run check    # typecheck + test + build
npm run build    # build เป็น static files ใน dist/
```
