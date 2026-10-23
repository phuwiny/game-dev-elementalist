# ART_HANDOFF.md — Elemental Spirit (working title)

เอกสารนี้คือ task spec สำหรับ Codex ในการผลิต **concept art** และ **visual asset ที่ใช้ในเกมจริง** ของเกม 2D action platformer แบบ pixel art 16-bit ที่รันบน browser ด้วย Phaser 4 + TypeScript

แหล่งอ้างอิงด้าน gameplay คือ `docs/GDD.md` เอกสารนี้เป็นแหล่งอ้างอิงหลักด้าน **ขนาด, palette, naming และรูปแบบไฟล์** ถ้าสองเอกสารขัดกันเรื่องภาพ ให้ยึดเอกสารนี้ และแจ้งความขัดแย้งในรายงานส่งงาน

---

## 0. กฎการทำงานของ Codex

1. ทำงานตาม Phase A → E ตามลำดับ **หยุดหลังจบ Phase A** เพื่อรอผู้ใช้อนุมัติ style ก่อนเริ่ม Phase B
2. หลังจบแต่ละ Phase ให้หยุดและส่งรายงานตามหัวข้อ 10 ก่อนเริ่ม Phase ถัดไป
3. แก้ไขได้เฉพาะ `art/`, `public/assets/` (ยกเว้น `public/assets/maps/` และ `public/assets/audio/`) และ `tools/` **ห้ามแก้ `src/`** และไฟล์ config ของโปรเจกต์
4. ห้ามลบหรือเขียนทับไฟล์ที่ผู้ใช้อนุมัติแล้ว ถ้าต้องแก้ ให้สร้างเวอร์ชันใหม่และบอกในรายงาน
5. ห้ามลอกหรืออ้างอิงตัวละคร, sprite หรือ tileset จากเกมหรือแฟรนไชส์ที่มีอยู่จริง ทุกอย่างต้องออกแบบใหม่ ยกเว้นภาพใน `art/reference/` ซึ่งเป็นงานออกแบบของผู้ใช้เองและเป็นต้นแบบที่ต้องยึด
6. Asset ในเกม (`public/assets/`) ต้องผ่าน `tools/validate_assets.py` (หัวข้อ 9) ทุกไฟล์ก่อนส่ง
7. ถ้าข้อมูลในเอกสารไม่พอให้ตัดสินใจ ให้เลือกทางที่สมเหตุสมผลที่สุด บันทึกเป็น "assumption" ในรายงาน และอย่าเดา dimension หรือ naming ที่กำหนดไว้แล้ว
8. `art/reference/` เป็นของผู้ใช้ **อ่านอย่างเดียว ห้ามแก้ ห้ามลบ ห้ามย้าย**
9. ระหว่างที่ยังไม่มีไฟล์จริง โค้ดเกมจะสร้าง placeholder ขณะรัน เมื่อวางไฟล์ตาม path และชื่อในเอกสารนี้ เกมจะใช้ไฟล์จริงทันทีโดยไม่ต้องแก้โค้ด path ที่เกมโหลดอยู่ใน `src/assets/manifest.ts` (อ่านได้ ห้ามแก้) ถ้าเห็นว่า path ไม่ตรงกับเอกสารนี้ ให้แจ้งในรายงาน

### วิธีผลิตงาน
- **Concept art (`art/concept/`)** ใช้ image generation หรือวาดแบบ illustration ได้ ไม่บังคับ pixel และไม่บังคับ palette แต่ต้องใช้โทนสีประจำธาตุตามหัวข้อ 2
- **In-game asset (`public/assets/`)** ต้องเป็น pixel art จริง: ทุก pixel อยู่ใน master palette, ไม่มี anti-aliasing, ไม่มี semi-transparent pixel (alpha เป็น 0 หรือ 255 เท่านั้น)
  - แนะนำให้สร้างด้วยสคริปต์ Python + Pillow ที่วาดแบบ pixel-level และ deterministic เก็บสคริปต์ไว้ใน `tools/art/` เพื่อแก้ไขและ regenerate ได้
  - ถ้าใช้ image generation เป็นจุดเริ่มต้น ต้อง downscale แบบ nearest-neighbor, quantize เข้า palette และเก็บงาน (clean-up) ให้คม จนผ่าน validator

---

## 1. Art Direction

| หัวข้อ | กำหนด |
|---|---|
| สไตล์ | Pixel art 16-bit, แฟนตาซีทั่วไป, สดใสอ่านง่าย ไม่มืดหม่น |
| ความละเอียดฐานของเกม | 640×360 px (scale เป็นจำนวนเต็มใน engine) |
| Tile | 16×16 px |
| ทิศทางแสง | จากซ้ายบน |
| การลงเงา | Cel shading 2–3 ระดับต่อวัสดุ ไม่ใช้ dithering หนัก (dither ได้เฉพาะ background ชั้นไกล) |
| Outline | 1 px ใช้สี `#0f0b1a` หรือเฉดเข้มสุดของ ramp วัสดุนั้น (selective outline) ห้ามใช้ `#000000` |
| ทิศทางตัวละคร | วาดหันขวาเท่านั้น engine จะ flip เอง |
| ความอ่านง่าย | ตัวเอก, ศัตรู และวัตถุที่โต้ตอบได้ ต้องมี contrast สูงกว่า background ชัดเจน background ใช้สีอิ่มตัวต่ำกว่าและสว่าง/มืดน้อยกว่า foreground |

---

## 2. Master Palette (35 สี)

Asset ในเกมทุกไฟล์ใช้ได้เฉพาะสีต่อไปนี้ บันทึกเป็น `art/palette/master_palette.png` (35×1 px) และ `art/palette/master_palette.hex`

สี 32–34 เพิ่มมาเพื่อเสื้อชมพูของ Aclaire ใน Phase A ถ้าเทียบกับภาพ reference แล้วสียังไม่ตรง (เช่น ผมส้ม ถุงเท้าเทาเข้ม เกราะเงิน) ให้เสนอค่า hex ใหม่หรือสีเพิ่มในรายงานได้ แต่ห้ามเปลี่ยนสีประจำธาตุ (12, 17, 22, 26)

