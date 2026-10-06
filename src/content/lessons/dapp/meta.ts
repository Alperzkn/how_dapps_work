import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'dapp',
  chapter: 'dapps',
  title: { en: 'How a dapp works', tr: 'Bir "dapp" nasıl çalışır?' },
  summary: {
    en: 'A website, a wallet, a node and a contract: follow one click from the button to the blockchain and back.',
    tr: 'Bir web sitesi, bir cüzdan, bir düğüm ve bir kontrat: tek bir tıklamayı düğmeden zincire, zincirden ekrana kadar izle.',
  },
  steps: ['compare', 'frontend', 'wallet', 'rpc', 'contract', 'events'],
};

export default meta;
