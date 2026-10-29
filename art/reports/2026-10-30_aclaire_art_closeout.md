# Aclaire combat art — closeout

Date: 2026-10-30

Pinz rejected the pixel-cluster cleanup review and selected the previously approved production artwork. The cleanup study never replaced production assets. A byte-level Git comparison against c82edd6 confirms that all player source frames, player atlas files and animations.json retain the approved original version, including compact Cast and identical Hurt frames.

The cleanup sources, review outputs and helper scripts were moved intact into the local, untracked archive `art/archive/2026-10-30_rejected_pixel_cleanup/`. They are rejected studies, not production inputs; historical pending-review statements inside the archive are superseded by this decision. They are excluded from PR #13.

Validation: asset validator PASS (0 errors); current player combat checks PASS (2 tests covering the 59-frame atlas contract). No new gameplay changes were introduced. Prior production browser smoke results remain recorded in the Phase B report; this closeout does not claim a new full gameplay test.

No specification changes, game-code work or further art decision is required for this revision. PR #13 contains the approved original artwork and is ready for integration; merging is separate from this art closeout.
