import { describe, expect, it } from 'vitest';
import { questions } from '../src/questions';
import { BUCKETS, bucketOf, createQuiz, isTextAnswerCorrect } from '../src/quiz';

describe('問題バンク', () => {
  it('120問以上あり、4分類が各30問以上ある', () => {
    expect(questions.length).toBeGreaterThanOrEqual(120);
    BUCKETS.forEach((bucket) => expect(questions.filter((question) => bucketOf(question) === bucket)).toHaveLength(30));
  });

  it('全問題に必須データと出典URLがある', () => {
    questions.forEach((question) => {
      expect(question.prompt).not.toBe('');
      expect(question.explanation).not.toBe('');
      expect(question.source.url).toMatch(/^https?:\/\//);
      if (question.answerKind === 'choice') expect(question.choices?.[question.correctChoice ?? -1]).toBeTruthy();
      else expect(question.acceptedAnswers?.length).toBeGreaterThan(0);
    });
  });
});

describe('出題', () => {
  ([10, 30, 50] as const).forEach((size) => it(`${size}問では重複がなく分類差が1以下`, () => {
    const quiz = createQuiz(questions, size);
    expect(new Set(quiz.map((question) => question.id)).size).toBe(size);
    const counts = BUCKETS.map((bucket) => quiz.filter((question) => bucketOf(question) === bucket).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  }));
});

describe('記述式の採点', () => {
  const accepted = ['BMS Search', 'BMSサーチ'];
  it('表記ゆれを許容する', () => expect(isTextAnswerCorrect('ｂｍｓ　ｓｅａｒｃｈ', accepted)).toBe(true));
  it('不正答と空欄を弾く', () => {
    expect(isTextAnswerCorrect('BMS Player', accepted)).toBe(false);
    expect(isTextAnswerCorrect('', accepted)).toBe(false);
  });
});
