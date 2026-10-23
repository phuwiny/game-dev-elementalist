# Phase A — Style และ Concept

## Latest revision — 2026-10-23 / ความละเอียดตัวละคร 2 เท่า (Aclaire V4)

พินปฏิเสธ V3 เพราะภาพแตกและหน้าไม่ชัด และอนุญาตให้เพิ่ม budget ความละเอียดของตัวละครในเกมโดยรวม เริ่มที่ Aclaire พร้อมลดรายละเอียดผม เกราะ ดาบ รองเท้าตามจำเป็น. รอบนี้สร้าง [V4 source](../concept/aclaire_idle_seed_v4_source.png) ใหม่ด้วย built-in imagegen แล้ว [เก็บแกนดาบตรงเป็น source สุดท้าย](../concept/aclaire_idle_seed_v4_aligned_source.png) โดยยึด Aclaire v2 เป็นดีไซน์ และ Coin Quest local เป็นตัวอย่างคุณภาพภาพเท่านั้น. เก็บ V3 ไว้สำหรับเทียบ.

**ข้อเสนอสำหรับรีวิว:** logical frame 48×64, density 2, ภาพจริง 96×128, bottom-center origin, หันขวา. [PNG โปร่งใส 96×128](../previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png) ใช้จริง **247 สี** จากเพดานทดลอง 256; [ภาพเทียบ V3/V4](../concept/aclaire_idle_seed_v4_comparison.png) แสดงขนาดบนจอเท่ากันโดยจำลองการแสดงผลที่นุ่ม; [ภาพ 640×360](../previews/phase_a/2026-10-23_aclaire_seed_v4_640x360.png) เป็น static display probe. มี [raw nearest ×4](../previews/phase_a/2026-10-23_aclaire_seed_v4_256color_x4_nearest.png) สำหรับตรวจพิกเซล และ [display ×4](../previews/phase_a/2026-10-23_aclaire_seed_v4_256color_x4_display.png) สำหรับตรวจความอ่านง่าย.

**การทดลองลดสี:** [ตัวเลือก 60 สี](../previews/phase_a/2026-10-23_aclaire_seed_v4_64color_density2.png) ยังมีเม็ดสีและหน้าหยาบเมื่อดูใกล้ จึงไม่เสนอเป็นตัวหลัก. ตัว 247 สีมีตาขาว/ม่านตา แก้ม รูปกราม และปอยผมอ่านได้ชัดกว่า; ผม เกราะ และรองเท้าลดลายเล็กลงแล้ว. สีชุด Aclaire v2 ยังอยู่: ส้ม/ยางชมพู ตาฟ้า เสื้อชมพู/เกราะเงิน/สายดำ กางเกง tan เห็นต้นขา ถุงเท้า charcoal บูทดำขอบและพื้นขาว กำไลทอง ดาบเดียวในฝักหลัง ไม่มีผ้าคลุม. ด้าม/กันมือ/ฝักใน source สุดท้ายอยู่บนแนวต่อเนื่องเกือบตั้งตรง.

**ผลตรวจเทคนิค:** `build_aclaire_seed_v4.py` ตรวจ raster 96×128, logical 48×64, alpha 0/255, เท้าถึงแถว 127 และสีจริงไม่เกิน 256; metrics อยู่ใน [ไฟล์นี้](2026-10-23_aclaire_seed_v4_metrics.json). Source/prompt อยู่ใน [provenance](2026-10-23_aclaire_seed_v4_prompt.md). การ smooth ในภาพเทียบ/640×360 เป็นเพียงการจำลองด้วย PIL; **ยังไม่ได้ใช้ Phaser runtime จริง**. สี 247 ไม่ใช่ master palette 35 สีและเกินข้อกำหนด 16 สีเดิม จึงเป็นข้อเสนอ Phase A ไม่ใช่ production asset ที่ผ่าน validator ตาม ART_HANDOFF.

