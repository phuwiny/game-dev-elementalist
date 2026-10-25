"""Create a visual contact sheet and measured frame bounds for the World 1 pack."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art" / "previews" / "phase_c"
FRAMES = ROOT / "art" / "frames"
GROUPS = {
    "moss_slime_idle": 4,
    "moss_slime_move": 6,
    "leaf_wisp_fly": 6,
    "leaf_wisp_dive": 3,
    "thorn_beetle_walk": 6,
    "thorn_beetle_flipped": 4,
    "idle": 6,
    "vine_attack": 8,
    "roar": 6,
    "weak_exposed": 4,
}


def metrics(image: Image.Image) -> dict[str, object]:
    box = image.getchannel("A").getbbox()
    if box is None:
        return {"bbox": None, "center_x": None, "bottom_gap": image.height}
    return {
        "bbox": list(box),
        "center_x": round((box[0] + box[2] - 1) / 2, 1),
        "bottom_gap": image.height - box[3],
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows: list[tuple[str, list[Image.Image]]] = []
    data: dict[str, object] = {}
    for name, count in GROUPS.items():
        directory = FRAMES / ("boss_bramble_king" if name in {"idle", "vine_attack", "roar", "weak_exposed"} else "enemies_w1")
        images = [Image.open(directory / f"{name}_{i:03}.png").convert("RGBA") for i in range(count)]
        rows.append((name, images))
        data[name] = [metrics(image) for image in images]

    width = 1800
    row_heights = [max(84, images[0].height * (1 if images[0].width > 64 else 2) + 28) for _, images in rows]
    board = Image.new("RGB", (width, sum(row_heights) + 12), "#2b2440")
    draw = ImageDraw.Draw(board)
    y = 6
    for (name, images), row_height in zip(rows, row_heights):
        scale = 1 if images[0].width > 64 else 2
        draw.text((8, y + 8), name, fill="#f2efe6")
        for i, frame in enumerate(images):
            x = 166 + i * (frame.width * scale + 8)
            if x + frame.width * scale > width:
                break
            tile = frame.resize((frame.width * scale, frame.height * scale), Image.Resampling.NEAREST)
            board.paste(tile, (x, y), tile)
            draw.text((x, y + frame.height * scale + 2), f"{i:03}", fill="#b4b2c9")
        y += row_height

    board.save(OUT / "2026-10-25_world1_motion_contact.png")
    tileset = Image.open(ROOT / "public" / "assets" / "tilesets" / "tiles_w1_ember_woods.png").convert("RGBA")
    legend = Image.new("RGB", (16 * 60 + 16, 4 * 68 + 38), "#2b2440")
    legend_draw = ImageDraw.Draw(legend)
    legend_draw.text((8, 8), "EMBER WOODS / TILE ID (0-based; Tiled GID = firstgid + ID)", fill="#f2efe6")
    for index in range(64):
        sx = 1 + (index % 16) * 18
        sy = 1 + (index // 16) * 18
        x = 8 + (index % 16) * 60
        y = 30 + (index // 16) * 68
        legend_draw.rectangle((x, y, x + 48, y + 48), fill="#4a4466")
        tile = tileset.crop((sx, sy, sx + 16, sy + 16)).resize((48, 48), Image.Resampling.NEAREST)
        legend.paste(tile, (x, y), tile)
        legend_draw.text((x, y + 49), f"{index:02}", fill="#f2efe6")
    legend.save(OUT / "2026-10-25_world1_tile_legend.png")
    adjacency = Image.new("RGB", (640, 360), "#2b2440")
    adjacency_draw = ImageDraw.Draw(adjacency)
    adjacency_draw.text((12, 8), "TILE ADJACENCY / 2x", fill="#f2efe6")

    def stamp(index: int, col: int, row: int, x0: int, y0: int) -> None:
        sx = 1 + (index % 16) * 18
        sy = 1 + (index // 16) * 18
        tile = tileset.crop((sx, sy, sx + 16, sy + 16)).resize((32, 32), Image.Resampling.NEAREST)
        adjacency.paste(tile, (x0 + col * 32, y0 + row * 32), tile)

    for col in range(12):
        stamp(7 if col == 0 else 8 if col == 11 else (0 if col % 4 else 1), col, 0, 12, 32)
        for row in range(1, 4):
            stamp(4 if col == 0 else 5 if col == 11 else (2 if (col + row) % 3 else 3), col, row, 12, 32)
    adjacency_draw.text((414, 32), "WALL", fill="#f2efe6")
    for row in range(3):
        for col in range(6):
            stamp(22 + ((row * 6 + col) % 12), col, row, 414, 52)
    adjacency_draw.text((12, 180), "INNER CORNERS", fill="#f2efe6")
    for col, index in enumerate((11, 12, 13, 14)):
        stamp(index, col, 0, 12, 204)
    adjacency_draw.text((200, 180), "ONE WAY", fill="#f2efe6")
    for col, index in enumerate((16, 17, 17, 17, 18)):
        stamp(index, col, 0, 200, 204)
    adjacency_draw.text((416, 180), "HAZARDS", fill="#f2efe6")
    for col, index in enumerate((19, 20, 21)):
        stamp(index, col, 0, 416, 204)
    adjacency_draw.text((12, 274), "DECORATION", fill="#f2efe6")
    for col, index in enumerate((34, 38, 42, 46, 50, 54)):
        stamp(index, col, 0, 12, 296)
    adjacency.save(OUT / "2026-10-25_world1_tile_adjacency.png")
    seam_board = Image.new("RGBA", (640, 4 * 360), "#2b2440")
    for row, layer in enumerate(("far", "mid", "near", "boss_far")):
        path = ROOT / "public" / "assets" / "backgrounds" / "w1" / f"bg_w1_{layer}.png"
        background = Image.open(path).convert("RGBA")
        seam_board.alpha_composite(background.crop((480, 0, 640, 360)), (160, row * 360))
        seam_board.alpha_composite(background.crop((0, 0, 160, 360)), (320, row * 360))
        ImageDraw.Draw(seam_board).line((320, row * 360, 320, row * 360 + 8), fill="#ff9a3c")
        ImageDraw.Draw(seam_board).text((8, row * 360 + 8), layer, fill="#f2efe6")
    seam_board.convert("RGB").save(OUT / "2026-10-25_world1_seam_review.png")
    (OUT / "2026-10-25_world1_frame_metrics.json").write_text(
        json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    for name, entries in data.items():
        centers = [entry["center_x"] for entry in entries if entry["center_x"] is not None]
        gaps = [entry["bottom_gap"] for entry in entries]
        print(f"{name}: center_x={min(centers)}..{max(centers)} bottom_gap={min(gaps)}..{max(gaps)}")


if __name__ == "__main__":
    main()
