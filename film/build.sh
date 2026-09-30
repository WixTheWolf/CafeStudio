#!/usr/bin/env bash
# Cafe Studio: the film.
#
# Hannah's paintings, seen up close, cut to the bar lines of an original
# coffee-house score (film/score.mp3). A few abstract coffee shots open
# the film and give it a breath in the middle; everything else is her
# work. Her paintings are her own photographs, moved with a slow camera,
# never regenerated and never graded.
#
#   film/build.sh <clips-dir> <out.mp4>
#
# <clips-dir> holds the generated clips named as in film/SHOTS.md (.mp4).
# Writes <out.mp4>, <out>-web.mp4 (lighter, for the site) and <out>-poster.jpg.
set -euo pipefail
FF=${FFMPEG:-ffmpeg}
FP=${FFPROBE:-ffprobe}
here=$(cd "$(dirname "$0")" && pwd)
C=$(cd "$1" && pwd)
OUT=$2
T=$(mktemp -d)
ENC="-c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30"
q() { "$FF" -nostdin -hide_banner -loglevel error -y "$@"; }
calc() { awk "BEGIN{printf \"%.3f\", $*}"; }

# The score is 78 BPM in 4/4: one bar every 3.077 s. Its first downbeat is
# at 3.05 s; trimming LEAD seconds puts it at 0.3 s, the middle of the first
# dissolve, so every cut below lands on a downbeat.
BAR=$(calc "60 / 78 * 4")
LEAD=2.75
XF=18                      # dissolve, in frames (0.6 s)
FPS=30
# frame where bar <b> starts
at() { awk "BEGIN{printf \"%d\", $1 * $BAR * $FPS + 0.5}"; }

# The grade for the generated shots: Hannah's one colour. Luminance is
# mapped onto a coffee ramp and a little of the shot's own colour is kept.
ramp() { echo "if(lt(val/255,0.45),$1+($2-$1)*(val/255)/0.45,if(lt(val/255,0.75),$2+($3-$2)*(val/255-0.45)/0.3,$3+($4-$3)*(val/255-0.75)/0.25))"; }
TONE="format=gray,format=rgb24,lutrgb=r='$(ramp 16 122 204 247)':g='$(ramp 10 72 148 234)':b='$(ramp 6 36 86 212)'"
grade() { # contrast brightness gamma: filter from [g0] to [g]
  echo "[g0]eq=contrast=$1:brightness=$2:gamma=$3,split[ga][gb];[ga]$TONE[gt];[gb]format=rgb24,hue=s=0.6[go];[gt][go]blend=all_mode=normal:all_opacity=0.8,format=yuv420p[g]"
}

