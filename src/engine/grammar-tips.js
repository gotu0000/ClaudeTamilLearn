/**
 * @file grammar-tips.js
 * @module GrammarTips
 * @description Surface-pattern → rule map. Given a Tamil token, return a one-line grammar rule that explains why the ending is what it is ("-ல marks negative", "-க்கு means 'to'"). Low-precision by design: longest suffix wins, no match returns null, and we keep the rule set small to avoid false positives (e.g. a noun that happens to end in -ல).
 * @exports
 *   - tipFor(tamilToken): string | null
 * @depends (none)
 * @connects Called from src/exercises.js genFillBlank to attach `grammarTip` to the exercise; rendered by App.jsx in the answer-feedback banner so the learner sees why the blank was what it was.
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
