import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'layer2',
  chapter: 'l1',
  title: { en: 'Layer 2 and rollups', tr: '"Layer 2" ve "rollup"\'lar' },
  summary: {
    en: 'Run the transactions somewhere cheaper, then prove to Ethereum that you ran them correctly.',
    tr: 'İşlemleri daha ucuz bir yerde çalıştır, sonra doğru çalıştırdığını Ethereum\'a kanıtla.',
  },
  steps: ['scarce', 'rollup', 'sequencer', 'optimistic', 'zk', 'blobs', 'bridge'],
};

export default meta;
