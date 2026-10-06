import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'pos',
  chapter: 'consensus',
  title: { en: 'Proof of Stake', tr: '"Proof of Stake"' },
  summary: {
    en: 'Block makers put up a deposit instead of burning electricity, and lose it if they cheat.',
    tr: '"Block" üretenler elektrik yakmak yerine teminat yatırır; hile yaparlarsa teminatı kaybederler.',
  },
  steps: ['stake', 'proposer', 'attest', 'finality', 'slashing', 'compare'],
};

export default meta;