ผมของ Aclaire ใช้ fire ramp เหมือนธาตุไฟ ต้องตรวจใน mockup ว่าตัวละครยังแยกจาก effect ไฟได้ชัด ถ้าไม่ชัด ให้เสนอปรับใน Phase A

| # | Hex | กลุ่ม |
|---|---|---|
| 0 | `#0f0b1a` | Outline / เงาเข้มสุด |
| 1 | `#2b2440` | Neutral |
| 2 | `#4a4466` | Neutral |
| 3 | `#7b7896` | Neutral |
| 4 | `#b4b2c9` | Neutral |
| 5 | `#f2efe6` | Highlight |
| 6 | `#5a3a2e` | Skin / Wood |
| 7 | `#9c5f45` | Skin / Wood |
| 8 | `#d99a6c` | Skin |
| 9 | `#f5d0a9` | Skin highlight |
| 10 | `#6e1a1a` | Fire ramp |
| 11 | `#b8321f` | Fire ramp |
| 12 | `#e8572a` | **Fire identity** |
| 13 | `#ff9a3c` | Fire ramp |
| 14 | `#ffd36b` | Fire / Gold highlight |
| 15 | `#12305a` | Water ramp |
| 16 | `#1f5f9e` | Water ramp |
| 17 | `#2f9ed9` | **Water identity** |
| 18 | `#7fd6f5` | Water / Ice |
| 19 | `#d4f4ff` | Ice highlight |
| 20 | `#12483f` | Wind ramp |
| 21 | `#1f8a6c` | Wind ramp |
| 22 | `#48c9a0` | **Wind identity** |
| 23 | `#a8f0cf` | Wind highlight |
| 24 | `#3d2a17` | Earth ramp |
| 25 | `#6e4a26` | Earth ramp |
| 26 | `#a8772f` | **Earth identity** |
| 27 | `#d9a94a` | Earth highlight |
| 28 | `#1e3d1f` | Foliage |
| 29 | `#3a6b2e` | Foliage |
| 30 | `#6fa83c` | Foliage |
| 31 | `#6b3fa0` | Spirit magic / UI accent |
| 32 | `#8c2a55` | Pink ramp (เงาเสื้อ Aclaire) |
| 33 | `#e0508a` | Pink ramp (เสื้อ Aclaire) |
| 34 | `#ff9ec4` | Pink highlight |

**สีประจำธาตุ** (ต้องตรงกันทุกที่: ภูต, FX, ไอคอน HUD, เกราะ Spirit Knight, phase ของบอสสุดท้าย)

| ธาตุ | Identity | Ramp ที่ใช้ |
|---|---|---|
| Fire | `#e8572a` | 10–14 |
| Water | `#2f9ed9` | 15–19 |
| Wind | `#48c9a0` | 20–23 |
| Earth | `#a8772f` | 24–27 |

**ข้อจำกัดต่อไฟล์:** sprite ของตัวละครหรือศัตรู 1 ตัวใช้ไม่เกิน 16 สี, tileset ต่อโลกไม่เกิน 24 สี

**โทนของแต่ละโลก**

| โลก | ชื่อ | โทนหลัก |
|---|---|---|
| 1 | Ember Woods | ป่าใบไม้แดง-ส้มยามเย็น ใช้ fire ramp + foliage + wood |
| 2 | Tidal Caverns | ถ้ำน้ำเงินเข้ม มีจุดเรืองแสงฟ้าและบ่อลาวาส้ม |
| 3 | Sky Cliffs | ฟ้าสว่าง เมฆขาว หน้าผาเขียวมิ้นต์-เทา |
| 4 | Stone Citadel | หินเทา-น้ำตาลอำพัน คูน้ำฟ้า กลไกทองเหลือง |
| 5 | Spirit Sanctum | วิหารลอยฟ้าม่วง `#6b3fa0` ผสมองค์ประกอบของทุกโลก |

---

## 3. Technical Specs (บังคับ)

### 3.1 ขนาด frame

| หมวด | Frame size | หมายเหตุ |
|---|---|---|
| ตัวเอก | 32×48 (ท่าโจมตี 64×48) | ตัวละครสูงประมาณ 40 px |
| ภูต | 32×32 | เผื่อปีกของ Valvaliz และลูกหินที่ลอยรอบ Eathy |
| ศัตรูทั่วไป | 32×32 | ยกเว้นตามตาราง 5 |
| Rock Golemling, Stone Sentinel | 48×48 | |
| Spirit Knight | 32×48 | |
| บอส | 128×128 ถึง 192×192 | ตามตาราง 6 |
| Tile | 16×16 | |
| Projectile ขนาดเล็ก | 12×12 หรือ 16×16 | |

### 3.2 Pivot และการจัดตำแหน่ง
- Origin ของตัวละครและศัตรูทุกตัวคือ **กึ่งกลางล่าง (bottom-center)** ฝ่าเท้าต้องอยู่ที่แถว pixel ล่างสุดของ frame
- ทุก frame ของ animation เดียวกัน ตำแหน่งลำตัวต้องไม่เลื่อนซ้ายขวาโดยไม่ตั้งใจ (ไม่ jitter)
- เอฟเฟกต์ที่ยื่นออกนอก frame เช่นแนวฟันของดาบ ให้แยกเป็น FX sprite ห้ามขยาย frame ของตัวละครเกินที่กำหนดในหัวข้อ 5
- ศัตรูบินและภูตใช้ origin กึ่งกลาง (center)

### 3.3 ไฟล์และ Atlas
- รูปแบบภาพ: PNG 32-bit RGBA, พื้นหลังโปร่งใส, alpha เป็น 0 หรือ 255 เท่านั้น
- Sprite รวมเป็น texture atlas: `<atlas_name>.png` + `<atlas_name>.json` รูปแบบ **Phaser JSON Hash** (โครงสร้างเดียวกับ TexturePacker "JSON (Hash)")
- ขนาด atlas สูงสุด 2048×2048, padding ระหว่าง frame 2 px, ห้าม trim, ห้าม rotate
- เขียนสคริปต์ `tools/art/pack_atlas.py` เพื่อ pack จาก frame แยกใน `art/frames/<atlas_name>/` ให้ regenerate ได้

