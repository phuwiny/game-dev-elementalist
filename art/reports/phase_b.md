# Phase B — first production movement atlas, 2026-10-24

This delivery follows merged PR #5 and is based on main `6a78a06` (including Claude's player V4 integration, PR #6). It supersedes earlier status notes below. Full Phase B is not complete.

## 1. Files delivered

- `public/assets/sprites/player/player.png` + `player.json`: 1024x262 RGBA atlas, 18 untrimmed/unrotated frames, 2px padding, Phaser JSON Hash. Frames retain physical sourceSize and pivot (0.5, 1); image scale metadata is 1, while runtime handles density 2.
- `public/assets/animations.json`: idle 6 @ 8fps, run 4 @ 8fps, jump_up 2 @ 10fps, jump_peak 2 @ 10fps, fall 2 @ 10fps, land 2 @ 14fps. Only idle/run/fall loop in the game.
- `art/frames/player/`: the 18 individual physical frame PNGs, matching table 5.1 naming.
- `tools/art/build_player_movement_atlas.py`, `tools/art/pack_atlas.py`: reproducible normalization and packing. Existing approved studies and reference images remain unchanged.
- `art/previews/phase_b/2026-10-24_player_movement/`: six APNG motion loops, six nearest-neighbor review boards, and a 640x360 overview.
- `art/previews/phase_b/2026-10-24_player_movement_review.html`: Phaser atlas review at 640x360, scale 0.5, pause/flip/speed controls and the user's requested 16x46 body guide.
- `art/mockups/2026-10-24_aclaire_v4_world1_style_test.png`: pre-Phase-C 640x360 comparison. Aclaire remains 48x64 on screen; enemies and 16px tile samples are displayed at main's new world scale 1.5.
- `art/previews/phase_b/2026-10-24_world1_style_samples/`: two 32x32 enemy samples and four 16x16 tile samples, review only; they are NOT a production World 1 pack.
- Source sheets under `art/concept/2026-10-24_aclaire_movement_batch_source.png` and `2026-10-24_world1_style_samples_source.png`; generation method and prompts in `art/reports/2026-10-24_production_generation_prompts.md`.
- Metrics: `2026-10-24_player_movement_metrics.json`, `2026-10-24_world1_style_metrics.json` in this report directory.
- Validator now accepts the approved 192x128 physical attack contract. Fixed a pre-existing missing-animations check that ran before atlas discovery. Added packet coverage/packing/anchor tests under `tools/art/`.

## 2. Validation and visual results

- `tools/validate_assets.py`: **PASS, 0 errors, exit 0** using bundled Python 3.
- `python -m unittest discover -s tools/art -p 'test_*.py'`: **10 tests passed**. Includes all 18 frame names, counts/timing, lossless atlas extraction, untrimmed metadata, baseline, and unchanged opaque idle-seed pixels.
- All 18 physical frames: binary alpha, soles on row 127. Atlas union: exactly 247 approved V4 colors. Run is 128x128; all other delivered frames are 96x128.
- Horizontal eye-center range within each animation: idle 2.169 physical px (intentional breathing), run 0.574, jump_up 0.007, jump_peak 0.129, fall 0.721, land 0.254. These measurements are anchor diagnostics, not a guarantee of subjective animation quality.
- Phaser review loaded all six animations with no warning/error logs; pause and left-facing flip were checked. Sole baselines stay aligned. The four-key run remains deliberately sparse and should be judged visually by Pinz.
- Dev server: bundled `pnpm run dev --host 127.0.0.1 --port 5174` (same Vite dev script; npm not on PATH). After receiving PR #6, opened `/?lowres` for a 640x360 render, entered World Map -> level 1-1, moved right, jumped, observed fall and returned to idle. Screenshots show correctly sized V4 with soles meeting the floor, without persistent sinking/floating. This is a smoke check, not exhaustive collision/playthrough validation.
- Before PR #6 arrived, the old main rendered V4 oversized. That earlier result is superseded by the check above.
- Style test: Moss Slime 13 colors, Thorn Beetle 12; four tiles use 10/11/12/12 colors, union 19, all from master palette. This mockup is an art comparison, not an engine screenshot or a tile-seam acceptance pass.

