# art(concept): Phase A style and concept review

## Review decision — Phase A style approved

พินอนุมัติ **style Phase A ตาม Aclaire V4 และ concept ใน PR #3** แล้ว; ตำแหน่งดาบเป็น polish note สำหรับ revision ภายหลัง. V4 เป็น idle seed ที่อนุมัติสำหรับทิศทางภาพ (logical 48×64, density 2, raster 96×128, 247 สีจริง). การอนุมัตินี้ไม่ใช่การยืนยันว่า asset ผ่านสเปก production เดิม: ART_HANDOFF.md ยังระบุ player 32×48, master palette 35 สี และไม่เกิน 16 สีต่อ sprite. ผู้ดูแล code/spec ต้องตกลงและปรับ frame/color budget, manifest, runtime scale และ atlas ก่อนผลิต asset ใช้จริง. ข้อความเก่าที่ระบุว่า “ยังรออนุมัติ” ด้านล่างเป็นประวัติรอบรีวิวเดิม.

PR คงเป็น Draft สำหรับ Phase A; ไม่เริ่ม animation หรือ Phase B จนกว่าพินจะสั่งโดยตรง.

## Review decision — Aclaire V4 accepted

พินระบุว่า "V4 กำลังดีเลยครับ ตำแหน่งดาบแปลกไปนิดแต่ใช้ได้ครับ" จึงบันทึก V4 เป็น idle seed ที่ยอมรับสำหรับ Aclaire และเก็บตำแหน่งดาบเป็น polish note. ไม่แก้ภาพที่ยอมรับแล้วทับไฟล์เดิม; budget สี/สเปกตัวละครอื่นและ gate ของ Phase A ทั้งชุดยังรอสรุป. PR ยังคง Draft.


## Latest update — V4 density-2 proposal

ผู้ใช้ขอเพิ่ม budget ความละเอียดตัวละครให้ใกล้ Coin Quest และปฏิเสธ V3 จึงทำ [V4 Aclaire comparison](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_idle_seed_v4_comparison.png): logical 48×64, physical 96×128, 247 สีจริง. [PNG โปร่งใส](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png) และ [640×360 scale probe](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v4_640x360.png). มีตัวเลือก 60 สีเทียบแต่หน้าหยาบกว่า. แก้แกนดาบบน source อีกครั้งให้ด้าม/กันมือ/ฝักเกือบตั้งตรง. รายละเอียดผลกระทบต่อขนาด/สี/atlas และขอบเขต approval อยู่ใน phase_a.md. V4 ยังรออนุมัติ; ไม่แก้ production code, ไม่เริ่ม animation หรือ Phase B.


## Latest update — V3 cleaner 16-color seed

ผู้ใช้เห็นว่า V2 แตกและต้องการลดรายละเอียดสีเพื่อให้หน้าเนียนขึ้น จึงเพิ่ม [V2/V3 comparison](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_idle_seed_v3_comparison.png), [V3 native 48×64](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v3_16color.png) และ [640×360 scale probe](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v3_640x360.png). V3 ใช้ 16 สีจริงจาก master palette, alpha 0/255 และยังรอรีวิว style/seed. ภาพเดิมยังอยู่ครบ. รายละเอียดใน `phase_a.md`.


## Latest PR body — 2026-10-23 seed v2

Phase A เพิ่ม Aclaire idle seed v2 ที่ 48×64 จาก feedback: หน้า/ตาโต ผมมีปริมาตร ท่ายืนสดใส และ costume v2 โดยเก็บ studies เดิมไว้ครบ

- [ภาพเทียบ Coin Quest / เดิม / v2 16 สี / v2 26 สี](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_idle_seed_v2_comparison.png)
- [PNG โปร่งใส 48×64 / 26 สี](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v2_master.png)
- [ภาพฐาน 640×360](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/2026-10-23_aclaire_seed_v2_640x360.png)
- [รายงานและข้อจำกัด](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/reports/phase_a.md)