### 3.4 Tileset
- 1 tileset ต่อโลก กว้าง 16 tile ต่อแถว
- **Extrude 1 px รอบทุก tile** (margin 1, spacing 2) เพื่อกันเส้นรอยต่อตอน scale ใน Phaser
- ให้ไฟล์ `.tsx` สำหรับ Tiled คู่กับ PNG และกำหนด custom property `collides: true` ให้ tile ที่เป็น terrain แข็ง, `oneWay: true` ให้ one-way platform, `hazard: true` ให้หนาม/ลาวา
- ไม่มีทางลาด (slope) เพราะใช้ Arcade Physics

### 3.5 Background
- Parallax 3 ชั้นต่อโลก: `far`, `mid`, `near`
- แต่ละชั้น 640×360 px และ **ต่อกันได้แนวนอนแบบไร้รอยต่อ** (tileable horizontally)
- ชั้น `far` ทึบทั้งภาพ ส่วน `mid` และ `near` มีพื้นที่โปร่งใส

### 3.6 Naming Convention
- ไฟล์และโฟลเดอร์: `snake_case` ภาษาอังกฤษเท่านั้น
- ชื่อ frame ใน atlas: `<anim>_<NNN>` เช่น `run_000`, `run_001` (เลข 3 หลักเริ่มที่ 000)
- Animation key ที่ใช้ในเกม: `<atlas>_<anim>` เช่น `player_run`, `enemies_w1_moss_slime_move`
- ใน atlas ที่รวมหลายตัว ใส่ชื่อตัวไว้หน้า anim: `moss_slime_move_000`
- Asset ที่มีหลายสถานะ (ตารางที่เขียนว่า "idle 1, burn 6" เป็นต้น) ตั้งชื่อ anim เป็น `<asset>_<state>` และชื่อ frame เป็น `<asset>_<state>_<NNN>` แม้มี frame เดียวก็ต้องมี `_000` เช่น `torch_unlit_000`, `torch_lit_000`…`torch_lit_003`, `earth_block_idle_000`, `freeze_shatter_004`
- ภูตใน atlas `spirits` ใช้ชื่อภูตเป็น prefix: `burnil_idle_000`, `wata_cast_000` ส่วน icon ไม่มีเลข: `burnil_icon`
- Frame นิ่งใน atlas `ui` ไม่มีเลขต่อท้าย ใช้ `<element>_<state>` เช่น `heart_full`, `heart_empty`, `energy_bar_fill_normal`, `element_icon_fire_locked` ส่วน element ที่มีสถานะเดียวใช้ชื่อ element ตรงๆ เช่น `energy_bar_frame`, `lives_icon`
- รายชื่อ frame ที่เกมใช้อยู่ตอนนี้ดูได้ที่ `src/assets/manifest.ts` (เพิ่มตามแต่ละ phase ของการพัฒนา) asset ที่มีมากกว่าในไฟล์นั้นไม่ทำให้เกมพัง

### 3.7 Animation Manifest
ทุก atlas ต้องมีรายการ animation ใน `public/assets/animations.json` เพื่อให้โค้ดสร้าง animation อัตโนมัติ

```json
{
  "player_run": { "atlas": "player", "prefix": "run_", "frames": 8, "frameRate": 12, "repeat": -1 },
  "player_attack_1": { "atlas": "player", "prefix": "attack_1_", "frames": 4, "frameRate": 16, "repeat": 0 }
}
```

`repeat: -1` = loop, `0` = เล่นครั้งเดียว

---

## 4. โครงสร้างโฟลเดอร์

```
art/
  palette/         master_palette.png, master_palette.hex
  concept/         concept art ทั้งหมด (ไม่ถูกโหลดในเกม)
  frames/          frame แยกก่อน pack แบ่งโฟลเดอร์ตาม atlas
  previews/        contact sheet และ GIF ตัวอย่าง animation สำหรับรีวิว
  mockups/         ภาพจำลองหน้าจอเกม 640x360
tools/
  art/             สคริปต์สร้าง sprite, pack_atlas.py
  validate_assets.py
public/assets/
  sprites/
    player/        player.png, player.json
    spirits/       spirits.png, spirits.json
    fx/            fx.png, fx.json
    objects/       objects.png, objects.json
    items/         items.png, items.json
    enemies/       enemies_w1.png/.json ... enemies_w5.png/.json
    bosses/        boss_bramble_king.png/.json ... boss_hollow_warden.png/.json
  tilesets/        tiles_w1_ember_woods.png/.tsx ... tiles_w5_spirit_sanctum.png/.tsx
  backgrounds/
    w1/            bg_w1_far.png, bg_w1_mid.png, bg_w1_near.png
    ... w5/
  ui/              ui.png, ui.json, font_hud.png, font_hud.xml
  animations.json
  maps/            (ผู้พัฒนาดูแล ห้ามแก้)
  audio/           (ไม่อยู่ในขอบเขต ห้ามแก้)
```

---

## 5. Asset List — ตัวละครหลัก, ศัตรู, FX, วัตถุ

ตัวเลขในวงเล็บ = จำนวน frame, ค่า fps เป็นค่าแนะนำ

### 5.1 ตัวเอก Aclaire — atlas `player` (32×48, ท่าโจมตี 64×48)
**ภาพต้นแบบ (ดีไซน์ v2 ใช้ภาพนี้เป็นหลัก ถ้าภาพไม่ตรงกัน ให้ยึดภาพนี้)**