## 3. Assumptions and production method

- Reused approved idle, four-frame run and two-frame jump-up sources. Idle frame 000 preserves every opaque seed pixel and alpha; invisible RGB is cleared. Blink colors outside the locked palette are mapped into it.
- Run receives a baseline translation, not a new redraw. Jump-up uses one shared 0.94 nearest-neighbor scale to retain the full ponytail while centering the face/body in a 96px-wide production frame. The old approved preview files are untouched.
- New peak/fall/land poses were generated together in one six-slot sheet using the built-in imagegen tool with approved idle/jump and owner character sheet references. One shared 0.25 nearest-neighbor scale is applied to all six new frames, then binary alpha, V4 palette mapping, common horizontal eye anchor and last-row sole placement. There is no individual fit-to-height resizing.
- APNG review loops intentionally repeat even non-looping game actions. Animation manifest retains their correct non-looping values.
- The pre-Phase-C sample sheet was generated with built-in imagegen from the existing enemy concept sheet, then normalized/quantized and composed using the project's Python/Pillow art workflow. No CLI image generation was used.

## 4. Remaining runtime/spec issues for Claude (no src changes made)

1. **Partial player atlas fallback is missing.** Preload only creates placeholders when the entire atlas fails. The 10 undelivered player animations therefore log missing frames: double_jump, cast, dash, glide, ground_slam, attack_1/2/3, hurt, dead. Please supply per-animation placeholder fallback before merging this partial production atlas for normal gameplay. The art request explicitly permits placeholders for those actions; the present code does not yet implement that behavior. Do not treat the successful movement smoke check as acceptance of those actions.
2. **animations.json overrides can be ignored.** In `PreloadScene.preload`, the `else this.failed.add(ANIMATIONS_KEY)` is attached to the map loop's `if (level.map)`, so mapless lab/graybox entries mark animations failed even when the JSON loaded. Current manifest happens to match this packet's counts/fps after PR #6, but future art overrides will not apply reliably. Claude owns the fix.
3. **Hitbox contract differs:** Pinz requested about 16x46 logical. Main's latest ART_HANDOFF now states 21x57 logical, corresponding to 14x38 world units at world scale 1.5. Artwork remains the approved V4 proportions; no game/spec changes were made here. Review page's 16x46 guide represents Pinz's request, not the current gameplay body.
4. The style mockup follows main's latest world scale 1.5 (16px tiles appear 24px; 32px enemy frames appear 48px), with V4 on-screen size unchanged. Source pixel sizes and palette limits are unchanged.

## 5. Review gates and next work

- Review the first six movement animations and the pre-Phase-C style test. V4 is visibly more detailed than the low-color enemies; tiles are denser than the character silhouettes and are samples requiring style approval.
- **Stop before Phase C until Pinz approves the 640x360 comparison.** No World 1 production atlas, tileset/TSX, background or boss was produced.
- Keep this first production delivery as a draft PR until Claude reconciles partial-atlas fallback and the runtime/spec issues above. Full player moveset and other Phase B atlases remain future work.

---

# Phase B — merge handoff, 2026-10-24

This status supersedes the historical notes below. This PR consolidates approved Phase A concept work and Phase B Aclaire studies; it is not completion of all Phase B production assets.

## 1. Files created or changed

- Restored `src/assets/manifest.ts` from `origin/main` as explicitly requested. There is no final diff in `src/`, `tests/`, `docs/`, or project configuration versus main.
- Merged `origin/main` into `art/phase-b` without conflicts. Preserved the main additions for enemies_w1, Bramble King, graybox tiles, world-map nodes and boss bars. Restored main's scope restrictions; retained the existing V4 art additions.
- Updated this report. Existing Phase A concept/palette files, Phase B idle/run/jump previews, build scripts, V4 palette and validator are included in the PR. Approved reference files and seed images are unchanged.
- Full branch file inventory: [2026-10-24_phase_b_changed_files.txt](2026-10-24_phase_b_changed_files.txt).

