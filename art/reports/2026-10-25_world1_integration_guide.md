# World 1 art integration guide — 2026-10-25

คู่มือนี้ใช้กับชุดภาพใน PR #9 (`art/phase-c`) และโค้ดเกมบน `main` ณ ตอนตรวจ 2026-10-25 ผู้รับช่วงงานฝั่งเกมคือ Claude; ไฟล์ `src/` และ `public/assets/maps/` ยังไม่ได้แก้ใน PR ภาพ

## ภาพที่ใช้ตรวจ

- ภาพรวม: `art/mockups/2026-10-24_world1_gameplay_mockup.png` และ `2026-10-24_world1_boss_mockup.png` ที่ 640×360
- เฟรม animation: `art/previews/phase_c/2026-10-25_world1_motion_contact.png`
- แผนผัง tile ID: `art/previews/phase_c/2026-10-25_world1_tile_legend.png`
- ตรวจรอยต่อ background: `art/previews/phase_c/2026-10-25_world1_seam_review.png` (เส้นสีส้มคือจุดต่อ)
- วัดกรอบภาพ: `art/previews/phase_c/2026-10-25_world1_frame_metrics.json`
- พรีวิว Phaser: `art/previews/phase_c/2026-10-24_world1_review.html`

## Tileset และ Tiled

ไฟล์ `public/assets/tilesets/tiles_w1_ember_woods.png` เป็น 288×72 px, 64 tile, 16 columns, tile 16×16 px, `margin=1`, `spacing=2` (extrude 1 px ทุกด้าน) ส่วน `.tsx` เก็บชนิด tile ข้างล่าง เมื่อ map JSON ฝัง tileset จะต้องมีค่าเหล่านี้รวมถึง `imagewidth=288`, `imageheight=72`, `tilecount=64`, `columns=16` ตรงกัน

| Tile ID แบบ 0-based | Tiled property | ใช้เป็น |
| --- | --- | --- |
| 0–1 | `collides: true` | ผิวบน 2 ลาย |
| 2–3 | `collides: true` | ดิน fill 2 ลาย |
| 4–5 | `collides: true` | ขอบซ้าย/ขวา |
| 6 | `collides: true` | เพดาน |
| 7–10 | `collides: true` | outer corner บนซ้าย, บนขวา, ล่างซ้าย, ล่างขวา |
| 11–14 | `collides: true` | inner corner บนซ้าย, บนขวา, ล่างซ้าย, ล่างขวา |
| 15 | `collides: true` | ฝาครอบแท่นเดี่ยว |
| 16–18 | `oneWay: true` | แท่นไม้ซ้าย/กลาง/ขวา |
| 19–21 | `hazard: true` | หนาม 2 แบบและหนามไฟ |
| 22–33 | ไม่มี | กำแพงหินชั้นหลัง |
| 34–57 | ไม่มี | ใบไม้ รากไม้ เถาวัลย์ หิน เห็ด ดอกไฟ |
| 58–63 | ไม่มี | ช่องว่างสำรอง ไม่ควรวางลง map |

Tile ID ในตารางคือเลข 0-based ของ atlas; ค่า GID ใน Tiled คือ `firstgid + tile ID` เช่น `firstgid=1` ทำให้ tile 19 เป็น GID 20. อย่านำเลข ID ไปใส่ `terrain.data` ตรง ๆ ถ้า map ใช้ GID ของ Tiled

ไฟล์ map เดิม `w1_1` ถึง `w1_3` ฝัง tileset `graybox` (3 tile) อยู่ การย้ายต้องแก้ทั้งข้อมูล tileset และ GID ใน layer โดยรักษาตำแหน่ง object, checkpoint, boss และกลไกเดิมไว้ แก้ภาพตกแต่งใน layer แยกจาก layer `terrain` เพื่อไม่ให้ decoration มี collision. ถ้าจะอ่าน `.tsx` แยกใน Tiled ให้แน่ใจว่า JSON ที่เกมโหลดมี property ของ tile ฝังอยู่ด้วย เพราะ `parseTiledMap()` ปัจจุบันอ่านเฉพาะ `map.tilesets[].tiles[].properties` ใน JSON

## จุดที่โค้ดเกมยังต้องรองรับ

