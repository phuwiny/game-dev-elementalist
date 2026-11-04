# Valvaliz / Eathy expression revision v2

User requested higher resolution for visible expressions, allowing smaller bodies.

Delivered 22 versioned 64x64 frames: 6 idle, 4 cast, 1 icon for each spirit. Valvaliz has a smaller torso and wings behind her larger face; Eathy has a larger face and compact orbiting stones. Expressions include blink, small smiles/frowns, surprised mouth and focused casting. Master-palette export, <=16 opaque colors per frame, binary alpha and dimensions all checked successfully. Source, deterministic export, 4 animated GIFs, before/after comparison and standalone preview atlas retained.

Paths: art/previews/phase_b/2026-11-04_spirit_expressions_v2/. Run python3 tools/art/build_spirit_expression_revision.py to regenerate.

This is a density-2 art revision ready for integration, not a replacement of the live 32px atlas. Before/after compares old 32px at 4x and new 64px at 2x: same screen allocation. Production files and the other two spirits remain unchanged.

Game-owner handoff: support 64x64 texture frames for Valvaliz and Eathy with 0.5 render scale relative to the existing 32px sprites, preserving center origins, animation names/counts/timing and flip behavior. Apply corresponding size handling at all spirit appearances (companion, pickups and icons), not only SpiritCompanion. Burnil and Wata remain 32px, so setting density 2 on the entire existing spirits atlas without per-character handling would shrink them. Either handle density per spirit or split the density-2 spirits into a separate atlas and update consumers. ART_HANDOFF and manifest currently specify 32x32; these code/spec files are owned by the game side per AGENTS.md. No code or production contract was modified here.

No browser integration claim: the existing runtime cannot display the new density correctly until that change. The new preview atlas is intentionally outside public/assets. The active production validator still passes.
