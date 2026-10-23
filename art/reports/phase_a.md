# Phase A — Style และ Concept

วันที่ 23 ตุลาคม 2026 · branch `art/phase-a` · **รอผู้ใช้เลือก A/B และอนุมัติ style**

อ่าน `AGENTS.md`, `ART_HANDOFF.md` ครบ รวมถึง `docs/GDD.md`, prompt v2 และภาพอ้างอิงก่อนผลิตงาน ยึด `aclaire_character_sheet_v2.png` และ `spirit_*.jpg` ทั้งสี่เป็นหลัก ไม่ใช้ดีไซน์เสื้อหัวใจ/กางเกงยีนส์เก่า

**จบขอบเขตการผลิต Phase A และหยุดที่ gate นี้ ไม่มีการเริ่ม Phase B** ไม่ได้สร้าง production atlas, animation, font, runtime asset หรือแก้โค้ดเกม การอนุมัติภาพยังเป็นหน้าที่ผู้ใช้

## 1. ไฟล์ที่สร้าง

ทุก concept board เป็น PNG RGBA 1920×1080 ภาพ illustration ถูกจัดบน canvas พร้อมบันทึกเทคนิค โดยไม่ยืดภาพต้นทาง 1672×941 หรืออ้างว่าเป็น native 1920 illustration ส่วน pixel studies วาดบนกริดจริงแล้วขยายด้วย nearest-neighbor เท่านั้น

| ไฟล์ | เนื้อหา |
| --- | --- |
| [master_palette.png](../palette/master_palette.png) | 35×1 RGBA สีครบและเรียงตามหัวข้อ 2 |
| [master_palette.hex](../palette/master_palette.hex) | 35 ค่า hex ไม่เพิ่มหรือเปลี่ยนสี |
| [style_guide.png](../concept/style_guide.png) | swatch, outline 1 px, วัตถุเงา 3 ระดับ, แสงซ้ายบน, tile 3×3, Aclaire 1:1 และ ×8 |
| [aclaire_pixel_study.png](../concept/aclaire_pixel_study.png) | A/B อย่างละ idle 32×48 และ attack 64×48 ที่ 1:1 และ ×8 |
| [aclaire_action_poses.png](../concept/aclaire_action_poses.png) | ฟันแนวนอน / เฉียงขึ้น / ลงพื้น และท่าใช้ไฟ น้ำ ลม ดิน |
| [spirits_sheet.png](../concept/spirits_sheet.png) | ภูต 4 ตน, expression 3 แบบต่อตน, pixel 32×32 ที่ 1:1 และ ×6 |
| [enemies_lineup.png](../concept/enemies_lineup.png) | ศัตรูครบ 10 ตัว พร้อม Aclaire และกรอบเทียบขนาด |
| [boss_bramble_king.png](../concept/boss_bramble_king.png) | ต้นไม้สวมมงกุฎหนาม; เผาเถาวัลย์เปิดปมกลางอก |
| [boss_magma_serpent.png](../concept/boss_magma_serpent.png) | งูลาวา; แพลตฟอร์มลาวาแช่แข็งและจุดอ่อนใต้ขากรรไกร |
| [boss_tempest_roc.png](../concept/boss_tempest_roc.png) | นกพายุ; เสาหินและแกนลมใต้ขนอก |
| [boss_moat_hydra.png](../concept/boss_moat_hydra.png) | 3 หัว; วาล์วระบายน้ำและเหงือกฐานคอ; แยกลำตัวใต้น้ำเป็น background |
| [boss_hollow_warden.png](../concept/boss_hollow_warden.png) | ผู้พิทักษ์ 4 ธาตุ; ตราอกและวงจรแพ้ทาง |
| [world_w1_keyframe.png](../concept/world_w1_keyframe.png) | Ember Woods — ใบไม้แดงส้ม รากไม้ ซากเสาหิน |
| [world_w2_keyframe.png](../concept/world_w2_keyframe.png) | Tidal Caverns — ถ้ำน้ำเงิน คริสตัล น้ำและลาวา |
| [world_w3_keyframe.png](../concept/world_w3_keyframe.png) | Sky Cliffs — หน้าผา เมฆ สะพานเชือก กังหัน |
| [world_w4_keyframe.png](../concept/world_w4_keyframe.png) | Stone Citadel — ปราการ คูน้ำ เฟืองและวาล์ว |
| [world_w5_keyframe.png](../concept/world_w5_keyframe.png) | Spirit Sanctum — วิหารลอยฟ้าม่วง ผสม 4 โลก |

