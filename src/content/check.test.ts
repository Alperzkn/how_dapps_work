import { expect, it } from 'vitest';
import { checkContent } from './check';

it('lesson content and glossary are complete and consistent', () => {
  expect(checkContent()).toEqual([]);
});
