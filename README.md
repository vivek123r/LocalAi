# Verdant · Offline AI — React Native + llama.cpp (MiniCPM-1B)

A beautiful, 100% offline AI chat app. The phone downloads one quantized
GGUF model (~657MB MiniCPM-1B Q4) once, then chats forever with **zero
internet, zero API keys, zero tracking** — inference runs on-device via
[llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp) on CPU/GPU.

Warm paper-beige + deep pine-green design. Not another purple-gradient bot.

## ✨ Features

- **First-launch setup** — auto-detects missing model → one-tap download
  from Hugging Face with live % / MB / speed → auto-loads into memory → chat.
- **Real-time streaming** — tokens render word-by-word like ChatGPT.
- **Stop button, clear history, tok/s badge** in the header.
- **Agent system, not just a prompt:**
  - 4 personas (Everyday / Study / Code / Write) with tuned sampling params
  - Token-budgeted context window (`buildWindow`) — never overflows `n_ctx`
  - Rolling memory note folds old turns + extracts facts (`Remember:…`,
    names, goals) so long chats stay coherent
  - `AgentOrchestrator` isolates UI from native code → unit-tested with a
    fake engine (`__tests__/`)
- **3 switchable brains** (MiniCPM-1B Q4 default, Lite Q3, Qwen Tiny) with
  per-model download/delete in the Models sheet.
- **Cloud build** — `.github/workflows/build-apk.yml` compiles NDK + Hermes +
  Gradle on GitHub servers; you just download the APK on your phone.

## 💾 Disk-space truth (your question)

| Location | Takes space | Size |
|---|---|---|
| **Your PC** | Only these code files | ~5–15 MB |
| **GitHub cloud** | SDK, NDK, Gradle, compilers | Runs on their servers, deleted after |
| **Your phone** | App + MiniCPM model | ~60 MB app + ~657 MB model |

You skip locally: Android Studio (~4GB), SDK (~12GB), NDK (~6GB),
Gradle cache (~8GB), emulators (~15GB) — **~35–45GB saved.** ✅

## 🚀 Get the APK (no PC build tools needed)

1. Push this folder to a free GitHub repo (`main` branch).
2. Open the repo → **Actions** → *Build Android APK (cloud)* → wait ~10–20 min.
3. Download **`verdant-release-apk`** artifact **on your Android phone**.
4. Install (allow *Install unknown apps*), open **Verdant**.
5. Tap **Download MiniCPM 1B** on Wi-Fi → wait → chat offline forever. ✈️

> APKs are signed with the debug key by default (perfect for personal
> sideloading). For Play Store, add `MYAPP_UPLOAD_*` secrets — see
> `android/app/build.gradle`.

## 🧠 Models

| In-app name | File | Source |
|---|---|---|
| MiniCPM 1B · Q4 *(default)* | `MiniCPM5-1B-Q4_K_M.gguf` 657MB | `openbmb/MiniCPM5-1B-GGUF` |
| MiniCPM 1B · Lite Q3 | Q3_K_M ~700MB | `mradermacher/MiniCPM5-1B-SFT-GGUF` |
| Qwen 0.5B · Q8 *(tiny fallback)* | Q8_0 ~560MB | `Qwen/Qwen2.5-0.5B-Instruct-GGUF` |

Change URLs/sizes in `src/models.ts`. Files land in the app-private
`.../files/models/` dir (scoped storage — no storage permission needed).

## 🛠 Project layout

```
src/
  App.tsx                 boot: check model → setup | chat
  theme.ts                beige/paper + pine design tokens
  models.ts               GGUF catalog (URLs, sizes, ctx)
  agent/
    personas.ts           4 system prompts + sampling params
    memory.ts             token budget + rolling memory note (tested)
    orchestrator.ts       send/stream/stop/clear state machine (tested)
  services/
    llama.ts              llama.rn singleton (load/completion/stop/release)
    downloader.ts         resumable HF download w/ progress + verify
    storage.ts            AsyncStorage: history, model, persona
  components/             MessageBubble, ChatInput, ChatHeader,
                          PersonaChips, EmptyState, TypingDots
  screens/
    SetupScreen.tsx       first-launch download UX
    ChatScreen.tsx        chat + model sheet
android/                  RN 0.81 (Kotlin, New Arch, Hermes, largeHeap)
__tests__/                jest: memory + orchestrator
.github/workflows/       cloud APK build
```

## 🧑‍💻 Local dev (optional — not needed for the APK)

```bash
npm install          # pulls RN + llama.rn prebuilt jniLibs
npx tsc --noEmit
npx jest
npx react-native run-android   # needs local SDK/NDK — or just use the cloud build
```

## ⚙️ Tuning the brain

- `src/services/llama.ts` — `n_ctx` (4096 default; 2048 for 3GB-RAM phones),
  `n_gpu_layers` (raise for Hexagon/Metal offload).
- `src/agent/personas.ts` — temperatures, `maxTokens`, system prompts.
- `src/agent/memory.ts` — `maxTokens` budget, `keepRecent` window.

## 🔒 Privacy

After the model download, the app makes **zero network calls**. Airplane-mode
test it. Conversations live in AsyncStorage on-device; Clear chat wipes them.

## 📄 License

MIT — model weights follow their own licenses (MiniCPM: Apache-2.0-family
open license; Qwen: Apache-2.0 — check Hugging Face pages before
redistributing weights).