**ผลกระทบถ้าพินอนุมัติแนวความละเอียดใหม่นี้:** ผู้ดูแลฝั่ง code/spec ต้องปรับ ART_HANDOFF.md และ `src/assets/manifest.ts` รวมถึง loader/render scale ให้ใช้ density 2 โดยรักษา logical dimensions และ pivot ให้ตรง. Player V4 96×128 มีพื้นที่ภาพ 4 เท่าของ 48×64 และ 8 เท่าของ 32×48 เดิม; ไฟล์ RGBA ไม่บีบอัดต่อ frame เพิ่มจาก ~6 KiB (32×48) เป็น ~48 KiB. Atlas เดิมจำกัด 2048×2048 จึงต้องคำนวณจำนวน frame/padding, memory และโหลดจริงใหม่. ถ้าใช้แนวเดียวกันกับตัวละครอื่น: logical 32×32 → physical 64×64 (ภูต/ศัตรูทั่วไป), 48×48 → 96×96 (ศัตรูใหญ่), 32×48 → 64×96 (Spirit Knight); บอสขนาดใหญ่ต้องทดสอบ atlas/performance แยกก่อนขยาย. ยังไม่ได้ผลิต asset เหล่านี้หรือแก้ production code.

**รอพินรีวิว V4 เป็น idle seed/style ก่อนทำ animation strip และก่อน Phase B.**


## Latest revision — 2026-10-23 / idle seed v3 หลัง feedback ว่าภาพแตก

พินเห็นว่า V2 แตกและขอให้ลดรายละเอียดสีเพื่อให้หน้าเนียนขึ้น จึงสร้าง **V3 ใหม่** จาก source แบบ cel shading ที่ลดจุดสีในผม/หน้า แล้วแปลงเป็นกริด 48×64 ด้วย area sampling และเก็บ facial pixels, กางเกง และดาบบนกริดเอง ภาพ V2 ยังอยู่ครบเพื่อเทียบ; V3 ยังไม่ถือว่าอนุมัติ.

- [ภาพเทียบ V2 / V3 ที่ขยาย nearest พร้อม 1:1](../concept/aclaire_idle_seed_v3_comparison.png)
- [PNG โปร่งใส V3 48×64](../previews/phase_a/2026-10-23_aclaire_seed_v3_16color.png), [ขยาย ×8](../previews/phase_a/2026-10-23_aclaire_seed_v3_16color_x8.png), [ภาพเทียบฐาน 640×360](../previews/phase_a/2026-10-23_aclaire_seed_v3_640x360.png)
- [source](../concept/aclaire_idle_seed_v3_source.png), [prompt](2026-10-23_aclaire_seed_v3_prompt.md), [metrics](2026-10-23_aclaire_seed_v3_metrics.json), `tools/art/build_aclaire_seed_v3.py`

**ผลตรวจ:** V3 ใช้ 16 สีจาก master palette เดิม, RGBA 48×64, alpha 0/255, เท้าถึงแถว 63. ผมลดเม็ดสีสุ่มชัดเจน; ตาทั้งสองมีตาขาว/สีฟ้า/จุดสะท้อนที่จัดบนกริด หน้าและแก้มเป็นพื้นที่สีต่อเนื่อง กางเกงอ่านเป็นขาสั้นด้วยตะเข็บกลาง. ด้าม/กันมือ/ฝักอยู่บนแกนตั้งเดียวกัน มือว่างและดาบอยู่บนหลัง. ตรวจทั้งภาพ ×8 และ native 1:1 แล้ว.

**ข้อจำกัดที่ยังรอรีวิว:** ที่ 48×64 ใบหน้ามีความละเอียดน้อยกว่า Coin Quest 108×96 จริง และเฉดผิว/เงินเหลือเพียง 1–2 ขั้น ภาพ V3 จึงคมแบบ pixel art แต่ไม่เนียนเท่า Coin Quest เมื่อดูขยาย ถ้าพินต้องการขอบหน้าที่เนียนเท่านั้น อาจต้องทดลอง density 2 หรือการ scale แบบ smoothing ในเกมโดยผู้ดูแลฝั่งโค้ด; ยังไม่ได้เปลี่ยน runtime. ไม่ทำ animation หรือ Phase B.


## Latest revision — 2026-10-23 / idle seed v2 จาก Coin Quest local

**ยังไม่มี seed/style ที่ได้รับอนุมัติ และหยุดที่ Phase A** ผลล่าสุดอยู่หัวข้อนี้; ข้อความเรื่อง ZIP เข้าไม่ได้ด้านล่างเป็นประวัติรอบก่อน รอบนี้อ่าน local `D:/nilworkspaces/tqm-proj/boss-game` ได้แล้ว โดยไม่แก้ Coin Quest.

### ไฟล์ใหม่และวิธีผลิต

