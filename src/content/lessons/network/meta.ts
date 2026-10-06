import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'network',
  chapter: 'basics',
  title: { en: 'Nodes and the network', tr: '"Node"\'lar ve ağ' },
  summary: {
    en: 'How thousands of computers keep the same ledger with nobody in charge.',
    tr: 'Binlerce bilgisayar, başında kimse olmadan aynı defteri nasıl tutar?',
  },
  steps: ['copies', 'gossip', 'verify', 'reject', 'forks'],
};

export default meta;