## 2. Validation results

- Ran `tools/validate_assets.py` with the bundled Python 3 interpreter: **exit 1**, `no production assets to validate`, `Validation: FAILED (1 errors)`.
- `public/assets/` contains only game-owned maps, which are excluded from art validation. No production player atlas or animations.json exists yet. The validator was not weakened to make an empty asset set pass.
- Pinz explicitly chose: open the PR with this failed result disclosed, then wait for merge before producing the atlas.
- Existing validator regression suite: `python -m unittest discover -s tools/art -p test_validate_assets.py`, **5 tests passed**. This is not a production-validation pass.
- Node is installed but npm is absent from PATH. Installed dependencies with bundled pnpm, without changing package.json or lockfiles, and ran the same dev script via `pnpm run dev --host 127.0.0.1 --port 5174`.
- Browser smoke check: Title -> Adventure world map -> level 1-1 rendered successfully. Screenshots were inspected; the game still displays main's placeholders. V4 scale, floor contact and motion/jitter have NOT been verified in Phaser.

## 3. Assumptions and approved production contract

- Aclaire V4 is the chosen style, with the exact approved 247-color palette; other sprites remain at 16 master-palette colors and tilesets at 24.
- Density 2, runtime scale 0.5, bottom-center origin, soles on the last frame row.
- `idle`, `jump_up`, `jump_peak`, `fall`, `land`, `double_jump`, `cast`, `dash`, `glide`, `hurt`, `dead`: 48x64 logical / 96x128 physical.
- `run`: 64x64 logical / 128x128 physical, four frames.
- `attack_1`, `attack_2`, `attack_3`: 96x64 logical / 192x128 physical, replacing the temporary 64x48 allocation. Body stays at the same bottom-center anchor as idle; blade extends at most 40 logical px right of the body center.
- Body artwork should fit approximately 16x46 logical; hair and ponytail may exceed this. Claude owns the corresponding game hitbox changes.
- Names and counts remain table 5.1, except the already approved four-frame run. First production delivery after merge: idle 6, run 4, jump_up 2, jump_peak 2, fall 2, land 2 (18 frames total). Other actions may use game placeholders.
- Production destination: `public/assets/sprites/player/player.png` and `player.json`, Phaser JSON Hash, no trimming or rotation, 2px padding; add matching entries to `public/assets/animations.json`.

## 4. Specification/runtime differences and ownership

- Claude owns `src/assets/manifest.ts` and the player-frame size sections of `ART_HANDOFF.md` in `feat/player-v4`. This cleanup does not implement those new size edits; existing V4 sections retain historical attack dimensions until Claude updates them. The contract above is the user's newer instruction and takes precedence.
- `tools/validate_assets.py` still contains historical 128x96 attack checks; update to 192x128 when production work begins under the new contract. No attack assets are currently shipped.
- GDD/runtime may still describe older player dimensions. Runtime scaling, body offsets, placeholder fallback for missing animations and scene rendering need reconciliation by Claude before V4 gameplay acceptance.
- Full Phase B (`spirits`, `fx`, `objects`, `items`, `ui`, font and complete player moveset) remains unfinished.

## 5. Decisions and next gate

- Wait for the Phase B consolidation PR to merge before beginning production atlas work. Do not merge it automatically.
- After merge, produce the six movement animations above and verify floor contact and jitter in the 640x360 game after Claude's integration.
- Before Phase C, produce one 640x360 style comparison with Aclaire V4, Moss Slime, Thorn Beetle and 3-4 master-palette floor tiles. Stop for Pinz's visual approval before World 1 production.
- No additional style choice is needed now; merge is the current gate. PR #3 is superseded by this branch, which includes its commits.

---

# Historical study notes (superseded where inconsistent)

# Phase B — Aclaire working report (24 October 2026)

## Scope and review state

Pinz approved the Phase A V4 style and explicitly asked to begin Phase B with Aclaire. This commit starts with a six-frame **idle preview**. It does not claim that the full Aclaire animation set or Phase B is finished, and no runtime asset is shipped yet. The approved V4 image remains untouched.

## Files

