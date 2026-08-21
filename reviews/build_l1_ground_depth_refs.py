from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = ROOT / "reviews/l1-position-reference-base.png"
FONT_PATH = "/System/Library/Fonts/STHeiti Medium.ttc"

CREAM = "#fff9e9"
INK = "#173a52"
MUTED = "#496273"
BLUE = "#078fc4"
RED = "#f04d3a"
GREEN = "#008f68"


def font(size):
    return ImageFont.truetype(FONT_PATH, size)


def fixed_sprite(path, scale):
    """Scale the complete 256×256 frame once; alpha-cropping never changes scale."""
    source = Image.open(ROOT / path).convert("RGBA")
    side = round(source.width * scale)
    scaled = source.resize((side, side), Image.Resampling.LANCZOS)
    return scaled.crop(scaled.getchannel("A").getbbox())


def fit_visible_height(path, height):
    source = Image.open(ROOT / path).convert("RGBA")
    bbox = source.getchannel("A").getbbox()
    return fixed_sprite(path, height / (bbox[3] - bbox[1]))


def paste_feet(canvas, sprite, center_x, full_feet_y):
    canvas.alpha_composite(
        sprite,
        (round(center_x - sprite.width / 2), round(full_feet_y - sprite.height)),
    )


def dashed(draw, x1, x2, y, color, width=4, dash=16, gap=12):
    x = x1
    while x < x2:
        draw.line((x, y, min(x + dash, x2), y), fill=color, width=width)
        x += dash + gap


def centered(draw, x, y, value, face, fill=INK):
    box = draw.textbbox((0, 0), value, font=face)
    draw.text((x - (box[2] - box[0]) / 2, y), value, font=face, fill=fill)


def ground_panel(width, height):
    base = Image.open(BASE_PATH).convert("RGBA")
    return base.resize((width, height), Image.Resampling.LANCZOS)


def overlay_front_grass(canvas, panel, panel_x, panel_y, local_grass_top, local_grass_bottom):
    """Repaint the foreground grass after actors so their lower feet sit behind it."""
    strip = panel.crop((0, local_grass_top, panel.width, local_grass_bottom))
    canvas.alpha_composite(strip, (panel_x, panel_y + local_grass_top))


