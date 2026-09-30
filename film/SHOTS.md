# Cafe Studio: the film

A film of about a minute for the site and the deck. Hannah's paintings
appear exactly as she painted them: they are her photographs, moved with a
slow camera. Everything around them (the coffee footage, the steam and the
window light) was generated with Higgsfield and laid over her photos.

The finished film is `media/cafe-studio-film.mp4` (and its poster), built by
`film/build.sh` from the clips below plus the files in this folder.

## Cut

| # | Shot | Source | Title |
| --- | --- | --- | --- |
| 1 | A drop of espresso lands on watercolor paper and dries into a ring | `drop` | |
| 2 | Espresso pours into a porcelain dish | `pour` | One ingredient. |
| 3 | A brush dips into coffee; a bead falls from its tip | `brush` | |
| 4 | A brush lays a golden stroke of coffee across the paper | `wash` | Coffee. |
| 5 | *Bean Up For Hours* under moving window light | her photo + `light` | Painted by hand, in coffee, by Hannah. |
| 6 | *A Pleasant Pause*, up close (her detail photo) | her photo + `light` | |
| 7 | *A Pleasant Pause* framed on the wall, sun and leaf shadows crossing it | her photo + `light` | “In a world chasing perfection, |
| 8 | *Not Just a Dopio*; steam rises out of the painted espresso into the room | her photo + `steam` | I have a deep appreciation for art that shows the human touch.” |
| 9 | Six pieces under a spotlight | her photos (`montage.mp4`) | Six series. Twenty-one originals. |
| 10 | At home: *It’s Bean Real* beside the espresso machine | her photo + `light` | |
| 11 | A cup of espresso from above, crema turning | `crema` | |
| 12 | “Cafe Studio” paints itself onto paper | `end.mp4` | |

The sound is the coffee's own (the drop, the pour, the brush), with the
`cafe` clip's murmur under the paintings.

## Generated clips (Higgsfield)

| Clip | Model | Job |
| --- | --- | --- |
| drop | Cinema Studio Video (pro, slow motion) | 5c8b68db-4650-4020-b17e-4a96424260cd |
| pour | Cinema Studio Video (pro, slow motion) | 6b4b7039-ceff-414c-bec8-68995d15c14d |
| brush | Cinema Studio Video (pro, slow motion) | 2deb93b7-9014-4d5b-a5bd-658b5089829a |
| wash | Kling 3.0 (pro) | 4566aa73-a1fe-4856-9791-0e4b269e29d6 |
| steam | Cinema Studio Video (pro), steam on black | 8f2626f3-6edd-4927-9864-eecd1b7edc6e |
| light | Cinema Studio Video (pro), window light on a wall | eed564c4-290d-479e-8064-52269e2ac636 |
| crema | Cinema Studio Video (pro) | fb0639e1-05d9-4efa-95d6-125d625bbe07 |
| cafe | Kling 3.0 (pro), used for its sound | 9ee9db7d-0b5e-4b70-8951-f9f485b2968f |

## Rebuilding

Download the clips into one folder as `<clip>.mp4`, then:

    film/build.sh <clips-folder> media/cafe-studio-film.mp4

It needs ffmpeg and ffprobe. The titles in `titles/`, the gallery montage
and the end card were rendered from `film/titles.html` with the site's own
fonts and coffee-painting engine.
