#!/usr/bin/env python3
"""TV Home's icon (tizen/icon.png): a glass TV with a play sign over an aurora, 512 x 512, drawn at 2048 and scaled
down. Needs Pillow.

    python3 tools/tv_home_icon.py tizen/icon.png
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 2048
out = sys.argv[1]

# Background: deep graphite, a little lighter at the top.
bg = Image.new('RGB', (S, S))
d = ImageDraw.Draw(bg)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=(int(26 - 16 * t), int(27 - 17 * t), int(38 - 24 * t)))

# Aurora: three soft blobs of color, very blurred.
glow = Image.new('RGB', (S, S), (0, 0, 0))
g = ImageDraw.Draw(glow)
for (cx, cy, r, col) in [(560, 1500, 760, (47, 123, 255)), (1500, 1550, 720, (255, 61, 127)), (1030, 1180, 600, (139, 92, 246))]:
    g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
glow = glow.filter(ImageFilter.GaussianBlur(260))
bg = ImageChops.add(bg, ImageChops.multiply(glow, Image.new('RGB', (S, S), (200, 200, 200))))

# The TV: a rounded screen of glass (white, partly clear) with a bright rim, on a small stand.
layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
L = ImageDraw.Draw(layer)
x0, y0, x1, y1 = 360, 470, S - 360, 1390
L.rounded_rectangle([x0, y0, x1, y1], radius=150, fill=(255, 255, 255, 58))
# glare from the top left
gl = Image.new('L', (S, S), 0)
G = ImageDraw.Draw(gl)
G.polygon([(x0, y0), (x0 + 900, y0), (x0, y0 + 620)], fill=90)
gl = gl.filter(ImageFilter.GaussianBlur(60))
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([x0, y0, x1, y1], radius=150, fill=255)
gl = ImageChops.multiply(gl, mask)
layer = Image.alpha_composite(layer, Image.merge('RGBA', [Image.new('L', (S, S), 255)] * 3 + [gl]))
L = ImageDraw.Draw(layer)
L.rounded_rectangle([x0, y0, x1, y1], radius=150, outline=(255, 255, 255, 235), width=34)
# stand
L.rounded_rectangle([S / 2 - 70, y1 + 20, S / 2 + 70, y1 + 150], radius=30, fill=(255, 255, 255, 220))
L.rounded_rectangle([S / 2 - 330, y1 + 140, S / 2 + 330, y1 + 210], radius=35, fill=(255, 255, 255, 235))
# play sign, rounded
cx, cy = S / 2 + 40, (y0 + y1) / 2
tri = Image.new('L', (S, S), 0)
ImageDraw.Draw(tri).polygon([(cx - 190, cy - 250), (cx - 190, cy + 250), (cx + 250, cy)], fill=255)
tri = tri.filter(ImageFilter.GaussianBlur(18)).point(lambda v: 255 if v > 128 else 0)
layer = Image.alpha_composite(layer, Image.merge('RGBA', [Image.new('L', (S, S), 255)] * 3 + [tri]))

# a soft shadow under the TV
sh = Image.new('L', (S, S), 0)
ImageDraw.Draw(sh).rounded_rectangle([x0 + 20, y0 + 70, x1 - 20, y1 + 230], radius=170, fill=150)
sh = sh.filter(ImageFilter.GaussianBlur(70))
img = bg.convert('RGBA')
img = Image.alpha_composite(img, Image.merge('RGBA', [Image.new('L', (S, S), 0)] * 3 + [sh]))
img = Image.alpha_composite(img, layer)

img.resize((512, 512), Image.LANCZOS).save(out, optimize=True)
print('wrote', out)