# The shot's own sound (brought to a peak of -10 dB), or silence.
audio() { # name src start frames
  local d; d=$(calc "$4 / $FPS")
  if [ -n "$src_has_audio" ]; then
    local peak gain
    peak=$("$FF" -nostdin -hide_banner -ss "$3" -t "$d" -i "$2" -vn -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')
    gain=$(awk "BEGIN{g = -10 - (${peak:-0}); if (g > 30) g = 30; if (g < -20) g = -20; printf \"%.1f\", g}")
    q -ss "$3" -t "$d" -i "$2" -vn -af "aresample=48000,aformat=channel_layouts=stereo,volume=${gain}dB,apad,atrim=0:$d,afade=t=in:d=0.3,afade=t=out:st=$(calc "$d - 0.5"):d=0.5" "$T/$1.wav"
  else
    q -f lavfi -t "$d" -i anullsrc=r=48000:cl=stereo "$T/$1.wav"
  fi
}

# A generated shot, graded. frames = the shot's length in frames.
clip() { # name src start frames contrast brightness gamma
  q -ss "$3" -i "$C/$2.mp4" -filter_complex \
    "[0:v]scale=1920:1080:flags=lanczos,setsar=1,fps=$FPS[g0];$(grade "$5" "$6" "$7")" -map "[g]" -frames:v "$4" -an $ENC "$T/$1.mp4"
  src_has_audio=$("$FP" -v error -select_streams a -show_entries stream=index -of csv=p=0 "$C/$2.mp4" 2>/dev/null || true)
  audio "$1" "$C/$2.mp4" "$3" "$4"
}

# One of Hannah's close-ups (a 16:9 still), with a slow camera: zoom z0 -> z1
# while the view drifts from (fx0, fy0) to (fx1, fy1). Not graded.
still() { # name image frames z0 z1 fx0 fy0 fx1 fy1
  local n=$3
  q -loop 1 -framerate $FPS -i "$2" -vf \
    "scale=3840:2160:flags=lanczos,zoompan=z='$4+($5-$4)*on/$n':x='(iw-iw/zoom)*($6+($8-$6)*on/$n)':y='(ih-ih/zoom)*($7+($9-$7)*on/$n)':d=1:s=1920x1080:fps=$FPS,format=yuv420p" \
    -frames:v "$n" $ENC "$T/$1.mp4"
  src_has_audio=""; audio "$1" "" 0 "$n"
}

# A prepared piece of film (the montage, the end card), held on its last
# frame as long as its bars need.
held() { # name file frames
  q -i "$2" -vf "fps=$FPS,tpad=stop_mode=clone:stop_duration=10,format=yuv420p" -frames:v "$3" -an $ENC "$T/$1.mp4"
  src_has_audio=""; audio "$1" "" 0 "$3"
}

# ---- the cut: shot, first bar, what it is ----
# kind name   bar  source                        settings
CUT="clip  s00  0  drop      0.2  1.25 -0.02 0.9
clip  s01  1  brush     0.5  1.2 0 1
clip  s02  2  bloom     0.2  1.2 0 1
still s03  4  tabby-full          1.0 1.08 .5 .5 .5 .5
still s04  5  p1-tabby            1.12 1.12 .15 .5 .85 .5
still s05  6  classic             1.08 1.0 .5 .5 .5 .5
still s06  7  brooklyn-croissant  1.1 1.1 .85 .5 .15 .5
still s07  8  brooklyn-cup        1.0 1.1 .5 .3 .5 .3
still s08  9  bean-up             1.15 1.15 .5 .15 .5 .85
still s09  10 crumb               1.0 1.1 .4 .45 .4 .45
clip  s10  11 steam     1.0  1.2 0 1
clip  s11  12 orbs      0.8  1.15 0 1
still s12  13 pause               1.12 1.12 .15 .5 .85 .5
still s13  14 p3-fresh            1.0 1.1 .5 .5 .5 .5
still s14  15 iced                1.12 1.12 .5 .15 .5 .85
still s15  16 bean-while          1.1 1.0 .5 .5 .5 .5
still s16  17 thinking            1.08 1.14 .3 .5 .2 .5
held  s17  18 montage
still s18  20 p4-house            1.12 1.12 .85 .5 .15 .5
still s19  21 pair                1.1 1.0 .5 .45 .5 .45
held  s20  22 end"
END_BAR=24.45              # the score's last chord has rung out

names=(); bars=()
while read -r kind name bar rest; do names+=("$name"); bars+=("$bar"); done <<< "$CUT"
N=${#names[@]}
declare -a START
i=0
while read -r kind name bar src a b c d e f; do
  f0=$(at "$bar")
  if [ $((i + 1)) -lt "$N" ]; then f1=$(at "${bars[$((i + 1))]}"); else f1=$(at "$END_BAR"); fi
  frames=$((f1 - f0 + (i + 1 < N ? XF : 0)))
  START[$i]=$(calc "$f0 / $FPS")
  case $kind in
    clip)  clip "$name" "$src" "$a" "$frames" "$b" "$c" "$d" ;;
    still) still "$name" "$here/src/$src.jpg" "$frames" "$a" "$b" "$c" "$d" "$e" "$f" ;;
    held)  held "$name" "$here/$src.mp4" "$frames" ;;
  esac
  i=$((i + 1))
