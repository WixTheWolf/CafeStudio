"""Cafe Studio: the collection montage in the film (film/montage.mp4).

Six of Hannah's pieces, one after another, hung under a spotlight on a
dark wall to the right of the frame (the title sits on the left). Each is
her own photo, as she painted it, with a slow push.

    python film/montage.py [ffmpeg]

Needs Pillow. Run from the repository root.
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFilter

FF = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
HERE = os.path.dirname(os.path.abspath(__file__))
WORKS = os.path.join(HERE, "..", "images", "works")
PIECES = ["but-first-tabby", "percolate", "every-last-crumb", "the-perfect-pair", "iced-americana", "breakfast-with-brooklyn"]
W, H = 1920, 1080
EACH, FADE = 1.2, 0.2


def wall(cx):
    bg = Image.new("RGB", (W, H), (22, 14, 9))
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((cx - 900, 100, cx + 900, 1200), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    return Image.composite(Image.new("RGB", (W, H), (150, 98, 56)), bg, glow.point(lambda v: int(v * 0.6)))


def hang(bg, im, x, y):
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rectangle((x + 14, y + 44, x + im.width - 14, y + im.height + 34), fill=200)
    bg = Image.composite(Image.new("RGB", (W, H), (6, 3, 1)), bg, sh.filter(ImageFilter.GaussianBlur(36)))
    bg.paste(im, (x, y))
    return bg


tmp = tempfile.mkdtemp()
args, filt = [], ""
for i, name in enumerate(PIECES):
    im = Image.open(os.path.join(WORKS, name + ".jpg")).convert("RGB")
    # no wider than 900 and no taller than 760, right-aligned
    s = min(900 / im.width, 760 / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    cx = W - 150 - im.width // 2
    still = os.path.join(tmp, "m%d.png" % i)
    hang(wall(cx), im, cx - im.width // 2, (H - im.height) // 2 + 10).save(still)
    args += ["-loop", "1", "-framerate", "30", "-t", str(EACH), "-i", still]
    n = round(EACH * 30)
    filt += ("[%d]scale=3840:2160,zoompan=z='1.0+0.035*on/%d':x='(iw-iw/zoom)*0.75':y='ih/2-(ih/zoom/2)'"
             ":d=1:s=1920x1080:fps=30,trim=0:%s,setpts=PTS-STARTPTS,fps=30,settb=1/30,format=yuv420p[m%d];") % (i, n, EACH, i)
last = "m0"
for i in range(1, len(PIECES)):
    filt += "[%s][m%d]xfade=transition=fade:duration=%s:offset=%s[x%d];" % (last, i, FADE, round(i * (EACH - FADE), 3), i)
    last = "x%d" % i
subprocess.run([FF, "-y", "-loglevel", "error"] + args + ["-filter_complex", filt + "[%s]format=yuv420p[v]" % last,
                "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-r", "30",
                os.path.join(HERE, "montage.mp4")], check=True)
print("montage:", os.path.join(HERE, "montage.mp4"))
