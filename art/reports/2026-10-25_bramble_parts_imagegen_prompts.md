# Bramble King part redraw — built-in imagegen, 2026-10-25

Four separate built-in `image_gen` edits produced transparent concept sources. `tools/art/build_world1_boss.py` reduces them to the fixed production frame sizes and the existing 16-color boss palette. The concept sources are not loaded by the game.

| Asset | Source | Production frames |
| --- | --- | --- |
| vine_attack | `art/concept/2026-10-25_vine_attack_detailed_source.png` | 8 × 192×192 |
| vine_shield_idle | `art/concept/2026-10-25_vine_shield_idle_source.png` | 1 × 32×32 |
| vine_shield_burn | `art/concept/2026-10-25_vine_shield_burn_source.png` | 6 × 32×32 |
| thorn_seed | `art/concept/2026-10-25_thorn_seed_source.png` | 2 × 16×16 |

## Final prompts

### vine_attack

```text
Use case: precise-object-edit. Asset: Bramble King vine_attack overlay concept for 192×192 boss frames in a 16-bit pixel-art platform game. Image 1 is the current boss attack pose edit target; Image 2 is the detailed vine_whip style reference. Redraw ONLY the attacking vine emerging from the boss's lower left forearm, reaching and lashing diagonally down-left. Preserve the entire boss body, face, foliage, colors, silhouette, stance, and framing exactly as Image 1. Replace the flat green angular tendril with a richer twisted woody vine: dark bark segments, bright moss-green fiber wraps, sharp alternating thorns, restrained amber knots, near-black outline, deliberate pixel clusters. It should remain visually distinct from the arm and readable at original 192px frame size. Full boss entirely in frame, exact same location on a genuinely transparent background. No ground, scenery, text, blur, antialias, or extra appendages.
```

Inputs: `art/frames/boss_bramble_king/vine_attack_004.png` (edit target), `art/concept/2026-10-25_vine_whip_detailed_source.png` (style reference). The pipeline isolates the redesigned tendril and composites it over the original boss body so the body does not change between frames.

### vine_shield_idle

```text
Use case: precise-object-edit. Asset type: one vine_shield_idle sprite concept for a 32×32 pixel-art boss part. Image 1 is the current simple circular shield edit target; Image 2 is the Bramble King style reference; Image 3 is a detailed thorny vine material reference. Redraw the shield as a compact readable circular woven buckler built from interlocked dark woody vines, moss-green braids, alternating short thorns, a warm amber glowing knot in its core, and a dark crisp silhouette. Preserve a centered round 32×32 composition and genuine transparent surrounding canvas. Make the silhouette and broad material bands survive reduction to 32×32 pixels. Handcrafted 16-bit pixel art, rectangular pixel clusters, 2-3 tones per material, controlled highlights. No boss body, no scene, no text, no blur, no antialias, no radial spokes, no smooth gradients.
```

Inputs: `art/frames/boss_bramble_king/vine_shield_idle_000.png` (edit target), `art/previews/phase_c/2026-10-24_bramble_king_review.png` (boss style), `art/concept/2026-10-25_vine_whip_detailed_source.png` (vine material).

### vine_shield_burn

```text
Use case: precise-object-edit. Asset: burning transformation concept for vine_shield_burn animation, ultimately 32×32 pixel art. Image 1 is the new shield idle design and the STRICT edit target; Image 2 is the old burn sprite only for gameplay meaning. Keep the exact circular woven silhouette, orientation, thorn placement, ring topology, and central amber knot of Image 1. Turn the outer vines into charred wood with spreading orange-yellow embers and a few crisp pixel flames on the upper edges. Core glows hotter. Shield is mid-burn and still recognizably the same shield. Genuine transparent background, object centered with generous empty transparent margin, no scene, text, particles detached from the object, blur, antialias, or smooth gradient. Crisp handcrafted 16-bit pixel art, readable when reduced to 32×32.
```

Inputs: `art/concept/2026-10-25_vine_shield_idle_source.png` (edit target), `art/frames/boss_bramble_king/vine_shield_burn_003.png` (gameplay reference).

### thorn_seed

```text
Use case: precise-object-edit. Asset type: thorn_seed projectile concept for a 16×16 pixel-art fantasy platform game. Image 1 is the current tiny thorn_seed edit target; Image 2 is the Bramble King boss style reference; Image 3 is the woven vine shield material reference. Redraw only one isolated compact spiked seed pod, vertically oriented, roughly round/teardrop silhouette. Give it a dark woody husk, three to five strong alternating hooked moss-green thorns, a few warm amber fissures, selective near-black outline. Make its outline unmistakable at 16×16 and keep the core large enough to read. Genuine transparent background, centered object, fully visible with margin. Crisp handcrafted 16-bit pixel art with deliberate rectangular clusters and limited material shades. No other object, no ground, no scene, no text, no blur, antialias or smooth gradient.
```

Inputs: `art/frames/boss_bramble_king/thorn_seed_000.png` (edit target), `art/previews/phase_c/2026-10-24_bramble_king_review.png` (boss style), `art/concept/2026-10-25_vine_shield_idle_source.png` (material reference).
