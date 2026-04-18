/**
 * @file grammar-tips.js
 * @module GrammarTips
 * @description Cross-cutting grammar aids. Two exports: `tipFor(tamilToken)` is a surface-pattern → rule map ("-ல marks negative", "-க்கு means 'to'"), and `universalTamilFor(englishWord)` maps high-frequency English words (mainly subject pronouns) to their colloquial Tamil equivalents so fill-blank can highlight them even when the topic's word list doesn't contain them. Both are intentionally narrow to avoid false positives; tune by adding more high-precision entries, not regex.
 * @exports
 *   - tipFor(tamilToken): string | null
 *   - universalTamilFor(englishWord): string | null
 * @depends (none)
 * @connects Called from src/exercises.js genFillBlank — tipFor attaches `grammarTip` to the exercise (rendered in App.jsx feedback banner); universalTamilFor is the pronoun fallback used when reverse-lookup from the topic word list fails.
 */

// Ordered longest-suffix-first so "-றேன்" wins over "-ற".
const RULES = [
  { suf: "றீங்க", tip: "-றீங்க ending → 'you (plural/polite)' are ___ing" },
  { suf: "றோம்",  tip: "-றோம் ending → 'we' are ___ing" },
  { suf: "றான்",  tip: "-றான் ending → 'he' is ___ing" },
  { suf: "றேன்",  tip: "-றேன் ending → 'I' am ___ing" },
  { suf: "க்கு",  tip: "-க்கு at the end means 'to' (direction/destination)" },
  { suf: "றா",    tip: "-றா ending → 'she' is ___ing" },
  { suf: "ற",     tip: "-ற ending → 'you (informal)' are ___ing" },
  { suf: "ல",     tip: "-ல at the end makes a verb negative (don't / not)" },
  { suf: "ா",     tip: "Final -ா turns a statement into a yes/no question" },
];

export function tipFor(token) {
  if (!token) return null;
  for (const r of RULES) if (token.endsWith(r.suf)) return r.tip;
  return null;
}

// Pronouns (and any other universal anchors) don't live in every topic's vocab,
// so reverse-lookup from topic words misses them. Keep this list short — only
// words whose Tamil form is stable across topics.
const UNIVERSAL_TAMIL = {
  i: "நான்",
  you: "நீ",
  he: "அவன்",
  she: "அவ",
  we: "நாம",
  they: "அவங்க",
};

export function universalTamilFor(englishWord) {
  if (!englishWord) return null;
  return UNIVERSAL_TAMIL[englishWord.toLowerCase()] || null;
}
