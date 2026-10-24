# STATUS — สถานะงานและบันทึกส่งต่อ

อัปเดตล่าสุด 2026-10-25 · ใช้เอกสารนี้เริ่มงานต่อใน session ใหม่ของ Claude (Claude Code หรือ chat ใหม่) อ่านคู่กับ `CLAUDE.md`, `docs/GDD.md` และ `ART_HANDOFF.md`

## สถานะตอนนี้

ฝั่งเกมจบ Phase 3 Vertical Slice (โลก 1 Ember Woods) และ merge เข้า `main` แล้ว รอภาพชุด World 1 จาก Codex (Phase C)

| PR | เนื้อหา | สถานะ |
| --- | --- | --- |
| #1 | Phase 1 Core Prototype | merged |
| #2 | Phase 2 Element System + Elements Lab | merged |
| #4 | Phase 3 โลก 1: ด่าน Tiled 1-1..1-3, Leaf Wisp, Thorn Beetle, Bramble King, World Map, เซฟ, SFX ชั่วคราว | merged |
| #5 | (Codex) Phase A/B study ของ Aclaire V4 | merged |
| #6 | รองรับ Aclaire V4: canvas 1280×720, ฉากขยาย 1.5 เท่า | merged |
| #7 | (Codex) atlas `player` ชุดแรก: idle, run, jump_up, jump_peak, fall, land | merged |
| #8 | placeholder รายท่า, แก้ `animations.json` ไม่ถูกใช้, hitbox 16×46 logical | merged |
| #3 | (Codex) art/phase-a เดิม รวมอยู่ใน #5 แล้ว | เปิดค้าง ปิดได้ |

ลิงก์อื่น: GDD ฉบับ Claude Docs <https://claude.ai/artifact/MZuWdrBm1rpa1anhEG9ppD> (ฉบับใน repo คือ `docs/GDD.md` เป็นหลัก) · ตัวเล่นทดสอบบน claude.ai <https://claude.ai/artifact/9ZhqvBnLoj4FhthKxjDMYN> (session เดิมเป็นคน publish session ใหม่อัปเดตลิงก์นี้ไม่ได้ ถ้าต้องการให้ build แล้วเปิด `npm run preview` ในเครื่องแทน)

## การตัดสินใจที่ต้องรู้ (ไม่ซ้ำกับ GDD)

- **ความละเอียด:** พิกัด logical 640×360 สำหรับเมนูและ HUD (`useUiCamera` ใน `src/ui/screen.ts`) canvas จริง 1280×720 (`RENDER_SCALE = 2`) กล้องในด่าน zoom 3 (`WORLD_SCALE = 1.5` × `RENDER_SCALE`) ภาพ 16 px ขยายเป็นจำนวนเต็มพอดี
- **Aclaire V4:** atlas `player` วาดที่ `density: 2` (frame 96×128, run 128×128, attack 192×128) ในด่านแสดงที่ scale 1/3 = สูง ~41 px ในพิกัดด่าน (~62 px บนจอ logical) hitbox 11×31 px ในด่าน (~16×46 logical เท้าถึงหน้าผาก) กระโดดสูงสุด ~64 px
- **ฉากและศัตรู:** Codex ยังวาดขนาดเดิม (tile 16, ศัตรู 32, palette 35 สี) ผู้ใช้อนุมัติภาพทดสอบสไตล์ World 1 แล้ว
- **Placeholder:** atlas ที่ยังไม่มีไฟล์ใช้ placeholder ทั้งชุด atlas ที่ส่งมาไม่ครบท่าจะเติมเฉพาะ frame ที่ขาดลง texture `<atlas>__fill` (`setAtlasFrame` ใน `src/assets/frames.ts` ใช้แทน `setFrame` ทุกครั้ง)
- **ด่าน:** ไฟล์ Tiled `public/assets/maps/w1_*.json` สร้างจาก `tools/levels/w1.py` (ASCII → Tiled) แก้ใน Tiled ตรงๆ ได้ แต่ถ้าแก้ผ่านสคริปต์จะทับไฟล์ ทุกด่านโหมดผจญภัยต้องผ่าน `LevelLint` (`tests/levels.test.ts`)
- **โลก 1 ใช้ไฟอย่างเดียว** ตาม GDD, `startSpirits` ใน `src/levels/index.ts`

## งานถัดไป

ฝั่ง Codex
1. ท่าที่เหลือของ Aclaire: double_jump, cast, dash, glide, ground_slam, attack_1–3 (96×64 logical), hurt, dead
2. Phase C World 1 Pack: `tiles_w1_ember_woods`, background 3 ชั้น + boss, `enemies_w1`, `boss_bramble_king`, mockup

ฝั่ง Claude
1. เมื่อ `tiles_w1_ember_woods` มาถึง: เปลี่ยนด่าน W1 จาก tileset `graybox` ไปใช้ tileset จริง (ตอนนี้ `GameScene` วาด tile จาก grid ของ `ParsedLevel` ไม่ได้ใช้ gid ของ Tiled ต้องเพิ่มการวาดตาม gid และ layer decoration) และเพิ่ม parallax background
2. ตรวจภาพที่ Codex ส่งในเกมทุกรอบ: เท้าตรงพื้น, hitbox, ไม่ jitter, กล้องในสนามบอส (บอสสูง 192 px มงกุฎชิดขอบบนจอ)
3. Playtest รอบแรกกับผู้ใช้แล้วปรับความยาก/ความยาวด่าน (ด่าน W1 ยาว 170–204 tile สั้นกว่าเป้า GDD)
4. งานค้างจาก GDD: Spirit Shard, key rebinding, ข้อความแจ้งเมื่อเซฟไม่ได้, เพลง

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
