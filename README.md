# Cafe Studio

Coffee-themed art by Hannah, painted with coffee.

Three pages, one static site with no build step and no dependencies:

| Page | File | What it is |
| --- | --- | --- |
| Site | `index.html`, `work.html` | A simple library of Hannah's work, every background a plain coffee colour or one of her paintings. The home page opens on *Bean Up For Hours*, enlarged across the first two screens, with her note on the medium; then one painting for each series (each links to its own page), her quote over *Fresh Baked*, her work at home, her artist statement, FYIs and care, and inquiries. A series page (`work.html?series=<id>`) shows every piece in a grid; a piece opens with its size, price, close-ups, a photo at home and a zoom. `work.html?series=<id>&piece=<slug>` opens straight on one piece, for links and QR codes. The menu reaches every series and section, and folds behind a Menu button on phones. |
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

## How the site works

`js/site.js` builds the site from `js/studio.js`: the menu's list of series,
the series cards and pages, the viewer, the photos at home and the inquiry
form. Nothing on the site counts pieces or series, so a new painting appears
as soon as it is added to `works`, and a new series as soon as it is added to
`series` (its `cover` is the piece shown for it). The backgrounds are in
`images/bg/`, enlarged from Hannah's own photos of the paintings.

The deck and the preread still use the WebGL renderers: `js/develop.js`
rebuilds a painting light to dark from her photo, `js/brew.js` paints the
paper and stains, and `js/crema.js` is the cup of coffee in the deck.

## The film

`media/cafe-studio-film.mp4` is used only by the deck now. It mixes
Hannah's paintings with generated coffee footage and generated music, so it
is not on the site. `film/SHOTS.md` lists every shot and how to rebuild it.

## Running it

Open `index.html` through any static server, for example:

    npx serve .

`npm test` checks that every script parses.

## Deploying

The repo deploys to Vercel as-is (`vercel.json` turns on clean URLs, so the
pages live at `/`, `/deck` and `/preread`).
