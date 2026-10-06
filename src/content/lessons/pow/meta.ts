import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'pow',
  chapter: 'consensus',
  title: { en: 'Proof of Work', tr: '"Proof of Work"' },
  summary: {
    en: 'A lottery where every ticket costs electricity decides who writes the next block.',
    tr: 'Sıradaki "block"\'u kimin yazacağına, her bileti elektrikle ödenen bir çekiliş karar verir.',
  },
  steps: ['who', 'puzzle', 'race', 'broadcast', 'retarget', 'attack'],
};

export default meta;
