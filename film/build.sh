#!/usr/bin/env bash
# Cafe Studio: the film.
#
# Cuts the Higgsfield clips together with Hannah's own photographs. Her
# paintings are never regenerated: they are her photos, moved with a slow
# camera, with generated steam and window light laid over them.
#
#   film/build.sh <clips-dir> <out.mp4>
#
# <clips-dir> holds the generated clips named as in film/SHOTS.md:
# drop, pour, brush, wash, steam, light, crema and cafe (.mp4).
# Writes <out.mp4>, <out>-web.mp4 (lighter, for the site) and <out>-poster.jpg.
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
FP=${FFPROBE:-ffprobe}
here=$(cd "$(dirname "$0")" && pwd)
C=$(cd "$1" && pwd)
OUT=$2
T=$(mktemp -d)
X=0.5                      # crossfade between shots, seconds
ENC="-c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30"
q() { "$FF" -hide_banner -loglevel error -y "$@"; }
calc() { awk "BEGIN{printf \"%.3f\", $*}"; }
dur() { "$FP" -v error -show_entries format=duration -of csv=p=0 "$1"; }

# The clip's own sound, or silence when it has none. Generated clips come
# back at very different levels, so each is brought up to peak near -8 dB.
audio() { # name src start dur
  if [ -n "$("$FP" -v error -select_streams a -show_entries stream=index -of csv=p=0 "$2" 2>/dev/null)" ]; then
    local peak gain
    peak=$("$FF" -hide_banner -ss "$3" -t "$4" -i "$2" -vn -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')
    gain=$(awk "BEGIN{g = -8 - (${peak:-0}); if (g > 24) g = 24; if (g < 0) g = 0; printf \"%.1f\", g}")
    q -ss "$3" -t "$4" -i "$2" -vn -af "aresample=48000,aformat=channel_layouts=stereo,volume=${gain}dB,apad,atrim=0:$4,afade=t=in:d=0.2,afade=t=out:st=$(calc "$4 - 0.3"):d=0.3" "$T/$1.wav"
  else
    silence "$1" "$4"
  fi
}
silence() { q -f lavfi -t "$2" -i anullsrc=r=48000:cl=stereo "$T/$1.wav"; }

# A generated clip, trimmed and brought to 1080p.
clip() { # name src start dur
  q -ss "$3" -t "$4" -i "$C/$2.mp4" -vf "scale=1920:1080:flags=lanczos,setsar=1,fps=30,eq=contrast=1.03:saturation=0.97,format=yuv420p" -an $ENC "$T/$1.mp4"
  audio "$1" "$C/$2.mp4" "$3" "$4"
}

# Window light: the generated wall (without its pillar) turned into a warm
# light map that only darkens, so leaf and pane shadows fall across the work.
LIGHT="crop=iw*0.68:ih:0:0,scale=1920:1080,fps=30,format=gbrp,colorchannelmixer=.3:.45:.25:0:.3:.45:.25:0:.3:.45:.25,normalize=smoothing=45,lutrgb=r='118+val*0.537':g='112+val*0.53':b='100+val*0.52'"
# Steam: the generated steam on black (without the light at its top), made
# warm white with its brightness as alpha and feathered on every edge.
steam() { # w h dur opacity -> filter that turns [in] into [st]
  echo "crop=iw:ih*0.75:0:ih*0.25,scale=$1:$2,fps=30,format=gray,eq=contrast=1.35:brightness=0.03,geq=lum='lum(X,Y)*min(1,(H-Y)/60)*min(1,Y/110)*min(1,X/90)*min(1,(W-X)/90)',format=gray[sg];color=c=0xfff3e4:s=$1x$2:r=30:d=$3[sc];[sc][sg]alphamerge,colorchannelmixer=aa=$4[st]"
}
# A slow push on a still or a composite: z0 -> z1, towards (fx, fy).
push() { # dur z0 z1 fx fy
  local n; n=$(awk "BEGIN{printf \"%d\", $1 * 30}")
  echo "scale=3840:2160,zoompan=z='$2+($3-$2)*on/$n':x='(iw-iw/zoom)*$4':y='(ih-ih/zoom)*$5':d=1:s=1920x1080:fps=30"
}
# A still under moving window light, with a slow push.
lit() { # name still dur light-start z0 z1 fx fy brightness [flip]
  local flip=${10:-}
  q -loop 1 -framerate 30 -t "$3" -i "$2" -ss "$4" -t "$3" -i "$C/light.mp4" -filter_complex \
    "[0]$(push "$3" "$5" "$6" "$7" "$8"),format=gbrp[a];[1]$LIGHT${flip:+,hflip}[l];[a][l]blend=all_mode=multiply,format=yuv420p,eq=brightness=$9[v]" \
    -map "[v]" -t "$3" $ENC "$T/$1.mp4"
  silence "$1" "$3"
}

# 1-4: the coffee
clip s01 drop 0 4.6
clip s02 pour 0.2 4.3
clip s03 brush 0.2 4.3
clip s04 wash 0.2 4.4

# 5-7: her paintings in afternoon light
lit s05 "$here/src/s4-beans.jpg" 5.2 0 1.0 1.09 0.35 0.5 0.04
lit s06 "$here/src/s5-pause-art.jpg" 4.6 2.5 1.0 1.1 0.6 0.4 0.04 flip
lit s07 "$here/src/s6-pause-wall.jpg" 6 1 1.0 1.1 0.5 0.4 0.04

# 8: Not Just a Dopio; steam rises out of the painted espresso into the room
q -loop 1 -framerate 30 -t 6 -i "$here/src/s8-dopio-wall.jpg" -ss 1.5 -t 6 -i "$C/steam.mp4" -filter_complex \
  "[1]$(steam 900 520 6 1);[0]fps=30,format=gbrp[img];[img][st]overlay=x=968:y=-13:format=gbrp,$(push 6 1.0 1.06 0.55 0.4),format=yuv420p[v]" \
  -map "[v]" -t 6 $ENC "$T/s08.mp4"
silence s08 6

# 9: the collection (made from her photos by the montage step)
q -i "$here/montage.mp4" -vf "fps=30,format=yuv420p" -an $ENC "$T/s09.mp4"
silence s09 "$(dur "$here/montage.mp4")"

# 10: at home, beside the espresso machine
lit s10 "$here/src/s7-kitchen.jpg" 4.2 3 1.0 1.06 0.6 0.6 0.05

# 11-12: the cup, then the name
clip s11 crema 0.3 3.6
q -i "$here/end.mp4" -vf "fps=30,format=yuv420p" -an $ENC "$T/s12.mp4"
silence s12 "$(dur "$here/end.mp4")"

# ---- assemble: crossfade every cut, lay titles over their shots ----
N=12; ins=""; ains=""; vf=""; af=""; t=0; prev="0:v"; aprev="0:a"
declare -a START
for i in $(seq 1 $N); do
  s=$(printf "s%02d" "$i")
  ins="$ins -i $T/$s.mp4"
  ains="$ains -i $T/$s.wav"
  d=$(dur "$T/$s.mp4")
  START[$i]=$t
  if [ "$i" -gt 1 ]; then
    vf="$vf[$prev][$((i-1)):v]xfade=transition=fade:duration=$X:offset=$t[v$i];"
    af="$af[$aprev][$((i-1)):a]acrossfade=d=$X:c1=tri:c2=tri[a$i];"
    prev="v$i"; aprev="a$i"
  fi
  t=$(calc "$t + $d - $X")
done
TOTAL=$(calc "$t + $X")

# titles: file, shot, in, out (seconds from the shot's start)
TITLES="t1 2 0.5 3.6
t2 4 0.6 3.8
t3 5 0.5 4.6
t4 7 0.5 5.4
t5 8 0.5 5.5
t6 9 0.4 5.6"
tin=""; k=1; last="$prev"
while read -r f shot a b; do
  s0=${START[$shot]}; st=$(calc "$s0 + $a"); en=$(calc "$s0 + $b"); du=$(calc "$en - $st")
  tin="$tin -loop 1 -framerate 30 -t $du -itsoffset $st -i $here/titles/$f.png"
  idx=$((N + k - 1))
  vf="$vf[$idx:v]format=rgba,fade=t=in:st=$st:d=0.6:alpha=1,fade=t=out:st=$(calc "$en - 0.5"):d=0.5:alpha=1[tt$k];[$last][tt$k]overlay=0:0:eof_action=pass[o$k];"
  last="o$k"; k=$((k + 1))
done <<< "$TITLES"
vf="$vf[$last]vignette=angle=PI/7,noise=alls=3:allf=t,format=yuv420p,trim=0:$TOTAL[vout]"
q $ins $tin -filter_complex "${vf%;}" -map "[vout]" $ENC -an "$T/picture.mp4"

# sound: the coffee's own sound, with the café murmuring under the paintings
q $ains -filter_complex "${af%;}" -map "[$aprev]" "$T/fx.wav"
cafe_at=$(awk "BEGIN{printf \"%d\", ${START[5]} * 1000}")
cafe_len=$(calc "${START[11]} - ${START[5]} + 1.5")
q -stream_loop -1 -i "$C/cafe.mp4" -vn -af "aresample=48000,aformat=channel_layouts=stereo,atrim=0:$cafe_len,afade=t=in:d=1.5,afade=t=out:st=$(calc "$cafe_len - 2"):d=2,volume=0.5,adelay=${cafe_at}|${cafe_at}" "$T/cafe.wav"
q -i "$T/fx.wav" -i "$T/cafe.wav" -filter_complex "[0][1]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=$(calc "$TOTAL - 1.8"):d=1.8,loudnorm=I=-18:TP=-1.5:LRA=11" -ar 48000 "$T/mix.wav"

q -i "$T/picture.mp4" -i "$T/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -maxrate 16M -bufsize 32M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
# a lighter copy for the website
q -i "$OUT" -c:v libx264 -preset slow -crf 24 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${OUT%.mp4}-web.mp4"
q -ss "$(calc "${START[8]} + 3")" -i "$OUT" -frames:v 1 -q:v 3 "${OUT%.mp4}-poster.jpg"
rm -rf "$T"
echo "film: $OUT ($TOTAL s)"