done <<< "$CUT"
TOTAL=$(calc "$(at "$END_BAR") / $FPS")

# ---- assemble: dissolve on every downbeat, then the titles ----
ins=""; ains=""; vf=""; af=""; prev="0:v"; aprev="0:a"
for i in $(seq 0 $((N - 1))); do
  ins="$ins -i $T/${names[$i]}.mp4"
  ains="$ains -i $T/${names[$i]}.wav"
  if [ "$i" -gt 0 ]; then
    vf="$vf[$prev][$i:v]xfade=transition=fade:duration=0.6:offset=${START[$i]}[v$i];"
    af="$af[$aprev][$i:a]acrossfade=d=0.6:c1=tri:c2=tri[a$i];"
    prev="v$i"; aprev="a$i"
  fi
done

# titles and labels: file, from (shot, seconds in), to (shot, seconds in)
TITLES="t1 1 0.6 2 0.3
t2 2 1.4 3 0.2
t3 3 0.5 4 0.0
l-but-first-tabby 3 0.9 5 0.1
l-a-classic-breakfast 5 0.6 6 0.1
l-breakfast-with-brooklyn 6 0.6 8 0.1
l-bean-up-for-hours 8 0.6 9 0.1
l-every-last-crumb 9 0.6 10 0.1
t4 10 0.5 11 0.3
t5 11 0.2 12 0.3
l-a-pleasant-pause 12 0.6 13 0.1
l-fresh-baked 13 0.6 14 0.1
l-iced-americana 14 0.6 15 0.1
l-its-bean-a-while 15 0.6 16 0.1
l-bean-thinking-of-you 16 0.6 17 0.1
t6 17 0.4 18 0.1
l-coffee-house 18 0.6 19 0.1
l-the-perfect-pair 19 0.6 20 0.1"
tin=""; k=1; last="$prev"
while read -r f a ao b bo; do
  st=$(calc "${START[$a]} + $ao"); en=$(calc "${START[$b]} + $bo"); du=$(calc "$en - $st")
  tin="$tin -loop 1 -framerate $FPS -t $du -itsoffset $st -i $here/titles/$f.png"
  idx=$((N + k - 1))
  vf="$vf[$idx:v]format=rgba,fade=t=in:st=$st:d=0.6:alpha=1,fade=t=out:st=$(calc "$en - 0.5"):d=0.5:alpha=1[tt$k];[$last][tt$k]overlay=0:0:eof_action=pass[o$k];"
  last="o$k"; k=$((k + 1))
done <<< "$TITLES"
vf="$vf[$last]vignette=angle=PI/8,noise=alls=3:allf=t,format=yuv420p,trim=0:$TOTAL[vout]"
q $ins $tin -filter_complex "${vf%;}" -map "[vout]" $ENC -an "$T/picture.mp4"

# sound: the score, with the opening shots' own sound under it
q $ains -filter_complex "${af%;}" -map "[$aprev]" "$T/fx.wav"
q -ss "$LEAD" -i "$here/score.mp3" -vn -af "aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:$TOTAL" "$T/score.wav"
q -i "$T/score.wav" -i "$T/fx.wav" -filter_complex "[1]volume=0.45[fx];[0][fx]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=$(calc "$TOTAL - 2.5"):d=2.5,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 "$T/mix.wav"

q -i "$T/picture.mp4" -i "$T/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -maxrate 16M -bufsize 32M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
# a lighter copy for the website
q -i "$OUT" -c:v libx264 -preset slow -crf 24 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${OUT%.mp4}-web.mp4"
q -ss "$(calc "${START[4]} + 1.8")" -i "$OUT" -frames:v 1 -q:v 3 "${OUT%.mp4}-poster.jpg"
rm -rf "$T"
echo "film: $OUT ($TOTAL s)"
