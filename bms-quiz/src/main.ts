import './style.css';
import { questions } from './questions';
import { createQuiz, isAnswerCorrect, scoreByBucket } from './quiz';
import type { AnswerRecord, Question } from './types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('アプリの起動に失敗しました。');
const root: HTMLDivElement = app;

type Size = 10 | 30 | 50;
let quiz: Question[] = [];
let current = 0;
let answers: AnswerRecord[] = [];
let selectedSize: Size = 10;

const bucketLabels: Record<string, string> = {
  'knowledge-choice': '知識 × 選択式',
  'knowledge-text': '知識 × 記述式',
  'reasoning-choice': '思考 × 選択式',
  'reasoning-text': '思考 × 記述式',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function shell(content: string) {
  root.innerHTML = `<main class="shell"><header class="site-header"><a href="#" class="brand" data-home>BMS <span>QUIZ</span></a><p>Culture &amp; Reasoning</p></header>${content}<footer>音源・映像は掲載せず、各問題の根拠リンクを案内します。</footer></main>`;
  root.querySelector('[data-home]')?.addEventListener('click', (event) => { event.preventDefault(); renderStart(); });
}

function renderStart() {
  quiz = [];
  current = 0;
  answers = [];
  shell(`
    <section class="hero">
      <p class="eyebrow">BMS CULTURE QUIZ</p>
      <h1>知っているだけでは<br><em>解けない。</em></h1>
      <p class="lead">BMSの楽曲・イベント・譜面・プレイ文化を横断。<br>知識と、資料から考える力を試すクイズです。</p>
      <div class="stats"><span>${questions.length}問の問題バンク</span><span>4つの出題分類</span><span>外部保存なし</span></div>
    </section>
    <section class="panel start-panel">
      <h2>問題数を選ぶ</h2>
      <p>問題は重複なしでランダム出題。4分類ができるだけ均等になるように選ばれます。</p>
      <div class="size-buttons">
        ${([10, 30, 50] as Size[]).map((size) => `<button class="size-button ${size === selectedSize ? 'selected' : ''}" data-size="${size}"><strong>${size}</strong><span>問</span><small>約${size === 10 ? 8 : size === 30 ? 22 : 36}分</small></button>`).join('')}
      </div>
      <button class="primary" data-start>この内容で始める <span>→</span></button>
      <p class="quiet">選択式と記述式、知識と考察をバランスよく出題します。</p>
    </section>`);
  root.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((button) => button.addEventListener('click', () => {
    selectedSize = Number(button.dataset.size) as Size;
    renderStart();
  }));
  root.querySelector('[data-start]')?.addEventListener('click', startQuiz);
}

function startQuiz() {
  quiz = createQuiz(questions, selectedSize);
  current = 0;
  answers = [];
  renderQuestion();
}

function renderQuestion() {
  const question = quiz[current];
  const type = `${question.kind === 'knowledge' ? '知識' : '思考'} × ${question.answerKind === 'choice' ? '選択式' : '記述式'}`;
  const answerControl = question.answerKind === 'choice'
    ? `<div class="choices">${question.choices?.map((choice, index) => `<label class="choice"><input type="radio" name="answer" value="${index}"><span class="choice-key">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(choice)}</span></label>`).join('')}</div>`
    : `<label class="text-answer"><span>答えを入力</span><input id="text-answer" autocomplete="off" placeholder="例：BMS Search" maxlength="100" /></label>`;
  shell(`
    <section class="quiz-head">
      <div><span class="eyebrow">QUESTION ${current + 1} / ${quiz.length}</span><div class="progress"><i style="width:${((current + 1) / quiz.length) * 100}%"></i></div></div>
      <span class="score-chip">${answers.filter((answer) => answer.correct).length} point</span>
    </section>
    <section class="question-card">
      <div class="question-meta"><span>${type}</span><span>${'◆'.repeat(question.difficulty)}${'◇'.repeat(3 - question.difficulty)}</span><span>${escapeHtml(question.category)}</span></div>
      <h1>${escapeHtml(question.prompt)}</h1>
      ${answerControl}
      <p class="error" aria-live="polite"></p>
      <button class="primary" data-submit>回答を確定 <span>→</span></button>
    </section>`);
  root.querySelector('[data-submit]')?.addEventListener('click', submitAnswer);
  root.querySelector<HTMLInputElement>('#text-answer')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') submitAnswer(); });
}