- Source seed: [`2026-10-23_aclaire_seed_v4_256color_density2.png`](../previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png)
- Six transparent 96×128 frames: [`2026-10-24_aclaire_idle/`](../previews/phase_b/2026-10-24_aclaire_idle/)
- Transparent [horizontal strip](../previews/phase_b/2026-10-24_aclaire_idle_strip_preview.png) and [animated PNG loop](../previews/phase_b/2026-10-24_aclaire_idle_motion.png)
- [2× nearest-neighbor review](../previews/phase_b/2026-10-24_aclaire_idle_x2_review.png) and [640×360 display probe](../previews/phase_b/2026-10-24_aclaire_idle_640x360.png)
- Reproducible build: `tools/art/build_aclaire_idle_phase_b.py`

## Method and visual review

The `game-studio:sprite-pipeline` workflow was tried with the approved seed on a six-slot transparent reference canvas. Image generation produced a redesigned figure and opaque backdrop, so that result was rejected and never added as an asset. A second targeted image-generation blink edit changed the figure proportions; it was also rejected as a direct frame. The final preview is derived from the approved V4 pixels with controlled one-pixel upper-silhouette movement and a manually composed blink on frame 4. Frame 1 is byte-identical to V4. Feet remain anchored at the bottom of every frame. The face, orange ponytail, pink tie, costume, boots and single sheathed sword remain recognisable at native and 640×360 display size. The sword position retains Pinz's accepted V4 imperfection and has not been silently redesigned.

The final image-generation prompt for the attempted strip asked for six evenly spaced transparent idle frames matching V4, screen-right facing, tiny breathing and ponytail sway, blink in frame 4, one straight sheathed sword, and fixed feet. The attempted blink prompt asked to change only V4's two blue eyes to closed eyes while preserving all other pixels. Neither generated bitmap was used as the final asset because visual inspection showed unacceptable drift. The Python build is the final source of the preview.

## Technical checks and assumptions

The six frames and strip are RGBA PNGs with binary alpha. Frames are 96×128 physical pixels, representing the Phase A-approved 48×64 logical size at density 2. Five frames use 247 opaque RGB colors; blink uses 243. APNG contains six frames at 125 ms each (8 fps), matching the old idle timing. The first frame's bytes match the V4 seed. The 640×360 probe is a static illustration of downsampled display size, not an in-engine screenshot.

This is still incompatible with the unchanged `ART_HANDOFF.md` production rules (32×48 player frame, master 35-color palette, at most 16 colors per sprite) and the current runtime manifest. The user approved the V4 visual direction, but `AGENTS.md` forbids changing `ART_HANDOFF.md` or `src/`. The code/spec owner must reconcile frame size, color budget, texture scaling, atlas coordinates and manifest entries before this can be placed in `public/assets/`. `tools/validate_assets.py` does not exist yet and is a Phase B deliverable, so no production validation pass is claimed. The idle preview does not establish the final sword position or motion language for run/attack; those need visual review at their own game scale.

## Next Aclaire work

Continue from this locked V4 seed with run and movement key poses, then normalize their frames to the same anchor and density. Keep one sheathed sword in movement/cast/hurt/dead poses; attacks must show one sword in hand and an empty sheath. Review each motion before atlas packing. The full Phase B phase report and production validation remain open.

## Run key pose proposal (24 October 2026)

After the idle preview, a single [run key pose](../previews/phase_b/2026-10-24_aclaire_run_key_64x64_density2.png) was generated from the approved V4 sprite and the owner's v2 sheet, then normalized and capped at 256 colors by `tools/art/build_aclaire_run_key_phase_b.py`. The image-generation prompt requested one isolated right-facing mid-stride pose, bright readable face, V4 outfit and proportions, one straight sheathed sword, no cape and transparent background. The [2× size comparison](../previews/phase_b/2026-10-24_aclaire_run_key_scale_review.png) and [640×360 probe](../previews/phase_b/2026-10-24_aclaire_run_key_640x360.png) show it beside V4 idle.

