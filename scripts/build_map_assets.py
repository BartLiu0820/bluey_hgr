#!/usr/bin/env python3
"""Normalize generated map plates, key magenta layers, and build loop-safe pairs/previews."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageOps


TARGET = (1536, 864)
MAGENTA = (255, 0, 255)


def color_distance(rgb: tuple[int, int, int], target: tuple[int, int, int] = MAGENTA) -> float:
    return math.sqrt(sum((int(a) - int(b)) ** 2 for a, b in zip(rgb, target)))


def normalize(image: Image.Image) -> Image.Image:
    return ImageOps.fit(image.convert("RGBA"), TARGET, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def key_magenta(image: Image.Image) -> Image.Image:
    image = normalize(image)
    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    src = image.load()
    dst = output.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = src[x, y]
            distance = color_distance((r, g, b))
            if distance <= 42:
                dst[x, y] = (0, 0, 0, 0)
                continue
            alpha = a if distance >= 150 else round(a * (distance - 42) / (150 - 42))
            # Suppress magenta spill only at the keyed edge.
            if alpha < 255:
                red_blue = min(r, b)
                g = max(g, min(red_blue, 180))
                r = min(r, g + 70)
                b = min(b, g + 70)
            dst[x, y] = (r, g, b, alpha)
    return output


def quiet_plate(image: Image.Image, saturation: float, contrast: float, brightness: float) -> Image.Image:
    image = ImageEnhance.Color(image).enhance(saturation)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    return image


def loop_pair(image: Image.Image, axis: str) -> Image.Image:
    if axis == "x":
        pair = Image.new("RGBA", (image.width * 2, image.height), (0, 0, 0, 0))
        pair.alpha_composite(image, (0, 0))
        pair.alpha_composite(ImageOps.mirror(image), (image.width, 0))
        return pair
    pair = Image.new("RGBA", (image.width, image.height * 2), (0, 0, 0, 0))
    pair.alpha_composite(image, (0, 0))
    pair.alpha_composite(ImageOps.flip(image), (0, image.height))
    return pair


def alpha_coverage(image: Image.Image) -> float:
    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    visible = sum(histogram[1:])
    return visible / (image.width * image.height)


def build_level(project: Path, level: str, far_src: Path, mid_src: Path, axis: str) -> dict[str, object]:
    output_dir = project / "assets" / "maps" / level
    output_dir.mkdir(parents=True, exist_ok=True)
    far = quiet_plate(normalize(Image.open(far_src)), 0.82, 0.88, 1.03)
    mid = quiet_plate(key_magenta(Image.open(mid_src)), 0.78, 0.88, 1.0)
    far_path = output_dir / "far.png"
    mid_path = output_dir / "mid.png"
    far.save(far_path)
    mid.save(mid_path)
    far_pair = loop_pair(far, axis)
    mid_pair = loop_pair(mid, axis)
    far_pair_path = output_dir / "far-loop-pair.png"
    mid_pair_path = output_dir / "mid-loop-pair.png"
    far_pair.save(far_pair_path)
    mid_pair.save(mid_pair_path)
    preview = far.copy()
    preview.alpha_composite(mid)
    preview_path = output_dir / "background-preview.png"
    preview.convert("RGB").save(preview_path, quality=94)
    seam = ImageChops.difference(
        far_pair.crop((0, 0, 1, far_pair.height)),
        far_pair.crop((far_pair.width - 1, 0, far_pair.width, far_pair.height)),
    )
    return {
        "level": level,
        "canvas": {"width": TARGET[0], "height": TARGET[1]},
        "loopAxis": axis,
        "repeatPolicy": "mirror_pair",
        "layers": {
            "far": str(far_path.relative_to(project)),
            "mid": str(mid_path.relative_to(project)),
            "farLoopPair": str(far_pair_path.relative_to(project)),
            "midLoopPair": str(mid_pair_path.relative_to(project)),
        },
        "midAlphaCoverage": round(alpha_coverage(mid), 4),
        "outerSeamDifferenceBBox": seam.getbbox(),
        "preview": str(preview_path.relative_to(project)),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=Path, required=True)
    args = parser.parse_args()
    project = args.project.resolve()
    configs = [
        ("creek", project / "assets/maps/creek/raw/far.png", project / "assets/maps/creek/raw/mid.png", "x"),
        ("firefly", project / "assets/maps/firefly/raw/far.png", project / "assets/maps/firefly/raw/mid.png", "x"),
        ("treetop", project / "assets/maps/treetop/raw/far.png", project / "assets/maps/treetop/raw/mid.png", "y"),
    ]
    report = {"targetCanvas": {"width": TARGET[0], "height": TARGET[1]}, "levels": []}
    for level, far_src, mid_src, axis in configs:
        report["levels"].append(build_level(project, level, far_src, mid_src, axis))
    report_path = project / "data/maps/map-asset-build-report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(report_path)


if __name__ == "__main__":
    main()
