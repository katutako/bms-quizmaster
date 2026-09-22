import type { AnswerRecord, Question } from './types';

export const BUCKETS = [
  'knowledge-choice',
  'knowledge-text',
  'reasoning-choice',
  'reasoning-text',
] as const;

export type Bucket = typeof BUCKETS[number];

export function bucketOf(question: Question): Bucket {
  return `${question.kind}-${question.answerKind}` as Bucket;
}

export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/[\s　・_\-－—–]/g, '')
    .replace(/[！!？?。、,.「」『』（）()]/g, '');
}

export function isTextAnswerCorrect(answer: string, accepted: string[] = []): boolean {
  const normalized = normalizeAnswer(answer);
  return normalized.length > 0 && accepted.some((candidate) => normalizeAnswer(candidate) === normalized);
}

export function isAnswerCorrect(question: Question, answer: string): boolean {
  if (question.answerKind === 'choice') return Number(answer) === question.correctChoice;
  return isTextAnswerCorrect(answer, question.acceptedAnswers);
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** The extra slots rotate by a random start point, so no one bucket always gets them. */
export function createQuiz(questions: Question[], size: 10 | 30 | 50): Question[] {
  const grouped = new Map<Bucket, Question[]>(BUCKETS.map((bucket) => [bucket, []]));
  questions.forEach((question) => grouped.get(bucketOf(question))?.push(question));
  const base = Math.floor(size / BUCKETS.length);
  const extra = size % BUCKETS.length;
  const order = shuffled([...BUCKETS]);
  const picked: Question[] = [];

  for (let index = 0; index < BUCKETS.length; index += 1) {
    const count = base + (index < extra ? 1 : 0);
    const candidates = shuffled(grouped.get(order[index]) ?? []);
    if (candidates.length < count) throw new Error(`${order[index]} の問題数が不足しています。`);
    picked.push(...candidates.slice(0, count));
  }
  return shuffled(picked);
}

export function scoreByBucket(records: AnswerRecord[]) {
  return BUCKETS.map((bucket) => {
    const items = records.filter((record) => bucketOf(record.question) === bucket);
    return { bucket, correct: items.filter((item) => item.correct).length, total: items.length };
  });
}
