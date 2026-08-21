from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reviews/l1-reference-03-character-jump-v2.png"
BASE = ROOT / "reviews/l1-position-reference-base.png"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"

W, H = 1600, 1000
INK = "#173a52"
MUTED = "#496273"
BLUE = "#078fc4"
RED = "#f04d3a"
GREEN = "#008f68"
CREAM = "#fff9e9"


def font(size: int):
    return ImageFont.truetype(FONT, size)


def fixed_sprite(relative_path: str, scale: float):
    """Scale the original 256 canvas once, then crop transparency without rescaling."""
    source = Image.open(ROOT / relative_path).convert("RGBA")
    side = round(source.width * scale)
    scaled = source.resize((side, side), Image.Resampling.LANCZOS)
    bbox = scaled.getchannel("A").getbbox()
    return scaled.crop(bbox)


def paste_feet(canvas, sprite, center_x, feet_y):
    x = round(center_x - sprite.width / 2)
    y = round(feet_y - sprite.height)
    canvas.alpha_composite(sprite, (x, y))


def center_text(draw, x, y, value, face, fill=INK):
    box = draw.textbbox((0, 0), value, font=face)
    draw.text((x - (box[2] - box[0]) / 2, y), value, font=face, fill=fill)


canvas = Image.new("RGBA", (W, H), CREAM)
draw = ImageDraw.Draw(canvas)

draw.text((48, 18), "03 角色跳跃锚点（按 02 修正）", font=font(43), fill=INK)
draw.text(
    (51, 78),
    "下落终点以 02 站立位置高度为准；落地瞬间脚底回线，随后恢复到同高站立",
    font=font(20),
    fill=MUTED,
)

panel_source = Image.open(BASE).convert("RGBA")
panel = panel_source.resize((1500, 360), Image.Resampling.LANCZOS)
panel_x = 50
top_y = 140
bottom_y = 560
canvas.alpha_composite(panel, (panel_x, top_y))
canvas.alpha_composite(panel, (panel_x, bottom_y))

# One scale for every pose. run-1's 144 px visible source height becomes 142 px,
# matching Bluey's target visible height in reference 02.
scale = 142 / 144
run = fixed_sprite("assets/characters/bluey/run/run-1.png", scale)
takeoff = fixed_sprite("assets/characters/bluey/jump/jump-1.png", scale)
peak = fixed_sprite("assets/characters/bluey/jump/jump-2.png", scale)
landing = fixed_sprite("assets/characters/bluey/jump/jump-4.png", scale)

contact_top = top_y + 292
contact_bottom = bottom_y + 292

# Draw explicit contact baselines over the pale track.
draw = ImageDraw.Draw(canvas)
for y in (contact_top, contact_bottom):
    draw.line((72, y, 1528, y), fill="#18a8d1", width=8)
    for x in range(78, 1520, 28):
        draw.line((x, y, min(x + 14, 1520), y), fill="#057faa", width=3)

# Current conflict: landing crouch is incorrectly treated as the final state.
draw.text((78, top_y + 18), "当前冲突：把落地蹲姿当成最终位置，因此看起来低于 02", font=font(25), fill=RED)
top_xs = (250, 610, 970, 1330)
top_sprites = (run, takeoff, peak, landing)
top_feet = (contact_top, contact_top, contact_top - 180, contact_top)
top_labels = ("站立", "起跳", "峰值", "错误终点：蹲姿")
for x, sprite, feet_y, label in zip(top_xs, top_sprites, top_feet, top_labels):
    paste_feet(canvas, sprite, x, feet_y)
    center_text(draw, x, top_y + 326, label, font(19), RED if "错误" in label else INK)

# Correct sequence: landing is transient and must recover to the exact 02 baseline/height.
draw.text((78, bottom_y + 18), "预计调整：落地回线后恢复站立，首尾均与 02 同高", font=font(25), fill=GREEN)
bottom_xs = (190, 490, 790, 1090, 1390)
bottom_sprites = (run, takeoff, peak, landing, run)
bottom_feet = (contact_bottom, contact_bottom, contact_bottom - 180, contact_bottom, contact_bottom)
bottom_labels = ("站立基准（同 02）", "起跳", "峰值", "落地瞬间", "恢复站立（同 02）")
for x, sprite, feet_y, label in zip(bottom_xs, bottom_sprites, bottom_feet, bottom_labels):
    paste_feet(canvas, sprite, x, feet_y)
    center_text(draw, x, bottom_y + 326, label, font(18), INK)

# Mark the authoritative first/final standing tops and shared foot baseline.
stand_top = contact_bottom - run.height
draw.line((145, stand_top, 1435, stand_top), fill=GREEN, width=2)
draw.text((1160, stand_top - 28), "02 站立可见高度：142 px", font=font(17), fill=GREEN)
draw.text((1160, contact_bottom - 26), "脚底统一接触线", font=font(17), fill=BLUE)

canvas.convert("RGB").save(OUT, quality=95)
print(OUT)
