#!/usr/bin/env bash
# Cafe Studio: the film.
#
# The café as Hannah sees it: abstract macro shots of coffee (a drop, crema,
# steam, light, a bloom on paper), all in her one colour, that lead into
# her own paintings seen just as close. The coffee footage was generated;
# her paintings are her photographs, moved with a slow camera and never
# regenerated or regraded.
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
X=0.8                      # dissolve between shots, seconds
ENC="-c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30"
q() { "$FF" -hide_banner -loglevel error -y "$@"; }
calc() { awk "BEGIN{printf \"%.3f\", $*}"; }
dur() { "$FP" -v error -show_entries format=duration -of csv=p=0 "$1"; }

# The grade: every generated shot in Hannah's one colour. Luminance is mapped
# onto a coffee ramp (espresso, roast, crema, cream) and a little of the
# shot's own colour is kept underneath so it still breathes.
ramp() { # anchors at 0, .45, .75 and 1
  echo "if(lt(val/255,0.45),$1+($2-$1)*(val/255)/0.45,if(lt(val/255,0.75),$2+($3-$2)*(val/255-0.45)/0.3,$3+($4-$3)*(val/255-0.75)/0.25))"
}
TONE="format=gray,format=rgb24,lutrgb=r='$(ramp 16 122 204 247)':g='$(ramp 10 72 148 234)':b='$(ramp 6 36 86 212)'"
grade() { # contrast brightness gamma: filter from [g0] to [g]
  echo "[g0]eq=contrast=$1:brightness=$2:gamma=$3,split[ga][gb];[ga]$TONE[gt];[gb]format=rgb24,hue=s=0.6[go];[gt][go]blend=all_mode=normal:all_opacity=0.8,format=yuv420p[g]"
}

# The shot's own sound, brought to a peak of <db>, or silence.
audio() { # name src start dur db
  if [ -n "$("$FP" -v error -select_streams a -show_entries stream=index -of csv=p=0 "$2" 2>/dev/null)" ]; then
    local peak gain
    peak=$("$FF" -hide_banner -ss "$3" -t "$4" -i "$2" -vn -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-*[0-9.]*\) dB.*/\1/p')
    gain=$(awk "BEGIN{g = $5 - (${peak:-0}); if (g > 30) g = 30; if (g < -20) g = -20; printf \"%.1f\", g}")
    q -ss "$3" -t "$4" -i "$2" -vn -af "aresample=48000,aformat=channel_layouts=stereo,volume=${gain}dB,apad,atrim=0:$4,afade=t=in:d=0.4,afade=t=out:st=$(calc "$4 - 0.6"):d=0.6" "$T/$1.wav"
  else
    silence "$1" "$4"
  fi
}
silence() { q -f lavfi -t "$2" -i anullsrc=r=48000:cl=stereo "$T/$1.wav"; }

# A generated shot, trimmed, brought to 1080p and graded.
clip() { # name src start dur contrast brightness gamma db
  q -ss "$3" -t "$4" -i "$C/$2.mp4" -filter_complex \
    "[0:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30[g0];$(grade "$5" "$6" "$7")" -map "[g]" -an $ENC "$T/$1.mp4"
  audio "$1" "$C/$2.mp4" "$3" "$4" "$8"
}

# A slow push across one of Hannah's close-ups (a 16:9 still): z0 -> z1
# towards (fx, fy). Her paintings are not graded.
push() { # dur z0 z1 fx fy
  local n; n=$(awk "BEGIN{printf \"%d\", $1 * 30}")
  echo "scale=3840:2160,zoompan=z='$2+($3-$2)*on/$n':x='(iw-iw/zoom)*$4':y='(ih-ih/zoom)*$5':d=1:s=1920x1080:fps=30"
}
still() { # name image dur z0 z1 fx fy
  q -loop 1 -framerate 30 -t "$3" -i "$2" -vf "$(push "$3" "$4" "$5" "$6" "$7"),format=yuv420p" -t "$3" $ENC "$T/$1.mp4"
  silence "$1" "$3"
}

