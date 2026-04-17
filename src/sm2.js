/**
 * @file sm2.js
 * @module SM2
 * @description SM-2 spaced-repetition algorithm (Anki-style). Quality scale: 0 blackout … 5 perfect; App.jsx passes 4 on correct answers, 1 on incorrect.
 * @exports
 *   - sm2(item, quality): returns {ef, interval, reps, nextReview} given prior state + quality rating
 *   - isDue(srState): true if the item has no review state or its nextReview has passed
 * @depends (none)
 * @connects Called from App.jsx handlePick (update on answer) and startReview (gather due words).
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
