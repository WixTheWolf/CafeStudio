# Cafe Studio: the film

A film of about a minute for the site and the deck: the café as Hannah sees
it, then her paintings seen just as close. No people and no faces; the café
is abstract, all macro and light, and every generated shot is graded into
her one colour (espresso, roast, crema, cream) so it reads as coffee on
paper rather than footage.

Hannah's paintings appear exactly as she painted them: they are her
photographs, moved with a slow camera, never regenerated and never graded.

The finished film is `media/cafe-studio-film.mp4` (and its poster), built by
`film/build.sh` from the clips below plus the files in this folder. The
loops that open the site (`media/reel/`) are cut from the same clips by
`film/loops.sh`.

## Cut

| # | Shot | Source | Title |
| --- | --- | --- | --- |
| 1 | A drop of espresso falls into a still pool of coffee | `drop` | |
| 2 | A ribbon of coffee pours through the dark | `ribbon` | |
| 3 | Coffee oils marbling on the surface of a cup | `oil` | The café, as Hannah sees it. |
| 4 | Crema, swirling | `crema` | |
| 5 | Steam curling through a beam of light | `steam` | “In a world chasing perfection, |
| 6 | The café's lights, out of focus | `orbs` | I have a deep appreciation for art that shows the human touch.” |
| 7 | Light through iced coffee, moving on paper | `caustics` | |
| 8 | A bead of coffee falls from a brush | `brush` | One ingredient. |
| 9 | Coffee poured onto paper blooms into a stain | `bloom` | Coffee. |
| 10 | Pools of coffee drying into rings | `wash` | |
| 11 | *But First, Tabby*, up close (the C clasp) | her photo `src/p1-tabby.jpg` | Painted by hand, in coffee, by Hannah. |
| 12 | *A Classic Breakfast*, up close | her photo `src/p2-breakfast.jpg` | |
| 13 | *Fresh Baked*, up close | her photo `src/p3-fresh.jpg` | |
| 14 | *The Coffee House at Second and Bridge*, up close | her photo `src/p4-house.jpg` | |
| 15 | Six pieces under a spotlight | her photos (`montage.mp4`) | Twenty-one originals. From $100. |
| 16 | “Cafe Studio” paints itself onto paper | `end.mp4` | |

The sound is each shot's own (the drop, the pour, the brush), with a quiet
café (`cafe`) under the second half.

## Site loops

| Loop | Clip | Chapter |
| --- | --- | --- |
| `oil` | `oil` | The opening, under the name |
| `steam` | `steam` | The ritual |
| `orbs` | `orbs` | The light |
| `caustics` | `caustics` | The moment |
| `bloom` | `bloom` (plays once) | The medium, then it clears to the paper |

## Generated clips (Higgsfield, Cinema Studio Video, pro)

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
| cafe (Kling 3.0, used for its sound) | 9ee9db7d-0b5e-4b70-8951-f9f485b2968f |

## Rebuilding

Download the clips into one folder as `<clip>.mp4`, then:

    film/build.sh <clips-folder> media/cafe-studio-film.mp4
    film/loops.sh <clips-folder> media/reel

Both need ffmpeg; `build.sh` also needs ffprobe. The titles in `titles/`,
the gallery montage and the end card were rendered from `film/titles.html`
with the site's own fonts and coffee-painting engine.
