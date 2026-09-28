/* Cafe Studio content. Edit this one file to update the site, the deck and
   the preread together.

   Photos live in images/works/. Each work has a main photo (the matted
   piece, or the painting itself) and can add a close-up `detail` and a
   `home` photo of it staged in a kitchen. A work without a photo is left
   off the gallery until one is added. */
window.STUDIO = {
  name: "Cafe Studio",
  legal: "Cafe Studio, LLC",
  artist: "Hannah",
  line: "Coffee-themed art, painted with coffee.",

  // Contact details. Leave a value empty to hide what depends on it.
  email: "cafestudiogallery@gmail.com",
  instagram: "",    // handle without the @
  site: "",         // public address, shown in the deck and the preread

  statement: [
    "In a world chasing perfection, I have a deep appreciation for art that shows the human touch.",
    "I paint coffee-themed art using coffee. The bold, rich, and natural warmth of the medium translates onto paper to delight your senses."
  ],

  bio: [
    "Art has been central to my life for as long as I can remember. I earned my Bachelor’s degree in Studio Art with a primary focus on traditional oil painting, a medium I went on to teach at the introductory level for three years.",
    "The birth of my daughter marked a turning point in both my life and my practice. Seeking a safer, non-toxic environment to create around her, I set aside traditional oils and discovered the unexpected versatility of painting with coffee. What began as a practical transition quickly became a passion; I soon found myself fully immersed in the rich culture, ritual, and community that revolves around the coffee lifestyle.",
    "Today, I harness the bold tones, natural warmth, and subtle textures of coffee to create monochromatic works that celebrate everyday moments and connection."
  ],

  // Care and FYIs, in Hannah's words.
  care: {
    intro: "Due to the nature of the coffee, please avoid:",
    avoid: ["Touching it directly", "Placing it in direct sunlight", "Any contact with moisture"],
    note: "The natural texture of the coffee may vary, so each piece will have unique characteristics and thickness."
  },
  fyi: [
    { title: "Pre-matted", text: "All pieces come pre-matted. Sizing information is included with each piece.", photo: "images/works/a-classic-breakfast-detail.jpg" },
    { title: "Frames for staging", text: "Frames in the photos are used for staging and are not included in the purchase.", photo: "images/works/fresh-baked-home.jpg" },
    { title: "One of a kind", text: "The texture of the coffee varies, so every piece has its own character and thickness.", photo: "images/works/but-first-tabby-detail.jpg" },
    { title: "Shipping", text: "Pricing does not include shipping.", photo: "images/works/percolate-home.jpg" }
  ],

  // A light-to-dark scale of the one coffee. The site's bean study uses it.
  strengths: [
    { name: "Café au lait", s: 0.06 },
    { name: "Latte",        s: 0.2 },
    { name: "Flat white",   s: 0.36 },
    { name: "Cortado",      s: 0.55 },
    { name: "Espresso",     s: 0.76 },
    { name: "Ristretto",    s: 0.96 }
  ],

  // How a coffee painting comes together, shown on the site with a bean
  // study that paints itself. `layers` names the study's layers each step
  // paints. The study is a demonstration, not one of Hannah's pieces.
  process: [
    { title: "Pale washes first", text: "Each bean starts as a pale golden shape in the weakest brew, while the paper is still the lightest thing on the page.", layers: ["wash"] },
    { title: "Let every layer dry", text: "Wet coffee keeps moving. The shadows go in only once the first wash has dried, or the edges run together.", layers: ["shadow"] },
    { title: "Build toward dark", text: "Stronger coffee rounds out each bean, deepest where it turns away from the light.", layers: ["form"] },
    { title: "Details last", text: "The crease down each bean and the darkest accents go in with the strongest coffee, and highlights are lifted back out.", layers: ["crease", "light", "details"] }
  ],

  // Series, in the order they hang. `count` is the size of the whole series,
  // including pieces that have no photo yet; the pages say how many are
  // still to come.
  series: [
    { id: "cool-beans", title: "Cool Beans", count: 7, blurb: "Coffee beans, up close." },
    { id: "pairs-well-with", title: "Pairs Well With", count: 5, blurb: "The treats that belong next to a cup." },
    { id: "coach", title: "My Coach and a Coffee", count: 3, blurb: "Coach bags, breakfast and the morning cup." },
    { id: "golden-hour", title: "Golden Hour", count: 3, blurb: "Coffee in warm, low light." },
    { id: "coffee-makers", title: "Coffee Makers", count: 2, blurb: "The brewers behind the cup." },
    { id: "coffee-houses", title: "Coffee Houses", count: 1, blurb: "Coffee shops, painted in coffee." }
  ],

  // mount: "matted" (photo shows the matted piece), "art" (the painting
  // itself), "panel" (a wood panel), "oval" (an oval wood panel).
  works: [
    { slug: "its-bean-a-while", title: "It’s Bean a While", series: "cool-beans", mount: "matted", ratio: 1.267 },
    { slug: "youve-bean-amazing", title: "You’ve Bean Amazing", series: "cool-beans", mount: "matted", ratio: 1.243, home: true },
    { slug: "spill-the-beans", title: "Spill the Beans", series: "cool-beans", mount: "matted", ratio: 0.742 },
    { slug: "its-bean-real", title: "It’s Bean Real", series: "cool-beans", mount: "matted", ratio: 1.107, home: true },
    { slug: "bean-thinking-of-you", title: "Bean Thinking of You", series: "cool-beans", mount: "matted", ratio: 1.244 },
    { slug: "bean-up-for-hours", title: "Bean Up For Hours", series: "cool-beans", mount: "art", ratio: 1.37, home: true },

    { slug: "the-perfect-pair", title: "The Perfect Pair", series: "pairs-well-with", mount: "art", ratio: 0.75 },
    { slug: "fresh-baked", title: "Fresh Baked", series: "pairs-well-with", mount: "matted", ratio: 0.768, detail: true, home: true },
    { slug: "every-last-crumb", title: "Every Last Crumb", series: "pairs-well-with", mount: "art", ratio: 1.333, home: true },
    { slug: "sticky-honey-pancake-balls", title: "Sticky Honey Pancake Balls", series: "pairs-well-with", mount: "matted", ratio: 1.23, home: true },

    { slug: "but-first-tabby", title: "But First, Tabby", series: "coach", mount: "matted", ratio: 1.281, detail: true },
    { slug: "a-classic-breakfast", title: "A Classic Breakfast", series: "coach", mount: "matted", ratio: 1.302, detail: true },
    { slug: "breakfast-with-brooklyn", title: "Breakfast with Brooklyn", series: "coach", mount: "art", ratio: 0.667 },

    { slug: "iced-americana", title: "Iced Americana", series: "golden-hour", mount: "panel", ratio: 0.703, home: true },
    { slug: "not-just-a-dopio", title: "Not Just a Dopio", series: "golden-hour", mount: "matted", ratio: 1.296, home: true },

    { slug: "percolate", title: "Percolate", series: "coffee-makers", mount: "matted", ratio: 0.787, home: true },
    { slug: "full-body", title: "Full Body", series: "coffee-makers", mount: "oval", ratio: 0.747, home: true },

    // Photos of this one are in Hannah's Drive but were too large to bring in.
    { slug: "a-pleasant-pause", title: "A Pleasant Pause", series: "", mount: "matted", ratio: 1.25, photo: null }
  ]
};