ทุก world board มีแถบสีที่วาดด้วยค่า hex จาก master palette จริงด้านล่าง แถบสีใน illustration ใช้ดูบรรยากาศเท่านั้น

ไฟล์สนับสนุนใน `art/previews/phase_a/`:

- `aclaire_a_idle.png`, `aclaire_a_attack.png`, `aclaire_b_idle.png`, `aclaire_b_attack.png` — native studies 4 ไฟล์
- `burnil_study.png`, `wata_study.png`, `valvaliz_study.png`, `eathy_study.png` — native studies 4 ไฟล์
- `spirits_pixel_studies.png` — แผ่นเทียบภูต 1:1 / ×8 เพิ่มเติม
- `tile_nine_patch.png` — tile study 48×48 (3×3 ช่องขนาด 16 px) ไม่ใช่ production tileset
- `fire_readability_probe.png` — เปรียบเทียบ Aclaire กับ Burnil บนพื้นเข้ม/ไม้/ส้ม เป็น static color probe ไม่ใช่ in-game mockup
- `runtime_placeholder_smoke.png` — screenshot เกมเดิม 1280×720 ระหว่างตรวจ dev server; ไม่ใช่ asset ใหม่หรือ mockup Phase C

เครื่องมือและหลักฐาน:

- `tools/art/build_phase_a_studies.py` — วาด palette, pixel studies, style guide และ color probe แบบ deterministic ด้วย Pillow
- `tools/art/compose_phase_a_boards.py` — จัด illustration และแถบข้อมูลลง board; รับ directory ภาพต้นทางจาก image generation เป็น argument ภาพต้นทางอยู่นอก repo และไม่ได้อ้างว่า regenerate ได้จาก seed
- `tools/art/validate_phase_a.py` — ตรวจเฉพาะงาน Phase A ไม่ใช่ validator ตามหัวข้อ 9
- `art/reports/phase_a_checks.txt` — ผลตรวจไฟล์จริง
- `art/reports/phase_a.md` — รายงานนี้

ไม่มีการแก้ไฟล์ที่มีอยู่เดิม รวมถึง `art/reference/`, `src/`, `tests/`, `docs/`, config, maps หรือ audio

## 2. ผลตรวจ

### คำสั่งที่ AGENTS.md ระบุ

`python3 tools/validate_assets.py` → **exit 2**:

```text
python3: can't open file '/workspace/game-dev-elementalist/tools/validate_assets.py': [Errno 2] No such file or directory
```

repo เริ่มต้นยังไม่มีไฟล์นี้และไม่มี `public/assets/` ตัว validator เป็นรายการส่ง Phase B ตามหัวข้อ 10 จึงไม่ได้สร้างแทนหรือรายงานว่าผ่าน งานนี้ส่งเป็น **draft PR สำหรับรีวิว Phase A** พร้อมเปิดเผยข้อขัดแย้งของ gate ไม่ได้ผ่าน production acceptance ตามหัวข้อ 9

`npm run dev -- --host 127.0.0.1` → Vite ready จากนั้นเปิดด้วย Chromium และกด Enter เข้าเกม: พบ canvas 1 ตัว, title `Elemental Spirit`, **pageerror 0** ตรวจ screenshot แล้ว HUD และด่าน placeholder แสดงได้ ไม่มี concept ถูกโหลดเป็น runtime asset ผลนี้เป็น smoke check เท่านั้น ไม่ใช่การทดสอบ asset ใหม่ในเกม

คำสั่งเริ่มต้นใน sandbox ถูกปฏิเสธการเปิด port (`EPERM`) และ Git ติดต่อ proxy ไม่ได้ หลังใช้ sandbox escalation ที่อนุญาตแล้ว dev server และ Git remote ทำงานได้