| ไฟล์ใน `art/reference/` | ใช้ทำอะไร |
|---|---|
| `aclaire_character_sheet_v2.png` | **ต้นแบบหลัก** มีมุม front / side / back, portrait และ sprite ตัวอย่าง 6 ท่าในแถว GAME REFERENCE (idle, blink, run, run, jump, fall) |
| `aclaire_expressions_v2.png` | สีหน้า 12 แบบ (happy, laughing, wink, confident, surprised, determined, angry, worried, sad, embarrassed, curious, relieved) ใช้เป็นแนวทางสีหน้าใน sprite และ concept art |
| `aclaire_prompt_v2.txt` | คำอธิบายดีไซน์ v2 ฉบับเต็ม รวมกฎเรื่องแนวดาบ ใช้ประกอบการอ่านภาพ |
| `aclaire_full_mode.jpg` | ภาพวาดมือฉบับแรก ใช้ดูรายละเอียดฝักดาบและสายคาด **ห้ามใช้สีผม** |
| `aclaire_character_sheet.png` | ดีไซน์เก่า (เสื้อยืดลายหัวใจ กางเกงยีนส์) **ห้ามใช้** |

**นิสัยที่ต้องเห็นในท่าทาง:** สดใส เป็นมิตร ขี้เล่น มีพลัง ท่า idle และ run ต้องดูร่าเริง ไม่ขึงขัง

| ส่วน | รายละเอียด | สีใน palette |
|---|---|---|
| ผม | สีส้มสดโทนอุ่น ไฮไลต์ส้มทอง เงาส้มเข้ม มัดหางม้าสูงด้วยยางรัดผมสีชมพู ผมหน้าม้าและปอยข้างฟูยุ่งมีชีวิตชีวา | 11, 12, 13, 14 (ยางรัดผม 33) |
| ตา | สีฟ้าสด โต | 16, 17, 19 |
| เสื้อ | แขนกุดสีชมพู คอตั้ง มีกระดุมที่คอ ไหล่และคอเสื้อยังมองเห็น | 32, 33, 34 |
| เกราะอก | แผ่นเกราะเล็กสีเงิน-เทาบนกลางอกด้านบน ขอบมนผสมเหลี่ยม แบนและเบา ไม่คลุมทั้งตัว ไม่มีเกราะไหล่ ด้านหลังมีแค่สายรัดเล็กๆ ใน pixel art ลดเหลือก้อนสีเงิน 2–3 ระดับ | 3, 4, 5 |
| สายสะพาย | สายหนังสีดำพาดทแยงทับเกราะอก มีหัวเข็มขัดเงิน ใช้แขวนดาบ | 0, 1, 4 |
| เข็มขัด | หนังสีน้ำตาล หัวเข็มขัดธรรมดา | 6, 7 |
| กางเกง | ขาสั้นสีน้ำตาลอ่อน (tan) พับปลายขา | 25, 26, 27 |
| ถุงเท้า | ถุงเท้ายาวสีเทาเข้ม (charcoal) ด้าน ยาวเหนือเข่าเล็กน้อย ยังเห็นต้นขาระหว่างขอบถุงเท้ากับขากางเกง ต้องแยกสีจากบูทได้ชัด | 1, 2 |
| รองเท้า | บูทยาวใต้เข่าสีดำ ขอบบนพับสีขาว พื้นหนาสีขาว | 0, 1, 5 |
| เครื่องประดับ | กำไลสีทองที่ข้อมือ | 14, 27 |
| ดาบ | ดาบใหญ่ 1 เล่มในฝักสะพายหลัง | ดูด้านล่าง |

**ดาบและฝัก:** ปุ่มท้ายด้ามเป็นลูกกลมสีแดง (11, 12), ด้ามจับพันเกลียวสีเหลืองสลับเขียว (14, 29), กันมือสีเหลือง (14, 27), ฝักสีดำล้วนทรงกว้างปลายโค้งไม่มีลาย (0, 1, 2), สายคาดฝักใช้หัวเข็มขัดแบบเข็มขัดทั่วไป

**กฎแนวดาบ (ห้ามผิด):** ปุ่มด้าม ด้าม กันมือ ปากฝัก และตัวฝักต้องอยู่บนแกนตรงเส้นเดียว เป็นของแข็งชิ้นเดียว **ห้ามหักงอ ห้ามด้ามลอยแยก** มีดาบเล่มเดียว ไม่มีผ้าคลุม
- มุมหน้า: ด้ามอยู่เหนือไหล่ขวาของตัวละคร (ฝั่งซ้ายของผู้ชม) ฝักเฉียงลงไปทางสะโพกซ้าย (ฝั่งขวาของผู้ชม)
- มุมหลัง: กลับด้าน ด้ามอยู่ฝั่งขวาของผู้ชม ปลายฝักอยู่ฝั่งซ้าย
- มุมข้าง (sprite ในเกมทุกท่า): ดาบเกือบตั้งตรงอยู่หลังแผ่นหลัง ด้ามโผล่เหนือไหล่ใกล้ท้ายทอย ผมและไหล่บังด้ามบางส่วนได้ ดาบที่ถูกบังแต่ตรงดีกว่าดาบที่เห็นครบแต่งอ เอียงได้เล็กน้อยตามแถว GAME REFERENCE แต่ต้องเป็นเส้นตรงเส้นเดียว

**การใช้ดาบในเกม:** ท่าปกติดาบอยู่ในฝักบนหลัง ท่าโจมตีชักดาบออกมาฟัน (ฝักยังอยู่บนหลัง) แล้วเก็บกลับ ท่าอื่นทั้งหมดดาบอยู่บนหลัง

**สัดส่วน:** chibi ประมาณ 2.5 หัวตามแถว GAME REFERENCE ใน `aclaire_character_sheet_v2.png` ใช้ 6 ท่าในแถวนั้นเป็นแนวทางท่าทางของ idle, blink, run, jump และ fall แต่ต้องวาดใหม่ให้ตรงขนาด 32×48 และ palette ของเอกสารนี้ ข้อความบนภาพ (เช่น "ACTION SIDE-SCROLLER") ไม่ต้องนำมาใช้

