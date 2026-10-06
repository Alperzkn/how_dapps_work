import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'uniswap-v3',
  chapter: 'defi',
  title: { en: 'Uniswap v3', tr: 'Uniswap v3' },
  summary: {
    en: 'Liquidity providers choose a price range, so the same money gives far deeper markets where trading actually happens.',
    tr: 'Likidite sağlayanlar bir fiyat aralığı seçer; aynı para, alım satımın gerçekten yapıldığı yerde çok daha derin bir piyasa oluşturur.',
  },
  steps: ['idle', 'concentrated', 'ticks', 'crossing', 'fees-nft', 'fee-day', 'efficiency'],
};

export default meta;