- [ภาพเทียบ Coin Quest / เดิม / ใหม่ 16 สี / ใหม่ 26 สี](../concept/aclaire_idle_seed_v2_comparison.png) — 1920×1080, มี native 1:1 และ nearest enlargement.
- [PNG โปร่งใส 48×64 / 26 สี](../previews/phase_a/2026-10-23_aclaire_seed_v2_master.png), [ขยาย ×8](../previews/phase_a/2026-10-23_aclaire_seed_v2_master_x8.png).
- [PNG โปร่งใส 48×64 / 16 สี](../previews/phase_a/2026-10-23_aclaire_seed_v2_16color.png), [ขยาย ×8](../previews/phase_a/2026-10-23_aclaire_seed_v2_16color_x8.png).
- [ภาพฐาน 640×360](../previews/phase_a/2026-10-23_aclaire_seed_v2_640x360.png) เป็น static scale probe ไม่ใช่ screenshot เกม.
- [source จาก built-in imagegen](../concept/aclaire_idle_seed_v2_source.png), [prompt และ provenance](2026-10-23_aclaire_seed_v2_prompt.md), [ผลวัด](2026-10-23_aclaire_seed_v2_metrics.json).
- Coin Quest: `2026-10-23_cq_idle_decoded.png`, `2026-10-23_cq_idle_x4.png`, `2026-10-23_cq_idle_data.json` ใน `art/previews/phase_a/` เป็นหลักฐานอ้างอิง ไม่ใช่ asset สำหรับ Elemental Spirit.
- `tools/art/extract_coin_quest_reference.cjs` อ่านข้อมูลจริงตามลำดับ loader; `tools/art/build_aclaire_seed_v2.py` ถอดภาพ reference, normalize, quantize, เก็บตา/ปาก/แกนดาบบนกริดและสร้างภาพเทียบซ้ำได้จาก source ที่เก็บไว้. ไม่ใช่การขยาย sprite เดิม.

### ข้อเท็จจริงจากไฟล์ Coin Quest

1. `index.html:404–406` โหลด `js/2026-10-15_character-art.js` แล้ว `js/2026-10-22_aclaire-walk.js` ก่อน `sprites.js`. ใช้ข้อมูลทั้งสองไฟล์ตามลำดับนี้ในการตรวจ.
2. `CQ.CharacterArt`: version `concept-2026-10-17-aclaire-arm-swing`, logical 54×48, ax=32, **density=2**, backing raster 108×96. Palette รวมมี 1465 entries รวม index 0 โปร่งใส; **idle Aclaire ใช้จริง 481 สี** ไม่ใช่ 1465 สีต่อ sprite.
3. ถอด idle แล้วตรงทุก RGBA pixel กับ `assets/characters/2026-10-16_aclaire-idle-hd.png`. Bounding box แบบ exclusive `(24,12,92,94)` = **68×82 physical pixels**, เท่ากับ 34×41 logical pixels ก่อน screen scale.
4. `tools/2026-10-15_build-character-art.cjs:16–50` ครอป source sheet, ใช้ scale ร่วม, resize แบบ Lanczos3, threshold alpha ที่ 128 แล้วปัดแต่ละ RGB channel เป็นขั้น 17. จึงมีสีระหว่างทางจำนวนมาก ไม่ใช่ master palette 16 สี.
5. `js/sprites.js:492–517` decode palette indices 3 hex digits และใช้ concept ก่อน fallback. `js/render.js:1752–1755` สร้าง backing canvas ตาม density; `1824–1826` เปิด image smoothing และ quality high สำหรับ density>1 แล้ววาด logical 54k×48k. ค่า k ขึ้นกับ viewport/DPR (`resize` บรรทัด 229 เป็นต้นไป), ไม่ได้ล็อกว่า display scale เท่าใดในเครื่องผู้ใช้. ภาพเทียบของเราขยาย nearest เพื่อเปิดให้เห็นข้อมูลจริง ไม่ได้จำลอง smoothing ของ runtime.

**การตีความเชิงภาพ:** จากภาพที่เปิดตรวจ Coin Quest มีพื้นที่หน้า/ดวงตามาก, ผมเป็นก้อนโค้งและไล่เฉดละเอียด, แก้ม/ตาขาวมี transition สี. density 2, สี 481 สีและ smoothing เป็นเหตุผลทางเทคนิคที่รองรับความนุ่ม; ยังยืนยันไม่ได้ว่าเป็นเฟรม/ขนาดจอเดียวกับภาพที่พินชอบทุกประการ.

### รีวิวด้วยตาและข้อจำกัด

