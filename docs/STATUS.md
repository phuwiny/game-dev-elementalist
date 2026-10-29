# STATUS — สถานะงานและบันทึกส่งต่อ

อัปเดตล่าสุด 2026-10-29 · ใช้เอกสารนี้เริ่มงานต่อใน session ใหม่ของ Claude (Claude Code หรือ chat ใหม่) อ่านคู่กับ `CLAUDE.md`, `docs/GDD.md` และ `ART_HANDOFF.md`

## สถานะตอนนี้

ฝั่งเกมจบ Phase 3 Vertical Slice (โลก 1 Ember Woods) และ merge เข้า `main` แล้ว ตอนนี้เชื่อมภาพชุด World 1 (Phase C, [PR #9](https://github.com/phuwiny/game-dev-elementalist/pull/9) ของ Codex) เข้าเกมแล้วใน branch `claude/aclaire-v4-status-al18pm` รอพินรีวิว mockup และสั่ง merge

| PR | เนื้อหา | สถานะ |
| --- | --- | --- |
| #1 | Phase 1 Core Prototype | merged |
| #2 | Phase 2 Element System + Elements Lab | merged |
| #4 | Phase 3 โลก 1: ด่าน Tiled 1-1..1-3, Leaf Wisp, Thorn Beetle, Bramble King, World Map, เซฟ, SFX ชั่วคราว | merged |
| #5 | (Codex) Phase A/B study ของ Aclaire V4 | merged |
| #6 | รองรับ Aclaire V4: canvas 1280×720, ฉากขยาย 1.5 เท่า | merged |
| #7 | (Codex) atlas `player` ชุดแรก: idle, run, jump_up, jump_peak, fall, land | merged |
| #8 | placeholder รายท่า, แก้ `animations.json` ไม่ถูกใช้, hitbox 16×46 logical | merged |
| #9 | (Codex) Phase C World 1: tileset, background 4 ชั้น, `enemies_w1`, `boss_bramble_king`, `animations.json` | draft รอพินรีวิว |
| #3 | (Codex) art/phase-a เดิม รวมอยู่ใน #5 แล้ว | เปิดค้าง ปิดได้ |

ลิงก์อื่น: GDD ฉบับ Claude Docs <https://claude.ai/artifact/MZuWdrBm1rpa1anhEG9ppD> (ฉบับใน repo คือ `docs/GDD.md` เป็นหลัก) · ตัวเล่นทดสอบบน claude.ai <https://claude.ai/artifact/9ZhqvBnLoj4FhthKxjDMYN> (session เดิมเป็นคน publish session ใหม่อัปเดตลิงก์นี้ไม่ได้ ถ้าต้องการให้ build แล้วเปิด `npm run preview` ในเครื่องแทน)

## การตัดสินใจที่ต้องรู้ (ไม่ซ้ำกับ GDD)

- **ความละเอียด:** พิกัด logical 640×360 สำหรับเมนูและ HUD (`useUiCamera` ใน `src/ui/screen.ts`) canvas จริง 1280×720 (`RENDER_SCALE = 2`) กล้องในด่าน zoom 3 (`WORLD_SCALE = 1.5` × `RENDER_SCALE`) ภาพ 16 px ขยายเป็นจำนวนเต็มพอดี
- **Aclaire V4:** atlas `player` วาดที่ `density: 2` (frame 96×128, run 128×128, attack 192×128) ในด่านแสดงที่ scale 1/3 = สูง ~41 px ในพิกัดด่าน (~62 px บนจอ logical) hitbox 11×31 px ในด่าน (~16×46 logical เท้าถึงหน้าผาก) กระโดดสูงสุด ~64 px
- **ฉากและศัตรู:** Codex ยังวาดขนาดเดิม (tile 16, ศัตรู 32, palette 35 สี) ผู้ใช้อนุมัติภาพทดสอบสไตล์ World 1 แล้ว
- **Placeholder:** atlas ที่ยังไม่มีไฟล์ใช้ placeholder ทั้งชุด atlas ที่ส่งมาไม่ครบท่าจะเติมเฉพาะ frame ที่ขาดลง texture `<atlas>__fill` (`setAtlasFrame` ใน `src/assets/frames.ts` ใช้แทน `setFrame` ทุกครั้ง)
- **ด่าน:** ไฟล์ Tiled `public/assets/maps/w1_*.json` สร้างจาก `tools/levels/w1.py` (ASCII → Tiled) แก้ใน Tiled ตรงๆ ได้ แต่ถ้าแก้ผ่านสคริปต์จะทับไฟล์ ทุกด่านโหมดผจญภัยต้องผ่าน `LevelLint` (`tests/levels.test.ts`)
- **Spirit Shard:** ตำแหน่งสร้างใน `tools/levels/w1.py` (`L.shard(col,row,slot)`, `L.crate_nest`) ด่านละ 3 ชิ้น: 1-1 หอแท่นลอย 3 ชั้นข้างจุดเริ่ม / ลอยเหนือแท่นกลางด่าน / รังลังหลังหลุม, 1-2 ลอยเหนือแท่นข้างพีระมิด / รังลัง / แท่นสูงที่มี Leaf Wisp เฝ้า, 1-3 ลอยเหนือหนามช่องแรก / รังลัง / แท่นข้างพีระมิดที่มี Leaf Wisp ชิ้นที่ลอยสูงต้องกระโดดซ้ำจากแท่น (เก็บจากพื้นไม่ถึง) ภาพ `spirit_shard_shine` ยังเป็น placeholder จนกว่า atlas `items` จะมา
- **โลก 1 ใช้ไฟอย่างเดียว** ตาม GDD, `startSpirits` ใน `src/levels/index.ts`
- **ด่าน W1 ใช้ `tiles_w1_ember_woods`:** `GameScene` วาด terrain ตาม gid ในไฟล์ Tiled (`buildArtTerrain` ใน `src/systems/TerrainArt.ts`, margin 1 spacing 2 อ่านจากแผนที่) ชนเฉพาะ tile ที่มี `collides` ชั้นที่ชื่อขึ้นต้นด้วย `decor` (ไม่บังคับ มีได้หลายชั้น เรียงตามไฟล์) วาดหลัง terrain ไม่ชน ด่าน W1 มี `decor` (ผนังซากปรัก) กับ `decor_over` (ตกแต่งบนพื้นและเถาวัลย์ห้อยจากยอดผนัง) ตำแหน่งซากปรักอยู่ใน `RUINS` ของ `w1.py` (ด่านบอสมีผนังเป็นฉากหลังทั้งสนาม) ด่าน ASCII (lab, graybox) และกรณีไม่มี texture ยังใช้ graybox จาก grid
- **บทบาทของ tile ID** (ตามคู่มือ `art/reports/2026-10-25_world1_integration_guide.md` ตัวสร้างด่านอยู่ที่ `tools/levels/w1.py` และอ่าน property จาก `.tsx` โดยตรง): 0–1 ผิวบน, 2–3 เนื้อดิน, 4/5 ขอบซ้าย/ขวา, 6 เพดาน, 7–10 มุมนอก (บนซ้าย, บนขวา, ล่างซ้าย, ล่างขวา), 11–14 มุมใน, 15 ฝาครอบแท่นเดี่ยว, 16–18 one-way, 19–21 hazard, 22–33 ผนังซากปรัก, 34–57 ตกแต่ง (ใบไม้, ราก, เถาวัลย์ผนัง 42–45, หิน, เห็ด, ดอกไม้ไฟ) **มุมใน 11–14 ยังไม่ใช้:** แต่ละใบวาดฝาหญ้าหรือเส้นขอบพาดทั้งด้านของ tile ที่อยู่กลางเนื้อดิน วางที่มุมเว้าแล้วดูเป็นก้อนหญ้าลอยในดิน จึงใช้เนื้อดินแทน รอ Codex ยืนยันว่าตั้งใจให้ใช้ตรงไหน
- **One-way:** `Tile.OneWay` (property `oneWay`) สร้าง zone ชนเฉพาะด้านบนผ่าน `addOneWayPlatform` พื้นผิวอยู่ต่ำกว่าขอบบน tile 5 px (`ONE_WAY_DECK_OFFSET`) ตามภาพสะพานไม้ แท่นลอยทั้ง 3 จุดของ W1 (`platform()` ใน `w1.py`) เป็น one-way แล้ว ศัตรูพื้นชนแท่นได้แต่ `isSolidAt` ยังไม่นับแท่น (ไม่มีศัตรูเดินบนแท่นใน W1) ตรวจด้วย `tests/e2e/oneway.py`
- **Background:** `ParallaxBackground` วาด `bg_w1_far/mid/near` เต็มจอ (scrollFactor 0 ย่อ 1/`WORLD_SCALE` ให้ 1 pixel ภาพ = 1 pixel logical) เลื่อนด้วย parallax 0.1/0.3/0.6 และวนซ้ำ ทั้ง 3 ชั้นอยู่หลังฉากเล่น (ชั้น near ไม่ได้บังหน้า) สนามบอสสลับชั้น far เป็น `bg_w1_boss_far` ตอนประตูสนามปิด และกลับเมื่อผู้เล่นตาย
- **โล่เถาวัลย์** ย้ายไปกึ่งกลาง x = 42 จากขอบซ้ายบอส (`BossBalance.brambleKing.shieldOffsetX`) เพื่อคลุมจุดอ่อน x 20–64 ตามสัญญา เดิมอยู่ที่ x = 6 ซึ่งอยู่ข้างจุดอ่อน

## งานถัดไป

ฝั่ง Codex
1. ท่าที่เหลือของ Aclaire: double_jump, cast, dash, glide, ground_slam, attack_1–3 (96×64 logical), hurt, dead
2. แก้ภาพ Phase C ตามผลทดสอบในเกม:
   - tile มุมใน 11–14 ของ `tiles_w1_ember_woods`: ถ้าตั้งใจให้ใช้ที่มุมเว้า (tile อยู่กลางเนื้อดินแต่เฉียงหนึ่งด้านว่าง) ภาพปัจจุบันไม่เข้า เพราะมีฝาหญ้าหรือเส้นขอบพาดทั้งด้านที่ติดดิน ขอให้บอกว่าตั้งใจใช้ตรงไหน หรือวาดใหม่ให้มีขอบเฉพาะมุมเว้า

ฝั่ง Claude
1. หลัง PR #9 merge: merge `main` เข้า branch นี้แล้วเปิด PR (ตอนนี้ branch รวม `art/phase-c` ไว้แล้วเพื่อทดสอบ) ถ้า Codex ส่งภาพแก้ ให้รัน `python3 tools/levels/w1.py public/assets/maps` ใหม่เมื่อ ID หรือบทบาท tile เปลี่ยน
2. ตรวจภาพที่ Codex ส่งในเกมทุกรอบ: เท้าตรงพื้น, hitbox, ไม่ jitter, กล้องในสนามบอส (บอสสูง 192 px มงกุฎชิดขอบบนจอ)
3. Playtest รอบแรกกับผู้ใช้แล้วปรับความยาก/ความยาวด่าน (ด่าน W1 ยาว 170–204 tile สั้นกว่าเป้า GDD)
4. งานค้างจาก GDD (แผนทำตามลำดับ แยก PR ต่อข้อ): ~~A ข้อความแจ้งเมื่อเซฟไม่ได้~~ (เสร็จ), ~~B key rebinding + หน้า Settings~~ (เสร็จ), ~~C Spirit Shard~~ (เสร็จ: ด่านละ 3 ชิ้น บันทึกเมื่อผ่านด่าน ยังไม่ทำ gallery/ด่านพิเศษที่ shard ปลดล็อก), D เพลง (chiptune ชั่วคราวในโค้ด + ตัวโหลดไฟล์จริง แหล่งเพลงจริงรอพิน)

## การทดสอบ

```bash
npm run check                      # typecheck + test + build (ต้องผ่านก่อนเปิด PR)
npm run build && npx vite preview --port 4173 &
pip install playwright && python3 -m playwright install chromium   # ครั้งแรก
python3 tests/e2e/w1_bot.py w1_1 clean          # bot วิ่งกระโดดจริงผ่านด่าน (ไม่วาร์ป)
python3 tests/e2e/w1_bot.py w1_3 clean --boss   # ด่าน 1-3 + สู้บอส
python3 tests/e2e/lab_test.py                   # Elements Lab 38 checks
python3 tests/e2e/flow.py                       # เมนู, World Map, เซฟ, Game Over
python3 tests/e2e/boss_reset.py                 # สนามบอส: ประตูปิด, ตายแล้วรีเซ็ต, phase 1→3
python3 tests/e2e/oneway.py                     # แท่น one-way: ทะลุจากล่าง ลงยืนจากบน
python3 tests/e2e/shards.py                     # Spirit Shard: เก็บครบ 9 ชิ้นด้วย input จริง (hop/เผาลัง), บันทึกเมื่อผ่านด่านเท่านั้น, HUD/Stage Clear/เงาชิ้นที่เก็บแล้ว
python3 tests/e2e/settings.py                   # key rebinding: Title/Pause → Settings, สลับปุ่มซ้ำ, ปุ่มสงวน, ใช้ปุ่มใหม่ในเกม, รีเซ็ต
python3 tests/e2e/save_warning.py               # เซฟไม่ได้: localStorage ถูกบล็อก หรือ setItem throw แล้วขึ้นข้อความเตือน
python3 tests/e2e/player_anims.py               # Aclaire: 59 frame ชิดพื้น/กึ่งกลาง และกดปุ่มจริงแล้วเล่นท่าถูก (run, combo, jump, double jump, cast, dash, slam, hurt, dead)
```

- สคริปต์ใช้ `?lowres` (วาด 640×360) เพราะ software GL ที่ 1280×720 ได้ ~44 fps จน bot กดปุ่มไม่ทัน ตั้ง `GAME_URL` และ `SHOT_DIR` ได้ทาง env
- ข้อควรระวังเวลาเขียนสคริปต์: `page.evaluate` ห้าม return object ของ Phaser (เช่นผลของ `scene.start`) ให้ครอบด้วย `{ ...; }` ไม่งั้นค้าง, กดปุ่มให้ค้าง ≥ 60 ms เพราะเกมอ่าน input ทีละ frame, ทดสอบอันตรายด้วยการวิ่งกระโดดจริงเสมอ
- Bot สู้บอสไม่หลบเมล็ดหนาม ผลตายบ้างในสนามบอสไม่ได้แปลว่าเกมผิด
- ตัวช่วยใน URL: `?unlock` ภูตครบ 4 ตน, `?debug` เห็น hitbox, `?lowres`

## วิธีทำงานกับ GitHub

- Branch `feat/*`, `fix/*`, `docs/*` → PR เข้า `main` ผู้ใช้เป็นคนสั่ง merge ทุกครั้ง
- ลำดับ merge เมื่องานภาพกับโค้ดผูกกัน: PR ฝั่งโค้ดที่รองรับสเปกใหม่เข้าก่อน แล้วค่อย PR ของ Codex
- Merge commit ที่ GitHub สร้างเป็น Verified อยู่แล้ว ไม่ต้อง amend หรือ force-push `main`

## ผู้ใช้

ตอบเป็นภาษาไทย คงศัพท์เทคนิคเป็นภาษาอังกฤษ งานใหญ่ให้อธิบายแผนและรอยืนยันก่อน ชี้ bug ตรงๆ พร้อมวิธีแก้ ผู้ใช้ (พิน) เป็นคนอนุมัติงานภาพของ Codex และเป็นคนส่งต่อข้อความระหว่าง Codex กับ Claude
