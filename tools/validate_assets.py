"""Validate shippable art assets against ART_HANDOFF.md.

Run from any directory. A missing/empty public/assets is incomplete, not a pass.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "art/palette/master_palette.hex"
V4 = ROOT / "art/palette/2026-10-24_aclaire_v4_palette.hex"
FRAME_NAME = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*_\d{3}$")
SNAKE = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
PLAYER_SIZES = {"run": (128, 128), "attack_1": (128, 96),
                "attack_2": (128, 96), "attack_3": (128, 96)}
PLAYER_DEFAULT = (96, 128)


def palette(path: Path) -> set[tuple[int, int, int]]:
    values = [s.strip() for s in path.read_text(encoding="utf-8-sig").splitlines() if s.strip()]
    if any(not re.fullmatch(r"#[0-9a-fA-F]{6}", s) for s in values):
        raise ValueError(f"Invalid palette entry in {path}")
    return {tuple(bytes.fromhex(s[1:])) for s in values}


def player_size(name: str) -> tuple[int, int] | None:
    match = re.fullmatch(r"(.+)_\d{3}", name)
    if not match:
        return None
    return PLAYER_SIZES.get(match.group(1), PLAYER_DEFAULT)


def validate(root: Path, master: set, v4: set) -> list[str]:
    errors: list[str] = []

    def fail(path: Path, message: str) -> None:
        errors.append(f"{path.relative_to(root) if path.is_relative_to(root) else path}: {message}")

    if not root.is_dir():
        return [f"{root}: production asset directory does not exist"]
    files = sorted(p for p in root.rglob("*") if p.is_file()
                   and not p.relative_to(root).parts[0] in {"maps", "audio"})
    if not files:
        return [f"{root}: no production assets to validate"]

    pngs: dict[Path, Image.Image] = {}
    for path in files:
        rel = path.relative_to(root)
        if any(not SNAKE.fullmatch(part) for part in rel.parts[:-1]) or not SNAKE.fullmatch(path.stem):
            fail(path, "file/directory name must be snake_case")
        if path.suffix.lower() != ".png":
            continue
        try:
            with Image.open(path) as source:
                if source.format != "PNG" or source.mode != "RGBA":
                    fail(path, "must be RGBA PNG")
                image = source.convert("RGBA")
        except (OSError, ValueError) as exc:
            fail(path, f"cannot read PNG: {exc}")
            continue
        pngs[path] = image
        colors = set()
        partial = False
        for r, g, b, a in image.get_flattened_data():
            if a not in (0, 255):
                partial = True
            if a == 255:
                colors.add((r, g, b))
        if partial:
            fail(path, "semi-transparent pixels (alpha 1..254)")
        is_player = rel.parts[:2] == ("sprites", "player")
        allowed = v4 if is_player else master
        if colors - allowed:
            fail(path, f"{len(colors - allowed)} colors outside {'Aclaire V4' if is_player else 'master'} palette")
        if is_player and len(colors) > 247:
            fail(path, f"Aclaire atlas uses {len(colors)} opaque colors; limit 247")
        if rel.parts[0] == "tilesets" and len(colors) > 24:
            fail(path, f"tileset uses {len(colors)} colors; limit 24")
        if rel.parts[0] == "tilesets":
            if image.width != 288 or image.height % 18 != 0 or image.height < 18:
                fail(path, f"tileset size {image.size} does not fit 16 columns with margin=1, spacing=2")
            else:
                rows = image.height // 18
                pixels = image.load()
                extrude_ok = True
                for row in range(rows):
                    for col in range(16):
                        x, y = 1 + col * 18, 1 + row * 18
                        for dx in range(16):
                            if pixels[x + dx, y - 1] != pixels[x + dx, y] or pixels[x + dx, y + 16] != pixels[x + dx, y + 15]:
                                extrude_ok = False
                                break
                        for dy in range(16):
                            if pixels[x - 1, y + dy] != pixels[x, y + dy] or pixels[x + 16, y + dy] != pixels[x + 15, y + dy]:
                                extrude_ok = False
                                break
                if not extrude_ok:
                    fail(path, "tile borders are not extruded by 1px")
        if rel.parts[0] == "backgrounds":
            if image.size != (640, 360):
                fail(path, f"background is {image.size}, expected 640x360")
            if list(image.crop((0, 0, 1, image.height)).get_flattened_data()) != list(image.crop((image.width - 1, 0, image.width, image.height)).get_flattened_data()):
                fail(path, "left and right edge columns differ")
        if image.width > 2048 or image.height > 2048:
            if rel.parts[0] in {"sprites", "ui"}:
                fail(path, "atlas exceeds 2048x2048")

    atlas_frames: dict[str, set[str]] = {}
    for png_path in pngs:
        if png_path.relative_to(root).parts[0] in {"sprites", "ui"} and not png_path.with_suffix(".json").exists() and png_path.stem != "font_hud":
            fail(png_path, "matching atlas JSON missing")
    if atlas_frames and not (root / "animations.json").exists():
        fail(root / "animations.json", "animation manifest missing")
    for path in files:
        if path.suffix.lower() != ".json" or path.name == "animations.json":
            continue
        png_path = path.with_suffix(".png")
        if png_path not in pngs:
            fail(path, "matching atlas PNG missing")
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8-sig"))
            frames = data["frames"]
            if not isinstance(frames, dict) or not frames:
                raise ValueError("frames must be a nonempty JSON Hash object")
        except (OSError, ValueError, KeyError, TypeError) as exc:
            fail(path, f"invalid Phaser JSON Hash: {exc}")
            continue
        image = pngs[png_path]
        atlas_frames[path.stem] = set(frames)
        rectangles: list[tuple[str, int, int, int, int]] = []
        for name, info in frames.items():
            if not isinstance(name, str) or (not FRAME_NAME.fullmatch(name) and path.stem != "ui"):
                fail(path, f"invalid frame name {name!r}")
            try:
                rect = info["frame"]
                x, y, w, h = (rect[k] for k in ("x", "y", "w", "h"))
                if any(type(v) is not int for v in (x, y, w, h)) or min(x, y) < 0 or min(w, h) <= 0:
                    raise ValueError("non-integer or nonpositive frame rectangle")
                if x + w > image.width or y + h > image.height:
                    fail(path, f"{name} exceeds atlas bounds")
                if info.get("rotated", False) or info.get("trimmed", False):
                    fail(path, f"{name} is rotated/trimmed")
                if path.stem == "player":
                    expected = player_size(name)
                    if expected and (w, h) != expected:
                        fail(path, f"{name} is {w}x{h}; expected {expected[0]}x{expected[1]}")
                elif path.stem != "ui" and path.relative_to(root).parts[0] == "sprites" and x + w <= image.width and y + h <= image.height:
                    frame_colors = {(r, g, b) for r, g, b, alpha in image.crop((x, y, x + w, y + h)).get_flattened_data() if alpha == 255}
                    if len(frame_colors) > 16:
                        fail(path, f"{name} uses {len(frame_colors)} colors; character/enemy limit 16")
                rectangles.append((name, x, y, w, h))
            except (KeyError, TypeError, ValueError) as exc:
                fail(path, f"invalid {name} frame: {exc}")
        for i, (a, ax, ay, aw, ah) in enumerate(rectangles):
            for b, bx, by, bw, bh in rectangles[i + 1:]:
                if ax < bx + bw + 2 and bx < ax + aw + 2 and ay < by + bh + 2 and by < ay + ah + 2:
                    fail(path, f"{a} and {b} lack 2px padding")

    for path in files:
        if path.name != "animations.json":
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8-sig"))
            if not isinstance(data, dict):
                raise ValueError("root must be an object")
        except (OSError, ValueError) as exc:
            fail(path, f"invalid animation manifest: {exc}")
            continue
        for key, anim in data.items():
            try:
                atlas = anim["atlas"]
                prefix = anim["prefix"]
                count = anim["frames"]
                if not isinstance(count, int) or count < 1:
                    raise ValueError("frames must be positive integer")
                if atlas not in atlas_frames:
                    fail(path, f"{key}: atlas {atlas!r} missing")
                    continue
                expected = {f"{prefix}{i:03d}" for i in range(count)}
                missing = expected - atlas_frames[atlas]
                if missing:
                    fail(path, f"{key}: missing frames {sorted(missing)}")
                actual = {n for n in atlas_frames[atlas] if n.startswith(prefix) and re.fullmatch(re.escape(prefix) + r"\d{3}", n)}
                if actual != expected:
                    fail(path, f"{key}: frame count/sequence mismatch")
            except (KeyError, TypeError, ValueError) as exc:
                fail(path, f"{key}: invalid animation: {exc}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets-root", type=Path, default=ROOT / "public/assets")
    args = parser.parse_args()
    try:
        master, v4 = palette(MASTER), palette(V4)
    except (OSError, ValueError) as exc:
        print(f"Palette error: {exc}")
        return 2
    if len(master) != 35 or len(v4) != 247:
        print(f"Palette size mismatch: master={len(master)}, V4={len(v4)}")
        return 2
    errors = validate(args.assets_root.resolve(), master, v4)
    for error in errors:
        print(f"ERROR {error}")
    print(f"Validation: {'FAILED' if errors else 'PASS'} ({len(errors)} errors)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