ตรวจจาก `src/scenes/PreloadScene.ts`, `src/core/TiledLevel.ts`, `src/scenes/GameScene.ts`, `src/entities/enemies/Enemy.ts` และ `LeafWisp.ts` ใน branch นี้:

1. `PreloadScene` ยังสร้างและโหลด `graybox_tiles` เท่านั้น ยังไม่ได้โหลด `tiles_w1_ember_woods.png` หรือ background 4 ชั้น
2. `parseTiledMap()` ยุบ GID ทุกตัวให้เหลือ `Solid`, `Spike` หรือ `Empty`; `oneWay` ใน TSX/JSON ยังถูกมองเป็น `Empty`. `GameScene.buildTerrain()` สร้างภาพจาก 3 graybox tile ใหม่ จึงยังไม่แสดง tile จริง แม้แปลง JSON แล้ว
3. ต้องแยก collision ของ 0–15, one-way ของ 16–18, hazard ของ 19–21 และ decoration/กำแพงชั้นหลังที่ไม่ชนออกจากกัน โดยคงพฤติกรรม gameplay เดิม
4. `Enemy` constructor ตั้ง origin `(0.5, 1)` ให้ทุกตัว แต่ Leaf Wisp ตาม art spec และ pivot ใน atlas ใช้ `(0.5, 0.5)`. ตรวจและตั้ง origin กับตำแหน่ง body เฉพาะ Leaf Wisp หลังปรับ เพื่อไม่ให้ภาพเลื่อนจาก hitbox
5. วาง Bramble King ด้วย origin `(0, 1)` ที่ `left,bottom` ตามโค้ดปัจจุบัน จุดอ่อนอยู่ `x = left+20..64`, สูงจากพื้น 16..68 px; โล่กึ่งกลางที่ `left+6` และแส้แยกเป็น sprite ต่างหาก ตรวจการซ้อนภาพโล่กับจุดอ่อนในเกม เพราะตำแหน่งโล่ในโค้ดอยู่ทางซ้ายของวงจุดอ่อนเป็นส่วนใหญ่
6. Background 4 ภาพขนาด 640×360: `bg_w1_far` ทึบ, `mid`/`near` โปร่งใส และ `bg_w1_boss_far` ทึบ. ชั้น `far/mid/near` สำหรับด่านปกติ; boss far สำหรับสนามบอส. ตั้ง parallax และลองเลื่อนกล้องผ่านขอบ 640 px เพื่อดูรอยต่อจริง

## ตรวจหลังแปลงด่าน

- เปิด `w1_1`, `w1_2`, `w1_3` ที่ 640×360 และเดินผ่านพื้น, หนาม, one-way platform; ตรวจภาพบนพื้นกับ collision ตรงกัน
- วิ่งผ่านตำแหน่ง x=640 และ x=1280 เพื่อดูรอยต่อของ background แต่ละชั้น แล้วถ่ายภาพจุดที่ผิดพร้อมพิกัด x/y ส่งกลับฝั่งภาพ
- ดู Leaf Wisp ตอน fly/dive ว่าจุดกึ่งกลางภาพกับ hitbox อยู่ด้วยกัน และ Thorn Beetle ตอน flipped ว่าไม่ลอยจากพื้น
- ดู Bramble King ตอน `weak_exposed` และโล่ 1–3 ชั้นว่าเห็นจุดอ่อน/สิ่งที่บังชัด รวมทั้งแส้กับเมล็ดหนามตรงพื้นที่อันตราย

## ข้อจำกัดที่พบในการตรวจภาพ

- Validator ตรวจว่าคอลัมน์ซ้ายสุดและขวาสุดของ background ตรงกัน แต่ภาพนิ่งรอบจุดต่อยังเห็นการเปลี่ยนรูปทรงของซากหินและพุ่มไม้บางจุด จึงต้องทดสอบตอนกล้องเลื่อนจริงก่อนรับงาน Phase C
- Bramble King มีรายละเอียดและ contrast สูงกว่าศัตรู 32×32 มาก ภาพ mockup อ่านได้ แต่ความกลมกลืนของสไตล์ต้องให้ Pinz ตัดสินจากพรีวิว 640×360