The wide stride occupies 110×124 physical pixels. Preserving V4's height therefore requires a **128×128 physical / 64×64 logical run frame**, wider than V4 idle's 96×128 / 48×64. Pinz explicitly selected 64×64 logical px for the run animation after seeing the scale comparison. The normalized key uses 247 opaque colors and binary alpha. The generator source is stored at `art/concept/2026-10-24_aclaire_run_key_source.png`, outside `public/assets/`.

## Eight-frame run motion study

The full-strip image-generation pass was rejected: it drew fewer than eight well-separated figures and drifted in proportion and placement. Four individually reviewed source poses (contact, compression, passing and airborne flight), plus an alternate contact, were normalized by `tools/art/build_aclaire_run_phase_b.py` into [eight 128×128 RGBA preview frames](../previews/phase_b/2026-10-24_aclaire_run_study/), a [nearest-neighbor review sheet](../previews/phase_b/2026-10-24_aclaire_run_study_x2.png) and an [APNG loop](../previews/phase_b/2026-10-24_aclaire_run_study_motion.png). All frames use binary alpha. The approved run-key frame retains its own 247-color quantization; frames 2–8 are mapped to V4's 247-color family, so the full study does not yet share one exact palette. The APNG uses 83 ms/frame, approximately 12 fps.

**Review limitation:** this is a timing/size study, not the final production run strip. Passing and flight artwork is reused in the second stride, so the near/far leg exchange and hair lag are not yet convincing. The first and alternate contacts also still need closer sword-axis cleanup. The torso and face are recognizable at 1:1 and 2×, but motion should be redrawn or substantially refined before atlas packing. The source PNGs are kept under `art/concept/` for reproducibility. No `public/assets/` files or runtime code were changed.

## Run V2 refinement after Pinz's review

Pinz selected the run study as the base and asked to refine the remaining frames. V2 keeps its approved 64×64 logical frame but replaces the repeated second-half passing and flight artwork with new key poses and gives frame 6 its own revised source. Eight distinct pose bitmaps are in [`2026-10-24_aclaire_run_v2_study/`](../previews/phase_b/2026-10-24_aclaire_run_v2_study/), with a [2× review sheet](../previews/phase_b/2026-10-24_aclaire_run_v2_study_x2.png), [physical-size APNG](../previews/phase_b/2026-10-24_aclaire_run_v2_study_motion.png), [logical-size APNG](../previews/phase_b/2026-10-24_aclaire_run_v2_study_logical_motion.png) and [640×360 static probe](../previews/phase_b/2026-10-24_aclaire_run_v2_study_640x360.png). The V1 study remains available for comparison.

`tools/art/build_aclaire_run_v2_phase_b.py` maps all eight physical frames, including the first, to colors sampled from the approved V4 seed. Each physical frame is 128×128 with binary alpha; opaque color counts range from 139 to 223, all within the V4 247-color set. Both APNGs contain eight frames at 83 ms/frame. The resized logical APNG is a soft display preview and is not subject to the physical-frame palette/alpha assertion. The source prompts asked image generation to preserve the approved big face, orange ponytail, v2 costume, one sheathed sword and right-facing run action while changing the second-stride legs and hair lag; attempted outputs that shrank the character were rejected. Three accepted source images are stored under `art/concept/` with `_compression_v3_source`, `_passing_alt_source` and `_flight_alt_source` suffixes.

Visual review at 2× and 640×360 shows improved frame-to-frame scale and hair movement. The opposite leg phase is still subtle because the socks and boots are symmetric, and the sword axis varies slightly across independently drawn poses. V2 is the current review candidate, not a finished production animation. It still cannot move into `public/assets/` until the spec/runtime changes listed above are resolved and the full asset validator exists.

## Run V3 motion stabilization after feedback

Pinz reported that V2 looks jerky. Reproduction and measurements with `tools/art/diagnose_aclaire_run_v2.py` showed the blue-eye center swinging **14.8 physical pixels horizontally** across the eight V2 frames, including a nearly 14-pixel jump from frame 2 to 3. The old normalizer fit each independently generated full-body image to the same frame height but did not anchor the face; passing frames also had visibly smaller heads. This is a measurable cause of perceived jitter, separate from the intended arm/leg motion.

