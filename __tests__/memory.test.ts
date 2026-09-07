import { buildWindow, estimateTokens, foldTurns, EMPTY_MEMORY } from '../src/agent/memory';
import type { ChatTurn } from '../src/agent/personas';

function turn(role: 'user' | 'assistant', content: string): ChatTurn {
  return { role, content };
}

describe('estimateTokens', () => {
  it('scales roughly with length', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });
});

describe('foldTurns', () => {
  it('returns prev when nothing to fold', () => {
    expect(foldTurns([], EMPTY_MEMORY)).toEqual(EMPTY_MEMORY);
  });

  it('captures the earlier topic and facts', () => {
    const mem = foldTurns(
      [
        turn('user', 'My name is Ada and my goal is to learn Spanish verbs.'),
        turn('assistant', 'Great, lets start with ser vs estar.'),
      ],
      EMPTY_MEMORY,
    );
    expect(mem.foldedTurns).toBe(2);
    expect(mem.note).toMatch(/Ada|Spanish/i);
  });

  it('caps the note length', () => {
    const mem = foldTurns([turn('user', 'x'.repeat(5000))], EMPTY_MEMORY);
    expect(mem.note.length).toBeLessThanOrEqual(500);
  });
});

describe('buildWindow', () => {
  it('keeps everything when it fits', () => {
    const all = [turn('user', 'hi'), turn('assistant', 'hello')];
    const { liveTurns, memory } = buildWindow(all, EMPTY_MEMORY);
    expect(liveTurns).toHaveLength(2);
    expect(memory.foldedTurns).toBe(0);
  });

  it('folds old turns once over budget', () => {
    const all: ChatTurn[] = [];
    for (let i = 0; i < 30; i++) {
      all.push(turn('user', `question number ${i} ` + 'x'.repeat(200)));
      all.push(turn('assistant', `answer number ${i} ` + 'y'.repeat(200)));
    }
    const { liveTurns, memory } = buildWindow(all, EMPTY_MEMORY, { maxTokens: 1200 });
    expect(liveTurns.length).toBeLessThan(all.length);
    expect(memory.foldedTurns).toBe(all.length - liveTurns.length);
    // newest turn always survives
    expect(liveTurns[liveTurns.length - 1]).toEqual(all[all.length - 1]);
  });
});
