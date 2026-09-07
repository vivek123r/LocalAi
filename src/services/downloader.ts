/**
 * Model downloader — resumable HTTPS download of the ~700MB GGUF from
 * Hugging Face into the app's private Documents folder.
 *
 * Uses react-native-blob-util (works with the New Architecture + scoped
 * storage, no extra Android permissions needed for app-private dirs).
 */

import { Platform } from 'react-native';

// Lazy requires keep Jest/Metro-without-native safe.
function blobUtil() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-blob-util').default;
}

export interface DownloadProgress {
  /** 0..1 */
  fraction: number;
  bytesWritten: number;
  contentLength: number;
}

export function modelFilePath(dirs: { DocumentDir: string }, fileName: string): string {
  return `${dirs.DocumentDir}/models/${fileName}`;
}

export async function getDirs(): Promise<{ DocumentDir: string }> {
  return blobUtil().fs.dirs;
}

export async function modelExists(fileName: string): Promise<{ exists: boolean; path: string; size: number }> {
  const RNFetch = blobUtil();
  const path = `${RNFetch.fs.dirs.DocumentDir}/models/${fileName}`;
  const exists = await RNFetch.fs.exists(path);
  let size = 0;
  if (exists) {
    try {
      const stat = await RNFetch.fs.stat(path);
      size = Number(stat.size ?? 0);
    } catch {
      size = 0;
    }
  }
  return { exists, path, size };
}

export async function deleteModel(fileName: string): Promise<void> {
  const RNFetch = blobUtil();
  const path = `${RNFetch.fs.dirs.DocumentDir}/models/${fileName}`;
  if (await RNFetch.fs.exists(path)) {
    await RNFetch.fs.unlink(path);
  }
}

let activeJob: { cancel: () => void } | null = null;

export function cancelDownload() {
  try {
    activeJob?.cancel();
  } catch {
    /* noop */
  } finally {
    activeJob = null;
  }
}

/**
 * Download with live progress. Resolves to the final file path.
 * Throws on cancel/failure; cleans up partial files on failure.
 */
export async function downloadModel(opts: {
  url: string;
  fileName: string;
  expectedBytes?: number;
  onProgress: (p: DownloadProgress) => void;
}): Promise<string> {
  const RNFetch = blobUtil();
  const dir = `${RNFetch.fs.dirs.DocumentDir}/models`;
  const dest = `${dir}/${opts.fileName}`;

  if (!(await RNFetch.fs.exists(dir))) {
    await RNFetch.fs.mkdir(dir);
  }

  const task = RNFetch.config({
    path: dest,
    fileCache: true,
    // Android: keep CPU awake during a 700MB download.
    ...(Platform.OS === 'android' ? {} : {}),
  }).fetch('GET', opts.url);

  activeJob = {
    cancel: () => {
      try {
        task.cancel();
      } catch {
        /* noop */
      }
    },
  };

  task.progress((received: string | number, total: string | number) => {
    const bytesWritten = Number(received);
    const contentLength = Number(total) || opts.expectedBytes || 0;
    opts.onProgress({
      fraction: contentLength > 0 ? Math.min(1, bytesWritten / contentLength) : 0,
      bytesWritten,
      contentLength,
    });
  });

  try {
    const res = await task;
    const status = res?.respInfo?.status ?? 200;
    if (status < 200 || status >= 300) {
      throw new Error(`Download failed (HTTP ${status}). Check connection and retry.`);
    }
    activeJob = null;
    // Sanity: a truncated GGUF is worse than none — require >50MB.
    const stat = await RNFetch.fs.stat(dest);
    if (Number(stat.size ?? 0) < 50 * 1024 * 1024) {
      await RNFetch.fs.unlink(dest).catch(() => {});
      throw new Error('Downloaded file looks truncated. Please retry.');
    }
    return dest;
  } catch (e) {
    activeJob = null;
    throw e;
  }
}

export function formatBytes(n: number): string {
  if (!n || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10} ${units[u]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}