**ซิลูเอตที่ต้องอ่านออกแม้เป็นเงาดำ:** หางม้าสูงฟู + ดาบใหญ่บนหลัง + บูทยาว

**จุดที่อ่านต้องออกที่ขนาด 32×48:** ผมส้ม, เสื้อชมพูกับเกราะเงินบนอก, กางเกง tan, ช่วงต้นขาสีผิว → ถุงเท้าเทาเข้ม → บูทดำขอบขาว

**ขนาด frame:** ทุก animation ใช้ 32×48 ยกเว้น `attack_1`, `attack_2`, `attack_3` ใช้ 64×48 เพื่อให้ดาบที่ฟันอยู่ในเฟรม ลำตัวต้องอยู่ตำแหน่งเดียวกับ frame 32×48 คือกึ่งกลางล่างของเฟรม

| Animation | Frames | fps | Loop |
|---|---|---|---|
| idle (มี frame กะพริบตา 1 frame) | 6 | 8 | ✓ |
| run | 8 | 12 | ✓ |
| jump_up | 2 | 10 | |
| jump_peak | 2 | 10 | |
| fall | 2 | 10 | ✓ |
| land | 2 | 14 | |
| double_jump | 4 | 14 | |
| attack_1 (ฟันแนวนอน, 64×48) | 4 | 16 | |
| attack_2 (ฟันเฉียงขึ้น, 64×48) | 4 | 16 | |
| attack_3 (ฟันหนักลงพื้น, 64×48) | 5 | 16 | |
| cast | 4 | 12 | |
| dash | 3 | 16 | |
| glide | 4 | 10 | ✓ |
| ground_slam | 5 | 14 | |
| hurt | 2 | 10 | |
| dead | 6 | 10 | |

### 5.2 ภูต — atlas `spirits` (32×32, origin center)

ต้นแบบของภูตทุกตนอยู่ใน `art/reference/` ให้ยึดรูปร่าง สีหน้า และนิสัยตามภาพ

| ภูต (key) | ธาตุ | ต้นแบบ | รูปลักษณ์ | นิสัยที่ต้องเห็นใน animation |
|---|---|---|---|---|
| Burnil (`burnil`) | Fire | `spirit_fire_burnil.jpg` | ก้อนไฟหนามสีเหลือง-ส้ม-แดง ตาคมรูปหยดน้ำ ยิ้มมีเขี้ยว 2 ซี่ | ใจร้อน บุ่มบ่าม กล้าหาญ: idle กระดุกกระดิกไม่อยู่นิ่ง |
| Wata (`wata`) | Water | `spirit_water_wata.jpg` | ก้อนน้ำทรงสไลม์สีฟ้าอ่อน มีจุกน้ำเล็กบนหัว ตาโตสีน้ำเงิน แก้มแดง ปาก ω | ขี้อ้อน ขี้งอแง ใจดี: idle ยืด-หดตัวเด้งดึ๋ง |
| Valvaliz (`valvaliz`) | Wind | `spirit_wind_valvaliz.jpg` | สาวจิ๋วผมยาวสีเขียว ตาเขียว ปีกขาว 2 คู่ ชุดเดรสแขนกุดสีฟ้าอ่อน ถุงเท้ายาวสีดำ | ขี้อาย ซุ่มซ่าม: idle กระพือปีกช้าๆ ตัวโคลงเล็กน้อย |
| Eathy (`eathy`) | Earth | `spirit_earth_eathy.jpg` | ก้อนกลม ผมสีน้ำตาลเข้ม คาดผ้าขาวที่หน้าผาก ผิวสีส้มพีช คิ้วขมวด มีลูกหินดำลอยรอบตัว | จุกจิกแต่ใจเย็น: idle ลอยนิ่ง ลูกหินหมุนรอบตัว |

Animation ต่อภูต (ชื่อ frame เช่น `burnil_idle_000`)

| Animation | Frames | fps | เนื้อหา |
|---|---|---|---|
| `<key>_idle` | 6 | 8 | loop ตามนิสัยด้านบน |
| `<key>_cast` | 4 | 12 | Burnil ยิงไฟ, Wata พ่นฟองน้ำ, Valvaliz สร้างพายุหมุนเล็ก, Eathy พุ่งโขกหัว |
| `<key>_icon` | 1 | — | หน้าตรง ใช้ในหน้าจอได้รับภูต |

ภูตทั้ง 4 ตนวาดเป็นตัวการ์ตูนกลมๆ ขนาดเล็กกว่า Aclaire ชัดเจน (สูงไม่เกิน 24 px ภายใน frame 32×32 ยกเว้นปีกของ Valvaliz)

### 5.3 FX — atlas `fx`

| FX | Frame size | Frames |
|---|---|---|
| slash_1, slash_2, slash_3 (แนวดาบ) | 32×32 | 3 แต่ละอัน |
| hit_spark | 16×16 | 4 |
| poof (ศัตรูตาย) | 32×32 | 6 |
| fireball (loop) | 16×16 | 4 |
| fire_burst | 32×32 | 6 |
| burn_status (loop) | 16×16 | 4 |
| water_bubble (ฟองน้ำของ Wata, loop) | 16×16 | 4 |
| water_splash (ฟองน้ำแตก) | 32×32 | 5 |
| freeze (ศัตรูถูกแช่แข็ง) | 32×32 | `freeze_overlay` 1, `freeze_shatter` 5 |
| wind_wave | 32×32 | 5 |
| dash_trail | 32×48 | 3 |
| ground_slam_wave | 64×32 | 6 |
| stone_shield (โล่หินของ Eathy ตอนกด K ค้าง ตั้งอยู่หน้าตัวละคร origin กึ่งกลางล่าง) | 16×32 | appear 4, idle 1, break 4 |
| earth_block | 32×32 | appear 4, idle 1, crumble 4 |
| element_switch_aura (4 สีตามธาตุ) | 32×48 | 5 ต่อธาตุ ชื่อ anim `element_switch_aura_fire`, `_water`, `_wind`, `_earth` |
| checkpoint_spark | 16×16 | 5 |

