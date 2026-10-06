import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'smart-contracts',
  chapter: 'dapps',
  title: { en: 'Smart contracts and the EVM', tr: '"Smart contract"\'lar ve "EVM"' },
  summary: {
    en: 'A program that lives at an address, keeps its own data and money, and runs the same way on every node.',
    tr: 'Bir adreste yaşayan, kendi verisini ve parasını tutan, her "node"\'da aynı şekilde çalışan bir program.',
  },
  steps: ['account', 'deploy', 'call', 'storage', 'evm', 'gas', 'reentrancy'],
};

export default meta;
