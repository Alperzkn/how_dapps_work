import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'other-l1s',
  chapter: 'l1',
  title: { en: 'Other L1s', tr: 'Diğer "L1" zincirleri' },
  summary: {
    en: 'Faster and cheaper chains exist. Each one pays for its speed somewhere else.',
    tr: 'Daha hızlı ve daha ucuz zincirler var. Her biri bu hızın bedelini başka bir yerde ödüyor.',
  },
  steps: ['trilemma', 'solana', 'avalanche', 'cosmos', 'tradeoffs'],
};

export default meta;
