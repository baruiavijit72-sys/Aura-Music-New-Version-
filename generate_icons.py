#!/usr/bin/env python3
"""Generate padded, non-adaptive Android launcher PNGs.

The complete source logo is fitted inside a solid dark square canvas. The
source aspect ratio is preserved and nothing is cropped. The 72% content size
leaves enough margin for launchers that apply circular/OEM masks.

Usage:
    python -m pip install Pillow
    python generate_icons.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "branding" / "20260919_123442.png"
RES = ROOT / "app" / "src" / "main" / "res"
BACKGROUND = (7, 11, 20, 255)
SAFE_DIAMETER_RATIO = 0.72
DENSITY_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def generate_icons() -> None:
    if not SRC.is_file():
        raise FileNotFoundError(f"Source logo not found: {SRC}")

    with Image.open(SRC) as source:
        source = source.convert("RGBA")
        for folder_name, size in DENSITY_SIZES.items():
            folder = RES / folder_name
            folder.mkdir(parents=True, exist_ok=True)
            safe_size = max(1, int(size * SAFE_DIAMETER_RATIO))
            fitted = ImageOps.contain(
                source,
                (safe_size, safe_size),
                method=Image.Resampling.LANCZOS,
            )
            canvas = Image.new("RGBA", (size, size), BACKGROUND)
            offset = ((size - fitted.width) // 2, (size - fitted.height) // 2)
            canvas.alpha_composite(fitted, offset)

            for filename in ("ic_launcher.png", "ic_launcher_round.png"):
                output = folder / filename
                canvas.save(output, format="PNG", optimize=True)
                print(f"Generated {output} ({size}x{size})")


if __name__ == "__main__":
    generate_icons()
    print("Done: padded flat launcher icons generated.")