// Fill in photo paths from the slugs.
(function (S) {
  S.works.forEach(function (w) {
    if (w.photo === undefined) w.photo = "images/works/" + w.slug + ".jpg";
    w.detailPhoto = w.detail ? "images/works/" + w.slug + "-detail.jpg" : null;
    w.homePhoto = w.home ? "images/works/" + w.slug + "-home.jpg" : null;
    w.medium = w.mount === "panel" || w.mount === "oval" ? "Coffee on wood panel" : "Coffee on paper, pre-matted";
  });
  S.seriesOf = function (id) { return S.series.filter(function (s) { return s.id === id; })[0]; };
  S.hung = function () { return S.works.filter(function (w) { return w.photo; }); };
  S.inSeries = function (id) { return S.hung().filter(function (w) { return w.series === id; }); };
  S.pieces = function (n) { return n + (n === 1 ? " piece" : " pieces"); };
  S.total = function () { return S.series.reduce(function (t, se) { return t + se.count; }, 0); };
  // What a series is still missing photos of, or "" when every piece is shown.
  S.toCome = function (se) {
    var shown = S.inSeries(se.id).length, left = se.count - shown;
    if (left <= 0) return "";
    if (!shown) return se.count === 1 ? "Photo coming soon" : "Photos coming soon";
    return "Plus " + left + " more, photo" + (left === 1 ? "" : "s") + " coming soon";
  };
})(window.STUDIO);
