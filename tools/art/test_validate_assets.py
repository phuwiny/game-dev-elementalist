"""Focused regression checks for the Phase B player asset contract."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("validate_assets", ROOT / "tools/validate_assets.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class PlayerContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.atlas = self.root / "sprites/player"
        self.atlas.mkdir(parents=True)
        self.master = validator.palette(validator.MASTER)
        self.v4 = validator.palette(validator.V4)

    def write_atlas(self, *, run_width=128, alpha=255, color=None):
        color = color or next(iter(self.v4))
        image = Image.new("RGBA", (240, 130), (0, 0, 0, 0))
        image.putpixel((0, 0), (*color, alpha))
        image.save(self.atlas / "player.png")
        data = {"frames": {
            "idle_000": {"frame": {"x": 0, "y": 0, "w": 96, "h": 128}, "rotated": False, "trimmed": False},
            "run_000": {"frame": {"x": 100, "y": 0, "w": run_width, "h": 128}, "rotated": False, "trimmed": False},
        }}
        (self.atlas / "player.json").write_text(json.dumps(data), encoding="utf-8")
        animations = {"player_idle": {"atlas": "player", "prefix": "idle_", "frames": 1},
                      "player_run": {"atlas": "player", "prefix": "run_", "frames": 1}}
        (self.root / "animations.json").write_text(json.dumps(animations), encoding="utf-8")

    def check(self):
        return validator.validate(self.root, self.master, self.v4)

    def test_valid_player_atlas(self):
        self.write_atlas()
        self.assertEqual([], self.check())

    def test_rejects_wrong_run_frame_size(self):
        self.write_atlas(run_width=120)
        self.assertTrue(any("expected 128x128" in e for e in self.check()))

    def test_rejects_partial_alpha_and_foreign_color(self):
        self.write_atlas(alpha=127, color=(1, 2, 3))
        self.assertTrue(any("semi-transparent" in e for e in self.check()))
        self.write_atlas(color=(1, 2, 3))
        self.assertTrue(any("outside Aclaire V4" in e for e in self.check()))

    def test_missing_assets_are_not_a_pass(self):
        self.assertTrue(any("no production assets" in e for e in self.check()))

    def test_approved_v4_previews_fit_the_new_contract(self):
        paths = [ROOT / "art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png",
                 ROOT / "art/previews/phase_b/2026-10-24_aclaire_jump_up_key_v4_48x64_density2.png"]
        paths += sorted((ROOT / "art/previews/phase_b/2026-10-24_aclaire_run_v4_redraw").glob("*.png"))
        self.assertGreaterEqual(len(paths), 3)
        for path in paths:
            with self.subTest(path=path):
                image = Image.open(path).convert("RGBA")
                self.assertEqual((128, 128) if "run_v4" in str(path) else (96, 128), image.size)
                pixels = list(image.get_flattened_data())
                self.assertLessEqual({a for _, _, _, a in pixels}, {0, 255})
                self.assertFalse({(r, g, b) for r, g, b, a in pixels if a == 255} - self.v4)


if __name__ == "__main__":
    unittest.main()
