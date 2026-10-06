import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'uniswap-v4',
  chapter: 'dapps',
  title: { en: 'Uniswap v4, and v2 / v3 / v4 compared', tr: 'Uniswap v4 ve v2 / v3 / v4 karşılaştırması' },
  summary: {
    en: 'Every pool moves into one contract, swaps settle as a single net payment, and pools can carry plug-in code called hooks.',
    tr: 'Bütün havuzlar tek bir sözleşmeye taşınır, takaslar tek bir net ödemeyle kapanır ve havuzlara "hook" denen eklenti kodları takılabilir.',
  },
  steps: ['singleton', 'flash', 'hooks', 'native-dynamic', 'compare', 'choose'],
};

export default meta;
