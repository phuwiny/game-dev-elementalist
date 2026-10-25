# Phase C — Ember Woods production art, 2026-10-24

## 1. Files created or changed

- `public/assets/tilesets/tiles_w1_ember_woods.png` + `.tsx`: 64 cells in 16 columns, 16×16 tile art with 1px extrusion, margin 1 and spacing 2. Cells 0–15 provide two top variants, two fill variants, left/right sides, ceiling, four outer corners, four inner corners and a single-tile cap; 16–18 are one-way platforms; 19–21 are hazards; 22–33 are masonry walls; 34–57 are 24 leaf/root/vine/stone/mushroom/ember decorations. Six reserved cells are transparent. Tiled properties mark `collides`, `oneWay`, and `hazard` respectively. On 2026-10-25 the terrain roles were made explicit and fill tiles were cleaned to avoid grass stripes underground.
- `public/assets/backgrounds/w1/`: `bg_w1_far.png`, `bg_w1_mid.png`, `bg_w1_near.png`, `bg_w1_boss_far.png`, each 640×360. Far and boss-far are opaque; mid and near are transparent. On 2026-10-25 the rightmost 64 px of each layer were blended toward a mirrored copy of the left edge so silhouettes as well as extreme columns continue across the horizontal loop.
- `public/assets/sprites/enemies/enemies_w1.png` + `.json`: 50 untrimmed, unrotated 32×32 frames in Phaser JSON Hash format, 2px padding. Moss Slime (17 frames), Leaf Wisp (16), Thorn Beetle (17) cover all actions listed in ART_HANDOFF 5.6. Flying Leaf Wisp uses center pivot in atlas metadata; ground enemies use bottom-center. On 2026-10-25, Leaf Wisp's dive loop was closed and Thorn Beetle's flipped frames were aligned to the floor; death was aligned to the game's five-frame manifest.
- `public/assets/sprites/bosses/boss_bramble_king.png` + `.json`: 51 frames, including 36 main 192×192 poses, vine whip 64×16 (6), vine shield 32×32 (idle 1/burn 6), thorn seed 16×16 (2). Main boss frames use bottom-left pivot; separate pieces retain their own origin. All frames have 2px atlas padding.
- `public/assets/animations.json`: 12 World 1 enemy and 10 Bramble King animation definitions. Frame counts match the game manifest; the JSON supplies the playback timing used by the game and review GIFs.
- `tools/art/build_world1_environment.py`, `build_world1_enemies.py`, `build_world1_boss.py`, `build_world1_mockups.py`: reproducible builders. Existing `pack_atlas.py` packs both atlases.
- `art/frames/enemies_w1/`, `art/frames/boss_bramble_king/`: source frames for regeneration.
- `art/concept/2026-10-24_bramble_king_sprite_source.png`, `2026-10-24_ember_woods_far_source.png`: generated source images, outside production assets.
- `art/mockups/2026-10-24_world1_gameplay_mockup.png` and `2026-10-24_world1_boss_mockup.png`: 640×360 compositions from real asset frames at the game's world scale.
- `art/previews/phase_c/`: enemy and boss review boards plus an interactive Phaser review of production atlases and backgrounds.
- `art/previews/phase_c/2026-10-25_world1_motion_contact.png`, `2026-10-25_world1_tile_legend.png`, `2026-10-25_world1_tile_adjacency.png`, `2026-10-25_world1_seam_review.png`, and `2026-10-25_world1_frame_metrics.json`: visual QA and frame-bound measurements.
- `art/previews/phase_c/2026-10-25_world1_animations.html` and `animations/*.gif`: 22 review-only animations at the rates specified by `animations.json`.
- `tools/art/inspect_world1_pack.py`, `build_world1_animation_previews.py`, and `art/reports/2026-10-25_world1_integration_guide.md`: repeatable QA output and tile/integration notes for Claude.

## 2. Validation

- `tools/validate_assets.py`: PASS, 0 errors. The validator checks master-palette colors, binary alpha, 16-color frame limits, 24-color tileset limit, sizes, atlas bounds/padding/names, animation manifest coverage, background dimensions and left/right seam columns, and tile extrusion.
- `pnpm run dev --host 127.0.0.1 --port 5174` (equivalent Vite dev script; `npm` is not on PATH): Phaser review at 640×360 loaded all production enemy and boss atlases, switched between gameplay and boss displays, and produced no browser console warning/error. The two static mockups were inspected at exact output size.
- Game maps `public/assets/maps/w1_*.json` still use the `graybox` tileset. The mockups and Phaser art review verify the new tiles visually, while in-game tile seam/collision behavior awaits Claude's map integration. No map, game code, or config was changed by art.
- Frame-bound inspection: Moss Slime idle and move keep the last pixel on the floor; Thorn Beetle walk keeps floor contact and flipped now has a 0–1 px bottom gap (previously 9–11 px). Leaf Wisp dive centers vary 14.5–16.5 px and return to their starting placement at the loop boundary. Main boss frames retain floor contact.
- The 22 generated GIFs loaded in the local browser at their authored frame rates. A 2× tile adjacency board and full-height background seam board were inspected. The new mirrored edge treatment removes the sharp silhouette break visible in the first seam review. Runtime parallax scrolling remains untested until the game loads the new backgrounds.

## 3. Assumptions

- The four tiles and two enemies from the Pinz-approved World 1 style comparison are reused as production starting art. Leaf Wisp follows the approved Phase A enemy lineup. The boss follows the approved Phase A Bramble King concept; its rendered source was reduced to a shared 16-color master-palette ramp. Additional animation keys are deterministic pixel revisions of those bases.
- All boss poses retain the 192×192 frame and bottom-left anchor. The exposed hit spot is highlighted within frame x=25–61 and y=124–160, corresponding to a height of 32–68px above the bottom, within the game target zone x=20–64, height 16–68. The shield is a separate frame for the game to stack.
- Background far is based on the Phase A keyframe direction and a generated pixel-art source, then reduced to muted master-palette values to keep Aclaire and enemies readable. Mid/near and the tileset are deterministic pixel art. Extreme-column equality is enforced during export.
- The enemy and boss pose families are first production motion sets; further hand-keyed motion refinement can follow Pinz's review. Empty final death frames intentionally represent full disappearance.

## 4. Differences from gameplay/specification

- The World 1 maps still reference `graybox`; switching them to `tiles_w1_ember_woods` and preserving `collides`/`oneWay`/`hazard` behavior is Claude's scope. Boss and enemy atlases load in the art review, but the existing map integration has not been changed here.
- The boss concept originally placed the glowing heart centrally. The game contract places the damage target toward the boss's bottom-left; `weak_exposed` adds a clear amber knot in the target zone. The central chest remains under its vine ring as decorative art. The separate shield is placed left of the amber knot by the current game code, so the in-game overlap needs review.
- `src/entities/enemies/Enemy.ts` sets bottom-center origin on every enemy, while Leaf Wisp's art spec and atlas pivot use center origin. `TiledLevel.ts` currently ignores `oneWay` and reduces art tile IDs to 3 graybox categories before rendering. These are game-side integration tasks documented in the guide; no `src/` or map file was changed.
- The static background seam review now passes visually. A moving-camera check after game-side parallax integration is still required before Phase C acceptance.

## 5. Decision needed before Phase D

- Pinz should review the 640×360 gameplay and boss mockups, plus the animated Phaser review, for silhouette readability and style. Phase D remains paused until Phase C is accepted. If the World 1 map conversion reveals a tile-edge or collision mismatch, Claude should report the exact tile IDs so the TSX/art can be corrected without changing `src/` or maps from this branch.
