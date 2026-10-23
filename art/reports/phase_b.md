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

The full-strip image-generation pass was rejected: it drew fewer than eight well-separated figures and drifted in proportion and placement. Four individually reviewed source poses (contact, compression, passing and airborne flight), plus an alternate contact, were normalized by `tools/art/build_aclaire_run_phase_b.py` into [eight 128×128 RGBA preview frames](../previews/phase_b/2026-10-24_aclaire_run_study/), a [nearest-neighbor review sheet](../previews/phase_b/2026-10-24_aclaire_run_study_x2.png) and an [APNG loop](../previews/phase_b/2026-10-24_aclaire_run_study_motion.png). All frames use binary alpha and only colors from V4's 247-color family; the APNG uses 83 ms/frame, approximately 12 fps.

**Review limitation:** this is a timing/size study, not the final production run strip. Passing and flight artwork is reused in the second stride, so the near/far leg exchange and hair lag are not yet convincing. The first and alternate contacts also still need closer sword-axis cleanup. The torso and face are recognizable at 1:1 and 2×, but motion should be redrawn or substantially refined before atlas packing. The source PNGs are kept under `art/concept/` for reproducibility. No `public/assets/` files or runtime code were changed.
