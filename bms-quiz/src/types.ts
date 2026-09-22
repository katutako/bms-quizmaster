export type KnowledgeKind = 'knowledge' | 'reasoning';
export type AnswerKind = 'choice' | 'text';

export interface Source {
  label: string;
  url: string;
}

export interface Question {
  id: string;
  kind: KnowledgeKind;
  answerKind: AnswerKind;
  difficulty: 1 | 2 | 3;
  category: string;
  prompt: string;
  choices?: string[];
  correctChoice?: number;
  acceptedAnswers?: string[];
  displayAnswer: string;
  explanation: string;
  source: Source;
}

export interface AnswerRecord {
  question: Question;
  answer: string;
  correct: boolean;
}
