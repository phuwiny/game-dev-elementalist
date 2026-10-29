# Vine whip source — built-in imagegen, 2026-10-25

The built-in `image_gen` tool edited `art/frames/boss_bramble_king/vine_whip_005.png` with `art/previews/phase_c/2026-10-24_bramble_king_review.png` as a style reference. The selected transparent source is saved at `art/concept/2026-10-25_vine_whip_detailed_source.png`. `tools/art/build_world1_boss.py` reduces it to the 64×16 production frames and the boss atlas. The concept source is not loaded by the game.

## Prompt

```text
Use case: precise-object-edit
Asset type: concept source for a 64×16 pixel-art vine whip attack in a 2D fantasy platform game.
Input images: Image 1 is the edit target, the current vine_whip_005 sprite; Image 2 is a supporting style reference showing Bramble King.
Primary request: Redraw only the vine from Image 1 with noticeably richer detail while preserving its long, thin, leftward whipping silhouette. The root attaches at the right edge and the pointed striking tip extends to the left. Add twisted woody bark segments, readable moss-green fiber bands, several sharp alternating thorns, tiny warm amber knots, and selective near-black outline. Follow the dark wood and foliage colors of Bramble King in Image 2.
Composition: one isolated horizontal vine, entirely visible with generous transparent space above and below, about a 4:1 wide-to-tall silhouette. No character, no ground, no scene, no border, no labels.
Style/medium: crisp handcrafted 16-bit pixel art with deliberate rectangular pixel clusters and 2–3 shade levels per material. Prioritize shape readability when downscaled to 64×16.
Constraints: genuine transparent background, hard pixel edges and binary alpha, no blur, no antialias, no smooth gradient, no extra objects.
```