- ใหม่ทั้งสองแบบมีหางม้าส้มฟู ยางชมพู หน้าสามส่วนหันขวา ตาฟ้า ปากยิ้ม และท่ายืนไม่สมมาตร. ตรวจภาพขยายจริงหลัง normalize แล้ว ไม่อ้างคุณภาพจากภาพ source ขนาดใหญ่.
- เสื้อชมพูคอตั้ง เกราะเงินกลางอกและสายดำยังแยกออกได้; เห็นต้นขา ถุงเท้าเข้ม และบูทขอบ/พื้นขาว. ดาบหนึ่งเล่มอยู่ในฝัก มือว่าง ไม่มีผ้าคลุม. เก็บส่วนด้าม/กันมือ/ฝักที่เปิดให้เห็นบนแกน x=18 หลัง sampling; ผมและตัวบังบางส่วน.
- แบบ 26 สีรักษาเงาผิว สี tan และสีเขียวพันด้ามได้มากกว่า. แบบ 16 สีทำให้กางเกงออกส้ม เงาบางส่วนแบนและสีเขียวพันด้ามถูกแทน; จึงเสนอเป็นภาพเทียบข้อจำกัด ไม่อ้างว่ารักษารายละเอียดได้ครบเท่าแบบ 26 สี.
- ยังมี pixel clusters เล็กในผม และตาไกลแคบกว่าตาใกล้; ใบหน้า 48×64 ไม่ละเอียดเท่า Coin Quest 108×96. นี่เป็น seed candidate สำหรับให้พินรีวิว ไม่ใช่ผลอนุมัติความตรง reference.
- ขอบเขตตัวใหม่ 38×62 px เทียบเดิมสูง 55 px: ทั้งสองอยู่ในกรอบ 48×64 เท่ากันแต่ตัวใหม่กินพื้นที่จอมากขึ้น. แสดงเท้าฐานเดียวกันใน scale probe.

### ผลตรวจและ assumptions

- ใช้ built-in imagegen ตาม skill imagegen; sprite-pipeline ระบุเริ่ม animation จาก approved seed จึงไม่ได้ทำ strip.
- ทุกสีของทั้งสองตัวเลือกอยู่ใน master 35 สีเดิม, alpha 0/255, PNG RGBA 48×64, เท้าถึงแถว 63. แบบ 26 สี **เกินข้อกำหนด 16 สี** โดยตั้งใจเพื่อรีวิวทางเลือก; ไม่แก้ master palette และไม่วางใน public/assets.
- `build_aclaire_seed_v2.py` มี assertions ตรวจเฉพาะ candidate ใหม่และ scale probe. `validate_phase_a.py` ตรวจชุดเดิมผ่าน แต่ไม่ได้ครอบคลุม candidate ใหม่; ไม่อ้างว่ารวมผ่าน production acceptance.
- `tools/validate_assets.py` ยังไม่มี: ผลเรียก exit 2; ไม่สร้าง validator ปลอม.
- รอบนี้ `npm run dev` เริ่มไม่ได้เพราะไม่มี npm ใน PATH และ checkout ไม่มี node_modules. จึงไม่มี browser/runtime verification รอบใหม่; smoke screenshot ในรายงานเก่าเป็นผลจากรอบก่อน.
- Assumptions: ใช้ idle ปกติไม่เปลี่ยน hue ของ Coin Quest เป็นตัวอย่าง; จัดสีและ silhouette ใหม่ตาม costume v2; ให้ PNG native 48×64 เป็นตัวตัดสิน style มากกว่าภาพ source.
- ก่อนใช้จริง ผู้ดูแลต้องอนุมัติและปรับ ART_HANDOFF.md, manifest/frame size, atlas/FX alignment, origin และ collision ที่อาจเกี่ยวข้อง. ถ้าเลือก 26 สีต้องแก้ข้อจำกัดสีด้วย; ไม่แก้ไฟล์นอก art/tools-art เอง.

**รอพินรีวิวหน้าตา/ผม/สัดส่วน และเลือกทาง 16 หรือ 26 สี ก่อน animation หรือ Phase B. ไม่มี merge หรือ auto-merge.**

วันที่ 23 ตุลาคม 2026 · branch `art/phase-a` · **ผู้ใช้เลือกแนวลดรายละเอียด A และขอทดลอง 48×64; ยังรออนุมัติ style/seed**