function submitAnswer() {
  const question = quiz[current];
  const answer = question.answerKind === 'choice'
    ? root.querySelector<HTMLInputElement>('input[name="answer"]:checked')?.value ?? ''
    : root.querySelector<HTMLInputElement>('#text-answer')?.value ?? '';
  if (!answer.trim()) {
    const error = root.querySelector('.error');
    if (error) error.textContent = '回答を選択・入力してください。';
    return;
  }
  answers.push({ question, answer, correct: isAnswerCorrect(question, answer) });
  current += 1;
  if (current === quiz.length) renderResults(); else renderQuestion();
}

function displayGivenAnswer(record: AnswerRecord) {
  if (record.question.answerKind === 'text') return record.answer;
  return record.question.choices?.[Number(record.answer)] ?? '未回答';
}

function renderResults() {
  const score = answers.filter((answer) => answer.correct).length;
  const byBucket = scoreByBucket(answers);
  shell(`
    <section class="results-hero">
      <p class="eyebrow">RESULT</p>
      <h1><strong>${score}</strong><span> / ${answers.length}</span></h1>
      <p>${score === answers.length ? 'Perfect. BMS文化の案内人です。' : score >= answers.length * .7 ? 'Good run. 解説で知識をつなげましょう。' : 'ここからが面白い。解説と出典をたどってみましょう。'}</p>
      <button class="secondary" data-copy>結果をコピー</button>
    </section>
    <section class="panel breakdown"><h2>分類ごとの結果</h2><div class="bucket-grid">${byBucket.map(({ bucket, correct, total }) => `<div><span>${bucketLabels[bucket]}</span><strong>${correct}<small> / ${total}</small></strong></div>`).join('')}</div></section>
    <section class="review"><h2>解説と出典</h2>${answers.map((record, index) => `<article class="review-card ${record.correct ? 'is-correct' : 'is-wrong'}"><div class="review-top"><span>Q${index + 1} · ${record.correct ? '正解' : '不正解'}</span><span>${record.question.kind === 'knowledge' ? '知識' : '思考'} × ${record.question.answerKind === 'choice' ? '選択' : '記述'}</span></div><h3>${escapeHtml(record.question.prompt)}</h3><dl><div><dt>あなたの回答</dt><dd>${escapeHtml(displayGivenAnswer(record))}</dd></div><div><dt>正答</dt><dd>${escapeHtml(record.question.displayAnswer)}</dd></div></dl><p>${escapeHtml(record.question.explanation)}</p><a href="${escapeHtml(record.question.source.url)}" target="_blank" rel="noopener noreferrer">根拠：${escapeHtml(record.question.source.label)} ↗</a></article>`).join('')}</section>
    <div class="again"><button class="primary" data-again>もう一度挑戦する <span>→</span></button></div>`);
  root.querySelector('[data-again]')?.addEventListener('click', renderStart);
  root.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const text = `BMS QUIZ 結果：${score} / ${answers.length} 点\n知識×選択 ${byBucket[0].correct}/${byBucket[0].total}｜知識×記述 ${byBucket[1].correct}/${byBucket[1].total}\n思考×選択 ${byBucket[2].correct}/${byBucket[2].total}｜思考×記述 ${byBucket[3].correct}/${byBucket[3].total}`;
    try { await navigator.clipboard.writeText(text); const button = root.querySelector<HTMLButtonElement>('[data-copy]'); if (button) button.textContent = 'コピーしました'; } catch { window.prompt('以下をコピーしてください。', text); }
  });
}

renderStart();
