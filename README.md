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

## สถานะ: Phase 2 · Element System

หน้า Title เลือกด่านทดสอบได้ (ปุ่ม 1–2 หรือลูกศรขึ้น/ลง แล้วกด Enter)

| ด่าน | ทดสอบอะไร |
| --- | --- |
| Graybox (Phase 1) | เดิน, กระโดด, ฟันดาบ, HP, ชีวิต, checkpoint, หนาม, หลุม |
| Elements Lab (Phase 2) | เก็บภูตทีละตนแล้วผ่านห้องไฟ → น้ำ → ลม → ดิน → ห้องผสม |

| ปุ่ม | Action |
| --- | --- |
| A / D หรือ ← / → | เดิน |
| Space | กระโดด (กดค้างสูงขึ้น, กดกลางอากาศ = double jump หลังได้ Valvaliz) |
| J | ฟันดาบ (combo 3 จังหวะ) |
| K | ใช้พลังธาตุที่เลือก |
| Q / E | สลับธาตุ วนซ้าย / ขวา |
| 1 / 2 / 3 / 4 | เลือก ไฟ / น้ำ / ลม / ดิน |
| Esc | Pause |

| ธาตุ | K บนพื้น | K กลางอากาศ |
| --- | --- | --- |
| Burnil (ไฟ) | ยิง fireball | ยิง fireball |
| Wata (น้ำ) | ปล่อยฟองน้ำ | ปล่อยฟองน้ำ |
| Valvaliz (ลม) | คลื่นลม | air dash, กดค้างตอนตก = glide |
| Eathy (ดิน) | สร้างบล็อกหิน | ground slam |

ตัวช่วยระหว่างพัฒนา: เติม `?unlock` ท้าย URL เพื่อได้ภูตครบ 4 ตนตั้งแต่เริ่ม และ `?debug` เพื่อดู hitbox

ภาพทั้งหมดตอนนี้เป็น placeholder ที่สร้างขณะรัน เมื่อ Codex วางไฟล์จริงตาม `ART_HANDOFF.md` เกมจะใช้ไฟล์จริงทันที
