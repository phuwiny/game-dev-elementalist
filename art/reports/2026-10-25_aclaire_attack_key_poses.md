# Aclaire V4 sword combo key poses — 2026-10-25

Three key poses are ready for Pinz's review. They are concept frames only; the production `player` atlas and `animations.json` have not changed. After approval, these poses will guide the 4 + 4 + 5 production attack frames.

## Deliverables

- `art/previews/phase_b/2026-10-25_attack_keys/2026-10-25_aclaire_attack_keys_640x360.png`: 1:1 logical game-scale comparison against approved idle.
- `art/previews/phase_b/2026-10-25_attack_keys/2026-10-25_aclaire_attack_keys_x2.png`: enlarged frame review.
- `art/previews/phase_b/2026-10-25_attack_keys/attack_{1,2,3}_key.png`: three 192×128 physical frames, density 2, bottom-center origin.
- `art/previews/phase_b/2026-10-25_attack_keys/2026-10-25_aclaire_attack_key_metrics.json`: frame bounds, eye alignment, sole row and sword reach.
- `art/concept/2026-10-25_aclaire_attack_{1,2,3}_key_source.png` and versioned revisions: transparent built-in imagegen sources, not loaded by the game. The selected revisions are attack 1 `_v3`, attack 2 `_v2`, and attack 3 `_v2`.

## Pose direction

| Pose | Peak action | Sword reach from body center | Frame |
| --- | --- | ---: | --- |
| `attack_1` | forward horizontal slash | 40.0 logical px | 192×128 |
| `attack_2` | diagonal rising slash | 38.5 logical px | 192×128 |
| `attack_3` | heavy downward ground contact | 36.0 logical px | 192×128 |

All three frames have binary alpha, colors mapped to the approved V4 palette (201, 184 and 191 opaque colors), and a sole on row 127. The eye is near frame x=105, matching approved idle's +9 physical px eye offset from the bottom-center pivot. The sheath stays on the back while the sword is drawn. After Pinz noted that `attack_3` read taller, its whole pose was reduced uniformly by 10% and re-anchored to the same sole row. Its top opaque row is now 26, close to `attack_1` row 25; `attack_2` reaches higher because its sword points upward. Pinz then approved the poses conditional on concealing the red pommel ball that protruded beyond the grip; three separate built-in imagegen edits removed it without changing the pose direction.

## Built-in imagegen prompt set

One separate built-in call was used per pose. A fourth edit corrected `attack_1` after its initial leg spread and sword were too long. The selected sources were then reduced and aligned reproducibly by `tools/art/build_player_attack_key_review.py`.

### attack_1 initial concept

```text
Use case: stylized-concept. Asset type: isolated key pose concept for Aclaire V4 attack_1, a 2D action platformer sprite. Image 1 is the approved V4 production idle sprite and is the STRICT identity, pixel style, head size, costume and color reference. Image 2 is the original character design reference. Image 3 is an older action sheet used ONLY for the first horizontal slash direction, not its drawing style or proportions. Create one full-body 16-bit pixel-art character facing RIGHT in a strong, playful forward lunge and performing the peak of a horizontal sword slash. The broad straight silver blade extends horizontally to the right, held in both hands; the large plain black scabbard stays EMPTY on her back. One sword only, straight continuous hilt/guard/blade axis. Keep the orange high ponytail with pink tie, large blue eyes at the same size as Image 1, pink sleeveless shirt, small silver chest plate and black diagonal strap, tan shorts, charcoal long socks, black boots with white cuffs and soles. Body mass stays centered over the feet, feet on the same baseline; allow wide empty transparent space on the right for blade. Intended reduction: a 192×128 physical frame (96×64 logical); body centered on frame x=96, blade tip within 40 logical px right of body center. Crisp hard pixel clusters, rich V4 coloring, transparent background with no ground, arc FX, text, border, blur, extra sword, bent blade, or costume change. Character identity and facial proportions must match approved idle exactly.
```

Inputs: `art/frames/player/idle_000.png` (approved identity), `art/reference/aclaire_character_sheet_v2.png` (design reference), `art/concept/aclaire_action_poses.png` (action direction).

### attack_1 correction (selected)

```text
Use case: precise-object-edit. Image 1 is the attack_1 key pose edit target; Image 2 is the approved idle sprite for exact character identity and head/body proportion. Correct ONLY the attack_1 pose geometry so it fits a compact 192×128 physical sprite frame with the body centered and boot soles on the bottom. Keep same Aclaire face, V4 pixel art style, orange ponytail, outfit colors, empty back scabbard and horizontal slash. Reduce the leg spread by about one third; rear boot comes closer beneath the torso. Shorten the straight silver blade by about one third, keeping one clear triangular point and its horizontal rigid axis, so the point ends no farther than 40 logical pixels right of body center after scaling. Keep the head the SAME size relative to torso as the idle reference. Arms grip one hilt naturally with no extra red ornament near the hands; the red orb is only the sword pommel at the left end of hilt. Fully visible, generous transparent margin. No glow or shadow backdrop, ground, arc trail, text, border, second sword, bent blade, blur or antialias.
```

Inputs: original `attack_1` generated source (edit target), approved `idle_000.png` (identity). Selected file: `art/concept/2026-10-25_aclaire_attack_1_key_source_v2.png`.

