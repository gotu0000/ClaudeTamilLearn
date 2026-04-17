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
  const s = sentences[Math.floor(Math.random() * sentences.length)];
  const ew = s.english.split(" ");
  if (ew.length < 3) return genWordMatch(words);
  const bi = 1 + Math.floor(Math.random() * (ew.length - 1));
  const blank = ew[bi];
  const display = ew.map((w, i) => (i === bi ? "______" : w)).join(" ");
  const dist = pick(words.map((w) => w.english.split(" / ")[0].split(" ")[0]).filter((w) => w.toLowerCase() !== blank.toLowerCase()), 3);
  return {
    type: "fill", tamil: s.tamil, transliteration: s.transliteration,
    display, answer: blank, targetWord: s,
    options: shuffle([blank, ...dist].slice(0, 4).map((o) => ({ label: o, correct: o === blank }))),
    xp: 20,
  };
}

export function genSentenceBuild(sentences) {
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
