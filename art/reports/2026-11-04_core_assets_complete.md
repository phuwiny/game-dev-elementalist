# Phase B core asset completion — 4 November 2026

This report supersedes the pending Core Assets notes in the earlier progress report. User authorized completing the core asset set in the confirmed concept direction.

## Delivered

| Atlas | Frames | Coverage |
|---|---:|---|
| spirits | 44 | Four spirits, each idle 6 / cast 4 / icon 1 |
| objects | 65 | All ten puzzle object families and states in handoff 5.4 |
| items | 41 | Coin, heart fruit, orb, feather, shard, checkpoint, goal flag |
| fx | 105 | All handoff 5.3 effects, including four switch auras and checkpoint spark |
| ui | 26 | Hearts, energy, elemental icons, lives/coin, boss bar, panel, buttons, cursor, map nodes |

Total: 281 atlas entries, plus font_hud.png and BMFont XML (8x8 cells, capitals/numerals/punctuation). Existing player, enemies, boss, tiles and background artwork are unchanged. All new sprite source frames are retained in art/frames. Sources and builders are versioned. The original concept board is visual direction; production sprites simplify detail to the actual runtime pixel sizes and master palette. Generated spirit sources retain the supplied character designs. Objects/items/UI use ember, brass, timber, stone and purple motifs. FX use the four identity ramps.

## Verification

- Asset validator: PASS, zero errors; binary alpha, master palette, per-frame limits and atlas bounds.
- Core manifest coverage and dimension assertions: PASS for every current runtime animation and still. No fill textures for any of the five core atlases in the browser.
- Validator regression suite: 8/8 PASS, including the four allowed unsuffixed spirit icon names and rejection of unknown icons.
- npm run check: typecheck, 86 unit tests and production build passed.
- Elements Lab: 38/38 scripted checks passed, including all four spirits, fire puzzles, frozen water, grown plant platforms, windmill, dash/glide, earth blocks, cracked walls and the goal.
- Browser smoke: Title -> Elements Lab -> movement/cast, 1280x720 viewport at ?lowres; screenshots inspected. HUD origins remain (0,0) after frame changes. No JavaScript or asset-load errors; the only console errors are the existing missing favicon.ico requests.
- Browser plugin unavailable; used local Playwright and system Chromium. The existing Lab test assumes Settings is absent from Title. A temporary copy added the second ArrowDown required by the current menu; repository gameplay tests were not edited.

## Integration notes

UI/items/objects/FX atlas entries intentionally omit custom pivot metadata. The runtime sets origins for individual uses; resetting them during setFrame caused the HUD to shift. Spirits retain center pivots. Existing production animation records are preserved; new objects/items/FX records are appended.

font_hud, spirit_orb, oneup_feather, spirit_shard, checkpoint_spark, panel_9slice, button states and cursor are delivered against ART_HANDOFF but are not all connected to runtime systems yet. The font loader and those gameplay/UI connections remain with the game-code owner. No source code, maps, audio or configuration was changed. This completes the core art set, not World 2–5 packs or Phase E title art.

## Review and regeneration

Open art/previews/phase_b/2026-11-04_core/index.html through Vite for looping GIF previews. Per-atlas contact sheets and in-game screenshots are in the same directory. Review loops repeat one-shot effects for inspection; runtime timing follows the manifest/animations.json.

From the repository root:

```
python3 tools/art/build_burnil.py
python3 tools/art/build_remaining_spirits.py
python3 tools/art/build_fire_objects.py
python3 tools/art/build_core_completion.py
python3 tools/art/review_core_assets.py
python3 tools/validate_assets.py
python3 tools/art/test_validate_assets.py
```

The review builder uses Node's TypeScript stripping to read the real runtime manifest. Regenerate in the order above so the final pack includes all objects and corrected runtime pivots.

## Delivery status

Branch: art/phase-b-core-assets. GitHub CLI authentication reports an invalid GH_TOKEN, including outside the sandbox, so remote push / draft PR creation was not completed. Work is retained locally and ready for review. No merge was performed.