### การตรวจ Phase A โดยเฉพาะ

`python3 tools/art/validate_phase_a.py` → **exit 0** (ผลเต็มใน `phase_a_checks.txt`):

- concept board ครบ 15 ไฟล์ ขนาด 1920×1080, RGBA และ naming ถูกต้อง
- master palette 35×1 ตรงกับไฟล์ hex และค่าที่กำหนดทุกสี
- Aclaire: idle 32×48 / attack 64×48; ตัวสูง 40 px; เท้าถึงแถว 47; ใช้ 14–15 สีต่อภาพ
- ภูต: 32×32 ใช้ไม่เกิน 16 สี; Burnil/Wata/Valvaliz สูงไม่เกิน 24 px; Eathy ตัวกลมสูง 20 px และเผื่อหินวงโคจร
- native studies ทุก pixel ทึบอยู่ใน palette และ alpha มีเฉพาะ 0/255
- ไฟล์ข้อความเป็น UTF-8 ไม่มี BOM และใช้ LF

ตรวจด้วยตา: silhouette หางม้า/ฝัก/บูท, ชมพูรอบเกราะเล็ก, ต้นขา→ถุงเท้า→ขอบบูท, ดาบบนแกนตรงใน native study, ไม่มีด้ามดาบสำรองบนหลังในท่า attack; ภูตมีลักษณะประจำตัวครบ; lineup ครบ 10 ชื่อ; Hydra มี 3 หัว; world tone แยกกัน

## 3. Assumptions และข้อเสนอ

### ตัวเลือก Aclaire

| | A — Clean clusters | B — Faceted detail |
| --- | --- | --- |
| เกราะอก | เงิน 2 ระดับ กลุ่มสีเล็ก อ่านรวดเร็ว | เงิน 3 ระดับ มีเหลี่ยมและเงามากขึ้น |
| ถุงเท้า | charcoal เรียบ แยกจากบูทดำด้วยขอบขาว | เพิ่มแนวผ้า 1 px ซึ่งอาจดูคล้ายโลหะที่ 1:1 |
| แนวดาบ idle | แกนตั้ง x=8 ถูกผมบังบางส่วน | แกนตั้ง x=9 ซ้อนหลังลำตัวมากขึ้น |
| ดาบ attack | ชักออกจากฝัก เหลือฝักเปล่าบนหลัง | หลักเดียวกัน |

**ข้อเสนอของผู้ทำ: เลือก A** เพราะอ่านถุงเท้าเป็นผ้าและรักษาชมพูกับเกราะเล็กได้ชัดกว่า B ที่ขนาดจริง ข้อนี้ยังไม่ใช่การเลือกแทนผู้ใช้

ใช้หัวโตประมาณ 2.5 หัว และลดรายละเอียดที่ไม่สามารถใส่ครบภายใน 16 สี เช่น เงาผิว/สีเข็มขัด ไม่เพิ่ม palette ใน Phase A ส่วนสีผมใช้ fire ramp ตามสเปก ผล probe ยังเห็นตัวจากเส้นขอบเข้มและเสื้อชมพู แต่เมื่อต้องซ้อน FX ไฟจริงให้เว้นช่องว่างจากหางม้าและตรวจ 640×360 อีกครั้งใน Phase C

ภาพท่าโจมตีเป็น key pose illustration ไม่ใช่ animation frames; ท่า overhead คือช่วงตั้งดาบก่อนฟันลงพื้น ภาพ casting เป็นภาพแสดงท่าทางสามส่วน ไม่ใช่ sprite side view ที่ใช้ flip ใน engine

### ภูต

- Burnil: ใจร้อน/กล้าหาญ/ตกใจ; เปลวหนาม ตาคม เขี้ยวคู่
- Wata: อ้อน/ร้องไห้/ดีใจ; จุกน้ำ ตาโต แก้มชมพู ปาก ω
- Valvaliz: ขี้อาย/ตกใจ/มั่นใจเงียบ ๆ; ผมยาวเขียว ปีกสองคู่ เดรสฟ้า ถุงเท้าดำ ปรับผมเป็น mint ramp ใน pixel เพื่อคง wind identity
- Eathy: จุกจิก/สงบ/ตั้งสมาธิ; ผมสีน้ำตาล ผ้าขาวกลางหน้าผาก ลูกหินดำ ใช้ amber highlight เชื่อม earth identity

