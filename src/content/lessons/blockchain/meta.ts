import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'blockchain',
  chapter: 'basics',
  title: { en: 'What is a blockchain?', tr: '"Blockchain" nedir?' },
  summary: {
    en: 'A shared record that everyone can check and nobody can quietly rewrite.',
    tr: 'Herkesin kontrol edebildiği, kimsenin gizlice değiştiremediği ortak bir kayıt.',
  },
  steps: ['ledger', 'blocks', 'fingerprint', 'tamper', 'history'],
};

export default meta;