`tools/art/build_aclaire_run_v3_phase_b.py` preserves V2 and creates a new [V3 eight-frame review](../previews/phase_b/2026-10-24_aclaire_run_v3_study_x2.png), [V2/V3 comparison](../previews/phase_b/2026-10-24_aclaire_run_v2_v3_comparison.png), [physical APNG](../previews/phase_b/2026-10-24_aclaire_run_v3_study_motion.png), [logical display APNG](../previews/phase_b/2026-10-24_aclaire_run_v3_study_logical_motion.png) and [640×360 probe](../previews/phase_b/2026-10-24_aclaire_run_v3_study_640x360.png). V3 moves each image to one shared face anchor, enlarges only the two undersized passing poses' upper half by 12% while fitting their legs inside the existing frame, and gives frames 3/7/8 a controlled vertical running bob. The eye center's horizontal range falls to **1.2 physical pixels**; detailed per-frame values are in [`2026-10-24_aclaire_run_v3_metrics.json`](2026-10-24_aclaire_run_v3_metrics.json).

All eight V3 physical frames remain 128×128 RGBA with binary alpha, 139–223 opaque colors per frame, and colors drawn only from the V4 seed palette. APNG timing remains eight frames at approximately 12 fps. Visual review of the stills and 640×360 probe confirms the face no longer hops across the slot. Because each pose still came from separate illustrations, ponytail volume, sword angle and leg overlap vary; the new APNG is a **review candidate**, not a claim that the run loop is production-ready or that its playback was verified in Phaser. No approved image was overwritten and no `public/assets/` or runtime code changed.

## Run V4 redrawn leg-cycle study after Pinz's review

Pinz found that V3 still stutters and requested **newly drawn poses**, a slower run, and a clear alternating-leg beat. The V3 frame translations were not reused. A new four-pose image-generation sheet was drawn from the approved Aclaire V4 seed, owner character sheet and accepted run key. Its lower row repeated the same leg silhouette, so it was rejected as a direct cycle. Two additional transparent key poses were redrawn: one with the right boot planted and left boot trailing, and one with the left boot planted and right boot lifted forward. The three raw generator sources remain in `art/concept/` with the `2026-10-24_aclaire_run_v4_*_source.png` names.

`tools/art/build_aclaire_run_v4_phase_b.py` selects four new keys and builds [four 128×128 transparent physical frames](../previews/phase_b/2026-10-24_aclaire_run_v4_redraw/), a [2× nearest-neighbor review](../previews/phase_b/2026-10-24_aclaire_run_v4_redraw_x2.png), [physical APNG loop](../previews/phase_b/2026-10-24_aclaire_run_v4_redraw_motion.png), [64×64 logical display APNG](../previews/phase_b/2026-10-24_aclaire_run_v4_redraw_logical_motion.png), and [640×360 size probe](../previews/phase_b/2026-10-24_aclaire_run_v4_redraw_640x360.png). The ordering shows the two contact boots alternating through recoil and wide stride. Playback is **8 fps / 125 ms per frame**, down from V3's approximately 12 fps. One four-key cycle is 500 ms.

The new physical frames use binary alpha, with 197–212 opaque colors each, mapped to the approved V4 seed's 247-color family. Their measured blue-eye centers align at x=72 physical pixels, with y ranging 39–42. Visual still review shows consistent large blue eyes, high orange ponytail, pink shirt, compact silver chest armor, tan shorts, dark socks, black boots and one sheathed sword. At 640×360, the raised versus planted boot is readable. **The four-key loop has not yet been approved or tested in Phaser**; slower timing and clearer leg order are testable changes, not proof that perceived stutter is gone. The older V2/V3 studies remain for comparison. No runtime atlas, manifest or handoff spec was changed.

Pinz provisionally accepted this run study and chose to revisit its motion later. Treat the run as **deferred for polish**, not a locked or production-ready animation; retain the V2/V3 comparisons and do not silently pack it into an atlas.

## Jump-up key proposal

