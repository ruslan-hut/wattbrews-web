#!/usr/bin/env python3
"""
Generates the static PNG shown on the WattBrews charger touchscreen.

  python3 scripts/generate-charger-screen.py [--lang en|es]

Output: docs/charger/charger-screen-<lang>.png (800x600 px)
"""

from __future__ import annotations

import argparse
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.constants import ERROR_CORRECT_H

REPO = Path(__file__).resolve().parents[1]
ICON_PATH = REPO / "src/assets/brand/wattbrews-app-icon.png"
OUT_DIR = REPO / "docs/charger"
WELCOME_URL = "https://app.wattbrews.me/welcome"

WIDTH, HEIGHT = 800, 600

# Brand palette (mirrors styles.scss)
GREEN_DEEP = "#053b2c"
GREEN_CORE = "#0a6b46"
GREEN_BRIGHT = "#1f9d5c"
GOLD = "#f4e26b"
INK = "#0b1f15"
WHITE = "#ffffff"
SOFT = "#e8f3e7"
MUTED = "#5f6b66"

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"

COPY = {
    "en": {
        "eyebrow": "WATTBREWS CHARGING",
        "headline": "Two ways to charge",
        "qr_title": "Scan & use the app",
        "qr_lines": [
            "Open the camera, scan the code,",
            "then sign in or install the app.",
        ],
        "card_title": "Pay by card",
        "card_lines": [
            "Tap or insert your card in the",
            "terminal below. No account needed.",
        ],
        "scan_label": "Scan to start",
        "footer": "app.wattbrews.me",
        "step_qr": "OPTION 1",
        "step_card": "OPTION 2",
    },
    "es": {
        "eyebrow": "RECARGA WATTBREWS",
        "headline": "Dos formas de cargar",
        "qr_title": "Escanea y usa la app",
        "qr_lines": [
            "Abre la cámara, escanea el código,",
            "luego inicia sesión o instala la app.",
        ],
        "card_title": "Paga con tarjeta",
        "card_lines": [
            "Acerca o introduce tu tarjeta en",
            "el terminal de abajo. Sin cuenta.",
        ],
        "scan_label": "Escanea para empezar",
        "footer": "app.wattbrews.me",
        "step_qr": "OPCIÓN 1",
        "step_card": "OPCIÓN 2",
    },
}


def load_font(size: int, *, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    indexes = {
        "Regular": 1,
        "Medium": 4,
        "Demi Bold": 5,
        "Bold": 6,
        "Heavy": 8,
    }
    idx = indexes.get(weight, 1)
    try:
        return ImageFont.truetype(AVENIR, size=size, index=idx)
    except OSError:
        return ImageFont.load_default()


def make_qr(data: str, *, box_size: int) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=box_size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color=INK, back_color=WHITE).convert("RGBA")


def draw_gradient(img: Image.Image) -> None:
    """Diagonal gradient from deep green → core → bright."""
    base = Image.new("RGB", (WIDTH, HEIGHT), GREEN_DEEP)
    overlay = Image.new("RGB", (WIDTH, HEIGHT), GREEN_BRIGHT)
    mask = Image.new("L", (WIDTH, HEIGHT))
    pixels = mask.load()
    diag = WIDTH + HEIGHT
    for y in range(HEIGHT):
        for x in range(WIDTH):
            t = (x + y) / diag
            pixels[x, y] = int(t * 255)
    blended = Image.composite(overlay, base, mask)

    mid = Image.new("RGB", (WIDTH, HEIGHT), GREEN_CORE)
    mid_mask = Image.new("L", (WIDTH, HEIGHT))
    mp = mid_mask.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            t = (x + y) / diag
            mp[x, y] = int(max(0, 1 - abs(t - 0.5) * 3) * 180)
    blended = Image.composite(mid, blended, mid_mask)

    img.paste(blended, (0, 0))

    # Warm gold radial glow bottom-right
    glow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy, r = WIDTH + 60, HEIGHT + 60, 520
    for i in range(40, 0, -1):
        alpha = int(110 * (i / 40) ** 2)
        gdraw.ellipse([cx - r * i / 40, cy - r * i / 40, cx + r * i / 40, cy + r * i / 40],
                      fill=(244, 226, 107, alpha))
    img.alpha_composite(glow)


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, *, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_text_block(draw, x, y, lines, font, color, line_gap=6):
    for line in lines:
        draw.text((x, y), line, font=font, fill=color)
        bbox = font.getbbox(line)
        y += (bbox[3] - bbox[1]) + line_gap
    return y