def build_reference_02():
    canvas = Image.new("RGBA", (1600, 900), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 18), "02 五角色站立位置（轻微纵深修正）", font=font(41), fill=INK)
    draw.text((51, 76), "脚要完整可辨；仅让鞋底最下缘轻微进入绿色草边，不能遮住脚掌或小腿", font=font(20), fill=MUTED)

    panel_w, panel_h = 760, 680
    panel = ground_panel(panel_w, panel_h)
    panels = ((30, 140), (810, 140))
    for px, py in panels:
        canvas.alpha_composite(panel, (px, py))

    paths = (
        "assets/characters/bluey/run/run-1.png",
        "assets/characters/bingo/run/run-1.png",
        "assets/characters/grey-puppy/run/run-1.png",
        "assets/characters/blue-heeler-dad/run/run-1.png",
        "assets/characters/garden-girl/run/run-1.png",
    )
    names = ("布鲁伊", "宾果", "麦麦", "班底特", "悠悠")
    sprites = [fit_visible_height(path, 142) for path in paths]
    local_surface = 558
    local_grass_top = 584
    local_depth_anchor = 590
    local_grass_bottom = 594
    xs = (115, 258, 400, 543, 685)

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((48, 155, 246, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((78, 166), "上一版（错误）", font=font(23), fill=RED)
    dashed(draw, 54, 766, 140 + local_surface, RED, width=4)
    for x, sprite, name in zip(xs, sprites, names):
        paste_feet(canvas, sprite, 30 + x, 140 + local_surface)
        centered(draw, 30 + x, 747, name, font(17))
    draw.text((205, 786), "脚底停在地面上沿，视觉上仍然悬浮", font=font(19), fill=RED)

    draw.rounded_rectangle((828, 155, 1058, 204), 18, fill="#fffdf8", outline="#d99a32", width=2)
    draw.text((857, 166), "预计调整后", font=font(23), fill=BLUE)
    for x, sprite, name in zip(xs, sprites, names):
        paste_feet(canvas, sprite, 810 + x, 140 + local_depth_anchor)
    overlay_front_grass(canvas, panel, 810, 140, local_grass_top, local_grass_bottom)
    draw = ImageDraw.Draw(canvas)
    dashed(draw, 834, 1546, 140 + local_depth_anchor, BLUE, width=3)
    for x, name in zip(xs, names):
        centered(draw, 810 + x, 747, name, font(17))
    draw.text((960, 786), "脚底仅交叠 4–6px，完整脚型保持可见", font=font(19), fill=BLUE)

    out = ROOT / "reviews/l1-reference-02-characters-standing-v3.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def build_reference_03():
    canvas = Image.new("RGBA", (1600, 1000), CREAM)
    draw = ImageDraw.Draw(canvas)
    draw.text((48, 18), "03 角色跳跃锚点（轻微纵深修正）", font=font(41), fill=INK)
    draw.text((51, 76), "站立与下落终点都继承 02：脚型完整可见，仅鞋底下缘与草边轻微交叠", font=font(20), fill=MUTED)

    panel_w, panel_h = 1500, 360
    panel = ground_panel(panel_w, panel_h)
    panel_x = 50
    top_y, bottom_y = 140, 560
    canvas.alpha_composite(panel, (panel_x, top_y))
    canvas.alpha_composite(panel, (panel_x, bottom_y))

    # Same complete-frame scale as reference 02's Bluey: visible run height = 142 px.
    scale = 142 / 144
    run = fixed_sprite("assets/characters/bluey/run/run-1.png", scale)
    takeoff = fixed_sprite("assets/characters/bluey/jump/jump-1.png", scale)
    peak = fixed_sprite("assets/characters/bluey/jump/jump-2.png", scale)
    landing = fixed_sprite("assets/characters/bluey/jump/jump-4.png", scale)

    local_surface = 292
    local_grass_top = 309
    local_depth_anchor = 313
    local_grass_bottom = 317

    draw = ImageDraw.Draw(canvas)
    draw.text((78, top_y + 18), "上一版错误：站立与落地都停在黄色路面上沿", font=font(25), fill=RED)
    top_xs = (250, 610, 970, 1330)
    top_sprites = (run, takeoff, peak, landing)
    top_feet = (top_y + local_surface, top_y + local_surface, top_y + local_surface - 180, top_y + local_surface)
    top_labels = ("站立", "起跳", "峰值", "落地")
    dashed(draw, 72, 1528, top_y + local_surface, RED, width=4)
    for x, sprite, feet_y, label in zip(top_xs, top_sprites, top_feet, top_labels):
        paste_feet(canvas, sprite, x, feet_y)
        centered(draw, x, top_y + 326, label, font(18))

    draw.text((78, bottom_y + 18), "预计调整：全过程以 02 的草地纵深锚点为零点", font=font(25), fill=GREEN)
    bottom_xs = (190, 490, 790, 1090, 1390)
    bottom_sprites = (run, takeoff, peak, landing, run)
    bottom_feet = (
        bottom_y + local_depth_anchor,
        bottom_y + local_depth_anchor,
        bottom_y + local_depth_anchor - 180,
        bottom_y + local_depth_anchor,
        bottom_y + local_depth_anchor,
    )
    bottom_labels = ("站立基准（同 02）", "起跳", "峰值", "落地瞬间", "恢复站立（同 02）")
    for x, sprite, feet_y in zip(bottom_xs, bottom_sprites, bottom_feet):
        paste_feet(canvas, sprite, x, feet_y)
    overlay_front_grass(canvas, panel, panel_x, bottom_y, local_grass_top, local_grass_bottom)
    draw = ImageDraw.Draw(canvas)
    dashed(draw, 72, 1528, bottom_y + local_depth_anchor, BLUE, width=3)
    for x, label in zip(bottom_xs, bottom_labels):
        centered(draw, x, bottom_y + 338, label, font(18))
    draw.text((1120, bottom_y + 280), "脚底仅交叠草边约 4px", font=font(17), fill=BLUE)

    out = ROOT / "reviews/l1-reference-03-character-jump-v4.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


if __name__ == "__main__":
    print(build_reference_02())
    print(build_reference_03())
