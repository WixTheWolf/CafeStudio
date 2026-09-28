# Cafe Studio

Coffee-themed art by Hannah, painted with coffee.

Three pages, one static site with no build step and no dependencies:

| Page | File | What it is |
| --- | --- | --- |
| Site | `index.html` | The scroll. A cup of coffee pulls back and lifts, leaves its ring, and the ring blooms into the palette. Hannah's *Bean Up For Hours* then comes back together on the paper, wash by wash, and is hung on the gallery wall with her six series. Her close-ups fill the screen, her kitchen photos drift by in morning light, and the night café tells her story and takes enquiries. |
| Deck | `deck.html` | A 13-slide 16:9 deck: statement, the artist, the medium, the process, the six series on the gallery wall, close-ups, and what to know about collecting. Arrow keys, space, tap or swipe to move; `N` for speaker notes; `F` for full screen; link a slide as `deck#s5`. |
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
Houses 1). Each series' `count` in `js/studio.js` is its full size, and
every page notes how many pieces in a series are still waiting on a
photo, so the totals stay right while photos come in.

Photographed so far: 18. Still to add: three pieces that are not in the
Drive, one each in Cool Beans, Golden Hour and Coffee Houses.

Series membership was matched from the paintings themselves (A Pleasant
Pause, macarons beside a cup, is in Pairs Well With); check it against
Hannah's list.

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
- `js/crema.js` is the live WebGL cup of coffee.

Without WebGL, the pages fall back to Hannah's photos as they are.

## Running it

Open `index.html` through any static server, for example:

    npx serve .

`npm test` checks that every script parses.

## Deploying

The repo deploys to Vercel as-is (`vercel.json` turns on clean URLs, so the
pages live at `/`, `/deck` and `/preread`).
