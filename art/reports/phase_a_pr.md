# art(concept): Phase A style and concept review

Base: `main` · Head: `art/phase-a` · Draft: yes

ชุดรีวิวภาพตาม ART_HANDOFF.md หัวข้อ 8 และ 10 โดยยึด Aclaire v2 และภูตต้นฉบับทั้งสี่ เพิ่ม palette 35 สี, style guide, Aclaire pixel study A/B, action poses 7 ท่า, ภูตพร้อมสีหน้าและ pixel studies, ศัตรู 10 ตัว, บอสพร้อมจุดอ่อน 5 ตัว และ world keyframes 5 โลก

เริ่มรีวิวที่ [Aclaire A/B](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/aclaire_pixel_study.png), [style guide](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/concept/style_guide.png) และ [รายงาน Phase A](https://github.com/phuwiny/game-dev-elementalist/blob/art/phase-a/art/reports/phase_a.md)

## Validation

- `python3 tools/art/validate_phase_a.py`: PASS — 15 boards 1920×1080, 8 native studies, exact 35-color palette, binary alpha, frame sizes and color budgets.
- Vite + Chromium smoke: เข้าเกมได้, canvas 1 ตัว, pageerror 0; screenshot เป็น placeholder เดิม ไม่ใช่ runtime asset ใหม่
- `git diff --check`: PASS
- `python3 tools/validate_assets.py`: exit 2 — repo ไม่มีไฟล์นี้; handoff กำหนดสร้างใน Phase B จึงไม่สร้างล่วงหน้าและไม่อ้างว่า production validation ผ่าน

แก้เฉพาะ `art/` และ `tools/art/`; reference และ game code ไม่เปลี่ยน ภาพ illustration เป็น concept; ข้อเสนอจุดอ่อน/ข้อความเพิ่มเติมในภาพไม่ใช่ gameplay ที่อนุมัติแล้ว รายละเอียดและข้อจำกัดอยู่ในรายงาน

## Review gate

เลือก Aclaire A หรือ B และอนุมัติ style ก่อนเริ่ม Phase B งานหยุดที่ Phase A ไม่มี production atlas, animation หรือ Phase B asset และไม่เปิด auto-merge
