#!/usr/bin/env bash
# Cafe Studio: the loops that open the site.
#
# Cuts short, silent, seamless loops from the generated clips, graded like
# the film, into media/reel/ (an .mp4 and a poster .jpg for each).
#
#   film/loops.sh <clips-dir> <media/reel>
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
C=$(cd "$1" && pwd)
OUT=$2
mkdir -p "$OUT"
q() { "$FF" -hide_banner -loglevel error -y "$@"; }
ramp() { echo "if(lt(val/255,0.45),$1+($2-$1)*(val/255)/0.45,if(lt(val/255,0.75),$2+($3-$2)*(val/255-0.45)/0.3,$3+($4-$3)*(val/255-0.75)/0.25))"; }
TONE="format=gray,format=rgb24,lutrgb=r='$(ramp 16 122 204 247)':g='$(ramp 10 72 148 234)':b='$(ramp 6 36 86 212)'"
GRADE="split[ga][gb];[ga]$TONE[gt];[gb]format=rgb24,hue=s=0.6[go];[gt][go]blend=all_mode=normal:all_opacity=0.8,format=yuv420p"
ENC="-c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -profile:v high -movflags +faststart -an"

# loop <name> <src> <start> <length> <fade> <contrast>: the last <fade>
# seconds dissolve into the first, so the end meets the beginning.
loop() {
  local n=$1 src=$2 a=$3 L=$4 d=$5 k=$6
  q -ss "$a" -t "$(awk "BEGIN{print $L + $d}")" -i "$C/$src.mp4" -filter_complex \
    "[0:v]scale=1280:720:flags=lanczos,setsar=1,fps=30,settb=1/30,eq=contrast=$k,$GRADE,fps=30,settb=1/30,split=3[x][y][z];
     [x]trim=$d:$L,setpts=PTS-STARTPTS,fps=30[body];
     [y]trim=$L:$(awk "BEGIN{print $L + $d}"),setpts=PTS-STARTPTS,fps=30[tail];
     [z]trim=0:$d,setpts=PTS-STARTPTS,fps=30[head];
     [tail][head]xfade=transition=fade:duration=$d:offset=0[seam];
     [seam][body]concat=n=2:v=1:a=0[v]" -map "[v]" $ENC "$OUT/$n.mp4"
  q -i "$OUT/$n.mp4" -frames:v 1 -q:v 4 "$OUT/$n.jpg"
}
# once <name> <src> <start> <length> <contrast>: plays through, no loop
once() {
  local n=$1 src=$2 a=$3 L=$4 k=$5
  q -ss "$a" -t "$L" -i "$C/$src.mp4" -vf "scale=1280:720:flags=lanczos,setsar=1,fps=30,eq=contrast=$k,$GRADE" $ENC "$OUT/$n.mp4"
  q -sseof -0.2 -i "$OUT/$n.mp4" -frames:v 1 -q:v 4 "$OUT/$n.jpg"
}

loop oil      oil      0.5 6.0 1.2 1.2
loop steam    steam    0.5 6.0 1.2 1.2
loop orbs     orbs     0.3 6.2 1.2 1.15
loop caustics caustics 0.5 6.0 1.2 1.2
once bloom    bloom    0.0 8.0 1.2
ls -la "$OUT"
