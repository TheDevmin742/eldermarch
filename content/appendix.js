/* ============================================================
   THE APPENDIX — folk, items, and spells the company knows.
   ⚠ FIREWALL: player-safe only. NPC lore here is public,
   in-world flavor — no DM Notes secrets, ever.
   - npcs: faction must match a key in appendix.factions
   - items: rarity is one of common | uncommon | rare | veryrare
     | legendary; magic: true adds the ✦ Magic label
   - spells: level is Cantrip | 1st | 2nd | 3rd …
   ============================================================ */
window.ELDERMARCH = window.ELDERMARCH || {};
window.ELDERMARCH.appendix = {

  factions: {
    shrine:      { name: "The Shrine of Luck",          color: "#8e3b6b" },
    adventurers: { name: "The Adventurers' Guild",      color: "#7c2f26" },
    merchants:   { name: "The Merchants' Guild",        color: "#b89a4e" },
    scriveners:  { name: "The Scriveners' Circle",      color: "#2e5496" },
    craftsmen:   { name: "The Craftsmen's Consortium",  color: "#8a6d3b" },
    phandalin:   { name: "Folk of Phandalin",           color: "#3c6e47" },
    brindlewick: { name: "Folk of Brindlewick",         color: "#5e3b86" },
    road:        { name: "The Open Road",               color: "#6f8aa3" },
    ashlings:    { name: "The Ashlings of Cinderhearth",color: "#c2701d" },
  },

  npcs: [
    {
      name: "Ember", faction: "shrine", place: "The Shrine of Luck, Phandalin",
      role: "Keeper of the Shrine of Luck — a red-haired woman in a tilted pointed hat, voice like quiet flame.",
      lore: "Nobody in Phandalin remembers the shrine being built, and nobody remembers Ember arriving; the oldest residents insist she was already old news when they were young. Her candles never gutter, her fortunes are always true, and she appears wherever she pleases — usually right when a stranger needs a fortune most. She handed Kree a book that writes itself, and she checks its margins.",
    },
    {
      name: "Guildmaster Rorek Stonehand", faction: "adventurers", place: "The Ironbound Hall, Phandalin",
      role: "Dwarf head of the Adventurers' Guild — gruff but fair.",
      lore: "Rorek was an adventurer himself once, and every trophy on the Ironbound Hall's walls has a story he starts loudly and never finishes. The missing half of his left eyebrow is one of them. He pretends not to have favorites among the registered companies; the ledger of jobs he quietly steers toward the promising ones says otherwise.",
    },
    {
      name: "Casey", faction: "adventurers", place: "The Ironbound Hall, Phandalin",
      role: "The Guild's dry, tired desk clerk. Neat handwriting; little patience.",
      lore: "Casey has registered one hundred and twelve adventuring companies and buried the paperwork of more of them than she cares to count. There is a drawer under her desk of unclaimed membership slips that she never throws away. She issued the company their Tablet of Vigor with the words 'one per party, annual — use it wisely,' and she meant every syllable.",
    },
    {
      name: "Seb", faction: "adventurers", place: "The Ironbound Hall, Phandalin",
      role: "A young adventurer who warned the company off the displacer-beast contract.",
      lore: "Seb grew up on a farm two valleys over and joined the Guild the week he was old enough, mostly on the strength of a sword his grandmother left him. He's seen just enough of the road to know which contracts eat new companies alive — 'You take that, you better be ready' — and he's the first to buy a round when a company he warned comes home anyway.",
    },
    {
      name: "Harlan Voss", faction: "merchants", place: "The Ledgerhall, Phandalin",
      role: "Meticulous Merchants' Guild trade factor; treats everything as a transaction.",
      lore: "Voss is said to have once itemized a thank-you. His ledgers balance to the copper, his handshakes come with terms, and he has never in living memory been surprised by a price. And yet — every market-day morning, someone refills the wishing-fountain in the square with a neat stack of coppers before dawn, and it has never once appeared in anyone's books.",
    },
    {
      name: "Eldric Vale", faction: "scriveners", place: "The Inkspire, Phandalin",
      role: "Elderly half-elf scholar of the Scriveners' Circle; soft-spoken, deeply curious.",
      lore: "Eldric has outlived four filing systems and remembers where everything is anyway. His tea is always cold because a map is always more interesting, and he considers 'I don't know yet' the most exciting sentence in any language. Lately an old fragment mentioning an 'ember hearth reclaimed' has him happier than he's been in a decade.",
    },
    {
      name: "Branna Coalhand", faction: "craftsmen", place: "The Hammerline, Phandalin",
      role: "Dwarf master smith of the Consortium — gruff but warm.",
      lore: "Branna judges people the way she judges steel: by how they take a hammering. She keeps a shelf of 'impossible materials' behind the forge — things she hasn't figured out how to work yet — and pays in favors, which everyone in Phandalin knows are worth more than her coin. Salamander scales and ember-silk are the two empty spots on that shelf.",
    },
    {
      name: "Frun", faction: "phandalin", place: "The Stonehill Inn, Phandalin",
      role: "Sleek-furred tabaxi innkeeper; warm but weary.",
      lore: "Frun came to Phandalin from somewhere far south and warmer, and has been meaning to go back for about eleven years now. She names the inn's rooms after weather she misses — the Long Sun, the Dry Wind. When the company was robbed under her roof she waived their whole bill, and took it more personally than anyone the coin actually belonged to.",
    },
    {
      name: "Sylvia Barthen", faction: "phandalin", place: "Barthen's Provisions, Phandalin",
      role: "Kind, white-haired keeper of the town's founding shop — the last Barthen in Phandalin.",
      lore: "The Barthens helped found Phandalin, and their tradition is a small bell: every child of the family carries one, so that no Barthen ever walks a road unheard. Her siblings' bells are in Riverbrook and the capital now, and hers sits by the till — which is why trading one to Kree for a salamander scale meant more than the shinies suggest. She'll deny it, kindly.",
    },
    {
      name: "Carmine", faction: "phandalin", place: "The East Gate Stables, Phandalin",
      role: "The gruff older stable-master, with no patience for noise.",
      lore: "Carmine has run the east stables for thirty years and buried three ponies she loved more than most people. She can tell a storm coming by which horse gets restless first, and claims — correctly, so far — to have never once been wrong about a traveler's character after watching them handle a tired animal. Kenra has been thrown out at least once. The horses, notably, like Kenra fine.",
    },
    {
      name: "Doctor Henning", faction: "phandalin", place: "The Clinic, Phandalin",
      role: "The hunched, cane-leaning clinic doctor.",
      lore: "Henning's cane came from a war he won't name, and his bedside manner comes from forty years of frontier medicine, which is to say it's brisk, honest, and secretly gentle. He hired Thalasstheos on the spot — the first time in anyone's memory he's admitted to needing help — and keeps a jar of honey-drops for patients who don't cry, and a bigger one for those who do.",
    },
    {
      name: "Nysa Grell", faction: "phandalin", place: "The Alchemist's Nook, Phandalin",
      role: "A cautious tiefling alchemist — potions, salves, fire-resistant oils.",
      lore: "Nysa labels everything twice and alphabetizes her explosives. She came to Phandalin because it was quiet, an irony she is now philosophical about. Since the rumors of fire at the old manor she's tripled her stock of fire-oils, and she keeps the good healing potions on the low shelf — where someone in a hurry, bleeding, can reach them.",
    },
    {
      name: "Linene Graywind", faction: "phandalin", place: "The Lionshield Coster, Phandalin",
      role: "Sharp-eyed proprietor of the town's arms shop.",
      lore: "Linene polishes the lionshield sign herself every morning and has refused to sell a sword to at least one person a season — 'you'll hurt yourself, and worse, you'll blame my steel.' The Coster is a chain out of a bigger city, but Linene runs her branch like it's the last honest armory in the world, because as far as she's concerned it is.",
    },
    {
      name: "Qelline Alderleaf", faction: "phandalin", place: "Alderleaf Farm, Phandalin",
      role: "Practical halfling matron of the farm at the east edge.",
      lore: "The Alderleafs fed the miners the winter the silver ran out, and 'bread outlasts silver' has been their family grace ever since. Qelline's barn door has never once been latched against a stray — cat, dog, or adventurer. Her son Carp notices everything the wardens miss, and is currently keeping a list, in careful crayon, of Things That Don't Add Up.",
    },
    {
      name: "Warden-Captain Maro", faction: "phandalin", place: "The Watchpost, Phandalin",
      role: "Overworked head of the town wardens.",
      lore: "Maro took the warden's post because nobody else wanted it, and keeps it because he turned out to be decent at the parts nobody thinks about: knowing every name, checking every latch, writing every report. The daylight robberies are the first thing in nine years he hasn't been able to explain, and it is quietly eating at him more than he lets on.",
    },
    {
      name: "Marta Brin", faction: "road", place: "The Brindlewick–Phandalin road",
      role: "Traveling merchant — the company's first employer, rescued from bandits.",
      lore: "Marta has driven the same route so long the wagon ruts know her name. She hires guards on instinct rather than references, and her instinct about a certain four travelers turned out to be the best bargain of her career. She still carries Brindlewick Sunday loaves on every run — one of which, given dryly to Wilhelm, may count as the company's true founding relic.",
    },
    {
      name: "Bop", faction: "ashlings", place: "Cinderhearth Manor",
      role: "Leader — insofar as embers are led — of the forty-some ashlings of Cinderhearth.",
      lore: "Bop is no taller than a hand, glows like a coal, and speaks only in cricket-and-steam squeaks that Thalasstheos alone understands. It was Bop who kept the flock together through the barn winters, Bop who trusted four strangers, and Bop who led the ashlings home when the manor cooled. Sleep a night under the ashlings' vigil and the dreams are good ones. That's Bop's doing too.",
    },
    {
      name: "Reeve Aldous Penhallow", faction: "brindlewick", place: "Brindlewick",
      role: "The closest thing Brindlewick has to a mayor — keeper of the ledger and the night-bell.",
      lore: "Penhallow believes every problem in the world can be solved by being written down in the correct column, and so far Brindlewick has largely obliged him. He rings the night-bell himself, every night, exactly on time — folk say you could set the mills by him. The bandit trouble on the lanes is the first entry in his ledger he hasn't known which column to put in.",
    },
    {
      name: "Master Tobias Quint", faction: "brindlewick", place: "The Cogwright Academy, Brindlewick",
      role: "Wilhelm's old mentor at the Academy — proud and dry.",
      lore: "Quint has taught practical artifice to three decades of apprentices and measures his life in the ones who surpassed him. He keeps Wilhelm's old workroom locked and untouched — 'storage,' he says — and he was heard to call Wilhelm 'my best tinker' exactly once, to no one, while reading a letter he has not answered yet.",
    },
    {
      name: "Old Maddie Bramsell", faction: "brindlewick", place: "Bramsell's Bakery, Bread Row",
      role: "Matron of the bakery that makes the legendary Sunday loaf.",
      lore: "Everyone buys bread, so Maddie knows everything — who's courting, who's quarreling, whose wagon left before dawn. She trades gossip at a fair exchange rate and gives day-old crusts to children for free, on the theory that a town's secrets should cost something but its kindness shouldn't. The Sunday loaf recipe goes to whichever grandchild proves patient enough. None have.",
    },
    {
      name: "Garrick Vane", faction: "brindlewick", place: "The Drowned Lantern, Brindlewick",
      role: "Retired caravan guard turned innkeeper.",
      lore: "Garrick walked twenty years of roads and retired with all his fingers, which in his trade counts as a triumph. He named his inn the Drowned Lantern as a joke about the driest town in the valley, and keeps his old cudgel above the bar — 'decorative,' he says, in a tone that has kept the bar quiet for years. He has firm opinions about the bandits on the lanes, and old friends who might know more.",
    },
    {
      name: "Nessa Sellwright", faction: "brindlewick", place: "Sellwright's Fixery, Brindlewick",
      role: "The sharp young tinker who runs the brass-and-repair shop — Wilhelm's friendly rival.",
      lore: "Nessa fixes clocks, tools, music boxes, and — once, memorably — the Reeve's spectacles while he was still wearing them. She and Wilhelm spent their apprentice years trying to out-build each other, which both would describe as a rivalry and everyone else would describe as friendship. She is exactly the person to tune up strange artifice, and she knows it.",
    },
    {
      name: "The Drub Brothers", faction: "brindlewick", place: "The Three Wheels, Brindlewick",
      role: "The millers who control the three waterwheels.",
      lore: "Hobb, Merrin, and Tam Drub have divided the River Brindle's flow between them since their father died, and have argued about the division every day since. No two brothers are ever feuding with each other at the same time; the alliances rotate weekly, and the whole town follows them like a serial. In a dry town, water rights are serious business. The bread gets milled anyway.",
    },
    {
      name: "Old Pell, the Rain-Watcher", faction: "brindlewick", place: "The Dry Well, Brindlewick",
      role: "An eccentric who keeps a decades-long rain ledger and mutters omens at passers-by.",
      lore: "Pell has recorded every rainfall in Brindlewick for forty-one years — it fits in one thin ledger, which is rather the point. Folk toss coins in the Dry Well and Pell writes down the wishes too, when he can overhear them, so someone remembers. He said rain-luck was coming the week before the company left town. It rained the morning they went. He has not let anyone forget it.",
    },
  ],

  items: [
    /* ---- relics & wondrous ---- */
    {
      name: "The Black Sword — “Riftshard”", rarity: "rare", magic: true,
      kind: "Weapon (shortsword)", holder: "Kree",
      desc: "Recovered from the rubble of Cinderhearth Manor. It destroys fire-spirits permanently, drinks the light around its edge, and has begun to whisper to Kree. Where it came from — and what it was made to cut — nobody yet knows.",
    },
    {
      name: "The Red Amulet", rarity: "rare", magic: true,
      kind: "Wondrous item (attuned)", holder: "Kree",
      desc: "Found in the manor; it devours fire and fire-spirits whole. It drank an entire burning manor's blaze and has been quiet ever since — the kind of quiet you keep an eye on.",
    },
    {
      name: "Tablet of Vigor", rarity: "rare", magic: true,
      kind: "Wondrous item (consumable)", holder: "The company (one, annual)",
      desc: "Issued by the Adventurers' Guild, one per registered company per year: a relic meant to pull someone back from death's door in dire need. Casey's advice: use it wisely.",
    },
    {
      name: "Decanter of Endless Water", rarity: "uncommon", magic: true,
      kind: "Wondrous item", holder: "Thalasstheos",
      desc: "On command it pours a stream, a fountain, or a thirty-gallon geyser strong enough to knock a foe prone. Endless fresh or salt water — for drinking, dousing, flooding, or dramatic entrances.",
    },
    {
      name: "Pearl of Tides", rarity: "uncommon", magic: true,
      kind: "Wondrous item (attuned)", holder: "Thalasstheos",
      desc: "Lets its bearer breathe water freely, and carries a tide-blessing of her home sea. It is warm when the tide is coming in, anywhere in the world.",
    },
    {
      name: "Ashling Hearth-Charm", rarity: "uncommon", magic: true,
      kind: "Wondrous item", holder: "The company",
      desc: "A gentle relic from the manor nursery, prized by the ashlings. Once a day its bearer can ignore environmental fire — flames part around them like a crowd being polite.",
    },
    {
      name: "Cinderwarden Coat", rarity: "uncommon", magic: true,
      kind: "Armor (coat)", holder: "Wilhelm",
      desc: "Grants resistance to fire — shrug off burning rooms. Cut for a tinker: nine pockets, three of them fireproof, one of them a mystery even to Wilhelm.",
    },
    {
      name: "Goggles of Night", rarity: "uncommon", magic: true,
      kind: "Wondrous item (Wilhelm's replica)", holder: "Wilhelm",
      desc: "Wilhelm-built goggles granting darkvision out to 60 feet. Slightly over-engineered, in that they also keep rain off, which Wilhelm insists was intentional.",
    },
    {
      name: "Pot of Alchemy", rarity: "uncommon", magic: true,
      kind: "Wondrous item (Wilhelm's replica)", holder: "Wilhelm",
      desc: "An alchemical reservoir of Wilhelm's own construction — a pot that stretches reagents further than they have any right to go.",
    },
    {
      name: "Feather of Many Voices", rarity: "uncommon", magic: true,
      kind: "Wondrous item", holder: "Kenra",
      desc: "A prized feather that perfects Kenra's mimicry once per day — any sound, any voice, exactly. In the hands of a kenku who already throws voices for fun, it is a menace.",
    },
    {
      name: "The Telecom", rarity: "uncommon", magic: true,
      kind: "Artifice (destroyed — for now)", holder: "Wilhelm (in pieces)",
      desc: "Wilhelm's long-range communicator, an Academy-grade piece of tinkering — crushed underfoot by a beast just as an unnatural lightning storm set the field ablaze. The pieces are in a pocket. Wilhelm has plans. Nessa Sellwright would have opinions.",
    },
    {
      name: "Fortune Charm", rarity: "common", magic: true,
      kind: "Trinket", holder: "Kenra",
      desc: "A small luck token. Does it work? Kenra hasn't died yet, and won't hear another word on the subject.",
    },
    /* ---- potions ---- */
    {
      name: "Potion of Healing", rarity: "common", magic: true,
      kind: "Potion", holder: "Kree ×2, and the party's pockets",
      desc: "Regain 2d4+2 hit points. Tastes faintly of cherries and regret. The single most reliable friend an adventurer has.",
    },
    {
      name: "Potion of Fire Resistance", rarity: "uncommon", magic: true,
      kind: "Potion", holder: "Kree",
      desc: "Resistance to fire damage for one hour. Bought from Nysa Grell, whose stock of these has tripled lately for entirely understandable reasons.",
    },
    /* ---- arms & gear ---- */
    {
      name: "Flintlock (Repeating Shot)", rarity: "uncommon", magic: true,
      kind: "Weapon (firearm, infused)", holder: "Wilhelm",
      desc: "Wilhelm's pride: a flintlock infused to conjure its own ammunition. Never needs reloading, never runs dry, and makes a noise that has ended several negotiations early.",
    },
    {
      name: "Returning Spear", rarity: "uncommon", magic: true,
      kind: "Weapon (spear, infused)", holder: "Wilhelm",
      desc: "Throw it and it flies back to the hand each turn. Wilhelm maintains this is elementary artifice. Everyone who has watched it whip past their ear disagrees.",
    },
    {
      name: "Shortbow", rarity: "common", magic: false,
      kind: "Weapon", holder: "Kree",
      desc: "Range 80/320. Kree's safe option — fired from the high ground, never point-blank, usually with something smug shouted after it.",
    },
    {
      name: "Rapier", rarity: "common", magic: false,
      kind: "Weapon", holder: "Kree",
      desc: "A finesse blade for diving in beside an ally, striking once, and being somewhere else before the counterattack lands.",
    },
    {
      name: "Dagger", rarity: "common", magic: false,
      kind: "Weapon", holder: "Kree, mostly",
      desc: "Thrown 20/60. The adventurer's second-most reliable friend, and the easiest one to replace.",
    },
    {
      name: "Short sword", rarity: "common", magic: false,
      kind: "Weapon", holder: "Wilhelm",
      desc: "Wilhelm's last resort, kept sharp out of professionalism and used approximately never, which is exactly how he likes it.",
    },
    {
      name: "Quarterstaff", rarity: "common", magic: false,
      kind: "Weapon", holder: "Kenra & Thalasstheos",
      desc: "The druid's classic. Plain oak — until a whispered Shillelagh makes it briefly magical and considerably more persuasive.",
    },
    {
      name: "Shell knife", rarity: "common", magic: false,
      kind: "Weapon (finesse dagger)", holder: "Thalasstheos",
      desc: "A knife of worked shell from her home coast — a tool first, a keepsake second, a weapon a distant third.",
    },
    {
      name: "Tinker's tools", rarity: "common", magic: false,
      kind: "Tools", holder: "Wilhelm",
      desc: "The reason half the party's gear works at all. Wilhelm can also conjure any artisan's tools in an hour — but these are his.",
    },
    {
      name: "Herbalism kit & pan pipes", rarity: "common", magic: false,
      kind: "Tools", holder: "Thalasstheos",
      desc: "Salves and remedies for the clinic work, and pipes whose slow airs calm frightened beasts. Both see more use than any weapon she carries.",
    },
    {
      name: "Traveler's gear", rarity: "common", magic: false,
      kind: "Sundries", holder: "The company",
      desc: "Fifty feet of good rope, waterskins, a wide straw hat, a water druid's cloak and robes, bedrolls, and the thousand small things that keep a company alive between towns.",
    },
    /* ---- materials & trophies ---- */
    {
      name: "Displacer beast pelt", rarity: "uncommon", magic: false,
      kind: "Material (trophy)", holder: "The company",
      desc: "The shimmering, light-bending hide of a displacer beast, taken on the Guild contract that started everything. Even off the beast, it's never quite where you're looking.",
    },
    {
      name: "Salamander scale", rarity: "uncommon", magic: false,
      kind: "Material (trophy)", holder: "One traded to Sylvia Barthen",
      desc: "A palm-sized scale of the Cindered Salamander, still warm to the touch years of seasons later. Branna Coalhand trades favors for these; Kree traded one for a bell.",
    },
    {
      name: "Ember-silk", rarity: "rare", magic: false,
      kind: "Material (sought)", holder: "Not yet found",
      desc: "A fire-spun thread that Branna Coalhand covets for the empty spot on her shelf of impossible materials. Where one finds ember-silk, nobody in Phandalin will say — possibly because nobody in Phandalin knows.",
    },
    /* ---- trinkets & valuables ---- */
    {
      name: "Barthen kin-token bell", rarity: "common", magic: false,
      kind: "Trinket", holder: "Kree",
      desc: "A small bell of the kind every Barthen child carries, so no Barthen ever walks a road unheard. Traded to Kree for a salamander scale. It rings true, and it is absolutely a shiny.",
    },
    {
      name: "The Brandt valuables", rarity: "common", magic: false,
      kind: "Valuables", holder: "The company",
      desc: "A silver candelabra, a pouch of jewels, and assorted household treasures abandoned in the Brandt family's flight from Cinderhearth — carried out past forty small glowing witnesses who did not mind.",
    },
  ],

  spells: [
    /* ---- cantrips ---- */
    { name: "Ray of Frost", level: "Cantrip", school: "Evocation", meta: "Action · 60 ft", casters: ["Wilhelm"],
      desc: "A frigid beam of blue-white light. Ranged spell attack for 1d8 cold, and the target's speed drops by 10 ft — perfect for slowing a chaser." },
    { name: "Mending", level: "Cantrip", school: "Transmutation", meta: "1 minute · touch", casters: ["Wilhelm"],
      desc: "Repairs a single break or tear in an object — a snapped strap, a cracked lens, a torn page. A tinker's best friend." },
    { name: "Primal Savagery", level: "Cantrip", school: "Transmutation", meta: "Action · self", casters: ["Kenra"],
      desc: "Teeth or claws sharpen into acid-dripping points: a melee spell attack for 1d10 acid. It's an Action, not a bonus action — plan the turn around it." },
    { name: "Resistance", level: "Cantrip", school: "Abjuration", meta: "Action · touch · Concentration", casters: ["Kenra"],
      desc: "A willing creature adds 1d4 to one saving throw of its choice before the spell ends. Small dice win big moments." },
    { name: "Shillelagh", level: "Cantrip", school: "Transmutation", meta: "Bonus action · touch · 1 min", casters: ["Kenra", "Thalasstheos"],
      desc: "The druid's staff shimmers with nature's force: it counts as magical and attacks with Wisdom for 1d8+3. Cast it, then bonk." },
    { name: "Thorn Whip", level: "Cantrip", school: "Transmutation", meta: "Action · 30 ft", casters: ["Thalasstheos"],
      desc: "A vine studded with thorns lashes out: +6 to hit, 1d6 piercing, and it yanks a Large-or-smaller target up to 10 ft closer. Come here." },
    { name: "Shape Water", level: "Cantrip", school: "Transmutation", meta: "Action · 30 ft", casters: ["Thalasstheos"],
      desc: "Move, shape, color, or freeze up to a five-foot cube of water. A ramp, a hand, a frozen bridge, a doused fire — pure utility, endlessly abused." },
    /* ---- 1st level ---- */
    { name: "Faerie Fire", level: "1st", school: "Evocation", meta: "Action · 60 ft · Concentration", casters: ["Wilhelm", "Thalasstheos"],
      desc: "Everything in a 20-ft cube must save or be outlined in glowing light: attacks against them have advantage and they can't hide. The company's favorite opener — mind your friends in the cube." },
    { name: "Shield", level: "1st", school: "Abjuration", meta: "Reaction", casters: ["Wilhelm"],
      desc: "An invisible barrier snaps up the instant something hits: +5 AC until your next turn, often turning that hit into a miss. Kept in the pocket at all times." },
    { name: "Heroism", level: "1st", school: "Enchantment", meta: "Action · touch · Concentration", casters: ["Wilhelm"],
      desc: "A willing creature can't be frightened and gains temporary hit points each turn while the spell lasts. Courage, bottled." },
    { name: "Arcane Weapon", level: "1st", school: "Transmutation", meta: "Bonus action · touch · Concentration", casters: ["Wilhelm"],
      desc: "A weapon crackles with chosen energy: +1d6 damage of that type, and it counts as magical. Artificer seasoning for any blade in the party." },
    { name: "Snare", level: "1st", school: "Abjuration", meta: "1 minute (trap)", casters: ["Wilhelm"],
      desc: "A hidden ring of rope and magic. The first creature to step in must save or be hoisted, restrained, upside down. Undignified and extremely effective." },
    { name: "Ice Knife", level: "1st", school: "Conjuration", meta: "Action · 60 ft", casters: ["Kenra", "Thalasstheos"],
      desc: "A shard of ice flies at the target — 1d10 piercing on a hit — then bursts, hit or miss: everyone within 5 ft saves or takes 2d6 cold. Allies count. Check the blast radius." },
    { name: "Beast Bond", level: "1st", school: "Divination", meta: "Action · touch · Concentration", casters: ["Kenra"],
      desc: "Forge a telepathic link with a friendly beast: share simple thoughts, and gain advantage on attacks against anything within 5 ft of it." },
    { name: "Cure Wounds", level: "1st", school: "Evocation", meta: "Action · touch", casters: ["Thalasstheos"],
      desc: "Healing energy through the hands: restore 1d8+3 hit points. No effect on undead or constructs — some things don't want mending." },
    { name: "Healing Word", level: "1st", school: "Evocation", meta: "Bonus action · 60 ft", casters: ["Thalasstheos"],
      desc: "A word of power that heals 1d4+3 from across the field — picking an ally up off the floor without spending the Action. The lifeline's lifeline." },
    { name: "Goodberry", level: "1st", school: "Transmutation", meta: "Action", casters: ["Thalasstheos"],
      desc: "Ten berries appear, each restoring 1 hit point and feeding a person for a day. Pocket healing and trail rations in one — the whole party's snack drawer." },
    { name: "Entangle", level: "1st", school: "Conjuration", meta: "Action · 90 ft · Concentration", casters: ["Thalasstheos"],
      desc: "Grasping weeds erupt across a 20-ft square: strength save or restrained, and the whole square becomes difficult terrain. It grabs everyone — aim it where friends aren't." },
    { name: "Create or Destroy Water", level: "1st", school: "Transmutation", meta: "Action · 30 ft", casters: ["Thalasstheos"],
      desc: "Conjure up to ten gallons of clean water — or rain across a 30-ft cube — or destroy that much, fog included. Between this and the Decanter, the company does not go thirsty." },
    { name: "Detect Magic", level: "1st", school: "Divination", meta: "Action (ritual) · Concentration", casters: ["Thalasstheos"],
      desc: "Sense magic within 30 ft and see its aura and school. Cast as a ritual to save the spell slot — patience is free." },
    /* ---- 2nd level ---- */
    { name: "Web", level: "2nd", school: "Conjuration", meta: "Action · 60 ft · Concentration", casters: ["Wilhelm"],
      desc: "A 20-ft cube fills with thick, sticky webbing: dexterity save or restrained. Anchor it between walls or trees, and bring a torch only if you've thought it through." },
    { name: "Heat Metal", level: "2nd", school: "Transmutation", meta: "Action · 60 ft · Concentration", casters: ["Wilhelm"],
      desc: "A metal object glows red-hot in its owner's hands: 2d8 fire each round, and they drop it or attack at disadvantage. Deeply unfair to knights, which is the point." },
    { name: "Enhance Ability", level: "2nd", school: "Transmutation", meta: "Action · touch · Concentration", casters: ["Wilhelm"],
      desc: "Bless a creature with bear's endurance, bull's strength, owl's wisdom — advantage on one ability's checks for up to an hour. The right tool, applied to a person." },
    { name: "Lesser Restoration", level: "2nd", school: "Abjuration", meta: "Action · touch", casters: ["Wilhelm", "Thalasstheos"],
      desc: "End one disease or one condition afflicting a creature: blinded, deafened, paralyzed, or poisoned. The clinic in a touch." },
    { name: "Flame Blade", level: "2nd", school: "Evocation", meta: "Bonus action · Concentration 10 min", casters: ["Kenra"],
      desc: "A scimitar of pure fire ignites in the hand: attack with it each turn for 3d6 fire. Single-target and safe beside allies — Kenra's caster-mode workhorse." },
    { name: "Summon Beast", level: "2nd", school: "Conjuration", meta: "Action · Concentration 1 hr", casters: ["Kenra"],
      desc: "A bestial spirit takes form — of land, air, or water — and fights at its summoner's command. An extra set of claws with none of the vet bills." },
    { name: "Moonbeam", level: "2nd", school: "Evocation", meta: "Action · 120 ft · Concentration", casters: ["Thalasstheos"],
      desc: "A silvery beam pours down in a 5-ft column: creatures entering or starting there save or take 2d10 radiant. Slide it 60 ft each turn and herd the battlefield." },
    { name: "Spike Growth", level: "2nd", school: "Transmutation", meta: "Action · 150 ft · Concentration", casters: ["Thalasstheos"],
      desc: "The ground within 20 ft sprouts hidden spikes: difficult terrain, and 2d4 piercing for every 5 ft moved through it. Quiet, invisible, and brutal zone-denial." },
    { name: "Pass without Trace", level: "2nd", school: "Abjuration", meta: "Action · self (30-ft aura) · Concentration", casters: ["Thalasstheos"],
      desc: "A veil of shadow and silence: everyone within 30 ft gains +10 to Stealth and can't be tracked. How a company of five walks through a war camp unheard." },
    { name: "Mirror Image", level: "2nd", school: "Illusion", meta: "Action · self · 1 min", casters: ["Thalasstheos"],
      desc: "Three illusory duplicates shimmer into being; attackers may strike a copy instead. Always prepared, coast-blessed — stay-alive insurance for the party's lifeline." },
    { name: "Misty Step", level: "2nd", school: "Conjuration", meta: "Bonus action · self", casters: ["Thalasstheos"],
      desc: "Vanish in silvery mist and reappear up to 30 ft away — out of the melee, across the chasm, past the bars. No opportunity attacks, no apologies. Always prepared." },
    /* ---- 3rd level ---- */
    { name: "Sleet Storm", level: "3rd", school: "Conjuration", meta: "Action · 150 ft · Concentration", casters: ["Kenra"],
      desc: "A 40-ft radius of freezing rain and sleet: heavily obscured, difficult terrain, save or fall prone — and casters inside must save or lose concentration. Weather, weaponized." },
    { name: "Speak with Plants", level: "3rd", school: "Transmutation", meta: "Action · self (30 ft)", casters: ["Kenra"],
      desc: "For ten minutes the plants nearby wake and answer: they part, bend, entangle, and report what has passed by. The forest keeps excellent records." },
    { name: "Call Lightning", level: "3rd", school: "Conjuration", meta: "Action · 120 ft · Concentration 10 min", casters: ["Thalasstheos"],
      desc: "A storm cloud gathers overhead; each turn, call a bolt down for 3d10 lightning (dexterity save for half). Big, repeatable damage — the sky on retainer." },
    { name: "Dispel Magic", level: "3rd", school: "Abjuration", meta: "Action · 120 ft", casters: ["Thalasstheos"],
      desc: "Unravel a magical effect on a creature or object — automatic against 3rd level and lower, an ability check above. The counterweight to everything on this page." },
    { name: "Conjure Animals", level: "3rd", school: "Conjuration", meta: "Action · 60 ft · Concentration 1 hr", casters: ["Thalasstheos"],
      desc: "Fey spirits take beast form and fight for the caster — two big, four middling, or eight small. An action-economy avalanche with fur." },
    { name: "Water Walk", level: "3rd", school: "Transmutation", meta: "Action (ritual) · 30 ft", casters: ["Thalasstheos"],
      desc: "Up to ten creatures walk on water, acid, mud, or even lava as if it were solid ground, for an hour. Coast-blessed; the river is a road if you know the right druid." },
    { name: "Water Breathing", level: "3rd", school: "Transmutation", meta: "Action (ritual) · 30 ft", casters: ["Thalasstheos"],
      desc: "Up to ten creatures breathe underwater for 24 hours. Coast-blessed. The genasi doesn't need it — her friends occasionally do." },
  ],
};
