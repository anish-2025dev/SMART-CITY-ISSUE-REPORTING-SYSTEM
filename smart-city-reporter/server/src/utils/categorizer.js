// Keyword-based categorizer. No ML: it scores the text against word lists per category.
// strong keywords = clear signal (3 points), weak keywords = supporting hint (1 point).
// Hindi/Hinglish words are included because many reports will be written that way.

const RULES = {
  pothole: {
    strong: ["pothole", "crater", "sinkhole", "road damage", "damaged road", "broken road",
             "road cave", "gaddha", "gadda", "gadde"],
    weak: ["road", "crack", "asphalt", "tar", "pit", "hole", "bump", "tyre", "bike skid"],
  },
  garbage: {
    strong: ["garbage", "trash", "litter", "rubbish", "waste", "dump", "dumping", "dustbin",
             "landfill", "kachra", "kooda", "overflowing bin"],
    weak: ["smell", "stink", "bin", "dirty", "filth", "sanitation", "rotten", "flies"],
  },
  streetlight: {
    strong: ["streetlight", "street light", "street lamp", "streetlamp", "lamp post", "lamppost",
             "light pole", "light not working", "lights not working", "no light", "bulb"],
    weak: ["light", "lamp", "dark", "pole", "batti", "flicker", "night"],
  },
  water_leak: {
    strong: ["leak", "leaking", "leakage", "burst pipe", "pipe burst", "pipeline", "water main",
             "water logging", "waterlogging", "sewage", "sewer"],
    weak: ["water", "pani", "paani", "pipe", "flood", "flooding", "drain", "overflow",
           "puddle", "tap", "hydrant", "wet"],
  },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole-word match that also accepts a simple plural (pothole -> potholes)
const toRegex = (kw) => new RegExp(`\\b${escapeRegex(kw)}(?:s|es)?\\b`, "i");

const COMPILED = Object.fromEntries(
  Object.entries(RULES).map(([cat, { strong, weak }]) => [
    cat,
    { strong: strong.map((k) => [k, toRegex(k)]), weak: weak.map((k) => [k, toRegex(k)]) },
  ])
);

const scoreText = (text) => {
  const scores = {};
  const matches = {};
  for (const [cat, { strong, weak }] of Object.entries(COMPILED)) {
    scores[cat] = 0;
    matches[cat] = [];
    for (const [kw, re] of strong) if (re.test(text)) { scores[cat] += 3; matches[cat].push(kw); }
    for (const [kw, re] of weak) if (re.test(text)) { scores[cat] += 1; matches[cat].push(kw); }
  }
  return { scores, matches };
};

/**
 * @returns {{ category: string, confidence: number, matches: string[] }}
 * confidence is 0..1. Falls back to "other" when there is no clear winner.
 */
export const categorize = (title = "", description = "") => {
  const t = scoreText(String(title));
  const d = scoreText(String(description));

  // Words in the title count double: people put the key point there
  const total = {};
  for (const cat of Object.keys(RULES)) total[cat] = t.scores[cat] * 2 + d.scores[cat];

  const ranked = Object.entries(total).sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = ranked[0];
  const secondScore = ranked[1][1];
  const sum = ranked.reduce((acc, [, s]) => acc + s, 0);

  // Need at least one strong keyword's worth of evidence and a clear lead over the runner-up
  if (topScore < 3 || topScore === secondScore) {
    return { category: "other", confidence: 0, matches: [] };
  }

  return {
    category: topCat,
    confidence: Number((topScore / sum).toFixed(2)),
    matches: [...new Set([...t.matches[topCat], ...d.matches[topCat]])],
  };
};