### attack_2

```text
Use case: stylized-concept. Asset type: isolated key pose concept for Aclaire V4 attack_2, a 2D action platformer sprite. Image 1 is the approved V4 production idle sprite and strict identity/head-size/color reference. Image 2 is the attack_1 key concept for continuity of costume and drawn sword, but this must be a distinctly NEW action. Image 3 is the original V2 action sheet used ONLY for the rising slash direction, not its drawing style. Create one full-body crisp 16-bit pixel-art Aclaire facing RIGHT at the PEAK of a diagonal rising sword slash. Her body twists upward, one foot planted on the bottom baseline and the other trailing, both hands firmly grip the hilt, and the broad STRAIGHT silver blade points up-right at about 45 degrees. Empty plain black scabbard stays on her back; exactly one sword, with straight continuous pommel/hilt/guard/blade alignment. Keep the same orange high ponytail with pink tie, blue eyes and SAME HEAD SIZE as Image 1, pink sleeveless top, small silver chest armor and black strap, tan shorts, charcoal socks, black boots with white cuffs. Energetic playful determined face. Intended reduction to a 192×128 physical frame: body centered at x=96, soles at bottom, sword reaches no more than 40 logical px right of body center. Fully visible with transparent margin. No magic, swoosh trail, background, ground, text, border, blur, antialias, bent blade, extra limbs or extra sword.
```

Inputs: approved `idle_000.png`, initial `attack_1` generated source (continuity reference), `art/concept/aclaire_action_poses.png` (action direction).

### attack_3

```text
Use case: stylized-concept. Asset type: isolated key pose concept for Aclaire V4 attack_3, the heavy downward finishing hit of a three-strike combo in a 2D action platformer. Image 1 is the approved V4 idle sprite and STRICT identity/head-size/color reference. Image 2 and Image 3 are attack_1 and attack_2 continuity references for the same costume and one sword. Image 4 is an older action sheet used ONLY for overhead-finisher direction. Draw one full-body crisp 16-bit pixel-art Aclaire facing RIGHT at the IMPACT moment AFTER the overhead swing: wide grounded stance, knees bent, both hands on one straight broad silver sword whose blade angles steeply DOWN-RIGHT and its tip contacts the ground just to the right of her front boot. Her face shows energetic determined effort, not anger. The plain black scabbard remains EMPTY on her back. Keep orange high ponytail and pink tie, blue eyes and SAME HEAD SIZE as approved idle, pink sleeveless shirt, small silver chest plate and black strap, tan shorts, charcoal long socks, black boots with white cuffs/soles. One sword only, rigid continuous pommel/hilt/guard/blade axis. Intended 192×128 physical frame, body around x=96, soles on bottom edge, sword tip no more than 40 logical px right of body center. Transparent background, fully visible. NO slash trail, dust plume, magic, ground scenery, text, border, blur, antialias, extra sword, bent blade or costume change.
```

Inputs: approved `idle_000.png`, initial `attack_1` and selected `attack_2` sources (continuity references), `art/concept/aclaire_action_poses.png` (action direction).

## Review gate

Pinz approved the three key poses after the `attack_3` height correction, conditional on hiding the red grip pommel. The correction is now applied to all three poses. Motion timing, intermediate frames, FX and runtime hit registration are outside this key-pose review.

## Final grip correction prompts

Each selected source was edited separately with built-in imagegen. The original pose was the edit target in each case.

### attack_1

```text
Use case: precise-object-edit. Edit target: this Aclaire V4 horizontal sword attack key pose. Make exactly ONE tiny change: conceal the bright red round ball at the rear of the sword grip where it protrudes past her hands. The short rear end of the hilt should terminate cleanly at or behind the nearest fist; no visible red circular pommel next to the hands. Preserve every other character pixel impression: identical face and head size, hair, expression, costume, feet, both hands and arms, sword blade length, straight sword angle, empty black back scabbard, pose, framing, pixel-art shading and transparent background. Do not change red/orange hair or any costume accents. No new effects or objects.
```

### attack_2

```text
Use case: precise-object-edit. Edit target: this Aclaire V4 rising diagonal sword attack key pose. Make exactly ONE tiny change: hide the bright red round ball protruding at the rear of the sword grip below and behind her raised fists. The hilt should end cleanly beneath the gripping hand with no visible red orb. Preserve the full character, face, eye and head scale, orange hair, costume, exact raised-arm pose, leg position, sword angle and length, empty black back scabbard, crisp pixel art, framing, and transparent background. Keep all other colors and pixels visually unchanged. Do not remove the gold wrist bracelet, sword guard, hair tie, or belt. No new objects, effects, background, blur or antialias.
```

### attack_3

```text
Use case: precise-object-edit. Edit target: this Aclaire V4 downward finisher key pose. Make exactly ONE tiny change: hide the bright red round ball protruding near the rear of the sword grip beside her lower fist. Her grip should read as two hands holding a single straight sword, with the hilt end concealed by the hand and no visible red circular knob. Preserve the exact face, head and body proportions, orange ponytail, pink outfit, empty black sheath, lowered sword angle and tip, all boot positions, stance, pixel-art style, framing and genuine transparent background. Do not remove the gold wrist bracelets or gold sword guard. No changes to hair or clothing, no extra effects, ground, blur, antialias or additional objects.
```
