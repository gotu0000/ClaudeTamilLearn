/**
 * @file morphology.js
 * @module Morphology
 * @description Small helpers for Tamil-sentence assembly. Inflections themselves are pre-computed in primitives.json; this file only holds the English-side glue needed by templates (auxiliary verb selection, capitalization) plus the question-particle rule.
 * @exports
 *   - auxFor(pronoun): "Am" / "Are" / "Is" — English auxiliary matching the subject
 *   - capFirst(str): capitalize the first character
 *   - addQuestionParticle(tamilToken): append the -ஆ particle to the final verb token
 * @depends (none)
 * @connects Called from src/engine/templates.js to build per-template output.
 */
export function auxFor(pronoun) {
  return pronoun.beCap;
}

export function capFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function addQuestionParticle(verbTamil) {
  return verbTamil + "ா";
}
