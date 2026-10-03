import test from "node:test";
import assert from "node:assert/strict";
import { categorize } from "../src/utils/categorizer.js";

const cases = [
  ["Deep pothole near market", "About 30cm wide, bikes skid here", "pothole"],
  ["Road damaged", "Huge crater formed after the rain", "pothole"],
  ["Sadak par gaddha", "Bahut bada gaddha hai", "pothole"],
  ["Garbage pile", "Trash not collected for a week, bad smell", "garbage"],
  ["Kachra everywhere", "Dustbin overflowing since Monday", "garbage"],
  ["Streetlight not working", "The whole lane is dark at night", "streetlight"],
  ["Lamp post bulb fused", "No light for 3 days", "streetlight"],
  ["Water pipe leaking", "Pipeline burst, water flowing on the road", "water_leak"],
  ["Sewage on road", "Sewer overflow with bad smell", "water_leak"],
  ["Stray dogs", "A lot of dogs near the park", "other"],
  ["", "", "other"],
  ["Help", "Something is wrong here", "other"],
];

for (const [title, description, expected] of cases) {
  test(`"${title}" -> ${expected}`, () => {
    assert.equal(categorize(title, description).category, expected);
  });
}

test("returns confidence and matched keywords", () => {
  const r = categorize("Pothole", "huge pothole on the road");
  assert.ok(r.confidence > 0 && r.confidence <= 1);
  assert.ok(r.matches.includes("pothole"));
});
