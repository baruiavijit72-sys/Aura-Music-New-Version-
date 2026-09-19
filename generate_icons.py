#!/usr/bin/env python3
"""Generate Android launcher PNGs with circular-mask-safe padding.

The full source logo is scaled down and placed on a solid dark square canvas.
The artwork's complete bounding box is kept inside a conservative central circle,
so Android launchers that apply circular masks do not cut the ring or text.

Usage:
    python -m pip install Pillow
    python generate_icons.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "branding" / "1789567332876.png"
RES = ROOT / "app" / "src" / "main" / "res"
BACKGROUND = (7, 11, 20, 255)  # AURA dark navy
# Keep the logo within 72% of the square canvas diameter. This is deliberately
# conservative for circular launcher masks and OEM icon treatments.
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
            # contain() preserves the entire logo and never crops it.
            fitted = ImageOps.contain(
                source,
                (safe_size, safe_size),
                method=Image.Resampling.LANCZOS,
            )

            # Use opaque dark padding rather than transparent padding so the
            # launcher mask cannot reveal a different background or trim edges.
            canvas = Image.new("RGBA", (size, size), BACKGROUND)
            left = (size - fitted.width) // 2
            top = (size - fitted.height) // 2
            canvas.alpha_composite(fitted, (left, top))

            for filename in ("ic_launcher.png", "ic_launcher_round.png"):
                output = folder / filename
                canvas.save(output, format="PNG", optimize=True)
                print(f"Generated {output} ({size}x{size}, safe content {safe_size}px)")


if __name__ == "__main__":
    generate_icons()
    print("Done: full logo padded for circular launcher masks.")
