# Aclaire V4 moveset key-pose review — 25 October 2026

This review covers all seven remaining Aclaire actions: `double_jump`, `cast`, `dash`, `glide`, `ground_slam`, `hurt`, and `dead`. It is an art review only. No production atlas, animation metadata, game code, or manifest was changed.

## Review files

- [640×360 size comparison](../previews/phase_b/2026-10-25_moveset_key_review/2026-10-25_moveset_keys_640x360.png)
- `double_jump`: [strip](../previews/phase_b/2026-10-25_moveset_key_review/double_jump_strip_review.png), [motion GIF](../previews/phase_b/2026-10-25_moveset_key_review/double_jump_motion.gif)
- `cast`: [strip](../previews/phase_b/2026-10-25_moveset_key_review/cast_strip_review.png), [motion GIF](../previews/phase_b/2026-10-25_moveset_key_review/cast_motion.gif)
- `dash`: [strip](../previews/phase_b/2026-10-25_moveset_key_review/dash_strip_review.png), [motion GIF](../previews/phase_b/2026-10-25_moveset_key_review/dash_motion.gif)
- `glide`: [strip](../previews/phase_b/2026-10-25_moveset_key_review/glide_strip_review.png), [motion GIF](../previews/phase_b/2026-10-25_moveset_key_review/glide_motion.gif)
- `ground_slam`, `hurt`, `dead`: [640×360 comparison](../previews/phase_b/2026-10-25_moveset_key_review/2026-10-25_moveset_impact_keys_640x360.png) and [2× key-pose sheet](../previews/phase_b/2026-10-25_moveset_key_review/2026-10-25_moveset_impact_keys_x2.png)

The selected transparent source sheets are in `art/concept/` with names `2026-10-25_aclaire_{double_jump_source_v2,cast_source_v3,dash_source_v3,glide_source}.png`. Three additional source images end in `{ground_slam,hurt,dead}_key_source.png`. `tools/art/build_player_moveset_key_review.py` converts them to 96×128 physical previews with one shared scale per multi-frame action, nearest-neighbor sampling, the approved V4 247-color palette, binary alpha and bottom anchor. The first six actions use blue-eye x=57; `dead` has closed eyes and is centered by its silhouette. The 15 individual preview frames, three extra keys and measurements are in the review directory. Earlier generated sources that made the head too small or sent the cast palm behind the character were rejected.

## Visual decisions for Pinz

- `double_jump_001` is the active upward spring pose. Its four frames move from a tuck through the second spring to airborne recovery.
- `cast_002` shows the open palm in front of the right-facing character. The projectile and element glow remain separate FX.
- `dash_001` is a compact low airborne burst so the figure fits the 48×64 logical frame without shrinking the head excessively. The dash trail remains separate FX.
- `glide_000` is the level-arm loop key. No wings or equipment were added.
- `ground_slam_key` is the compact ground-contact pose; the hand touches the same baseline as the boot.
- `hurt_key` shows a brief recoil without injury details.
- `dead_key` is a compact seated collapse so the pose fits the specified 48×64 logical frame.

Pinz approved these key poses ("ok ครับ"). The production follow-up now uses them as the action anchors. Details of strip completion and atlas integration are in `phase_b.md`.