# I. the café, as she sees it
clip s01 drop     0.2 4.2  1.25 -0.02 0.9  -12
clip s02 ribbon   0.5 3.8  1.2  0     1    -14
clip s03 oil      1.0 4.8  1.2  0     1    -26
clip s04 crema    0.5 4.0  1.25 0     1    -26
clip s05 steam    1.0 4.8  1.2  0     1    -24
clip s06 orbs     0.8 5.2  1.15 0     1    -22
clip s07 caustics 1.0 4.0  1.2  0     1    -24
# II. the coffee goes onto paper
clip s08 brush    0.5 4.2  1.2  0     1    -12
clip s09 bloom    0.2 6.2  1.2  0     1    -18
clip s10 wash     1.0 3.8  1.25 -0.03 1    -28
# III. her paintings, just as close
still s11 "$here/src/p1-tabby.jpg"     4.2 1.0 1.08 0.45 0.5
still s12 "$here/src/p2-breakfast.jpg" 3.6 1.06 1.0 0.6 0.4
still s13 "$here/src/p3-fresh.jpg"     3.6 1.0 1.07 0.4 0.6
still s14 "$here/src/p4-house.jpg"     3.6 1.07 1.0 0.5 0.5
# the collection, then the name
q -i "$here/montage.mp4" -vf "fps=30,format=yuv420p" -an $ENC "$T/s15.mp4"
silence s15 "$(dur "$here/montage.mp4")"
q -i "$here/end.mp4" -vf "fps=30,format=yuv420p" -an $ENC "$T/s16.mp4"
silence s16 "$(dur "$here/end.mp4")"

# ---- assemble: dissolve every cut, lay titles over their shots ----
N=16; ins=""; ains=""; vf=""; af=""; t=0; prev="0:v"; aprev="0:a"
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
TITLES="t0 3 0.6 4.3
t4 5 0.5 4.4
t5 6 0.4 4.9
t1 8 0.5 3.8
t2 9 1.9 5.8
t3 11 0.6 3.9
t6 15 0.4 5.6"
tin=""; k=1; last="$prev"
while read -r f shot a b; do
  s0=${START[$shot]}; st=$(calc "$s0 + $a"); en=$(calc "$s0 + $b"); du=$(calc "$en - $st")
  tin="$tin -loop 1 -framerate 30 -t $du -itsoffset $st -i $here/titles/$f.png"
  idx=$((N + k - 1))
  vf="$vf[$idx:v]format=rgba,fade=t=in:st=$st:d=0.7:alpha=1,fade=t=out:st=$(calc "$en - 0.6"):d=0.6:alpha=1[tt$k];[$last][tt$k]overlay=0:0:eof_action=pass[o$k];"
  last="o$k"; k=$((k + 1))
done <<< "$TITLES"
vf="$vf[$last]vignette=angle=PI/8,noise=alls=3:allf=t,format=yuv420p,trim=0:$TOTAL[vout]"
q $ins $tin -filter_complex "${vf%;}" -map "[vout]" $ENC -an "$T/picture.mp4"

# sound: each shot's own sound, with a quiet café under the second half
q $ains -filter_complex "${af%;}" -map "[$aprev]" "$T/fx.wav"
cafe_at=$(awk "BEGIN{printf \"%d\", ${START[5]} * 1000}")
cafe_len=$(calc "${START[16]} - ${START[5]} + 1.5")
q -stream_loop -1 -i "$C/cafe.mp4" -vn -af "aresample=48000,aformat=channel_layouts=stereo,atrim=0:$cafe_len,afade=t=in:d=2.5,afade=t=out:st=$(calc "$cafe_len - 2.5"):d=2.5,volume=0.32,adelay=${cafe_at}|${cafe_at}" "$T/cafe.wav"
q -i "$T/fx.wav" -i "$T/cafe.wav" -filter_complex "[0][1]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=$(calc "$TOTAL - 2"):d=2,loudnorm=I=-20:TP=-1.5:LRA=11" -ar 48000 "$T/mix.wav"

q -i "$T/picture.mp4" -i "$T/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -maxrate 16M -bufsize 32M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
# a lighter copy for the website
q -i "$OUT" -c:v libx264 -preset slow -crf 24 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${OUT%.mp4}-web.mp4"
q -ss "$(calc "${START[7]} + 2")" -i "$OUT" -frames:v 1 -q:v 3 "${OUT%.mp4}-poster.jpg"
rm -rf "$T"
echo "film: $OUT ($TOTAL s)"
