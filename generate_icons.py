#!/usr/bin/env python3
"""Generate full-logo Android launcher PNGs without cropping.

This script reads the complete source logomark at:
    assets/branding/1789567332876.png
and creates non-adaptive PNG launchers for every Android mipmap density.
The artwork is fit into each square canvas without crop, mask, or adaptive 
icon container behavior. This preserves the entire original logo exactly as
provided.

Usage:
    python generate_icons.py

Requirements:
    pip install Pillow
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "branding" / "1789567332876.png"
RES = ROOT / "app" / "src" / "main" / "res"

DENSITY_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def ensure_pngs():
    if not SRC.exists():
        raise FileNotFoundError(f"Source logo not found: {SRC}")

    with Image.open(SRC) as src_img:
        src_img = src_img.convert("RGBA")

        for folder_name, size in DENSITY_SIZES.items():
            folder = RES / folder_name
            folder.mkdir(parents=True, exist_ok=True)

            # Preserve the entire original logo without center-cropping.
            fitted = ImageOps.contain(src_img, (size, size), method=Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

            left = (size - fitted.width) // 2
            top = (size - fitted.height) // 2
            canvas.alpha_composite(fitted, (left, top))

            launcher = folder / "ic_launcher.png"
            round_launcher = folder / "ic_launcher_round.png"

            canvas.save(launcher, format="PNG", optimize=True)
            canvas.save(round_launcher, format="PNG", optimize=True)

            print(f"Generated {launcher} and {round_launcher}")


if __name__ == "__main__":
    ensure_pngs()
    print("Done.")
