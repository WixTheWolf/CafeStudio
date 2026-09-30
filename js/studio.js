/* Cafe Studio content. Edit this one file to update the site, the deck and
   the preread together.

   Photos live in images/works/. Each work has a main photo (the matted
   piece, or the painting itself) and can add close-ups (`detail: true` for
   <slug>-detail.jpg, `detail: 2` to add <slug>-detail-2.jpg) and a `home`
   photo of it staged at home. A work without a photo is left
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
    { title: "Pre-matted", text: "Pieces on paper come pre-matted; the wood panels are unmatted. Size and price are listed with each piece.", photo: "images/works/a-classic-breakfast-detail.jpg" },
    { title: "Frames for staging", text: "Frames in the photos are used for staging and are not included in the purchase.", photo: "images/works/fresh-baked-home.jpg" },
    { title: "One of a kind", text: "The texture of the coffee varies, so every piece has its own character and thickness.", photo: "images/works/but-first-tabby-detail.jpg" },
    { title: "Shipping", text: "Pricing does not include shipping.", photo: "images/works/percolate-home.jpg" }
  ],

  // A light-to-dark scale of the one coffee, for the palette.
  strengths: [
    { name: "Café au lait", s: 0.06 },
    { name: "Latte",        s: 0.2 },
    { name: "Flat white",   s: 0.36 },
    { name: "Cortado",      s: 0.55 },
    { name: "Espresso",     s: 0.76 },
    { name: "Ristretto",    s: 0.96 }
  ],

  // The home photos scattered through the site's "At home" section, in order.
  atHome: ["bean-up-for-hours", "coffee-house", "its-bean-real", "fresh-baked", "every-last-crumb",
    "sticky-honey-pancake-balls", "iced-americana", "not-just-a-dopio", "percolate", "full-body"],

  // The painting the site builds up as you scroll, one wash at a time. The
  // animation is made from the finished piece, so it ends as the photo.
  feature: "bean-up-for-hours",

  // How a coffee painting comes together. Each step brings the feature
  // painting through one more stage, from pale washes to the darkest details.
  process: [
    { title: "Pale washes first", text: "Each bean starts as a pale golden shape in the weakest brew, while the paper is still the lightest thing on the page." },
    { title: "Let every layer dry", text: "Wet coffee keeps moving. The next wash goes in only once the last has dried, or the edges run together." },
    { title: "Build toward dark", text: "Stronger coffee rounds out each bean, deepest where it turns away from the light." },
    { title: "Details last", text: "The crease down each bean and the darkest accents go in last, with the strongest coffee." }
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
  // size is the painting in inches, mat the matted size (none on wood), and
  // price is in US dollars; leave price out to show "Price on request".
  works: [
    { slug: "bean-up-for-hours", title: "Bean Up For Hours", series: "cool-beans", mount: "art", ratio: 0.73, home: true, size: "9x12", mat: "11x14", price: 350 },
    { slug: "its-bean-a-while", title: "It’s Bean a While", series: "cool-beans", mount: "matted", ratio: 1.267, detail: true, size: "5x7", mat: "8x10", price: 100 },
    { slug: "bean-there-done-that", title: "Bean There, Done That", series: "cool-beans", mount: "matted", ratio: 1.26, home: true, size: "5x7", mat: "8x10", price: 100 },
    { slug: "bean-thinking-of-you", title: "Bean Thinking of You", series: "cool-beans", mount: "matted", ratio: 1.244, detail: true, size: "5x7", mat: "8x10", price: 100 },
    { slug: "youve-bean-amazing", title: "You’ve Bean Amazing", series: "cool-beans", mount: "matted", ratio: 1.243, home: true },
    { slug: "spill-the-beans", title: "Spill the Beans", series: "cool-beans", mount: "matted", ratio: 0.742 },
    { slug: "its-bean-real", title: "It’s Bean Real", series: "cool-beans", mount: "matted", ratio: 1.107, home: true },

    { slug: "the-perfect-pair", title: "The Perfect Pair", series: "pairs-well-with", mount: "art", ratio: 0.75, size: "5x7", mat: "8x10", price: 100 },
    { slug: "fresh-baked", title: "Fresh Baked", series: "pairs-well-with", mount: "matted", ratio: 0.768, detail: true, home: true, size: "9x12", mat: "11x14", price: 300 },
    { slug: "every-last-crumb", title: "Every Last Crumb", series: "pairs-well-with", mount: "art", ratio: 1.333, home: true, size: "7x10", mat: "11x12", price: 175 },
    { slug: "sticky-honey-pancake-balls", title: "Sticky Honey Pancake Balls", series: "pairs-well-with", mount: "matted", ratio: 1.23, home: true, size: "5x7", mat: "8x10", price: 100 },
    { slug: "a-pleasant-pause", title: "A Pleasant Pause", series: "pairs-well-with", mount: "matted", ratio: 1.289, detail: true, size: "5x7", mat: "8x10", price: 100 },

    { slug: "but-first-tabby", title: "But First, Tabby", series: "coach", mount: "matted", ratio: 1.281, detail: true, size: "9x12", mat: "11x14", price: 450 },
    { slug: "a-classic-breakfast", title: "A Classic Breakfast", series: "coach", mount: "matted", ratio: 1.302, detail: true, size: "9x12", mat: "11x14", price: 450 },
    { slug: "breakfast-with-brooklyn", title: "Breakfast with Brooklyn", series: "coach", mount: "matted", ratio: 0.763, detail: 2, home: true, size: "9x12", mat: "11x14", price: 450 },

    { slug: "iced-americana", title: "Iced Americana", series: "golden-hour", mount: "panel", ratio: 0.703, home: true, size: "4.75x6.75", price: 150 },
    { slug: "not-just-a-dopio", title: "Not Just a Dopio", series: "golden-hour", mount: "matted", ratio: 1.27, home: true, size: "5x7", mat: "8x10", price: 100 },
    { slug: "full-body", title: "Full Body", series: "golden-hour", mount: "oval", ratio: 0.747, home: true, size: "4.75x6.75", price: 150 },

    { slug: "percolate", title: "Percolate", series: "coffee-makers", mount: "matted", ratio: 0.787, home: true, size: "9x12", mat: "11x14", price: 350 },
    { slug: "al-banco", title: "Al Banco", series: "coffee-makers", mount: "matted", ratio: 0.775, size: "9x12", mat: "11x14", price: 350 },

    { slug: "coffee-house", title: "The Coffee House at Second and Bridge", series: "coffee-houses", mount: "art", ratio: 1.354, detail: true, home: true, size: "9x12", mat: "11x14", price: 450 }
  ]
};

// Fill in photo paths from the slugs.
(function (S) {
  S.works.forEach(function (w) {
    if (w.photo === undefined) w.photo = "images/works/" + w.slug + ".jpg";
    w.detailPhotos = [];
    for (var d = 1; d <= (w.detail === true ? 1 : w.detail || 0); d++) w.detailPhotos.push("images/works/" + w.slug + "-detail" + (d > 1 ? "-" + d : "") + ".jpg");
    w.detailPhoto = w.detailPhotos[0] || null;
    w.homePhoto = w.home ? "images/works/" + w.slug + "-home.jpg" : null;
    w.wood = w.mount === "panel" || w.mount === "oval";
    w.medium = w.mount === "oval" ? "Coffee on an oval wood panel" : w.wood ? "Coffee on a wood panel" : "Coffee on paper";
  });
  // "9x12" -> "9 × 12 in"
  function inches(s) { return s.split("x").join(" × ") + " in"; }
  // The painting's size and how it comes: "9 × 12 in, matted to 11 × 14 in".
  S.sizeText = function (w) {
    if (!w.size) return "Size on request";
    return inches(w.size) + (w.mat ? ", matted to " + inches(w.mat) : w.wood ? ", unmatted" : "");
  };
  S.priceText = function (w) { return w.price ? "$" + w.price.toLocaleString("en-US") : "Price on request"; };
  S.spec = function (w) { return S.sizeText(w) + " · " + S.priceText(w); };
  S.priceRange = function () {
    var p = S.works.map(function (w) { return w.price; }).filter(Boolean);
    return p.length ? "$" + Math.min.apply(null, p) + " to $" + Math.max.apply(null, p) : "";
  };
  S.seriesOf = function (id) { return S.series.filter(function (s) { return s.id === id; })[0]; };
  S.hung = function () { return S.works.filter(function (w) { return w.photo; }); };
  S.inSeries = function (id) { return S.hung().filter(function (w) { return w.series === id; }); };
  S.pieces = function (n) { return n + (n === 1 ? " piece" : " pieces"); };
  S.work = function (slug) { return S.works.filter(function (w) { return w.slug === slug; })[0]; };
  S.total = function () { return S.series.reduce(function (t, se) { return t + se.count; }, 0); };
  // What a series is still missing photos of, or "" when every piece is shown.
  S.toCome = function (se) {
    var shown = S.inSeries(se.id).length, left = se.count - shown;
    if (left <= 0) return "";
    if (!shown) return se.count === 1 ? "Photo coming soon" : "Photos coming soon";
    return "Plus " + left + " more, photo" + (left === 1 ? "" : "s") + " coming soon";
  };
})(window.STUDIO);
