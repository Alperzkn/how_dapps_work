import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'transactions',
  chapter: 'basics',
  title: { en: 'Transactions and wallets', tr: '"Transaction" ve "wallet"' },
  summary: {
    en: 'How a payment is signed, sent, queued and written into a block.',
    tr: 'Bir ödeme nasıl imzalanır, ağa gönderilir, sırada bekler ve bir "block" içine yazılır?',
  },
  steps: ['keys', 'sign', 'broadcast', 'mempool', 'included', 'confirmations'],
};

export default meta;
