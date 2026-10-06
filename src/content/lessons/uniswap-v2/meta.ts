import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'uniswap-v2',
  chapter: 'defi',
  title: { en: 'Uniswap v2', tr: 'Uniswap v2' },
  summary: {
    en: 'An exchange with no order book: two tokens in a pool and one formula that sets the price.',
    tr: 'Emir defteri olmayan bir borsa: bir havuzda iki token ve fiyatı belirleyen tek bir formül.',
  },
  steps: ['orderbook', 'pool', 'curve', 'swap', 'fees', 'risks'],
};

export default meta;
