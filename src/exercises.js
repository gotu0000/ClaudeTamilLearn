/**
 * @file exercises.js
 * @module Exercises
 * @description Pure exercise generators. Four types: word-match, listen, fill-blank, sentence-build. Difficulty-gated in generateExercise: 0=match+listen, 1=+fill, 2=+build. The `sentences` argument is the learner's introduced-sentence slice (not the full topic pool); fill/build only fire when this slice is non-empty. genFillBlank is POS-aware: for primitive-backed sentences it blanks a content primitive (verb > destination > pronoun) and offers same-POS distractors; for legacy sentences it uses a stopword filter so the blank never lands on "am/are/is/the/to" etc.
 * @exports
 *   - shuffle(arr): Fisher-Yates copy
 *   - pick(arr, n): shuffled slice of n
 *   - genWordMatch(words): {type:"word-match", options:[{label,correct}], xp:10}
 *   - genListen(words, sentences): {type:"listen", options, xp:15}
 *   - genFillBlank(words, sentences): {type:"fill", options, xp:20}; falls back to word-match on tiny sentences or empty sentence pool
 *   - genSentenceBuild(sentences): {type:"build", correctOrder, scrambled, xp:25}; returns null if insufficient tokens or empty pool
 *   - generateExercise(words, sentences, difficulty): picks a suitable generator based on difficulty and sentence availability
 * @depends (none)
 * @connects Called from App.jsx startTopic / startFromCards / nextStep to build each lesson step.
 */
const STOPWORDS = new Set([
  "a","an","the","am","is","are","was","were","be","been","being",
  "to","of","for","in","on","at","by","with","from",
  "and","or","but","not","no",
  "do","does","did","have","has","had",
  "will","would","can","could","should","may","might",
  "it","this","that","these","those",
]);

const stripPunct = (w) => w.replace(/[.,!?;:"']/g, "");
const isStop = (w) => STOPWORDS.has(stripPunct(w).toLowerCase());
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

export function genWordMatch(words) {
  const pool = pick(words, 4);
  const target = pool[0];
  const dir = Math.random() > 0.5 ? "t2e" : "e2t";
  return {
    type: "word-match", dir,
    prompt: dir === "t2e" ? target.tamil : target.english,
    promptSub: dir === "t2e" ? target.transliteration : null,
    answer: dir === "t2e" ? target.english : target.tamil,
    answerSub: dir === "e2t" ? target.transliteration : null,
    targetWord: target,
    options: shuffle(pool.map((w) => ({
      label: dir === "t2e" ? w.english : w.tamil,
      sub: dir === "e2t" ? w.transliteration : null,
      correct: w === target,
    }))),
    xp: 10,
  };
}

export function genListen(words, sentences) {
  const pool = pick([...words, ...sentences], 4);
  const target = pool[0];
  return {
    type: "listen",
    targetWord: target,
    tamil: target.tamil,
    transliteration: target.transliteration,
    answer: target.english,
    options: shuffle(pool.map((p) => ({ label: p.english, correct: p === target }))),
    xp: 15,
  };
}

export function genFillBlank(words, sentences) {
  if (!sentences.length) return genWordMatch(words);
  const s = sentences[Math.floor(Math.random() * sentences.length)];
  const ew = s.english.split(" ");
  if (ew.length < 3) return genWordMatch(words);

  // Primitive path: blank a content primitive, distractors are same-POS.
  if (s.primIds && words.some((w) => w._primId)) {
    const primsInSentence = s.primIds
      .map((id) => words.find((w) => w._primId === id))
      .filter(Boolean);
    const priority = { verb: 0, noun: 1, pronoun: 2 };
    const ranked = primsInSentence
      .filter((p) => priority[p.pos] !== undefined)
      .sort((a, b) => priority[a.pos] - priority[b.pos]);
    const target = ranked[0];
    if (target) {
      const surface = target.pos === "verb" ? target.englishIng : target.english;
      const bi = ew.findIndex((w) => stripPunct(w).toLowerCase() === surface.toLowerCase());
      if (bi >= 0) {
        const blank = stripPunct(ew[bi]);
        const display = ew.map((w, i) => (i === bi ? "______" : w)).join(" ");
        const sameSposOthers = words
          .filter((w) => w.pos === target.pos && w._primId !== target._primId)
          .map((w) => (w.pos === "verb" ? w.englishIng : w.english))
          .filter((x) => x && x.toLowerCase() !== blank.toLowerCase());
        const dist = pick(sameSposOthers, 3);
        return {
          type: "fill", tamil: s.tamil, transliteration: s.transliteration || "",
          display, answer: blank, targetWord: s,
          options: shuffle([blank, ...dist].slice(0, 4).map((o) => ({ label: o, correct: o === blank }))),
          xp: 20,
        };
      }
    }
  }

  // Legacy path: skip stopwords when choosing what to blank.
  const contentIdx = ew
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => !isStop(w))
    .map(({ i }) => i);
  if (contentIdx.length === 0) return genWordMatch(words);
  const bi = contentIdx[Math.floor(Math.random() * contentIdx.length)];
  const blank = stripPunct(ew[bi]);
  const display = ew.map((w, i) => (i === bi ? "______" : w)).join(" ");
  const dist = pick(
    words
      .map((w) => w.english.split(" / ")[0].split(" ")[0])
      .filter((w) => w && !isStop(w) && w.toLowerCase() !== blank.toLowerCase()),
    3
  );
  return {
    type: "fill", tamil: s.tamil, transliteration: s.transliteration,
    display, answer: blank, targetWord: s,
    options: shuffle([blank, ...dist].slice(0, 4).map((o) => ({ label: o, correct: o === blank }))),
    xp: 20,
  };
}

export function genSentenceBuild(sentences) {
  if (!sentences.length) return null;
  const s = sentences[Math.floor(Math.random() * sentences.length)];
  const tw = s.tamil.split(" ");
  if (tw.length < 3) return null;
  return {
    type: "build", english: s.english, transliteration: s.transliteration,
    correctOrder: tw, scrambled: shuffle(tw), targetWord: s, xp: 25,
  };
}

export function generateExercise(words, sentences, difficulty = 0) {
  const gens = [() => genWordMatch(words), () => genListen(words, sentences)];
  if (difficulty >= 1 && sentences.length) gens.push(() => genFillBlank(words, sentences));
  if (difficulty >= 2 && sentences.length) gens.push(() => genSentenceBuild(sentences));
  for (let i = 0; i < 10; i++) {
    const ex = gens[Math.floor(Math.random() * gens.length)]();
    if (ex) return ex;
  }
  return genWordMatch(words);
}
