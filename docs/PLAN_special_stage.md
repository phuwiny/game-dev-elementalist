# แผนงาน — ด่านพิเศษ 1-S (Spirit Trial)

สถานะ: **รอเริ่ม** · เขียนเมื่อ 2026-11-06 · อ่านคู่กับ `docs/STATUS.md`, `docs/GDD.md` หัวข้อ 4 และ 7

เอกสารนี้เป็นแผนงานที่ผู้ใช้อนุมัติแนวทางแล้วแต่ยังไม่ได้ลงมือ session ใหม่เริ่มทำตามขั้นตอนในหัวข้อ 4 ได้เลย ก่อนเริ่มให้ยืนยันคำถามที่เปิดอยู่ในหัวข้อ 6 กับผู้ใช้

## 1. สิ่งที่ตัดสินใจแล้ว

ผู้ใช้เลือกเมื่อ 2026-11-05

| เรื่อง | ข้อสรุป |
| --- | --- |
| เงื่อนไขปลดล็อก | เก็บ Spirit Shard ครบทั้งโลก (โลก 1 = 9 ชิ้น) เปิดด่านพิเศษของโลกนั้น (เก็บครบ 3 ชิ้นของด่านได้ภาพ gallery ซึ่งทำแล้วใน #23) |
| รูปแบบด่าน | ด่านท้าทายสั้น ยาวประมาณ 120 tile ใช้ tileset `tiles_w1_ember_woods` และศัตรูโลก 1 ที่มีอยู่ ไม่ต้องรอภาพใหม่ |
| เนื้อหา | platforming ยากกว่าด่านปกติ และ puzzle ไฟ ไม่มี checkpoint |
| รางวัล | จับเวลา บันทึกเวลาที่ดีที่สุดลงเซฟ |
| การแยก PR | 1 PR สำหรับด่าน 1-S ทั้งหมด (gallery merge ไปแล้วใน #23) |

## 2. สิ่งที่มีอยู่แล้วให้ใช้ต่อ

- `Progress.collectedShards(level)`, `totalShards`, `maxShards` (`src/core/Progress.ts`) ใช้ตัดสินว่าเก็บครบโลกหรือยัง
- `ADVENTURE_LEVELS` / `ADVENTURE_ORDER` / `isAdventure` (`src/levels/index.ts`) คุมการปลดล็อกทีละด่านและการบันทึก ห้ามใส่ 1-S ลงในรายการนี้ ไม่งั้น `maxShards` จะนับ 1-S เป็น 3 ชิ้น และ World Map จะเรียงต่อเป็นด่านที่ 4
- `tools/levels/w1.py` สร้างไฟล์ Tiled จาก ASCII (`Level`, `platform`, `pit`, `spikes`, `crate_nest`, `RUINS`) **ห้ามวาง object ในช่วงคอลัมน์ `RUINS`** เพราะลำดับสุ่มของผนังซากปรักจะเลื่อนทั้งด่าน
- `lintLevel(level, SINGLE_JUMP_RULES)` (`src/core/LevelLint.ts`) ทุกด่านโหมดผจญภัยต้องผ่าน ใช้กับ 1-S ด้วย
- `tests/e2e/w1_bot.py` bot ที่วิ่งกระโดดจริงผ่านด่าน ใช้ตรวจว่า 1-S ผ่านได้
- `font_hud` + `addHudText` (`src/ui/hudText.ts`) ใช้แสดงนาฬิกาบน HUD
- `StageClearScene` (`src/scenes/EndScenes.ts`) รับ `data` เพิ่มได้ ตอนนี้มี `shards` และ `galleryUnlocked`

## 3. ออกแบบ

### 3.1 ข้อมูลและกฎ (`src/core/`, มี unit test)

- `src/levels/index.ts`: เพิ่ม `SPECIAL_LEVELS` แยกจาก `ADVENTURE_LEVELS`
  - `{ key: 'w1_s', name: '1-S Spirit Trial', map: 'assets/maps/w1_s.json', startSpirits: [ElementType.Fire], world: 1 }`
  - เพิ่ม `isSpecial(key)` และให้ `LEVELS` รวม `SPECIAL_LEVELS` ด้วย เพื่อให้ PreloadScene โหลดแผนที่
- `src/core/SpecialStage.ts` (ใหม่)
  - `isSpecialUnlocked(record, worldLevels)`: true เมื่อทุกด่านใน `worldLevels` มี shard ครบ `SHARDS_PER_LEVEL`
  - `formatTime(ms)` → `"1:23.45"` (นาที:วินาที.ร้อยวินาที) ใช้ทั้ง HUD และ Stage Clear
- `Progress`: เพิ่ม `bestTimes: Record<string, number>` (มิลลิวินาที)
  - `bestTime(level)` และ `recordTime(level, ms)` คืน true เมื่อเป็นสถิติใหม่ บันทึกทันที
  - อ่านเซฟแบบเดียวกับ `feathers`: ข้ามค่าที่ไม่ใช่จำนวนเต็มบวก และ key ที่ไม่ใช่ด่านพิเศษ
  - `reset()` ล้างด้วย
  - constructor ของ `Progress` ตอนนี้รับ `order` (ด่านผจญภัย) ให้เพิ่มพารามิเตอร์รายการด่านพิเศษ หรือรับ key ที่อนุญาตทั้งหมด เพื่อไม่ให้ `isUnlocked` / `maxShards` เปลี่ยนความหมาย

### 3.2 ด่าน (`tools/levels/w1.py` → `public/assets/maps/w1_s.json`)

- ฟังก์ชัน `w1_s()` ความกว้างประมาณ 120 tile และเพิ่มในลูป `__main__`
- ชื่อด่านในไฟล์: `Spirit Trial` และเพิ่ม `RUINS['Spirit Trial']` ถ้าอยากมีผนังซากปรัก
- ไม่มี `K` (checkpoint), ไม่มี shard และไม่มี orb/feather จะใส่เหรียญก็ได้
- โครงที่เสนอ (ยาก แต่ทุกจุดต้องผ่าน lint และ bot):
  1. เปิดด้วยแท่น one-way ลอยต่อกันเหนือหลุม 4 tile สองหลุม
  2. กำแพงเถาวัลย์และลังไม้ที่ต้องเผาระหว่างกระโดด (มีภูตไฟตั้งแต่เริ่ม)
  3. หนาม 3 tile สลับกับ Thorn Beetle ที่ต้องข้ามแล้วตีจากหลัง
  4. หอแท่นที่มี Leaf Wisp เฝ้า 2 ตัว
  5. คบเพลิง → ประตู แล้ววิ่งตรงเข้าเส้นชัย
- ตรวจผลด้วย `tests/levels.test.ts` (lint) และดูว่า tile ของ decor ในด่านเดิมไม่เปลี่ยน (เทียบ JSON ของ `w1_1`–`w1_3` ก่อน/หลัง generate)

### 3.3 เกม

- **GameScene**
  - ถ้า `isSpecial(def.key)` เปิดนาฬิกา: สะสม `delta` ใน `update()` เพื่อให้หยุดเองตอน Pause (scene ถูก pause แล้ว update ไม่ทำงาน) และไม่นับช่วงที่ `finished`
  - ส่งเวลาใน `hudState()` (`timeMs: number | null`)
  - ตอนผ่านด่าน: `progress.markCleared` + `progress.recordTime` แล้วส่ง `{ timeMs, bestMs, newBest }` ไป Stage Clear
  - ไม่มี checkpoint จึงเกิดใหม่ที่จุดเริ่มเสมอ ส่วนจะเริ่มนับเวลาใหม่หรือไม่ ดูคำถามข้อ 1 ในหัวข้อ 6
- **UIScene**: แสดงนาฬิกาด้วย `addHudText` มุมบนกลาง เฉพาะเมื่อ `timeMs !== null`
- **StageClearScene**
  - แสดง `Time 1:23.45` และ `Best 1:20.10` ถ้าทำสถิติใหม่แสดง `NEW BEST!` สีทอง
  - ปุ่ม ENTER = เล่นใหม่, ESC = World Map
- **WorldMapScene**
  - เพิ่ม node ที่ 4 ของ 1-S ต่อจาก 1-3 ตอนนี้ระยะห่าง node คือ 140 px ต้องคำนวณใหม่ให้ 4 node พอดีจอ 640
  - ถ้ายังล็อก: ใช้ `world_map_node_locked` และข้อความ `Locked: collect all 9 Spirit Shards (x/9)`
  - ถ้าเปิดแล้ว: แสดงเวลาที่ดีที่สุดใต้ชื่อด่าน
  - ด่านนี้ไม่มี shard จึงไม่แสดงบรรทัด `Shards x/3`
- **Stage Clear ของด่านปกติ**: ถ้าการผ่านด่านครั้งนั้นทำให้ shard ครบ 9 ชิ้น ให้แจ้ง `Spirit Trial unlocked!` แบบเดียวกับข้อความ gallery
- **เพลง**: ใช้ `world1` ไปก่อน (`src/systems/Music.ts`) จะเพิ่มแทร็กเฉพาะทีหลังก็ได้

### 3.4 เอกสาร

- `docs/GDD.md`: เพิ่มด่าน 1-S ในตารางด่านโลก 1 และกฎจับเวลา
- `docs/STATUS.md`: ตาราง PR, การตัดสินใจ, คำสั่ง e2e ใหม่
- `ART_HANDOFF.md`: ไม่ต้องแก้ เพราะไม่มีภาพใหม่ ถ้าอยากได้ node พิเศษบน World Map (เช่น `world_map_node_special`) ให้เพิ่มเป็นงานของ Codex แยก

## 4. ขั้นตอน

1. เริ่ม branch จาก `main` ล่าสุด รัน `npm ci` และ `npm run check` ให้ผ่านก่อน
2. `src/core/SpecialStage.ts` + ส่วนของ `Progress` พร้อม unit test (`tests/special.test.ts`): ปลดล็อกเมื่อครบ 9, ไม่ปลดล็อกเมื่อ 8, บันทึกสถิติใหม่เฉพาะเวลาที่น้อยกว่า, ข้อมูลเซฟเสียถูกข้าม, `formatTime`
3. `SPECIAL_LEVELS` / `isSpecial` ใน `src/levels/index.ts` และตรวจว่า `maxShards` ยังเป็น 9
4. `w1_s()` ใน `tools/levels/w1.py` → `python3 tools/levels/w1.py public/assets/maps` แล้วเทียบว่า `w1_1`–`w1_3` ไม่เปลี่ยน
5. เพิ่ม `w1_s` ใน `tests/levels.test.ts`: ต้องผ่าน lint, ไม่มี checkpoint, ไม่มี shard
6. GameScene (นาฬิกา, ตอนผ่านด่าน) → UIScene (นาฬิกา) → StageClear (เวลา, NEW BEST, ข้อความปลดล็อก) → WorldMap (node ที่ 4)
7. e2e `tests/e2e/special.py`
   - เซฟใหม่: node 1-S ล็อก กด ENTER แล้วไม่เข้า
   - บันทึก shard ครบ 9: node เปิด เข้าด่านได้
   - นาฬิกาเดิน, หยุดตอน Pause, ผ่านด่านแล้ว Stage Clear แสดงเวลาและ NEW BEST
   - เล่นซ้ำช้ากว่าเดิม: ไม่มี NEW BEST และเวลาที่ดีที่สุดไม่เปลี่ยน
   - reload หน้าแล้วเวลาที่ดีที่สุดยังอยู่
8. bot: `python3 tests/e2e/w1_bot.py w1_s clean` ต้องผ่านด่านได้ ถ้า bot ไม่รู้จักด่าน ให้เพิ่มที่จำเป็นใน `w1_bot.py`
9. e2e เดิมที่ต้องรันซ้ำ: `flow.py`, `shards.py`, `gallery.py`, `core_ui.py`, `lab_test.py`, `w1_bot.py` ทั้ง 3 ด่าน
10. อัปเดตเอกสาร (หัวข้อ 3.4) และ publish ตัวเล่น playtest ใหม่ถ้าผู้ใช้ต้องการ ใช้ลิงก์เดิมไม่ได้ถ้าเป็น session ใหม่ ต้องอ่านด้วย `Artifact` action `read` ก่อน publish ทับ

## 5. ความเสี่ยงและจุดที่ต้องระวัง

- **ใส่ 1-S ใน `ADVENTURE_LEVELS`:** `maxShards`, การปลดล็อกทีละด่าน และ e2e ที่นับ node จะเพี้ยนทั้งหมด ต้องแยกรายการ
- **decor ของด่านเดิมเปลี่ยน:** generator ใช้ seed ตามชื่อด่าน ด่านใหม่ไม่ควรกระทบด่านเดิม แต่ต้องเทียบไฟล์ทุกครั้งที่ generate
- **ยากเกินจน bot ผ่านไม่ได้:** ให้ lint ผ่านก่อน แล้วปรับจนกว่า bot ผ่านได้ ด่านที่ bot ผ่านไม่ได้ ผู้เล่นทั่วไปก็มักผ่านไม่ได้
- **นาฬิกากับ software GL:** ใน e2e เกมเดินช้ากว่าเวลาจริง ให้ test ตรวจจาก delta ที่เกมสะสม ไม่ใช่เวลาบนนาฬิกาจริง

## 6. คำถามที่ต้องถามผู้ใช้ก่อนเริ่ม

1. ตายในด่าน 1-S แล้วนาฬิกา: **เริ่มนับใหม่จาก 0** (แนะนำ เพราะไม่มี checkpoint และสถิติจะได้วัดการวิ่งรวดเดียว) หรือนับต่อ
2. ด่าน 1-S เสียชีวิตตามปกติไหม (แนะนำ: ไม่เสีย เพราะเป็นด่านท้าทายที่ต้องตายแล้วลองใหม่บ่อย ถ้าเสียชีวิตตามปกติ ผู้เล่นจะเจอหน้า Game Over และชีวิตถูกรีเซ็ต)
3. ชื่อด่าน `1-S Spirit Trial` ใช้ได้ไหม
4. ต้องการภาพ node พิเศษบน World Map จาก Codex หรือใช้ node ปกติไปก่อน

## 7. งานอื่นที่ค้าง (ไม่อยู่ในแผนนี้)

- Playtest โลก 1 กับผู้ใช้ ตัวเล่น: <https://claude.ai/artifact/DCvFEBkmtfmrF2wBsAuYF8> (build วันที่ 2026-11-05 ยังไม่มี gallery)
- Codex: ภาพ gallery 3 ภาพ + แก้ validator (ART_HANDOFF.md หัวข้อ 8.1) และคำตอบเรื่อง tile มุมใน 11–14
