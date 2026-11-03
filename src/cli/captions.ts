export type TimedWord = { text: string; startMs: number; endMs: number };
export type Caption = { text: string; startMs: number; endMs: number; words: TimedWord[] };

/** Group measured words without inventing or changing their timestamps. */
export function groupCaptions(input: unknown, maxWords = 6): Caption[] {
  if (!Number.isInteger(maxWords) || maxWords < 1 || maxWords > 30) throw new Error('max-words must be an integer from 1 to 30');
  if (!Array.isArray(input)) throw new Error('Expected an array of timed words');
  const words: TimedWord[] = input.map((item, i) => {
    if (!item || typeof item.text !== 'string' || !item.text.trim() || typeof item.startMs !== 'number' || !Number.isFinite(item.startMs) || typeof item.endMs !== 'number' || !Number.isFinite(item.endMs) || item.startMs < 0 || item.endMs <= item.startMs || (i > 0 && item.startMs < input[i - 1].endMs)) throw new Error(`Invalid timing at word ${i}`);
    return { text: item.text, startMs: item.startMs, endMs: item.endMs };
  });
  const result: Caption[] = [];
  let pending: TimedWord[] = [];
  const flush = () => { if (pending.length) { result.push({ text: pending.map(w => w.text).join(' '), startMs: pending[0].startMs, endMs: pending[pending.length - 1].endMs, words: pending }); pending = []; } };
  for (const word of words) {
    if (pending.length && word.startMs - pending[pending.length - 1].endMs > 700) flush();
    pending.push(word);
    if (pending.length >= maxWords || /[.!?।][”’"']?$/.test(word.text)) flush();
  }
  flush();
  return result;
}