ตรวจ Coin Quest local แล้ว: idle ตรงกับ PNG ทุก pixel, density 2, raster 108×96, ตัวละคร 68×82, ใช้จริง 481 สี และ renderer เปิด smoothing. ใช้ built-in imagegen สร้าง source ใหม่แล้ว nearest-resample, map master palette และเก็บตา/ปาก/แกนดาบบนกริด. ตัวเลือก 16 สีเสียสี tan/เขียวพันด้ามบางส่วน; 26 สีรักษารายละเอียดมากกว่าแต่เกิน budget เดิม จึงเป็นข้อเสนอสำหรับรีวิว ไม่เปลี่ยน master palette หรือ production spec

Validation:
- validate_phase_a.py: PASS ชุดเดิม 16 boards / 9 studies.
- build_aclaire_seed_v2.py: PASS assertions candidate ใหม่ ขนาด 48×64, binary alpha, master colors, feet baseline และ scale probe 640×360. 26 สีไม่ใช่ production pass.
- ตรวจภาพจริงแล้ว; pixel clusters ในผมและตาไกลแคบยังเป็นจุดรอรีวิว.
- git diff --check: PASS.
- tools/validate_assets.py ยังไม่มี (exit 2).
- Runtime รอบนี้ยังไม่ได้ตรวจ: ไม่มี npm ใน PATH และไม่มี node_modules. ภาพฐานเป็น static probe ไม่ใช่ screenshot เกม

ชุด Phase A เดิม (palette/style/action poses/ภูต/ศัตรู/บอส/world keyframes) ยังอยู่ครบ. แก้เฉพาะ art/ และ tools/art/; Coin Quest อ่านอย่างเดียว

ยังไม่มี approved seed/style. คง Draft และหยุดรอผู้ใช้ก่อน animation strip หรือ Phase B. ไม่ merge และไม่เปิด auto-merge.

---
## Previous PR body (historical)

Base: `main` · Head: `art/phase-a` · Draft: yes

ชุดรีวิวภาพตาม ART_HANDOFF.md หัวข้อ 8 และ 10 โดยยึด Aclaire v2 และภูตต้นฉบับทั้งสี่ เพิ่ม palette 35 สี, style guide, Aclaire pixel study A/B, action poses 7 ท่า, ภูตพร้อมสีหน้าและ pixel studies, ศัตรู 10 ตัว, บอสพร้อมจุดอ่อน 5 ตัว และ world keyframes 5 โลก

ผู้ใช้เลือกแนว A และขอทดลอง 48×64 จึงเพิ่ม [seed 48×64](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_48x64_study.png) กับ [ภาพเทียบขนาด 640×360](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/previews/phase_a/aclaire_48x64_scale_probe.png) เป็น Phase A revision; ยังรออนุมัติภาพและขนาด final. ZIP ตัวอย่างที่แนบมาเกินขีดจำกัดรับไฟล์ 32 MiB จึงยังไม่ได้เทียบภาพต้นฉบับใน ZIP

เริ่มรีวิวเดิมที่ [Aclaire A/B](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_pixel_study.png), [style guide](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/style_guide.png) และ [รายงาน Phase A](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/reports/phase_a.md)

## Validation

- `python3 tools/art/validate_phase_a.py`: PASS — 16 boards 1920×1080, 9 native studies, exact 35-color palette, binary alpha, frame sizes and color budgets.
- Vite + Chromium smoke: เข้าเกมได้, canvas 1 ตัว, pageerror 0; screenshot เป็น placeholder เดิม ไม่ใช่ runtime asset ใหม่
- `git diff --check`: PASS
- `python3 tools/validate_assets.py`: exit 2 — repo ไม่มีไฟล์นี้; handoff กำหนดสร้างใน Phase B จึงไม่สร้างล่วงหน้าและไม่อ้างว่า production validation ผ่าน

แก้เฉพาะ `art/` และ `tools/art/`; reference และ game code ไม่เปลี่ยน ภาพ illustration เป็น concept; ข้อเสนอจุดอ่อน/ข้อความเพิ่มเติมในภาพไม่ใช่ gameplay ที่อนุมัติแล้ว รายละเอียดและข้อจำกัดอยู่ในรายงาน

## Review gate

รีวิว Aclaire 48×64 seed และอนุมัติ style/ขนาด final ก่อนเริ่ม Phase B งานหยุดที่ Phase A ไม่มี production atlas, animation หรือ Phase B asset และไม่เปิด auto-merge