def generate(lang: str) -> Path:
    copy = COPY[lang]

    canvas = Image.new("RGBA", (WIDTH, HEIGHT), WHITE)
    draw_gradient(canvas)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # ---- Header (brand strip) -------------------------------------------------
    icon = Image.open(ICON_PATH).convert("RGBA")
    icon_size = 72
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)
    # Soft white card behind icon
    badge_pad = 10
    rounded_rect(draw,
                 (40 - badge_pad, 40 - badge_pad,
                  40 + icon_size + badge_pad, 40 + icon_size + badge_pad),
                 radius=20, fill=(255, 255, 255, 235))
    canvas.alpha_composite(icon, (40, 40))

    eyebrow_font = load_font(16, weight="Demi Bold")
    wordmark_font = load_font(32, weight="Bold")
    draw.text((40 + icon_size + 24, 44), copy["eyebrow"],
              font=eyebrow_font, fill=GOLD)
    draw.text((40 + icon_size + 24, 66), "WattBrews",
              font=wordmark_font, fill=WHITE)

    # Headline
    headline_font = load_font(40, weight="Bold")
    draw.text((40, 124), copy["headline"], font=headline_font, fill=WHITE)
    draw.rectangle((40, 178, 130, 184), fill=GOLD)

    # ---- Cards (mirrored, white frosted) --------------------------------------
    card_top, card_bottom = 204, 558
    gutter = 26
    card_w = (WIDTH - 40 * 2 - gutter) // 2
    left_box = (40, card_top, 40 + card_w, card_bottom)
    right_box = (40 + card_w + gutter, card_top,
                 40 + card_w + gutter + card_w, card_bottom)

    for box in (left_box, right_box):
        rounded_rect(draw, box, radius=22,
                     fill=(255, 255, 255, 245),
                     outline=(255, 255, 255, 255), width=1)

    step_font = load_font(13, weight="Demi Bold")
    title_font = load_font(22, weight="Bold")
    body_font = load_font(15, weight="Medium")
    label_font = load_font(13, weight="Demi Bold")

    # ---- Left card: QR -------------------------------------------------------
    qr = make_qr(WELCOME_URL, box_size=8)
    qr_size = 168
    qr = qr.resize((qr_size, qr_size), Image.NEAREST)
    qr_x = left_box[0] + (card_w - qr_size) // 2
    qr_y = left_box[1] + 46
    canvas.alpha_composite(qr, (qr_x, qr_y))

    draw.text((left_box[0] + 22, left_box[1] + 18),
              copy["step_qr"], font=step_font, fill=GREEN_CORE)

    scan_label = copy["scan_label"].upper()
    slw = draw.textlength(scan_label, font=label_font)
    draw.text((left_box[0] + (card_w - slw) / 2, qr_y + qr_size + 8),
              scan_label, font=label_font, fill=GREEN_CORE)

    qr_title_y = qr_y + qr_size + 36
    draw.text((left_box[0] + 22, qr_title_y),
              copy["qr_title"], font=title_font, fill=INK)
    draw_text_block(draw, left_box[0] + 22, qr_title_y + 32,
                    copy["qr_lines"], body_font, MUTED, line_gap=4)

    # ---- Right card: card payment -------------------------------------------
    draw.text((right_box[0] + 22, right_box[1] + 18),
              copy["step_card"], font=step_font, fill=GREEN_CORE)

    # Illustration: contactless card with chip + waves
    illo_w, illo_h = 200, 168
    illo_x = right_box[0] + (card_w - illo_w) // 2
    illo_y = right_box[1] + 46

    # outer card body (the credit card)
    card_rect_w, card_rect_h = 168, 110
    cardx = illo_x + (illo_w - card_rect_w) // 2
    cardy = illo_y + 18
    # subtle drop-shadow
    shadow = Image.new("RGBA", (card_rect_w + 16, card_rect_h + 16), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((8, 8, card_rect_w + 8, card_rect_h + 8),
                         radius=14, fill=(0, 60, 30, 70))
    canvas.alpha_composite(shadow, (cardx - 8, cardy - 4))
    rounded_rect(draw, (cardx, cardy, cardx + card_rect_w, cardy + card_rect_h),
                 radius=14, fill=GREEN_CORE)
    # magnetic stripe top
    draw.rectangle((cardx, cardy + 12, cardx + card_rect_w, cardy + 24),
                   fill=(0, 0, 0, 180))
    # chip
    chip_x, chip_y = cardx + 18, cardy + 42
    rounded_rect(draw, (chip_x, chip_y, chip_x + 38, chip_y + 28),
                 radius=6, fill=GOLD, outline=INK, width=1)
    for ly in (chip_y + 9, chip_y + 16, chip_y + 23):
        draw.line((chip_x + 4, ly, chip_x + 34, ly), fill=INK, width=1)
    # contactless waves
    wave_cx = chip_x + 58
    wave_cy = chip_y + 14
    for r in (10, 18, 26):
        draw.arc((wave_cx - r, wave_cy - r, wave_cx + r, wave_cy + r),
                 start=-50, end=50, fill=GOLD, width=3)
    # card number dots
    dot_y = cardy + card_rect_h - 22
    for i, dx in enumerate(range(0, card_rect_w - 28, 22)):
        if i >= 6:
            break
        draw.ellipse((cardx + 14 + dx, dot_y, cardx + 22 + dx, dot_y + 8),
                     fill=(255, 255, 255, 200))

    card_label = "CONTACTLESS"
    clw = draw.textlength(card_label, font=label_font)
    draw.text((right_box[0] + (card_w - clw) / 2, illo_y + illo_h + 8),
              card_label, font=label_font, fill=GREEN_CORE)

    card_title_y = qr_title_y
    draw.text((right_box[0] + 22, card_title_y),
              copy["card_title"], font=title_font, fill=INK)
    draw_text_block(draw, right_box[0] + 22, card_title_y + 32,
                    copy["card_lines"], body_font, MUTED, line_gap=4)

    # ---- Footer URL strip -----------------------------------------------------
    footer_font = load_font(16, weight="Medium")
    fw = draw.textlength(copy["footer"], font=footer_font)
    draw.text(((WIDTH - fw) / 2, 572), copy["footer"],
              font=footer_font, fill=(255, 255, 255, 220))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"charger-screen-{lang}.png"
    canvas.convert("RGB").save(out_path, "PNG", optimize=True)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=list(COPY), default="en")
    parser.add_argument("--all", action="store_true",
                        help="Render every locale defined in COPY")
    args = parser.parse_args()

    langs = list(COPY) if args.all else [args.lang]
    for lang in langs:
        out = generate(lang)
        print(f"wrote {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
