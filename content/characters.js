/* ============================================================
   THE COMPANY — one card per hero.
   hidden: true  keeps a character off the site (e.g. before debut).
   ============================================================ */
window.ELDERMARCH = window.ELDERMARCH || {};
window.ELDERMARCH.characters = [
  {
    name: "Kree",
    tags: ["Aarakocra", "Rogue — Scout"],
    color: "#4a6741",
    blurb: "A magpie-hearted skirmisher with a thief's eye and a hoard of shinies. Fast, feathered, and never where the counterattack lands.",
    links: [
      { label: "Hearthsheet", href: "sheets/kree.html" },
      { label: "Tip Sheet", href: "docs/tips-kree.html" },
    ],
  },
  {
    name: "Wilhelm",
    tags: ["Human", "Artificer"],
    color: "#8a6d3b",
    blurb: "The company's toolbox — Academy-trained, endlessly tinkering, and quietly the reason half the party's gear works at all.",
    links: [
      { label: "Hearthsheet", href: "sheets/wilhelm.html" },
      { label: "Tip Sheet", href: "docs/tips-wilhelm.html" },
    ],
  },
  {
    name: "Thalasstheos",
    tags: ["Water Genasi", "Druid — Coast"],
    color: "#6f8aa3",
    blurb: "The tide that holds the company together — healer, heart, and the calm voice when the storm gets loud.",
    links: [
      { label: "Hearthsheet", href: "sheets/thalasstheos.html" },
      { label: "Wild Shape Codex", href: "sheets/thalasstheos-wildshape.html" },
      { label: "Tip Sheet", href: "docs/tips-thalasstheos.html" },
    ],
  },
  {
    name: "Kenra",
    tags: ["Kenku", "Druid — Moon"],
    color: "#5e3b86",
    blurb: "A mimic of borrowed voices and borrowed shapes. Underestimate the quiet bird at your peril — the moon doesn't.",
    links: [
      { label: "Hearthsheet", href: "sheets/kenra.html" },
      { label: "Tip Sheet", href: "docs/tips-kenra.html" },
    ],
  },
  {
    /* Flip hidden to false when Lloyd makes his entrance!
       (His tip sheet & battle card get added to the site then too.) */
    hidden: true,
    name: "Lloyd",
    tags: ["Orc", "Paladin — Devotion"],
    color: "#b8860b",
    blurb: "A silver-tongued aristocrat of exactly no remaining fortune, sworn to the god of honest coin. New in town — ask him about rates.",
    links: [{ label: "Hearthsheet", href: "sheets/lloyd.html" }],
  },
];