FX ที่ซ้อนบนศัตรูหรือตัวละคร (`freeze_overlay`, `burn_status`) วาดให้ฐานล่างตรงกับเท้า เพราะเกมวาง origin ที่กึ่งกลางล่าง

### 5.4 วัตถุ puzzle — atlas `objects`

| Object | Frame size | Animations |
|---|---|---|
| burnable_vine | 16×16 | idle 1, burn 6 |
| wooden_crate (เผาได้) | 16×16 | idle 1, burn 6 |
| torch | 16×32 | unlit 1, lit 4 (loop) |
| ice_block (ละลายได้) | 16×16 | idle 1, melt 5 |
| water_surface | 16×16 | water 4 (loop), frozen 1 |
| magic_seed (เมล็ด → ต้นที่มีใบให้เหยียบ) | 16×64 | seed 1, grow 8, grown 1 (ใบ 2 ชั้นที่สูง 32 และ 64 px จากพื้น ตรงกับแท่นเหยียบในเกม) |
| windmill | 48×48 | idle 1, spin 8 (loop) |
| cracked_wall | 32×32 | idle 1, break 6 (ในด่านวางซ้อน 2 ชิ้นเป็นกำแพงสูง 64 px ลายร้าวควรต่อกันได้) |
| pressure_plate | 32×8 | up 1, down 1 |
| gate_door | 32×48 | closed 1, open 6 |

### 5.5 Items — atlas `items`

| Item | Frame size | Animations |
|---|---|---|
| coin | 12×12 | spin 6 (loop) |
| heart_fruit | 16×16 | bob 4 (loop) |
| spirit_orb | 16×16 | pulse 4 (loop) |
| oneup_feather | 16×16 | float 4 (loop) |
| spirit_shard | 16×16 | shine 6 (loop) |
| checkpoint_shrine | 32×48 | unlit 1, lighting 6, lit 4 (loop) |
| goal_flag | 32×64 | wave 6 (loop) |

### 5.6 ศัตรู — atlas `enemies_w1` ถึง `enemies_w5`
แต่ละตัวอยู่ใน atlas ของโลกที่ปรากฏครั้งแรก ทุกตัวต้องมี `hurt` (2) และ `death` (5–6)

| ศัตรู | ธาตุ | Atlas | Frame | Animations อื่น | Projectile |
|---|---|---|---|---|---|
| moss_slime | — | enemies_w1 | 32×32 | idle 4, move 6 | |
| leaf_wisp | Wind | enemies_w1 | 32×32 | fly 6, dive 3 | |
| thorn_beetle | Earth | enemies_w1 | 32×32 | walk 6, flipped 4 | |
| magma_newt | Fire | enemies_w2 | 32×32 | idle 4, walk 6, spit 5 | newt_fireball 12×12 (4) |
| cave_bat | Wind | enemies_w2 | 32×32 | hang 2, fly 6 | |
| storm_hawk | Wind | enemies_w3 | 32×32 | fly 6, swoop 3 | |
| rock_golemling | Earth | enemies_w3 | 48×48 | walk 6, slam 6 | shockwave 32×16 (4) |
| tide_crab | Water | enemies_w4 | 32×32 | walk 6, shoot 4 | bubble 12×12 (4) |
| stone_sentinel | Earth | enemies_w4 | 48×48 | idle 4, shoot 5 | rock_bullet 12×12 (2) |
| spirit_knight | สลับ | enemies_w5 | 32×48 | walk 6, attack 5, switch 4 | |

ชื่อ anim ของ enemies_w1 ที่เกมใช้แล้ว (Phase 3): `moss_slime_idle/move/hurt/death`, `leaf_wisp_fly/dive/hurt/death`, `thorn_beetle_walk/flipped/hurt/death` เช่น frame `leaf_wisp_dive_002`, `thorn_beetle_flipped_000`
- Leaf Wisp บินลอย ใช้ origin กึ่งกลาง (หัวข้อ 3.2) ท่า `dive` คือพุ่งเฉียงลงหาผู้เล่น
- Thorn Beetle มีเกราะหนามด้านหน้า (ด้านขวาของภาพ เพราะวาดหันขวา) ให้เห็นชัดว่าด้านหลังไม่มีหนาม เพราะผู้เล่นต้องอ่านออกว่าต้องตีจากด้านหลัง ท่า `flipped` คือหงายท้องดิ้น

Spirit Knight ต้องมี 4 ชุดสีเกราะตามสีประจำธาตุ ตั้งชื่อ frame เป็น `spirit_knight_fire_walk_000` เป็นต้น

---

## 6. Asset List — บอส

| บอส | Atlas | Frame | Animations | ชิ้นส่วนเพิ่ม |
|---|---|---|---|---|
| Bramble King (ต้นไม้ยักษ์มีมงกุฎหนาม) | boss_bramble_king | 192×192 | idle 6, vine_attack 8, roar 6, weak_exposed 4, hurt 2, death 10 | vine_whip 64×16 (6), vine_shield 32×32 (idle 1, burn 6) |
| Magma Serpent (งูลาวา) | boss_magma_serpent | 192×128 | emerge 6, swim 6, spit 6, hurt 2, death 10 | lava_ball 16×16 (4), frozen_lava_platform 48×16 (1) |
| Tempest Roc (นกพายุยักษ์) | boss_tempest_roc | 192×160 | fly 8, dive 4, gust 6, hurt 2, death 10 | storm_feather 16×16 (2) |
| Moat Hydra (ไฮดราน้ำ 3 หัว) | boss_moat_hydra | 128×128 ต่อหัว | rise 6, bite 6, spit 5, sink 6, hurt 2, death 8 | drain_valve 32×32 (closed 1, open 4), water_jet 16×16 (4) |
| Hollow Warden (ผู้พิทักษ์วิหารเปลี่ยนธาตุ) | boss_hollow_warden | 160×192 | idle 6, attack_fire 8, attack_water 8, attack_wind 8, attack_earth 8, transition 8, hurt 2, death 12 | orb ต่อธาตุ 16×16 (4) |

