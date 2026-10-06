import type { LessonMeta } from '../../../types';

const meta: LessonMeta = {
  id: 'mev',
  chapter: 'defi',
  title: { en: 'MEV: who sees your swap first', tr: 'MEV: takasını ilk kim görüyor' },
  summary: {
    en: 'Your pending swap is public, and whoever orders the block can profit from it. See how a sandwich works, when it pays, and how to leave it no room.',
    tr: 'Bekleyen takasın herkese açıktır ve bloğu sıralayan bundan kazanç çıkarabilir. "Sandwich" saldırısının nasıl işlediğini, ne zaman kâr ettiğini ve ona nasıl yer bırakmayacağını gör.',
  },
  steps: ['mempool', 'ordering', 'backrun', 'sandwich', 'slippage', 'defences', 'pbs'],
};

export default meta;
