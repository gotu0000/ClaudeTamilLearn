/**
 * SM-2 Spaced Repetition (same as Anki)
 * Quality: 0=blackout, 5=perfect. App uses 4=correct, 1=incorrect.
 */
export function sm2(item, quality) {
  let { ef = 2.5, interval = 1, reps = 0 } = item || {};
  if (quality >= 3) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ef);
    reps += 1;
  } else {
    reps = 0;
    interval = 1;
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { ef, interval, reps, nextReview: Date.now() + interval * 864e5 };
}

export function isDue(srState) {
  if (!srState || !srState.nextReview) return true;
  return srState.nextReview <= Date.now();
}