**Bramble King (ใช้ในเกมแล้ว Phase 3)** ทุกชิ้นอยู่ใน atlas `boss_bramble_king` ชื่อ anim:
- ตัวบอส 192×192: `idle`, `vine_attack`, `roar`, `weak_exposed`, `hurt`, `death` (frame เช่น `idle_000`, `death_009`)
- ชิ้นส่วน: `vine_whip` 64×16 (6, loop), `vine_shield_idle` 32×32 (1), `vine_shield_burn` 32×32 (6), `thorn_seed` 16×16 (2, loop) เมล็ดหนามที่ตกจากด้านบนใน phase 2–3
- บอสวางด้วย origin **มุมล่างซ้าย** ของ frame (ไม่ใช่กึ่งกลางล่าง) และหันหน้าไปทางซ้าย (ผู้เล่นเข้ามาจากซ้าย)
- ตำแหน่งในเกมนับจากมุมล่างซ้ายของ frame: จุดอ่อน (ปุ่มไม้/แกนกลางที่เปิดตอน `weak_exposed`) อยู่ที่ x 20–64, สูงจากพื้น 16–68 px ลำต้นที่เป็นกำแพงเริ่มที่ x 60 ไปทางขวา โล่เถาวัลย์ซ้อนกันขึ้นไปที่ x ประมาณ 6 (กึ่งกลางชิ้น) ชิ้นละ 32 px สูงสุด 3 ชั้น แส้เถาวัลย์กวาดไปทางซ้ายติดพื้น ให้วาดหันซ้าย

ลำตัวส่วนที่อยู่ใต้น้ำของ Moat Hydra ให้วาดเป็นส่วนหนึ่งของ background ชั้น `near` ของด่านบอส (`bg_w4_boss_near.png` ขนาด 640×360)

---

## 7. Asset List — Tileset, Background, UI

### 7.1 Tileset ต่อโลก (`tiles_wN_<name>.png`)
แต่ละ tileset ต้องมีอย่างน้อย:
- Terrain set: top, fill, ด้านซ้าย/ขวา, ceiling, outer corner 4, inner corner 4, ปลายแท่นเดี่ยว (รวม ≥ 16 tile) อย่างน้อย 2 รูปแบบ fill ไม่ให้ดูซ้ำ
- One-way platform: ซ้าย, กลาง, ขวา
- Hazard: หนาม 2 แบบ + hazard เฉพาะโลก (ลาวา 4 frame ใน W2, เหวลมในหน้าผา W3 ใช้ background)
- Background wall tiles สำหรับ layer หลัง terrain 8–12 tile
- Decoration 16–24 tile (หญ้า, หิน, เห็ด, ธง, โซ่ ฯลฯ ตามธีม)

| โลก | ไฟล์ | Decoration เฉพาะ |
|---|---|---|
| 1 | tiles_w1_ember_woods | ใบไม้แดง, รากไม้, ซากเสาหิน |

ด่าน 1-1 ถึง 1-3 (`public/assets/maps/w1_*.json` ของฝั่งโค้ด) ตอนนี้อ้างถึง tileset ชั่วคราว `graybox` (3 tile: fill, top, หนาม) เกมอ่านเฉพาะ property `collides` / `hazard` จาก tile เมื่อ `tiles_w1_ember_woods` พร้อม Claude จะเปลี่ยนด่านและการวาดไปใช้ tileset จริง ดังนั้น tileset ต้องกำหนด property ตามหัวข้อ 3.4 ให้ครบ
| 2 | tiles_w2_tidal_caverns | หินงอก, คริสตัลเรืองแสง, บ่อลาวา (animated 4) |
| 3 | tiles_w3_sky_cliffs | สะพานเชือก, ธงผ้า, ก้อนเมฆ one-way |
| 4 | tiles_w4_stone_citadel | อิฐปราการ, เฟือง, โซ่, ธงปราสาท |
| 5 | tiles_w5_spirit_sanctum | เสาวิหาร, รูนเรืองแสง 4 สีธาตุ |

### 7.2 Background
- โลก 1–5: ชั้น `far`, `mid`, `near` ตามหัวข้อ 3.5
- ด่านบอสแต่ละโลกมี `bg_wN_boss_far.png` เพิ่มอีก 1 ชั้น (และ `bg_w4_boss_near.png` สำหรับ Hydra)

### 7.3 UI — atlas `ui`

| Element | ขนาด | สถานะ |
|---|---|---|
| heart | 16×16 | full, empty |
| energy_bar_frame | 96×12 | — |
| energy_bar_fill | 92×8 | normal, flash (กะพริบเมื่อ Energy ไม่พอ) |
| element_icon (fire, water, wind, earth) | 24×24 | normal, locked (เงาเทา) |
| element_slot_select | 28×28 | กรอบเลือก |
| lives_icon | 16×16 | — |
| coin_icon | 12×12 | — |
| boss_bar_frame / boss_bar_fill | 240×12 / 236×8 | — (เกมตัด fill จากซ้ายตาม HP บอส) |
| panel_9slice | 48×48 | ใช้ทำกล่องเมนู ขอบ 16 px |
| button | 96×24 | normal, hover, pressed |
| cursor_arrow | 8×8 | — |
| world_map_node | 16×16 | locked, open, cleared (frame `world_map_node_locked` ฯลฯ เกมขยาย 2 เท่าบนแผนที่โลก) |

**Bitmap font HUD** (`font_hud.png` + `font_hud.xml` รูปแบบ BMFont XML): ตัวเลข 0–9, A–Z, เครื่องหมาย `× : / - + !` ขนาด glyph 8×8

คำถามเปิด: ภาษาของ UI และเมนูยังไม่ได้ตัดสิน ถ้าเป็นภาษาไทยจะใช้ web font ที่รองรับไทยแทน bitmap font ในส่วนเมนู Codex ไม่ต้องทำฟอนต์ไทย

---

## 8. Concept Art (Phase A และ E)

