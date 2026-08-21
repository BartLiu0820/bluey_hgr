from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "reviews/l1-position-reference-base.png"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
CREAM = "#fff9e9"
INK = "#173a52"
MUTED = "#496273"
BLUE = "#078fc4"
RED = "#f04d3a"


def face(size):
    return ImageFont.truetype(FONT, size)


def crop_alpha(path):
    image = Image.open(ROOT / path).convert("RGBA")
    return image.crop(image.getchannel("A").getbbox())


def fit_height(path, height):
    image = crop_alpha(path)
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def fit_width(path, width):
    image = crop_alpha(path)
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def paste_base(canvas, x, y, width=760, height=680):
    panel = Image.open(BASE).convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
    canvas.alpha_composite(panel, (x, y))
    return panel


def paste_bottom(canvas, sprite, center_x, bottom_y):
    canvas.alpha_composite(sprite, (round(center_x - sprite.width / 2), round(bottom_y - sprite.height)))


def dashed(draw, x1, x2, y, color):
    for x in range(x1, x2, 28):
        draw.line((x, y, min(x + 16, x2), y), fill=color, width=3)


def overlay_grass(canvas, panel, panel_x, panel_y, top, bottom):
    canvas.alpha_composite(panel.crop((0, top, panel.width, bottom)), (panel_x, panel_y + top))


def build_solid(number, name, asset, sprite, filename, previous_overlap):
    canvas = Image.new("RGBA", (1600, 900), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 18), f"{number} {name}（障碍物上移修正）", font=face(41), fill=INK)
    draw.text((51, 76), "刚性障碍底座只轻微进入草边，不能埋住底座、嫩芽或最下层箱体", font=face(20), fill=MUTED)

    panel_y = 140
    left_panel = paste_base(canvas, 30, panel_y)
    right_panel = paste_base(canvas, 810, panel_y)
    grass_top = 584
    old_bottom = panel_y + grass_top + previous_overlap
    target_bottom = panel_y + grass_top + 3

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((48, 155, 260, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((79, 166), "上一版（偏低）", font=face(23), fill=RED)
    paste_bottom(canvas, sprite, 410, old_bottom)
    overlay_grass(canvas, left_panel, 30, panel_y, grass_top, min(grass_top + previous_overlap, 620))
    draw = ImageDraw.Draw(canvas)
    dashed(draw, 54, 766, old_bottom, RED)
    draw.text((210, 786), f"底座进入草边约 {previous_overlap}px，视觉偏低", font=face(19), fill=RED)

    draw.rounded_rectangle((828, 155, 1058, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((857, 166), "预计调整后", font=face(23), fill=BLUE)
    paste_bottom(canvas, sprite, 1190, target_bottom)
    overlay_grass(canvas, right_panel, 810, panel_y, grass_top, grass_top + 3)
    draw = ImageDraw.Draw(canvas)
    dashed(draw, 834, 1546, target_bottom, BLUE)
    draw.text((976, 786), "整体上移，仅与草边交叠约 3px", font=face(19), fill=BLUE)

    out = ROOT / f"reviews/{filename}"
    canvas.convert("RGB").save(out, quality=95)
    return out


def build_pit():
    canvas = Image.new("RGBA", (1600, 900), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 18), "07 坑洞近岸位置（接缝上移修正）", font=face(41), fill=INK)
    draw.text((51, 76), "坑洞按左右近岸的黄色路面接缝定位；水面保持低于路面，草岸不能整体陷入地面", font=face(20), fill=MUTED)

    panel_y = 140
    paste_base(canvas, 30, panel_y)
    paste_base(canvas, 810, panel_y)
    pit = fit_width("assets/map-objects/creek-pit/prop.png", 690)

    # At this display scale, the near-shore road seam sits roughly 52 px below the sprite top.
    road_seam_y = panel_y + 568
    old_top = road_seam_y - 52 + 12
    target_top = road_seam_y - 52

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((48, 155, 260, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((79, 166), "上一版（偏低）", font=face(23), fill=RED)
    canvas.alpha_composite(pit, (65, round(old_top)))
    dashed(draw, 54, 766, road_seam_y, RED)
    draw.text((188, 786), "近岸接缝低于地图路面，草岸显得下沉", font=face(19), fill=RED)

    draw.rounded_rectangle((828, 155, 1058, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((857, 166), "预计调整后", font=face(23), fill=BLUE)
    canvas.alpha_composite(pit, (845, round(target_top)))
    dashed(draw, 834, 1546, road_seam_y, BLUE)
    draw.text((944, 786), "整体上移约 12px，近岸接缝与路面齐平", font=face(19), fill=BLUE)

    out = ROOT / "reviews/l1-reference-07-pit-v2.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


if __name__ == "__main__":
    outputs = [
        build_solid(
            "04", "软木箱", "assets/map-objects/soft-crate/prop.png",
            fit_height("assets/map-objects/soft-crate/prop.png", 220),
            "l1-reference-04-soft-crate-v2.png", 10,
        ),
        build_solid(
            "05", "原木", "assets/map-objects/creek-log/prop.png",
            fit_width("assets/map-objects/creek-log/prop.png", 560),
            "l1-reference-05-log-v2.png", 16,
        ),
        build_solid(
            "06", "双层木箱", "assets/map-objects/creek-double-crate/prop.png",
            fit_height("assets/map-objects/creek-double-crate/prop.png", 270),
            "l1-reference-06-double-crate-v2.png", 8,
        ),
        build_pit(),
    ]
    for output in outputs:
        print(output)
