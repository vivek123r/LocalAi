/**
 * LlamaEngine — thin, crash-safe wrapper around llama.rn (llama.cpp).
 *
 * - Singleton: one context at a time (phone RAM is precious).
 * - initLlama with phone-sane defaults: n_ctx 4096, GPU offload where free.
 * - completion() streams tokens via llama.rn's callback.
 * - stopCompletion() + release() for lifecycle safety.
 *
 * llama.rn is an optional native module: the JS bundle imports it lazily so
 * Jest / Metro (without a native build) never crash on `require`.
 */

import type { EngineCompletionParams } from '../agent/orchestrator';

// Lazy native binding — avoids hard crash when running in Jest or web preview.
let RnLlama: any = null;
function native() {
  if (!RnLlama) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RnLlama = require('llama.rn');
  }
  return RnLlama;
}

export interface LoadOptions {
  modelPath: string;
  /** arrière — leave headroom: 4096 ctx is the sweet spot for 1B on 4-6GB phones */
  nCtx?: number;
  nGpuLayers?: number;
}

class LlamaEngine {
  private context: any = null;
  private loadedPath: string | null = null;
  private loading: Promise<void> | null = null;

  get isLoaded(): boolean {
    return !!this.context;
  }

  get path(): string | null {
    return this.loadedPath;
  }

  /** Load (or re-use) the GGUF at `modelPath`. Safe to call repeatedly. */
  load(opts: LoadOptions): Promise<void> {
    if (this.context && this.loadedPath === opts.modelPath) return Promise.resolve();
    if (this.loading && this.loadedPath === opts.modelPath) return this.loading;
    this.loadedPath = opts.modelPath;
    this.loading = (async () => {
      // Drop any previous context before allocating a new one.
      await this.release();
      const { initLlama } = native();
      this.context = await initLlama({
        model: opts.modelPath,
        use_mlock: true,
        n_ctx: opts.nCtx ?? 4096,
        // 0 = CPU only (safest). llama.rn auto-uses Metal/Hexagon where available
        // when > 0; we default to 1 layer probe and fall back silently.
        n_gpu_layers: opts.nGpuLayers ?? 1,
        embedding: false,
      });
    })();
    return this.loading;
  }

  async completion(
    params: EngineCompletionParams,
    onToken: (tok: string) => void,
  ): Promise<{ text: string }> {
    if (!this.context) throw new Error('Model not loaded.');
    // llama.rn supports both `completion(messages, ...)` chat form and raw prompt.
    const res = await this.context.completion(
      {
        messages: params.messages,
        n_predict: params.n_predict ?? 512,
        temperature: params.temperature ?? 0.7,
        top_p: params.top_p ?? 0.9,
        repeat_penalty: params.repeat_penalty ?? 1.1,
        stop: params.stop,
        emit_partial_completion: true,
      },
      (data: any) => {
        const tok: string = data?.token ?? '';
        if (tok) onToken(tok);
      },
    );
    return { text: String(res?.text ?? '') };
  }

  async stopCompletion(): Promise<void> {
    try {
      await this.context?.stopCompletion?.();
    } catch {
      // ignore — engine may be idle
    }
  }

  async release(): Promise<void> {
    try {
      if (this.context?.release) await this.context.release();
      else {
        try {
          await native()?.releaseAllLlama?.();
        } catch {
          /* noop */
        }
      }
    } finally {
      this.context = null;
    }
  }
}

export const llamaEngine = new LlamaEngine();
