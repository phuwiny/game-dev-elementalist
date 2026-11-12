# Core assets progress — 2026-11-04

Burnil source generated from the user's reference, retained in art/concept/2026-11-04_burnil_source.png. Exported 6 idle frames, 4 cast frames, and a portrait icon at 32x32 into the spirits atlas. The builder uses nearest-neighbor normalization, binary alpha and a seven-color subset of the master palette. Review board and GIFs are in art/previews/phase_b/2026-11-04_core/.

The validator previously rejected the four explicitly specified spirit icon names because they have no animation suffix. It now accepts only those four names in the spirits atlas. Validator passes with 0 errors; its existing seven regression tests pass. Other spirits remain runtime placeholders. Existing approved atlases and animation metadata were not replaced.

A source concept board for fire puzzle objects, sword/fire FX, items and HUD is retained as art/concept/2026-11-04_core_asset_board.png. It is NOT production artwork: background removal, exact dimensions, separate animation frames and palette conversion remain outstanding. The generation requested transparency but the result contains a colored background.

Burnil also still needs visual review at gameplay scale: the cast source includes a short flame tongue and its idle silhouettes face more toward the viewer than the cast poses. No game smoke test or full phase completion is claimed. No PR has been created.

## Fire puzzle follow-up

Added the 28-frame fire puzzle subset to `public/assets/sprites/objects/objects.png` and `.json`: vine idle/burn (7), crate idle/burn (7), torch unlit/lit (5), pressure plate up/down (2), gate closed/open (7). Versioned generated source and deterministic export script retained. Background RGB is present under alpha zero in the source; exported sprites use binary alpha and a shared 16-color master-palette subset. Explicit row crop boundaries prevent neighboring gate flames contaminating torch frames. Runtime manifest supplies animation timing; existing animations.json is unchanged.

Reviewed the exported contact sheet. Validator PASS (0 errors), eight validator regression tests PASS, diff whitespace check PASS. Game smoke test is still outstanding. Review GIFs and fire_objects_review.png are under art/previews/phase_b/2026-11-04_core. Remaining FX/items/HUD are still concept-only.
