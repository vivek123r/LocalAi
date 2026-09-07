/**
 * Verdant — 100% offline AI chat.
 * Root: first-launch model check → setup (download) → chat (llama.cpp).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AgentOrchestrator } from './agent/orchestrator';
import { DEFAULT_MODEL, MODELS, getModelById } from './models';
import { llamaEngine } from './services/llama';
import {
  cancelDownload,
  downloadModel,
  modelExists,
  type DownloadProgress,
} from './services/downloader';
import { loadModelId, saveModelId } from './services/storage';
import { palette } from './theme';
import { SetupScreen } from './screens/SetupScreen';
import { ChatScreen, ModelRow } from './screens/ChatScreen';

type Boot = 'checking' | 'setup' | 'chat';
type Phase = 'idle' | 'downloading' | 'verifying' | 'loading' | 'error';

const MIN_VALID_BYTES = 50 * 1024 * 1024;

export default function App() {
  const orchestrator = useMemo(() => new AgentOrchestrator(), []);
  const [boot, setBoot] = useState<Boot>('checking');
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL.id);
  const [modelPath, setModelPath] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<DownloadProgress>({ fraction: 0, bytesWritten: 0, contentLength: 0 });
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastTick = useRef({ t: 0, bytes: 0 });

  const checkStored = useCallback(async () => {
    setBoot('checking');
    const savedId = (await loadModelId()) ?? DEFAULT_MODEL.id;
    const info = getModelById(savedId);
    setModelId(info.id);
    try {
      const st = await modelExists(info.fileName);
      if (st.exists && st.size > MIN_VALID_BYTES) {
        setModelPath(st.path);
        setBoot('chat');
        return;
      }
    } catch {
      /* fall through to setup */
    }
    setProgress({ fraction: 0, bytesWritten: 0, contentLength: info.sizeBytes });
    setPhase('idle');
    setBoot('setup');
  }, []);

  useEffect(() => {
    checkStored();
  }, [checkStored]);

  const startDownload = useCallback(async () => {
    const info = getModelById(modelId);
    setError(null);
    setPhase('downloading');
    setProgress({ fraction: 0, bytesWritten: 0, contentLength: info.sizeBytes });
    lastTick.current = { t: Date.now(), bytes: 0 };
    try {
      const dest = await downloadModel({
        url: info.url,
        fileName: info.fileName,
        expectedBytes: info.sizeBytes,
        onProgress: p => {
          setProgress(p);
          const now = Date.now();
          const dt = (now - lastTick.current.t) / 1000;
          if (dt >= 0.5) {
            setSpeed(Math.max(0, Math.round((p.bytesWritten - lastTick.current.bytes) / dt)));
            lastTick.current = { t: now, bytes: p.bytesWritten };
          }
        },
      });
      setPhase('loading');
      // Small beat so the UI can paint "Loading…" before the heavy mmap.
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 350);
      });
      orchestrator.attachEngine(llamaEngine as any);
      await llamaEngine.load({ modelPath: dest });
      await saveModelId(info.id);
      setModelPath(dest);
      setPhase('idle');
      setBoot('chat');
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/cancel/i.test(msg)) {
        setPhase('idle');
        setError(null);
      } else {
        setPhase('error');
        setError(msg.slice(0, 220));
      }
    }
  }, [modelId, orchestrator]);

  const cancel = useCallback(() => {
    cancelDownload();
    setPhase('idle');
    setError(null);
  }, []);

  const needModel = useCallback(() => {
    setPhase('idle');
    setError(null);
    setBoot('setup');
  }, []);

  const switchModel = useCallback(
    async (id: string) => {
      const info = getModelById(id);
      setModelId(id);
      await saveModelId(id);
      await llamaEngine.release().catch(() => {});
      try {
        const st = await modelExists(info.fileName);
        if (st.exists && st.size > MIN_VALID_BYTES) {
          setModelPath(st.path);
          setBoot('chat');
        } else {
          setProgress({ fraction: 0, bytesWritten: 0, contentLength: info.sizeBytes });
          setPhase('idle');
          setError(null);
          setBoot('setup');
        }
      } catch {
        setBoot('setup');
      }
    },
    [],
  );

  const model = getModelById(modelId);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <View style={styles.root}>
        {boot === 'checking' && (
          <View style={styles.checking}>
            <View style={styles.mark}>
              <View style={styles.sprout} />
            </View>
            <Text style={styles.checkingTitle}>Verdant</Text>
            <ActivityIndicator color={palette.pine} style={{ marginTop: 14 }} />
            <Text style={styles.checkingSub}>Checking for your offline brain…</Text>
          </View>
        )}

        {boot === 'setup' && (
          <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <SetupScreen
                model={model}
                phase={phase}
                progress={progress}
                speed={speed}
                error={error}
                onDownload={startDownload}
                onCancel={cancel}
                onRetry={startDownload}
                onPickModel={() => setPickerOpen(true)}
              />
            </ScrollView>
          </SafeAreaView>
        )}

        {boot === 'chat' && !!modelPath && (
          <ChatScreen
            modelId={modelId}
            modelPath={modelPath}
            orchestrator={orchestrator}
            onNeedModel={needModel}
            onSwitchModel={switchModel}
          />
        )}

        <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.scrim} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.sheetTitle}>Pick your brain</Text>
              <Text style={styles.sheetSub}>Bigger = smarter. Smaller = faster on old phones.</Text>
              {MODELS.map(m => (
                <ModelRow
                  key={m.id}
                  name={`${m.label} · ${m.sizeLabel}`}
                  meta={m.description}
                  active={m.id === modelId}
                  onPress={() => {
                    setPickerOpen(false);
                    switchModel(m.id);
                  }}
                />
              ))}
              <Pressable style={styles.doneBtn} onPress={() => setPickerOpen(false)}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  checking: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mark: { width: 64, height: 64, borderRadius: 32, backgroundColor: palette.pine, alignItems: 'center', justifyContent: 'center' },
  sprout: { width: 20, height: 30, borderRadius: 12, backgroundColor: palette.lime, transform: [{ rotate: '24deg' }] },
  checkingTitle: { fontFamily: 'Georgia', fontSize: 32, fontWeight: '700', color: palette.pineDeep, marginTop: 14 },
  checkingSub: { marginTop: 8, fontSize: 13, color: palette.muted },
  scrim: { flex: 1, backgroundColor: 'rgba(26,46,40,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30 },
  sheetTitle: { fontFamily: 'Georgia', fontSize: 21, fontWeight: '700', color: palette.pineDeep },
  sheetSub: { marginTop: 4, fontSize: 12.5, color: palette.muted, marginBottom: 8 },
  doneBtn: { marginTop: 14, backgroundColor: palette.pine, borderRadius: 14, padding: 14, alignItems: 'center' },
  doneText: { color: '#FFFDF6', fontWeight: '800' },
});
