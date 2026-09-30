"""Cafe Studio: the splashes and brushes on the site (media/fx/).

Splashes were filmed on white. Each is flattened to pure white (divided by
its own empty background), turned into Hannah's coffee tones and faded to
white at the edges, so on the page it can be multiplied onto the paper:
only the coffee shows, never the rectangle. The brush macros are graded
like the film and encoded with a keyframe every few frames, so the page
can scrub them with the scroll.

    python film/fx.py <clips-dir> <media/fx> [ffmpeg]

Needs Pillow. <clips-dir> holds splash-left, splash-paper, splash-up,
paper-fly, brush-wash, brush-wide and brush-line (.mp4).
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
FF = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else "ffmpeg"
os.makedirs(OUT, exist_ok=True)
tmp = tempfile.mkdtemp()


def ramp(a, b, c, d):
    return ("if(lt(val/255,0.45),%s+(%s-%s)*(val/255)/0.45,if(lt(val/255,0.75),%s+(%s-%s)*(val/255-0.45)/0.3,"
            "%s+(%s-%s)*(val/255-0.75)/0.25))") % (a, b, a, b, c, b, c, d, c)


# coffee on white: espresso, roast, crema, and pure white paper
INK = "lutrgb=r='%s':g='%s':b='%s'" % (ramp(28, 118, 200, 255), ramp(16, 70, 150, 255), ramp(8, 36, 96, 255))


def run(*a):
    subprocess.run([FF, "-nostdin", "-hide_banner", "-loglevel", "error", "-y"] + list(a), check=True)


def background(src, w, h):
    """The empty set: the brightest each pixel gets over the clip, blurred."""
    frames = []
    for i, t in enumerate((0.05, 0.4, 0.8, 1.3, 1.9, 2.6, 3.3, 4.0, 4.6)):
        f = os.path.join(tmp, "bg%d.png" % i)
        run("-ss", str(t), "-i", src, "-frames:v", "1", "-vf", "scale=%d:%d,format=gray" % (w, h), f)
        frames.append(Image.open(f).convert("L"))
    bg = frames[0]
    for f in frames[1:]:
        bg = ImageChops.lighter(bg, f)
    return bg.filter(ImageFilter.GaussianBlur(w / 30))


def edge_mask(w, h, round_=False):
    """Black where the coffee may show, white where it must fade out."""
    m = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(m)
    if round_:
        r = min(w, h) * 0.36
        d.ellipse((w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r), fill=0)
        return m.filter(ImageFilter.GaussianBlur(min(w, h) * 0.08))
    pad = min(w, h) * 0.07
    d.rectangle((pad, pad, w - pad, h - pad), fill=0)
    return m.filter(ImageFilter.GaussianBlur(pad * 0.8))


def splash(name, w, h, crop=None, round_=False, gain=1.06, out=None):
    src = os.path.join(SRC, name + ".mp4")
    if crop:
        # work from the crop, so the background matches it
        c = os.path.join(tmp, name + "-crop.mp4")
        run("-i", src, "-vf", "crop=" + crop, "-an", "-c:v", "libx264", "-crf", "12", c)
        src = c
    bg = os.path.join(tmp, name + "-bg.png")
    mask = os.path.join(tmp, name + "-mask.png")
    background(src, w, h).save(bg)
    edge_mask(w, h, round_).save(mask)
    run("-i", src, "-loop", "1", "-i", bg, "-loop", "1", "-i", mask, "-filter_complex",
        "[0:v]scale=%d:%d,fps=30,format=gray[a];[1]format=gray[b];"
        "[a][b]blend=all_mode=divide:shortest=1,lutyuv=y='clip(val*%s,0,255)',format=rgb24,%s,format=gbrp[c];"
        # the edge fade must blend in RGB: in YUV it would tint the colour planes
        "[2]format=gbrp[m];[c][m]blend=all_mode=screen:shortest=1,format=yuv420p[v]" % (w, h, gain, INK),
        "-map", "[v]", "-t", "5", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, (out or name) + ".mp4"))


# the café grade, for footage that fills the screen
TONE = "format=gray,format=rgb24,lutrgb=r='%s':g='%s':b='%s'" % (ramp(16, 122, 204, 247), ramp(10, 72, 148, 234), ramp(6, 36, 86, 212))
GRADE = "split[ga][gb];[ga]%s[gt];[gb]format=rgb24,hue=s=0.6[go];[gt][go]blend=all_mode=normal:all_opacity=0.8,format=yuv420p" % TONE


def brush(name, start, length, still):
    """still: a moment mid-stroke, for the poster."""
    run("-ss", str(start), "-t", str(length), "-i", os.path.join(SRC, name + ".mp4"), "-vf",
        "scale=1280:720:flags=lanczos,setsar=1,fps=30,eq=contrast=1.18,%s" % GRADE,
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-g", "6", "-keyint_min", "6",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, name + ".mp4"))
    run("-ss", str(still), "-i", os.path.join(OUT, name + ".mp4"), "-frames:v", "1", "-q:v", "4", os.path.join(OUT, name + ".jpg"))


splash("splash-left", 1280, 720)
splash("paper-fly", 1280, 720)
splash("splash-up", 1280, 720)
splash("splash-paper", 640, 640, crop="1080:1080:420:0", round_=True, out="crown")
if "--splashes" not in sys.argv:
    brush("brush-wash", 0.3, 7.4, 2.0)
    brush("brush-wide", 0.2, 7.6, 3.0)
    brush("brush-line", 0.3, 7.4, 3.0)
print("fx ok")
