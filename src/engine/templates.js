/**
 * @file templates.js
 * @module Templates
 * @description Grammar templates for client-side Tamil sentence composition. Each template declares which primitive POS classes it needs and a build() function that returns {tokens[], english}. tokens[] carries per-word {t, id} so downstream exercises can map a Tamil token back to the primitive that produced it (needed by fill-blank). enumerate() expands a set of introduced primitives through all enabled templates into a deduped list of composable sentences.
 * @exports
 *   - TEMPLATES: map of templateId → {needs, build}
 *   - enumerate(primitives, learnedIds, topic): [{tamil, english, tokens, templateId, primIds}]
 * @depends src/engine/morphology.js
 * @connects Called from App.jsx to build the sentence pool fed into exercise generators for primitive-backed topics.
 */
import { auxFor, capFirst, addQuestionParticle } from "./morphology.js";

export const TEMPLATES = {
  SV: {
    needs: ["pronoun", "verb"],
    build: (s, v) => ({
      tokens: [
        { t: s.tamil, id: s.id },
        { t: v.present[s.agreement], id: v.id },
      ],
      english: `${capFirst(s.english)} ${s.be} ${v.englishIng}`,
    }),
  },

  SDV: {
    needs: ["pronoun", "destination", "verb"],
    build: (s, d, v) => ({
      tokens: [
        { t: s.tamil, id: s.id },
        { t: d.dative, id: d.id },
        { t: v.present[s.agreement], id: v.id },
      ],
      english: `${capFirst(s.english)} ${s.be} ${v.englishIng} ${d.toGloss}`,
    }),
  },

  SV_Q: {
    needs: ["pronoun", "verb"],
    build: (s, v) => ({
      tokens: [
        { t: s.tamil, id: s.id },
        { t: addQuestionParticle(v.present[s.agreement]), id: v.id },
      ],
      english: `${auxFor(s)} ${s.english} ${v.englishIng}?`,
    }),
  },

  Neg_SV: {
    needs: ["pronoun", "verb"],
    build: (s, v) => ({
      tokens: [
        { t: s.tamil, id: s.id },
        { t: v.negPresent[s.agreement], id: v.id },
      ],
      english: `${capFirst(s.english)} ${s.be} not ${v.englishIng}`,
    }),
  },
};

function joinTokens(tokens) {
  return tokens.map((x) => x.t).join(" ");
}

function pickByRole(topicGroups, role) {
  // role → group key mapping
  const map = { pronoun: "pronouns", verb: "verbs", destination: "destinations" };
  return topicGroups[map[role]] || [];
}

export function enumerate(primitives, learnedIdSet, topic) {
  const out = [];
  const seen = new Set();

  for (const tid of topic.templates) {
    const tpl = TEMPLATES[tid];
    if (!tpl) continue;

    // Resolve each needed role to a list of learned primitive objects
    const slots = tpl.needs.map((role) => {
      const groupIds = pickByRole(topic.groups, role);
      return groupIds
        .filter((id) => learnedIdSet.has(id))
        .map((id) => ({ ...primitives[id], id }));
    });
    if (slots.some((s) => s.length === 0)) continue;

    // Cartesian product
    const combos = cartesian(slots);
    for (const combo of combos) {
      const built = tpl.build(...combo);
      const tamil = joinTokens(built.tokens);
      const key = `${tid}|${tamil}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        templateId: tid,
        tamil,
        english: built.english,
        tokens: built.tokens,
        primIds: combo.map((p) => p.id),
      });
    }
  }

  return out;
}

function cartesian(arrays) {
  return arrays.reduce(
    (acc, arr) => acc.flatMap((tuple) => arr.map((x) => [...tuple, x])),
    [[]]
  );
}
