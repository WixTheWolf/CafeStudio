# Cafe Studio

Coffee-themed art by Hannah, painted with coffee.

Three pages, one static site with no build step and no dependencies:

| Page | File | What it is |
| --- | --- | --- |
| Site | `index.html` | The scroll. It opens in the café as Hannah sees it: abstract macro loops of coffee (marbling oils, steam, light, a bloom on paper), each spreading over the last like a coffee stain, stirred by the pointer, until the last clears to the paper and leaves a ring. The ring blooms into the palette, and three close-ups of a brush (a pale wash, a stronger stroke, the last fine details) move with the scroll. Hannah's *Bean Up For Hours* then comes back together on the paper, wash by wash, and is hung on the gallery wall with her six series. Then you step inside: seven of her paintings hang one behind another, and scrolling walks through them, each one opening from the middle onto the next. Her close-ups fill the screen, her kitchen photos drift by in morning light, and the night café tells her story and takes enquiries. Every chapter has beats, and the page settles on them (see below). |
| Deck | `deck.html` | A 16-slide 16:9 deck: the film, statement, the artist, the medium, the process, the six series on the gallery wall with sizes and prices, close-ups, what to know about collecting, and the price list. Arrow keys, space, tap or swipe to move; `N` for speaker notes; `F` for full screen; link a slide as `deck#s5`. |
| Preread | `preread.html` | A five-minute read to send before a meeting. Follows light and dark mode, prints cleanly. |

## Editing the content

Everything the three pages say lives in **`js/studio.js`**: the artist
statement and bio, the six series, every work, the collecting notes and the
care notes. Change it once and all three pages follow.

Contact details:

- `legal` is the business name, Cafe Studio, LLC, shown in the footers and
  on the last slide.
- `email` is the studio address. It powers the "Email Hannah" button on the
  enquiry form and shows in the deck, preread and footer.
- `instagram` and `site` are optional and appear wherever contact details
  do once they are filled in.

## The works

Photos are in `images/works/`, cropped from Hannah's originals in her shared
Drive folders:

- `<slug>.jpg` is the piece itself (the matted piece, the painting, or the
  wood panel),
- `<slug>-detail.jpg` is an optional close-up,
- `<slug>-home.jpg` is an optional photo of the piece staged at home.

Each work in `js/studio.js` names its `series` and its `mount`:
`matted` (the photo includes the mat), `art` (the painting itself),
`panel` or `oval` (painted on wood). A work with `photo: null` stays off
the gallery until a photo is added.

The collection is 21 pieces across six series (Cool Beans 7, Pairs Well
With 5, My Coach and a Coffee 3, Golden Hour 3, Coffee Makers 2, Coffee
Houses 1), and every one is photographed.

Each work also carries its `size` and `mat` in inches and its `price` in US
dollars, from Hannah's list. The site shows them on every placard and in
the viewer, the deck under every piece and on a price-list slide, and the
preread in its plate captions and price table. A work without a `price`
shows "Price on request": You've Bean Amazing, Spill the Beans and It's
Bean Real are still waiting on theirs.

## How the animation works

- `js/develop.js` is a small WebGL renderer for Hannah's photos. In *build*
  mode it puts a finished painting back on the paper in four stages, light
  to dark: every pixel gets washes until it reaches its darkness in the
  photo, each wash sweeps in with a ragged wet edge and a faint rim, and
  the detail only sharpens in the last stage. The site scrolls through it,
  and the deck and preread show the four stages. Which painting is set by
  `feature` in `js/studio.js`. In *bleed* mode one close-up spreads over
  another like spilled coffee.
- `js/brew.js` paints the ring stain, the palette swatches and the painted
  wordmarks, imitating coffee on cotton paper.
- `js/reel.js` plays the café loops that open the site (`media/reel/`), in
  WebGL: each loop spreads over the last as a stain with a dark wet rim, the
  pointer stirs the picture, and the last loop clears to the paper. The
  brush chapter uses it too: the footage arrives as a spreading stain, and
  the scroll scrubs each brush clip (`media/fx/brush-*.mp4`, encoded with a
  keyframe every six frames so scrubbing stays smooth). Without WebGL, or
  with reduced motion, the posters stand in.
- "Step inside" needs no WebGL: each frame is scaled by how far the
  reader is from it, and a radial mask opens the painting in front. With
  reduced motion the frames hang flat in a grid.
- The scroll has beats: each line of the café, each note on the medium,
  the full palette, each step with the brush, each layer of the process,
  every painting in the middle of the gallery wall, each frame of "Step
  inside" and each close-up (`beats()` in `js/site.js`). When the reader
  stops, the page glides to the next beat in the direction they were
  scrolling (or back to one they only just passed), so one turn of the
  wheel or one swipe is one step of the story. It never pulls back to
  where a scroll started, lets go at the first touch, wheel or key, and
  stops at Hannah's story, which scrolls freely. The stage also follows
  the scroll with a short glide, so wheel steps move it smoothly. With
  reduced motion neither happens.
- `js/crema.js` is the live WebGL cup of coffee in the deck.

Without WebGL, the pages fall back to Hannah's photos as they are.

## The film

`media/cafe-studio-film.mp4` is a film of a minute and a quarter, cut to
the bar lines of an original coffee-house score (felt piano, brushed
snare, upright bass, strings; generated with ElevenLabs Music). It is
Hannah's paintings up close, fourteen of them, each named as it appears,
with a few abstract macro shots of coffee (a drop, a brush, a bloom on
paper, steam, light) opening it and giving it one breath in the middle.
It plays from the "Watch the film" button on the site (or `/#film`), on
the deck's second slide, and from the preread's closing links. The coffee
footage was generated with Higgsfield and graded into her one colour; her
paintings are her own photos, moved with a slow camera and never
regenerated. `film/SHOTS.md` lists every shot, the music brief and every
clip, and how to rebuild the film (`film/build.sh`), the montage
(`film/montage.py`), the opening loops (`film/loops.sh`) and the brush
close-ups (`film/brushes.py`).

## Running it

Open `index.html` through any static server, for example:

    npx serve .

`npm test` checks that every script parses.

## Deploying

The repo deploys to Vercel as-is (`vercel.json` turns on clean URLs, so the
pages live at `/`, `/deck` and `/preread`).