สถานะส่ง GitHub: **ส่ง branch และเปิด [draft PR #3](https://github.com/phuwiny/game-dev-elementalist/pull/3) เข้า main แล้ว** หลังผู้ใช้ปรับสิทธิ์ GitHub การส่งครั้งแรกติด HTTP 403 แต่การลองใหม่สำเร็จ ข้อความ PR อยู่ใน `phase_a_pr.md`

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
- `art/reports/phase_a_pr.md` — title/body สำหรับ draft PR #3

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

- concept board ครบ 16 ไฟล์ ขนาด 1920×1080, RGBA และ naming ถูกต้อง
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

- ผู้ใช้เลือก **แนว A** แล้ว แต่ขอทดลอง 48×64; รอบนี้รอรีวิว seed ใหม่นี้และภาพ Coin Quest ต้นฉบับก่อนล็อกขนาด/ภาพ
- อนุมัติ style guide, palette เดิม 35 สี และแนวทางลดรายละเอียดของภูตหรือขอปรับ
- รีวิว silhouette ศัตรู, จุดอ่อนบอสที่เสนอ และบรรยากาศ 5 โลก; ชี้จุดที่ต้องปรับก่อนผลิต asset จริง

**หยุดที่ Phase A — ต้องมีคำอนุมัติ style และ seed 48×64 จากผู้ใช้ก่อนเริ่ม Phase B ไม่ตีความการเปิดหรือ merge PR ว่าเป็นคำสั่งเริ่ม Phase B อัตโนมัติ**

## Revision: Aclaire 48×64 ตาม feedback (23 ตุลาคม 2026)

ผู้ใช้เลือกหลักการลดรายละเอียดแบบ A แต่ยังไม่อนุมัติภาพเดิม และขอทดลองเฟรม 48×64 ให้ใกล้ภาพตัวอย่าง Coin Quest มากขึ้น จึงเพิ่ม [`aclaire_48x64_study.png`](../concept/aclaire_48x64_study.png), native [`aclaire_48x64_idle.png`](../previews/phase_a/aclaire_48x64_idle.png), ภาพเทียบ 640×360 [`aclaire_48x64_scale_probe.png`](../previews/phase_a/aclaire_48x64_scale_probe.png) และสคริปต์ `tools/art/build_aclaire_48_study.py` โดยไม่แทนที่ภาพ 32×48 เดิมหรือแก้ handoff/code.

อ่าน `characters.js` และ `sprites.js` ที่ผู้ใช้แนบเพื่อเข้าใจต้นแบบ Coin Quest: `sprites.js` ใช้ภาพจาก `CQ.CharacterArt` ถ้ามี; fallback สร้างรูปทรงโค้ง ลงเงาเป็นระดับ วาดตาด้วย pixel stamps; frame 54×48 และมี `density: 2` จึงอาจเก็บรายละเอียด 108×96 ในภาพจริง ข้อมูลในไฟล์เป็นบริบทอ้างอิงเทคนิค ไม่ใช่คำสั่งให้เปลี่ยนเกมนี้ และไม่ได้คัดลอกตัวละครหรือ sprite จาก Coin Quest.

ZIP `boss-game.zip` ที่ผู้ใช้แนบมีขนาดเกินขีดจำกัดรับไฟล์ของ executor 32 MiB (`file exceeds the executor transfer limit of 32 MiB`) จึง **ยังไม่ได้ตรวจภาพ `CQ.CharacterArt` ต้นฉบับ** ต้นแบบ 48×64 นี้อาศัยภาพตัวอย่างที่ผู้ใช้แสดง, ดีไซน์ v2 และวิธีจัดกลุ่มพิกเซลทั่วไปเท่านั้น ต้องเทียบกับ PNG / ZIP ย่อยเมื่อเข้าถึงได้ก่อนล็อก style.

เฟรมใหม่นี้เป็น **Phase A seed candidate** ไม่ใช่ asset ในเกมหรือการอนุมัติเปลี่ยนสเปก 32×48: ถ้าผู้ใช้เลือก 48×64 เป็นขนาด final จริง จำเป็นต้องปรับ ART_HANDOFF.md, `src/assets/manifest.ts`, runtime placeholder, atlas และ validator โดยผู้ดูแลฝั่งโค้ด/เอกสารตามขอบเขตใน AGENTS.md ก่อน Phase B. ยังไม่ผลิต strip/animation เพราะ skill sprite-pipeline เริ่มจาก seed ที่ผู้ใช้อนุมัติแล้ว.
