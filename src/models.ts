/**
 * Model catalog — GGUF builds that run on-device via llama.rn / llama.cpp.
 *
 * Default is MiniCPM-1B class (~700MB Q4_K_M), matching the requested
 * first-launch experience. Alternatives are smaller fallbacks for 3-4GB RAM phones.
 */

export interface ModelInfo {
  id: string;
  label: string;
  shortLabel: string;
  fileName: string;
  /** Full HTTPS URL to the .gguf on Hugging Face */
  url: string;
  sizeBytes: number;
  sizeLabel: string;
  quant: string;
  context: number;
  description: string;
  recommended?: boolean;
}

export const MODELS: ModelInfo[] = [
  {
    id: 'minicpm-1b-q4',
    label: 'MiniCPM 1B · Q4',
    shortLabel: 'MiniCPM 1B',
    fileName: 'minicpm-1b-Q4_K_M.gguf',
    // openbmb MiniCPM5-1B GGUF — Q4_K_M ≈ 657MB. Best quality/size for phones.
    url: 'https://huggingface.co/openbmb/MiniCPM5-1B-GGUF/resolve/main/MiniCPM5-1B-Q4_K_M.gguf',
    sizeBytes: 657 * 1024 * 1024,
    sizeLabel: '657 MB',
    quant: 'Q4_K_M',
    context: 4096,
    description:
      'Default brain. Balanced 1B model — good reasoning for its size, fast on modern phone CPUs.',
    recommended: true,
  },
  {
    id: 'minicpm-1b-q3',
    label: 'MiniCPM 1B · Lite Q3',
    shortLabel: 'MiniCPM Lite',
    fileName: 'minicpm-1b-Q3_K_M.gguf',
    url: 'https://huggingface.co/mradermacher/MiniCPM5-1B-SFT-GGUF/resolve/main/MiniCPM5-1B-SFT.Q3_K_M.gguf',
    sizeBytes: 700 * 1024 * 1024,
    sizeLabel: '~700 MB',
    quant: 'Q3_K_M',
    context: 4096,
    description:
      'Smaller quant fallback for 3–4 GB RAM phones. Slightly less precise, noticeably faster to load.',
  },
  {
    id: 'qwen-05b-q8',
    label: 'Qwen 0.5B · Q8',
    shortLabel: 'Qwen Tiny',
    fileName: 'qwen2.5-0.5b-Q8_0.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q8_0.gguf',
    sizeBytes: 560 * 1024 * 1024,
    sizeLabel: '~560 MB',
    quant: 'Q8_0',
    context: 4096,
    description:
      'Ultra-light emergency fallback. Smallest download, runs on almost anything, weaker reasoning.',
  },
];

export const DEFAULT_MODEL = MODELS[0];

export function getModelById(id: string): ModelInfo {
  return MODELS.find(m => m.id === id) ?? DEFAULT_MODEL;
}