ส่งเป็น PNG ใน `art/concept/` ความละเอียดอย่างน้อย 1920×1080 (หรือ 1024×1024 สำหรับ character sheet)

| ไฟล์ | เนื้อหา |
|---|---|
| style_guide.png | Palette swatch, ตัวอย่าง outline, การลงเงา 3 ระดับ, ทิศแสง, ตัวอย่าง tile 3×3 และตัวเอก 1 frame ที่ขนาดจริงและขยาย ×8 |
| aclaire_pixel_study.png | แปลง Aclaire จาก `aclaire_character_sheet_v2.png` เป็น pixel art 32×48 (idle 1 frame + attack 64×48 1 frame) ที่ขนาดจริงและขยาย ×8 เสนอ 2 แบบที่ต่างกันเรื่องการลดรายละเอียด (โดยเฉพาะเกราะอก ถุงเท้า และแนวดาบ) |
| aclaire_action_poses.png | pose ฟันดาบ 3 จังหวะ และ pose ใช้พลัง 4 ธาตุ (illustration ตามดีไซน์ v2) ไม่ต้องทำ turnaround หรือสีหน้าใหม่ เพราะมีใน reference แล้ว |
| spirits_sheet.png | ภูต 4 ตนตามต้นแบบ พร้อม expression 3 แบบต่อตน และ pixel study 32×32 ต่อตน |
| enemies_lineup.png | ศัตรู 10 ตัว เทียบขนาดกับตัวเอก |
| boss_<name>.png ×5 | บอสแต่ละตัว + ภาพแสดงจุดอ่อน |
| world_wN_keyframe.png ×5 | ภาพบรรยากาศแต่ละโลก + palette strip ของโลกนั้น |
| key_art_title.png (Phase E) | ภาพหน้า title 1920×1080 |

**In-game mockups** (`art/mockups/`): ภาพ 640×360 ที่ประกอบจาก asset จริงในเกม แสดง HUD, ตัวเอก, ศัตรู และ tileset ใช้ตรวจว่าอ่านภาพได้ชัดที่ขนาดจริง ทำ 1 ภาพต่อโลกตั้งแต่ Phase C

---

## 9. Validator และ Acceptance Criteria

Codex ต้องเขียน `tools/validate_assets.py` (Python 3 + Pillow) ที่ตรวจทุกไฟล์ใน `public/assets/` ยกเว้น `maps/` และ `audio/` แล้วออก exit code ≠ 0 เมื่อพบข้อผิดพลาด

**สิ่งที่ validator ต้องตรวจ**
- [ ] ทุก pixel ที่ alpha = 255 เป็นสีใน master palette
- [ ] ไม่มี alpha ระหว่าง 1–254
- [ ] จำนวนสีต่อ sprite ของตัวละครหรือศัตรูไม่เกิน 16, ต่อ tileset ไม่เกิน 24
- [ ] ขนาด frame ตรงตามตารางในหัวข้อ 3.1, 5, 6, 7
- [ ] ชื่อไฟล์และชื่อ frame ตรง naming convention
- [ ] Atlas JSON อ่านได้, ทุก frame อ้างพื้นที่ภายในภาพ, atlas ไม่เกิน 2048×2048
- [ ] ทุก key ใน `animations.json` อ้าง atlas และ frame ที่มีจริง และจำนวน frame ตรง
- [ ] Background ทุกชั้นขนาด 640×360 และขอบซ้าย-ขวาต่อกันได้ (คอลัมน์ pixel ซ้ายสุดและขวาสุดต่อเนื่อง)
- [ ] Tileset กว้าง 16 tile และมี extrude ตามหัวข้อ 3.4

**สิ่งที่ผู้ใช้จะรีวิวด้วยตา**
- [ ] ซิลูเอตของตัวเอกและศัตรูแต่ละตัวแยกออกจากกันได้
- [ ] Animation ไม่ jitter และ loop ต่อเนื่อง (ดูจาก GIF ใน `art/previews/`)
- [ ] สีประจำธาตุถูกต้องและสม่ำเสมอทุก asset
- [ ] Foreground อ่านง่ายเมื่ออยู่บน background ใน mockup ที่ 640×360

---

## 10. Phases และการส่งงาน

| Phase | ส่งก่อน Dev phase | สิ่งที่ส่ง | Gate |
|---|---|---|---|
| **A · Style และ Concept** | Phase 1 Core Prototype | palette, style_guide, aclaire_pixel_study, aclaire_action_poses, spirits_sheet, enemies/bosses concept, world keyframes ×5 | **หยุดรอผู้ใช้เลือก pixel study ของ Aclaire และอนุมัติ style** |
| **B · Core Sprites** | Phase 1–2 | `player`, `spirits`, `fx`, `objects`, `items`, `ui`, font_hud, validator, pack_atlas, animations.json | Validator ผ่าน + รีวิว GIF |
| **C · World 1 Pack** | Phase 3 Vertical Slice | tiles_w1, bg_w1 ×3 + boss bg, enemies_w1, boss_bramble_king, mockup โลก 1 | Validator ผ่าน + รีวิว mockup |
| **D · World 2–5 Packs** | Phase 4 Content Production | ชุดเดียวกับ C สำหรับโลก 2, 3, 4, 5 ส่งทีละโลก | Validator ผ่าน + รีวิว mockup ทีละโลก |
| **E · Polish Art** | Phase 5 Polish | key_art_title, world map (640×360), หน้าจอเมนู, ปรับแก้ตาม feedback | รีวิวรวม |

**รายงานส่งงานท้ายแต่ละ Phase** (เขียนเป็น `art/reports/phase_<X>.md`)
1. รายการไฟล์ที่สร้างหรือแก้ไข
2. ผลรัน `tools/validate_assets.py`
3. Assumption ที่ตัดสินใจเอง
4. จุดที่ขัดแย้งกับ GDD หรือเอกสารนี้ (ถ้ามี)
5. คำถามที่ต้องให้ผู้ใช้ตัดสินใจก่อน Phase ถัดไป
