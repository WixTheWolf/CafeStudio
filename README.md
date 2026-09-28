# Cafe Studio

Coffee-themed art by Hannah, painted with coffee.

Three pages, one static site with no build step and no dependencies:

| Page | File | What it is |
| --- | --- | --- |
| Site | `index.html` | The scroll. A cup of coffee pulls back and lifts, leaves its ring, the ring blooms into the palette, a bean study paints itself one dry layer at a time and is hung on the gallery wall beside Hannah's six series, then the night café tells her story and takes enquiries. |
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

Photographed so far: 17. Still to add:

- "A Pleasant Pause": its folder in Hannah's Drive has three photos, but
  all are 8 to 13 MB, too large for the Drive connector used to fetch
  them. Its series is not known yet.
- Three more pieces that are not in the Drive at all. Together with A
  Pleasant Pause they fill one open place each in Cool Beans, Pairs Well
  With, Golden Hour and Coffee Houses.

Series membership was matched from the paintings themselves; check it
against Hannah's list.

## How the stand-in paintings are made

The ring stain, the palette and the bean study are painted live in the
browser by `js/brew.js`, a small generative engine that imitates coffee on
cotton paper. The cup of coffee is live WebGL in `js/crema.js`. The bean
study is labelled on the page as a demonstration, not one of Hannah's
pieces.

## Running it

Open `index.html` through any static server, for example:

    npx serve .

`npm test` checks that every script parses.

## Deploying

The repo deploys to Vercel as-is (`vercel.json` turns on clean URLs, so the
pages live at `/`, `/deck` and `/preread`).
