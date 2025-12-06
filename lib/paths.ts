import path from 'path';

const DATA_ROOT = process.env.DATA_ROOT || '/data';
const QUESTION_BANK_FILE = process.env.QUESTION_BANK_FILE || 'question-bank.pdf';

export function getQuestionBankStoragePath() {
  return path.resolve(process.env.QUESTION_BANK_PATH || path.join(DATA_ROOT, QUESTION_BANK_FILE));
}

export function getQuestionBankFallbackPath() {
  return path.resolve(process.cwd(), 'resources/hr-interview-question-bank.pdf');
}

export function getQuestionBankFilename() {
  return process.env.QUESTION_BANK_FILENAME || 'HR-Interview-Question-Bank.pdf';
}