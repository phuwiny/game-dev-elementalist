"""Export the approved Aclaire V4 seed's opaque RGB palette."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png"
OUTPUT = ROOT / "art/palette/2026-10-24_aclaire_v4_palette.hex"


def main() -> None:
    image = Image.open(SEED).convert("RGBA")
    pixels = list(image.get_flattened_data())
    alphas = {a for _, _, _, a in pixels}
    if image.size != (96, 128) or not alphas <= {0, 255}:
        raise ValueError(f"Unexpected V4 seed format: {image.size}, alpha={alphas}")
    colors = sorted({(r, g, b) for r, g, b, a in pixels if a == 255})
    OUTPUT.write_bytes("".join(f"#{r:02x}{g:02x}{b:02x}\n" for r, g, b in colors).encode("utf-8"))
    print(f"Exported {len(colors)} V4 colors to {OUTPUT}")


if __name__ == "__main__":
    main()
