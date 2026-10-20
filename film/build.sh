#!/usr/bin/env bash
# Cafe Studio: "In the studio", a short film made only from Hannah's own
# phone footage (portrait, 1080 x 1920), with the clips' own sound.
#
#   film/build.sh <clips-dir> <out.mp4>
#
# <clips-dir> holds IMG_7161, IMG_2168, IMG_2489 and IMG_7169 (.MOV), as she
# shared them. The clips are HDR (HLG); they are tone-mapped to ordinary
# video with no other grading, so the colours stay as she filmed them.
# Writes <out.mp4> and <out>-poster.jpg.
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
C=$(cd "$1" && pwd)
OUT=$2
here=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
q() { "$FF" -nostdin -hide_banner -loglevel error -y "$@"; }
SDR="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
XF=0.5   # crossfade, seconds

# the cut: clip, from, to (seconds)
CUT="IMG_7161 0 5.9
IMG_2168 0 12.5
IMG_2489 0 9
IMG_2489 18 25.5
IMG_7169 0 8
IMG_7169 17 27.3"

i=0; names=(); lens=()
while read -r clip a b; do
  d=$(awk "BEGIN{print $b - $a}")
  q -ss "$a" -t "$d" -i "$C/$clip.MOV" -map 0:v:0 -map 0:a:0 \
    -vf "$SDR,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,settb=1/30" \
    -af "aresample=48000,aformat=channel_layouts=stereo" \
    -c:v libx264 -crf 14 -preset medium -c:a pcm_s16le "$T/s$i.mov"
  names+=("$T/s$i.mov"); lens+=("$d"); i=$((i + 1))
done <<< "$CUT"

# the end card, held for 3.5 s, in silence
q -loop 1 -framerate 30 -t 3.5 -i "$here/end-card.png" -f lavfi -t 3.5 -i anullsrc=r=48000:cl=stereo \
  -vf "scale=1080:1920,format=yuv420p,settb=1/30" -c:v libx264 -crf 14 -c:a pcm_s16le -shortest "$T/s$i.mov"
names+=("$T/s$i.mov"); lens+=(3.5)

# join with crossfades
ins=""; vf=""; af=""; pv="0:v"; pa="0:a"; off=0
for k in "${!names[@]}"; do
  ins="$ins -i ${names[$k]}"
  if [ "$k" -gt 0 ]; then
    off=$(awk "BEGIN{print $off + ${lens[$((k - 1))]} - $XF}")
    vf="$vf[$pv][$k:v]xfade=transition=fade:duration=$XF:offset=$off[v$k];"
    af="$af[$pa][$k:a]acrossfade=d=$XF[a$k];"
    pv="v$k"; pa="a$k"
  fi
done
q $ins -filter_complex "${vf}${af}[$pa]loudnorm=I=-20:TP=-2[aout]" -map "[$pv]" -map "[aout]" \
  -c:v libx264 -preset slow -crf 26 -maxrate 3M -bufsize 6M -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 48000 -movflags +faststart "$OUT"
q -ss 9 -i "$OUT" -frames:v 1 -q:v 3 "${OUT%.mp4}-poster.jpg"
rm -rf "$T"
echo "film: $OUT"