### ศัตรู บอส และโลก

รายละเอียดเชิงภาพที่ GDD ไม่กำหนดเป็นข้อเสนอ: หัวใจปมไม้ของ Bramble, ช่องใต้กราม Serpent, แกนลมอก Roc, เหงือก Hydra และตราอก Warden รวมถึงหน้าต่างเปิดจุดอ่อน/ข้อความ stun เป็นแนวคิดภาพสำหรับคุยกับผู้พัฒนา ไม่ได้อนุมัติ gameplay ใหม่หรือแก้โค้ด

World keyframes เป็นภาพบรรยากาศ ไม่ใช่แผนที่ collision และไม่ใช่ parallax ที่ต่อแนวนอนได้จริง ฉากอาจมี perspective เพื่อเล่าบรรยากาศ การผลิต tiles/3 parallax layers และ mockup จริงอยู่ Phase C/D เท่านั้น

## 4. ความขัดแย้งและข้อจำกัด

1. `AGENTS.md` กำหนด validator exit 0 ก่อน PR แต่ handoff วางการสร้าง validator ไว้ Phase B และ repo ไม่มีไฟล์นี้: เปิดเผยผล exit 2 และใช้ draft PR ไม่ข้าม gate ด้วย validator ปลอม
2. GDD บอกเพิ่มศัตรูโลกละ 2 แบบ แต่ตารางระบุ W1=3, W2=2, W3=2, W4=2, W5=1: ใช้รายชื่อและโลกจากตารางทั้ง 10 ตัว
3. GDD roadmap วาง Phase A คู่ Dev 0 ขณะที่ handoff บอกส่งก่อน Dev 1: ไม่กระทบขอบเขตงานหรือการหยุดรออนุมัติ
4. ภาพ illustration ที่ image generation สร้างมีข้อความบรรยายเสริม เช่นความสูงเป็นเมตร/รางวัลในภาพ Hydra และสัดส่วน heroine ย่อยที่ไม่ใช่ chibi: สิ่งเหล่านี้ **ไม่ใช่ข้อกำหนดใหม่**; ค่าพิกเซลใน footer, native study และ handoff มีอำนาจเหนือภาพประกอบ จดข้อจำกัดไว้เพื่อไม่ให้ผู้พัฒนานำข้อความในภาพไปตั้ง gameplay
5. ไม่มีการพบ path ที่ขัดแย้งใน `src/assets/manifest.ts` ส่วน atlas/ท่าที่ยังไม่มีใน manifest เป็นรายการของ development ภายหลังตามหมายเหตุในไฟล์ ไม่ได้เพิ่มเอง
6. ยังไม่ได้ตรวจ animation jitter, atlas packing, seamless background หรือ foreground contrast ในเกมจริง เพราะเป็นงาน Phase B–D ไม่ใช่ผลที่อ้างว่าผ่านแล้วในชุดนี้

## 5. สิ่งที่รอผู้ใช้ตัดสินใจก่อน Phase ถัดไป

- เลือก **Aclaire A หรือ B** หรือระบุส่วนที่อยากผสมจากทั้งสองแบบ
- อนุมัติ style guide, palette เดิม 35 สี และแนวทางลดรายละเอียดของภูตหรือขอปรับ
- รีวิว silhouette ศัตรู, จุดอ่อนบอสที่เสนอ และบรรยากาศ 5 โลก; ชี้จุดที่ต้องปรับก่อนผลิต asset จริง

**หยุดที่ Phase A — ต้องมีคำอนุมัติ style และการเลือก pixel study จากผู้ใช้ก่อนเริ่ม Phase B ไม่ตีความการเปิดหรือ merge PR ว่าเป็นคำสั่งเริ่ม Phase B อัตโนมัติ**
