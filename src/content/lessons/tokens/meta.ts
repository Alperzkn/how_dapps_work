import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'tokens',
  chapter: 'dapps',
  title: { en: 'Tokens: ERC-20 and NFTs', tr: '"Token"\'lar: "ERC-20" ve "NFT"\'ler' },
  summary: {
    en: 'A token is not a coin in your wallet. It is a number in a contract\'s table, and a shared standard lets every app read it.',
    tr: 'Bir "token", cüzdanındaki bir madeni para değildir. Bir contract\'ın tablosundaki bir sayıdır ve ortak bir standart sayesinde her uygulama onu okuyabilir.',
  },
  steps: ['ledger', 'erc20', 'supply', 'approve', 'kinds', 'nft'],
};

export default meta;
