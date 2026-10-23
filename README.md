# Elemental Spirit (working title)

เกม 2D action platformer แนว side-scrolling แบบ pixel art 16-bit เล่นบน browser บน desktop
Aclaire ตะลุยด่านจนถึงเส้นชัย โดยใช้พลังจากภูต 4 ธาตุ ได้แก่ Burnil (ไฟ), Wata (น้ำ), Valvaliz (ลม) และ Eathy (ดิน)

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

เปิด `http://localhost:5173/?debug` เพื่อดู hitbox ของ physics

## สถานะ: Phase 1 · Core Prototype

ด่าน graybox ทดสอบ: เดิน, กระโดดแบบกดค้าง (coyote time + jump buffer), ฟันดาบ 3 จังหวะ, HP 5 ช่อง, 3 ชีวิต, checkpoint, หนาม, หลุม, Moss Slime, เหรียญ, Heart Fruit, เส้นชัย, Pause และ Game Over / Continue

| ปุ่ม | Action |
| --- | --- |
| A / D หรือ ← / → | เดิน |
| Space | กระโดด (กดค้างกระโดดสูงขึ้น) |
| J | ฟันดาบ (กดต่อเนื่องเป็น combo 3 จังหวะ) |
| Esc | Pause |

ภาพทั้งหมดตอนนี้เป็น placeholder ที่สร้างขณะรัน เมื่อ Codex วางไฟล์จริงตาม `ART_HANDOFF.md` เกมจะใช้ไฟล์จริงทันที
