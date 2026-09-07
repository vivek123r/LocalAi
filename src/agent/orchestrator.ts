/**
 * AgentOrchestrator — the single place that turns UI events into model calls.
 *
 * Responsibilities:
 *  - own the conversation (turns + memory note)
 *  - apply the active persona (system prompt + sampling params)
 *  - stream tokens to the UI, compute tok/s, support stop()
 *  - collapse old history via buildWindow() so we never overflow n_ctx
 *
 * The actual llama.cpp binding lives in services/llama.ts; this class never
 * touches native code directly, which keeps it testable with a fake engine.
 */

import { PERSONAS, buildMessages, type ChatTurn, type PersonaMode } from './personas';
import { buildWindow, EMPTY_MEMORY, type MemoryState } from './memory';

export interface EngineCompletionParams {
  messages: Array<{ role: string; content: string }>;
  n_predict: number;
  temperature: number;
  top_p: number;
  repeat_penalty: number;
  stop?: string[];
}

export interface Engine {
  completion(params: EngineCompletionParams, onToken: (tok: string) => void): Promise<{ text: string }>;
  stopCompletion(): Promise<void> | void;
}

export interface StreamCallbacks {
  onToken?: (partial: string) => void;
  onStats?: (tokensPerSec: number, totalTokens: number) => void;
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tokPerSec?: number;
  stopped?: boolean;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export class AgentOrchestrator {
  private engine: Engine | null = null;
  private turns: ChatTurn[] = [];
  private memory: MemoryState = { ...EMPTY_MEMORY };
  private mode: PersonaMode = 'general';
  private generating = false;
  private stopRequested = false;
  private listeners = new Set<(msgs: UIMessage[]) => void>();
  private ui: UIMessage[] = [];

  attachEngine(engine: Engine) {
    this.engine = engine;
  }

  setMode(mode: PersonaMode) {
    this.mode = mode;
  }

  getMode(): PersonaMode {
    return this.mode;
  }

  get isGenerating(): boolean {
    return this.generating;
  }

  subscribe(fn: (msgs: UIMessage[]) => void): () => void {
    this.listeners.add(fn);
    fn([...this.ui]);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const snap = [...this.ui];
    this.listeners.forEach(fn => fn(snap));
  }

  /** Restore a persisted conversation (plain turns, no memory note needed). */
  restore(messages: UIMessage[]) {
    this.ui = messages;
    this.turns = messages
      .filter(m => m.text.trim().length > 0)
      .map(m => ({ role: m.role, content: m.text }));
    this.emit();
  }

  snapshot(): UIMessage[] {
    return [...this.ui];
  }

  clear() {
    this.turns = [];
    this.ui = [];
    this.memory = { ...EMPTY_MEMORY };
    this.emit();
  }

  removeMessage(id: string) {
    this.ui = this.ui.filter(m => m.id !== id);
    this.turns = this.ui.map(m => ({ role: m.role, content: m.text }));
    this.emit();
  }

  async stop() {
    this.stopRequested = true;
    try {
      await this.engine?.stopCompletion();
    } catch {
      // engine may already be idle — safe to ignore
    }
  }

  async send(userText: string, cb: StreamCallbacks = {}): Promise<void> {
    const text = userText.trim();
    if (!text || this.generating) return;
    if (!this.engine) throw new Error('Model engine not attached yet.');

    const persona = PERSONAS[this.mode];
    this.generating = true;
    this.stopRequested = false;

    const userMsg: UIMessage = { id: uid(), role: 'user', text };
    this.ui = [...this.ui, userMsg];
    this.turns = [...this.turns, { role: 'user', content: text }];

    const assistantId = uid();
    let partial = '';
    this.ui = [...this.ui, { id: assistantId, role: 'assistant', text: '' }];
    this.emit();

    const startedAt = Date.now();
    let tokenCount = 0;

    try {
      const { liveTurns, memory } = buildWindow(this.turns, this.memory, {
        maxTokens: 3200,
      });
      this.memory = memory;
      const messages = buildMessages(persona, liveTurns, memory.note || undefined);

      const result = await this.engine.completion(
        {
          messages,
          n_predict: persona.maxTokens,
          temperature: persona.temperature,
          top_p: persona.topP,
          repeat_penalty: persona.repeatPenalty,
          stop: ['<|im_end|>', '<|endoftext|>', 'User:', '\nUser:'],
        },
        tok => {
          tokenCount += 1;
          partial += tok;
          this.ui = this.ui.map(m =>
            m.id === assistantId ? { ...m, text: partial } : m,
          );
          this.emit();
          cb.onToken?.(partial);
        },
      );

      const finalText = (result?.text ?? partial).trim() || 'Hmm — I lost that thought. Try asking again?';
      const elapsedSec = Math.max(0.25, (Date.now() - startedAt) / 1000);
      const tps = Math.round((tokenCount / elapsedSec) * 10) / 10;

      this.ui = this.ui.map(m =>
        m.id === assistantId
          ? { ...m, text: finalText, tokPerSec: tps, stopped: this.stopRequested }
          : m,
      );
      this.turns = [...this.turns, { role: 'assistant', content: finalText }];
      this.emit();
      cb.onStats?.(tps, tokenCount);
    } catch (e: any) {
      const msg =
        this.stopRequested || /cancel|stop|abort/i.test(String(e?.message ?? ''))
          ? partial.trim() + (partial.trim() ? '\n\n— stopped.' : 'Stopped before I could start typing.')
          : `Something hiccuped on-device (${String(e?.message ?? e).slice(0, 120)}). Your chat is safe — try again.`;
      this.ui = this.ui.map(m =>
        m.id === assistantId ? { ...m, text: msg, stopped: true } : m,
      );
      if (partial.trim()) {
        this.turns = [...this.turns, { role: 'assistant', content: msg }];
      }
      this.emit();
    } finally {
      this.generating = false;
    }
  }
}