The next Aclaire motion in the handoff list is `jump_up`. One new transparent [source pose](../concept/2026-10-24_aclaire_jump_up_key_source.png) was drawn from the approved V4 appearance and the owner v2 sheet's jump reference. `tools/art/build_aclaire_jump_up_key_phase_b.py` normalizes it to a [96×128 physical / 48×64 logical key](../previews/phase_b/2026-10-24_aclaire_jump_up_key_48x64_density2.png), maps it to V4's color family and produces a [2× idle/jump comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_x2_review.png) and [640×360 display probe](../previews/phase_b/2026-10-24_aclaire_jump_up_key_640x360.png). The physical key has binary alpha and 220 opaque colors drawn from the V4 247-color set.

The jump silhouette, face and costume read at display size. **The hilt and black sheath are still not perfectly collinear**, so this is a pose proposal for review, not an approved seed or production frame. A targeted image-generation sword correction was inspected but did not sufficiently fix the axis and was rejected. No `jump_up` strip was made pending seed review and sword cleanup.

### Jump-up sword-axis correction (V2)

After Pinz asked for a correction, the original jump key was retained and a second targeted image edit moved the pommel and grip directly above the sheath mouth. The [V1/V2 4× comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v1_v2_comparison.png) makes the change visible: V1's grip ran diagonally across the sheath axis; V2's pommel, grip, guard and sheath follow one near-vertical line behind the body. The jump pose, face, clothing and boots stay close to V1. A previous sword-only edit that left the bend visible was rejected; its image is not part of the study.

The new [V2 source](../concept/2026-10-24_aclaire_jump_up_key_v2_source.png) builds with `--version v2` into a separate [96×128 transparent key](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v2_48x64_density2.png), [2× review](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v2_x2_review.png), and [640×360 display probe](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v2_640x360.png). The physical PNG uses binary alpha and 222 colors from the approved V4 family; V1 stays reproducible with `--version v1`. Visual inspection at 4× and display size finds the sword substantially straighter and still sheathed. This is still a **pose review candidate**, not an approved `jump_up` animation strip or a runtime asset.

### Jump-up pose V3 — both arms raised

Pinz supplied the Aclaire v2 character sheet again and asked to use its bottom-row JUMP pose with **both arms raised**. The V2 pose had one arm extended down/back. V3 redraws that arm so both bent arms and clenched fists are above shoulder height, while retaining the tucked-leg jump, cheerful face, orange ponytail, V4 costume and single near-vertical sheathed sword. The attached sheet is a visual reference; its labels are not asset instructions. The V2 image remains available.

The [V3 source](../concept/2026-10-24_aclaire_jump_up_key_v3_source.png) builds with `--version v3` into a separate [96×128 transparent key](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v3_48x64_density2.png). The [V2/V3 4× comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v2_v3_comparison.png), [2× idle/jump view](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v3_x2_review.png) and [640×360 size probe](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v3_640x360.png) were inspected visually. Both raised fists are legible at sprite size; face, ponytail, outfit and sheathed sword remain identifiable. The physical PNG has binary alpha and 219 opaque colors from V4's palette family. V3 is a **new pose candidate awaiting visual review**, not a two-frame animation or runtime atlas entry.

Pinz clarified that this interpretation was insufficient: the **whole JUMP pose** in the owner sheet, not just raised arms, must be the model. V3's fists sit too high and its rear leg extends backward, so V3 is rejected as the final jump-up seed.

### Jump-up pose V4 — owner sheet pose study

V4 uses the bottom-row JUMP sprite of `art/reference/aclaire_character_sheet_v2.png` as a direct pose blueprint. Compared with V3, both fists are beside the head at about shoulder height, the arms spread outward, the torso stays compact and upright, and both knees tuck together in front with the boots clustered beneath. The orange ponytail moves behind the head. A first edit reproduced the pose but bent the sword; a targeted second edit kept the pose and moved the pommel, grip, guard and black sheath onto a nearly vertical axis behind her body, consistent with the handoff's side-view sword rule.

