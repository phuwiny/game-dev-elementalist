"""Export review-only GIFs for every World 1 enemy and boss animation."""
from __future__ import annotations

import html
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art" / "frames"
OUTPUT = ROOT / "art" / "previews" / "phase_c" / "animations"
INDEX = ROOT / "art" / "previews" / "phase_c" / "2026-10-25_world1_animations.html"
BACKGROUND = "#2b2440"


def placement(atlas: str, name: str, frame: Image.Image) -> tuple[int, int, int]:
    if atlas == "enemies_w1":
        scale = 4
        if name.startswith("leaf_wisp_"):
            return (160 - frame.width * scale // 2, 132 - frame.height * scale // 2, scale)
        return (160 - frame.width * scale // 2, 230 - frame.height * scale, scale)
    if name in ("idle", "vine_attack", "roar", "weak_exposed", "hurt", "death"):
        return (28, 230 - frame.height, 1)
    if name == "vine_whip":
        return (72, 230 - frame.height * 3, 3)
    if name.startswith("vine_shield_"):
        return (160 - frame.width * 3 // 2, 230 - frame.height * 3, 3)
    return (160 - frame.width * 4 // 2, 132 - frame.height * 4 // 2, 4)


def render_frame(atlas: str, name: str, index: int, count: int, source: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (320, 260), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    if not name.startswith("leaf_wisp_") and name != "thorn_seed":
        draw.line((0, 230, 319, 230), fill="#7b7896")
    x, y, scale = placement(atlas, name, source)
    sprite = source.resize((source.width * scale, source.height * scale), Image.Resampling.NEAREST)
    canvas.paste(sprite, (x, y), sprite)
    draw.text((8, 7), name, fill="#f2efe6")
    draw.text((8, 244), f"{index + 1}/{count}", fill="#b4b2c9")
    return canvas


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    motions = json.loads((ROOT / "public" / "assets" / "animations.json").read_text(encoding="utf-8"))
    cards: list[str] = []
    count = 0
    for key, definition in motions.items():
        if not key.startswith(("enemies_w1_", "boss_bramble_king_")):
            continue
        atlas = definition["atlas"]
        name = key[len(atlas) + 1:]
        prefix = definition["prefix"]
        frame_count = definition["frames"]
        fps = definition["frameRate"]
        images = []
        for index in range(frame_count):
            filename = SOURCE / atlas / f"{prefix}{index:03}.png"
            source = Image.open(filename).convert("RGBA")
            images.append(render_frame(atlas, name, index, frame_count, source))
        target = OUTPUT / f"{key}.gif"
        images[0].save(
            target,
            save_all=True,
            append_images=images[1:],
            duration=round(1000 / fps),
            loop=0,
            optimize=False,
        )
        cards.append(
            f'<figure><img src="animations/{html.escape(target.name)}" width="320" height="260" '
            f'alt="{html.escape(name)} animation"><figcaption>{html.escape(name)} · '
            f'{frame_count} frames · {fps} fps</figcaption></figure>'
        )
        count += 1
    document = """<!doctype html>
<html lang="en"><meta charset="utf-8"><title>World 1 animation review</title>
<style>body{background:#0f0b1a;color:#f2efe6;font:14px system-ui;margin:24px}
h1{font-size:22px}p{color:#b4b2c9}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
figure{margin:0;background:#2b2440}img{display:block;image-rendering:pixelated;max-width:100%}
figcaption{padding:8px}</style><h1>Ember Woods · animation review</h1>
<p>Production frames at their authored frame rates. GIFs loop for review, including one-shot death poses.</p>
<main>""" + "\n".join(cards) + "</main></html>\n"
    INDEX.write_text(document, encoding="utf-8", newline="\n")
    print(f"Built {count} animation GIFs and {INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
