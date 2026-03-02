"""
Generate Ishihara-style pseudoisochromatic plates using PIL text for the digit mask.
Guaranteed correct digit shapes.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random, math

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def jitter_color(rgb, amount=20):
    return tuple(max(0, min(255, c + random.randint(-amount, amount))) for c in rgb)

def make_text_mask(number_str, size, font_size=None):
    """Render number_str as a clean white-on-black mask using PIL default font."""
    if font_size is None:
        font_size = int(size * 0.38)  # big — ~212px tall for 560

    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)

    # Try to get a large font; fall back to default if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

    # Get bounding box and centre text
    bbox = draw.textbbox((0, 0), number_str, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), number_str, fill=255, font=font)

    return np.array(mask) > 128


def generate_plate(
    size=560,
    number_str="74",
    fg_colors=None,
    bg_colors=None,
    out_path="plate.png",
    font_size=None,
):
    rng = random.Random(42)
    mask = make_text_mask(number_str, size, font_size=font_size)

    img = Image.new("RGB", (size, size), (215, 215, 215))
    draw = ImageDraw.Draw(img)

    cx, cy, radius = size // 2, size // 2, size // 2 - 6
    draw.ellipse([cx-radius, cy-radius, cx+radius, cy+radius], fill=(210, 210, 210))

    step = 9
    dot_r_min, dot_r_max = 3, 7

    for gx in range(dot_r_max, size - dot_r_max, step):
        for gy in range(dot_r_max, size - dot_r_max, step):
            px = gx + rng.randint(-3, 3)
            py = gy + rng.randint(-3, 3)
            if math.hypot(px - cx, py - cy) > radius - dot_r_max:
                continue
            r = rng.randint(dot_r_min, dot_r_max)
            py_c = max(0, min(size-1, py))
            px_c = max(0, min(size-1, px))
            is_fg = bool(mask[py_c, px_c])
            pool = fg_colors if is_fg else bg_colors
            color = hex2rgb(rng.choice(pool))
            color = jitter_color(color, 18)
            draw.ellipse([px-r, py-r, px+r, py+r], fill=color)

    draw.ellipse([cx-radius, cy-radius, cx+radius, cy+radius],
                 outline=(150,150,150), width=3)
    img.save(out_path)
    fg = int(mask.sum())
    print(f"  {out_path}  number={number_str!r}  fg_pixels={fg}")


OUT = "/home/ai24mtech02001/.openclaw/workspace/colorization-webapp/tutorial/colorblind"

print("Generating plates...")

# 1. DEMO — "12" vivid red vs blue, visible to everyone
generate_plate(
    number_str="12",
    fg_colors=["#C0392B","#E74C3C","#A93226","#B03A2E","#D44333"],
    bg_colors=["#2471A3","#1A5276","#2E86C1","#1F618D","#5499C2","#2980B9"],
    out_path=f"{OUT}/plate_demo.png",
)

# 2. RED-GREEN — "74"
#    Normal: green pops on orange. Protan/Deutan: both look similar brownish.
generate_plate(
    number_str="74",
    fg_colors=["#4A7C00","#5B8C00","#6B9E0E","#527A00","#3D6B00","#618500"],
    bg_colors=["#C47A1E","#D4892E","#BF6D10","#CC8022","#D99030",
               "#B86008","#E09840","#A85500","#CB7818"],
    out_path=f"{OUT}/plate_redgreen.png",
)

# 3. BLUE-YELLOW — "6"  
#    Normal: yellow pops on blue. Tritanope: similar.
generate_plate(
    number_str="6",
    fg_colors=["#E8C200","#F0CA00","#D4B000","#DCBA00","#F5D000","#EBC400"],
    bg_colors=["#2C3E7A","#1C2D68","#3B4F90","#253580","#162870","#324488","#2A3C82"],
    out_path=f"{OUT}/plate_blueyellow.png",
)

print("Done.")