The new [V4 source](../concept/2026-10-24_aclaire_jump_up_key_v4_source.png) builds with `--version v4` into a separate [96×128 transparent key](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_48x64_density2.png). Review files include a [direct sheet-pose/V4 comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_reference_pose_comparison.png), [V3/V4 4× comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v3_v4_comparison.png), [2× idle/jump comparison](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_x2_review.png) and [640×360 display probe](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_640x360.png). The physical PNG has binary alpha and 215 opaque colors from V4's approved color family. Visual inspection finds the requested arm, knee and boot arrangement readable at display size. This is a pose study awaiting Pinz's visual review; no `jump_up` strip or runtime atlas was created.

Pinz subsequently approved the V4 jump pose ("โอเคแล้ว"). Treat V4 as the approved jump-up seed. The older V1–V3 proposals remain for comparison but should not be used as animation anchors.

### Jump-up two-frame motion preview

Using the approved V4 pose, a two-slot image-generation pass supplied subtle ascent motion. `tools/art/build_aclaire_jump_up_phase_b.py` locks frame 01 pixel-for-pixel to the approved [V4 key](../previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_48x64_density2.png) and normalizes the second pose to the same 96×128 physical / 48×64 logical frame, palette family and face x anchor, with a deliberate two-physical-pixel ascent. The transparent [source sheet](../concept/2026-10-24_aclaire_jump_up_two_frame_source.png), [two physical frames](../previews/phase_b/2026-10-24_aclaire_jump_up_v4_study/), [4× nearest-neighbor review](../previews/phase_b/2026-10-24_aclaire_jump_up_v4_study_x4.png), [physical APNG](../previews/phase_b/2026-10-24_aclaire_jump_up_v4_study_motion.png), [logical display APNG](../previews/phase_b/2026-10-24_aclaire_jump_up_v4_study_logical_motion.png) and [640×360 static size probe](../previews/phase_b/2026-10-24_aclaire_jump_up_v4_study_640x360.png) are available for review.

Both physical frames have binary alpha and colors from the approved V4 jump key's 215-color set. APNG preview timing is 100 ms per frame (10 fps); the preview loops for inspection, while `jump_up` itself is non-looping in the handoff. Visual still review shows both arms beside the head, knees tucked together and one nearly vertical sheathed sword in both frames. Frame 02 varies hair, knees and body rise slightly. Pinz approved this two-frame visual preview ("โอเค"); its pose and timing may be used as the basis for subsequent Aclaire airborne motions. It has not been tested in Phaser. No runtime atlas or manifest was changed.

## Phase B production contract update (24 October 2026)

At Pinz's explicit request, `ART_HANDOFF.md` and `src/assets/manifest.ts` now specify Aclaire at density 2: idle/jump/default 48×64 logical (96×128 texture pixels), run 64×64 logical (128×128 texture pixels). The manifest uses the provisional V4 run study's four frames at 8 fps; the run motion still needs polish before production. Attack remains a **provisional legacy** 64×48 logical (128×96 physical) allocation pending its own pose review. The approved idle and jump preview PNGs have not been overwritten or placed in `public/assets/`.

The Aclaire-only palette exception is the exact 247-color opaque RGB set exported from the approved V4 idle seed into `art/palette/2026-10-24_aclaire_v4_palette.hex` by `tools/art/export_v4_palette.py`. Other assets remain on the 35-color master palette with their prior color caps. `tools/validate_assets.py` checks production PNG alpha/palette, atlas bounds/naming/padding, Aclaire frame sizes and animation references; it returns nonzero while `public/assets/` is absent. No production validation pass is claimed.

**Runtime integration still needed by the game-code owner:** `Player` and `TitleScene` render texture pixels at their existing scale, so a density-2 atlas would appear twice the intended logical size. `Player.syncBodyToFrame()` also derives its Arcade body offset directly from the physical frame size. The placeholder Aclaire painter still uses old sprite proportions. Those runtime files are outside this art-spec/manifest request and must be reconciled before the first real atlas is shipped. `docs/GDD.md` still lists the old 32×48 player size. The validator does not judge sprite aesthetics or run-loop smoothness; it checks tileset dimensions and edge extrusion but does not yet parse TSX metadata.
