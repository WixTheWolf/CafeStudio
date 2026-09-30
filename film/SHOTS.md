# Cafe Studio: the film

A film of a minute and a quarter for the site and the deck, cut to an
original coffee-house score. Hannah's paintings are the film: fourteen of
her close-ups, each moved with a slow camera and named as it appears, and a
montage of six pieces on the gallery wall. A few abstract coffee shots
open it and give it one breath in the middle. No people and no faces;
every generated shot is graded into her one colour (espresso, roast,
crema, cream) so it reads as coffee on paper rather than footage.

Hannah's paintings appear exactly as she painted them: they are her
photographs, never regenerated and never graded.

The finished film is `media/cafe-studio-film.mp4` (and its poster), built by
`film/build.sh` from the clips below plus the files in this folder.

## Music

`score.mp3` is an original instrumental generated with ElevenLabs Music
(`eleven_music_v2_5`, 78 s, the second of two takes), from this brief:

> Cinematic coffee-house jazz instrumental, warm and intimate. Opens with a
> lone felt piano and soft vinyl warmth, slow tempo around 78 BPM; at about
> 12 seconds brushed snare, upright bass and a gentle Rhodes join in a
> relaxed swing; strings swell in slowly from 40 seconds to a tender
> cinematic peak around 60 seconds, then everything falls away to solo
> piano for a quiet final chord.

It is 78 BPM in 4/4, so one bar every 3.077 s. `build.sh` trims its lead-in
so the first downbeat lands in the first dissolve, then starts every shot
on a bar line: every cut is a 0.6 s dissolve centred on a downbeat. The
opening shots keep a little of their own sound (the drop, the brush) under
the score.

## Cut

| Bar | Shot | Source | On screen |
| --- | --- | --- | --- |
| 0 | A drop of espresso falls into a still pool | `drop` | |
| 1 | A bead of coffee falls from a brush | `brush` | One ingredient. |
| 2–3 | Coffee poured onto paper blooms into a stain | `bloom` | Coffee. |
| 4 | *But First, Tabby*, the whole painting | her photo `src/tabby-full.jpg` | Painted by hand, in coffee, by Hannah. · *But First, Tabby* |
| 5 | *But First, Tabby*, the C clasp | `src/p1-tabby.jpg` | |
| 6 | *A Classic Breakfast* | `src/classic.jpg` | *A Classic Breakfast* |
| 7 | *Breakfast with Brooklyn*, the croissant | `src/brooklyn-croissant.jpg` | *Breakfast with Brooklyn* |
| 8 | *Breakfast with Brooklyn*, the cup | `src/brooklyn-cup.jpg` | |
| 9 | *Bean Up For Hours* | `src/bean-up.jpg` | *Bean Up For Hours* |
| 10 | *Every Last Crumb* | `src/crumb.jpg` | *Every Last Crumb* |
| 11 | Steam curling through a beam of light | `steam` | “In a world chasing perfection, |
| 12 | The café's lights, out of focus | `orbs` | I have a deep appreciation for art that shows the human touch.” |
| 13 | *A Pleasant Pause* | `src/pause.jpg` | *A Pleasant Pause* |
| 14 | *Fresh Baked* | `src/p3-fresh.jpg` | *Fresh Baked* |
| 15 | *Iced Americana* | `src/iced.jpg` | *Iced Americana* |
| 16 | *It's Bean a While* | `src/bean-while.jpg` | *It's Bean a While* |
| 17 | *Bean Thinking of You* | `src/thinking.jpg` | *Bean Thinking of You* |
| 18–19 | Six pieces under a spotlight | her photos (`montage.mp4`) | Twenty-one originals. From $100. |
| 20 | *The Coffee House at Second and Bridge* | `src/p4-house.jpg` | *The Coffee House at Second and Bridge* |
| 21 | *The Perfect Pair* | `src/pair.jpg` | *The Perfect Pair* |
| 22–24 | “Cafe Studio” paints itself onto paper | `end.mp4` | |

Each painting's name and series appear in the corner as it comes on
(`titles/l-*.png`); the other titles are `titles/t1.png` to `t6.png`. All of
them are rendered from `titles.html` with the site's fonts.

## Generated clips (Higgsfield, Cinema Studio Video, pro)

For the film and the café loops that open the site (`media/reel/`, cut by
`film/loops.sh`):

| Clip | Job |
| --- | --- |
| drop | 197ecb70-2694-460c-8fe4-660cee144dfd |
| ribbon | 544278c7-73d0-4078-8356-5cb3aa552189 |
| oil | 052ff1d6-b016-40ff-a0ed-00dc29afa6ec |
| crema | d5ac9ea3-0486-4941-99b9-a0b9becd021c |
| steam | 3f751666-8b43-4aa4-b7da-79436c7a7277 |
| orbs | 66c93ed6-f418-4955-9162-f5288105342e |
| caustics | 6fbce7f0-3d82-41d0-9270-36e1153d2913 |
| brush | 9572e972-4631-4571-9578-6e6d86d58fba |
| bloom | 305148f1-5b27-462d-a6d0-178a5e5d2ef9 |
| wash | 5638d98b-1be2-47d4-8b48-b84d165f1292 |

For the brush close-ups on the site (`media/fx/`, made by `film/brushes.py`):

| Clip | What it is | Job |
| --- | --- | --- |
| brush-wash | A wide brush laying a pale wash | 872d7a93-c231-4ada-8e39-c6f30549756c |
| brush-wide | A round brush pooling a stronger stroke | 82c82f4f-2aa7-4380-ab65-8c6745fb05ff |
| brush-line | A fine point drawing the last details | a98a5eaa-61f3-4121-aec6-a3d67d8c8b86 |

## Rebuilding

Download the clips into one folder as `<clip>.mp4`, then from the
repository root:

    python film/montage.py                        # montage.mp4
    film/build.sh <clips-folder> media/cafe-studio-film.mp4
    film/loops.sh <clips-folder> media/reel
    python film/brushes.py <clips-folder> media/fx

They need ffmpeg (`build.sh` also needs ffprobe) and the Python ones need
Pillow. `build.sh` writes the master and a lighter `-web.mp4` copy; the site
serves the web copy as `media/cafe-studio-film.mp4`.
