"""Cafe Studio: the brush close-ups on the site (media/fx/brush-*).

Three macro shots of a brush on paper, graded like the film and encoded
with a keyframe every six frames so the page can scrub them with the
scroll. Each also gets a poster, taken mid-stroke.

    python film/brushes.py <clips-dir> <media/fx> [ffmpeg]

<clips-dir> holds brush-wash, brush-wide and brush-line (.mp4).
"""
import os
import subprocess
import sys

SRC, OUT = sys.argv[1], sys.argv[2]
FF = sys.argv[3] if len(sys.argv) > 3 else "ffmpeg"
os.makedirs(OUT, exist_ok=True)


def ramp(a, b, c, d):
    return ("if(lt(val/255,0.45),%s+(%s-%s)*(val/255)/0.45,if(lt(val/255,0.75),%s+(%s-%s)*(val/255-0.45)/0.3,"
            "%s+(%s-%s)*(val/255-0.75)/0.25))") % (a, b, a, b, c, b, c, d, c)


def run(*a):
    subprocess.run([FF, "-nostdin", "-hide_banner", "-loglevel", "error", "-y"] + list(a), check=True)


# the café grade: luminance onto a coffee ramp, with a little of the shot's own colour
TONE = "format=gray,format=rgb24,lutrgb=r='%s':g='%s':b='%s'" % (ramp(16, 122, 204, 247), ramp(10, 72, 148, 234), ramp(6, 36, 86, 212))
GRADE = "split[ga][gb];[ga]%s[gt];[gb]format=rgb24,hue=s=0.6[go];[gt][go]blend=all_mode=normal:all_opacity=0.8,format=yuv420p" % TONE


def brush(name, start, length, still):
    """start, length: the part of the clip to keep; still: a moment mid-stroke, for the poster."""
    run("-ss", str(start), "-t", str(length), "-i", os.path.join(SRC, name + ".mp4"), "-vf",
        "scale=1280:720:flags=lanczos,setsar=1,fps=30,eq=contrast=1.18,%s" % GRADE,
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-g", "6", "-keyint_min", "6",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, name + ".mp4"))
    run("-ss", str(still), "-i", os.path.join(OUT, name + ".mp4"), "-frames:v", "1", "-q:v", "4", os.path.join(OUT, name + ".jpg"))


brush("brush-wash", 0.3, 7.4, 2.0)
brush("brush-wide", 0.2, 7.6, 3.0)
brush("brush-line", 0.3, 7.4, 3.0)
print("brushes ok")
