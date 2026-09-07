/**
 * Conversation memory — keeps the prompt inside the model's context window.
 *
 * Strategy (all local, no network):
 *  1. Estimate tokens crudely (~4 chars/token — good enough for budgeting).
 *  2. Always keep the last `keepRecent` turns verbatim.
 *  3. Older turns collapse into a short rolling `memoryNote` (extractive:
 *     first user goal + key facts). A full abstractive summary would cost a
 *     second inference pass; we only do that opportunistically on idle.
 *  4. `buildWindow()` returns exactly what gets sent to the model.
 */

import type { ChatTurn } from './personas';

export interface MemoryState {
  /** Compressed note about everything older than the live window. */
  note: string;
  /** How many original turns have been folded into `note`. */
  foldedTurns: number;
}

export const EMPTY_MEMORY: MemoryState = { note: '', foldedTurns: 0 };

/** Rough token estimate — ~4 chars per token for English. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function turnsTokens(turns: ChatTurn[]): number {
  return turns.reduce((n, t) => n + estimateTokens(t.content) + 8, 0);
}

/**
 * Fold old turns into the memory note.
 * Keeps it deterministic + offline: pulls the user's stated goal and any
 * `Remember:` / `My name is` style facts, caps at ~400 chars.
 */
export function foldTurns(
  old: ChatTurn[],
  prev: MemoryState,
): MemoryState {
  if (old.length === 0) return prev;
  const facts: string[] = [];
  for (const t of old) {
    const m =
      t.content.match(/(?:remember|my name is|i am|i'm|i like|i prefer|my goal is)[^.\n]{0,120}/i)?.[0] ??
      '';
    if (m) facts.push(m.trim());
    if (facts.length >= 3) break;
  }
  const firstGoal = old.find(t => t.role === 'user')?.content.slice(0, 140) ?? '';
  const parts = [
    prev.note,
    firstGoal ? `Earlier topic: ${firstGoal}` : '',
    facts.length ? `Facts: ${facts.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500);
  return { note: parts, foldedTurns: prev.foldedTurns + old.length };
}

export interface WindowResult {
  liveTurns: ChatTurn[];
  memory: MemoryState;
}

/**
 * Budget the conversation to `maxTokens` (model ctx minus headroom for reply).
 * Pure function — easy to unit test.
 */
export function buildWindow(
  all: ChatTurn[],
  memory: MemoryState,
  opts: { maxTokens?: number; keepRecent?: number; systemTokens?: number } = {},
): WindowResult {
  const { maxTokens = 3200, keepRecent = 12, systemTokens = 450 } = opts;
  const budget = Math.max(512, maxTokens - systemTokens);
  // Fast path: everything fits.
  if (all.length <= keepRecent && turnsTokens(all) <= budget) {
    return { liveTurns: all, memory };
  }
  // Walk back from the newest until the budget is full.
  const live: ChatTurn[] = [];
  let used = 0;
  for (let i = all.length - 1; i >= 0 && live.length < keepRecent * 2; i--) {
    const t = all[i];
    const cost = estimateTokens(t.content) + 8;
    if (used + cost > budget && live.length >= 2) break;
    live.unshift(t);
    used += cost;
  }
  const folded = all.slice(0, all.length - live.length);
  return { liveTurns: live, memory: foldTurns(folded, memory) };
}
