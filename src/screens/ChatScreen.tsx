import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgentOrchestrator, type UIMessage } from '../agent/orchestrator';
import { PERSONAS, type PersonaMode } from '../agent/personas';
import { MODELS, getModelById } from '../models';
import { llamaEngine } from '../services/llama';
import { deleteModel, modelExists } from '../services/downloader';
import { clearChat, loadChat, loadPersona, saveChat, savePersona } from '../services/storage';
import { palette } from '../theme';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { EmptyState } from '../components/EmptyState';
import { MessageBubble } from '../components/MessageBubble';
import { PersonaChips } from '../components/PersonaChips';
import { TypingDots } from '../components/TypingDots';

interface Props {
  modelId: string;
  modelPath: string;
  orchestrator: AgentOrchestrator;
  onNeedModel: () => void;
  onSwitchModel: (id: string) => void;
}

export function ChatScreen({ modelId, modelPath, orchestrator, onNeedModel, onSwitchModel }: Props) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [persona, setPersona] = useState<PersonaMode>('general');
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [lastTps, setLastTps] = useState<number | null>(null);
  const [modelsOpen, setModelsOpen] = useState(false);
  // True for the whole generation (not just before the first token) so the
  // stop button stays visible until streaming actually finishes.
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Subscribe to the orchestrator + restore history + attach engine.
  useEffect(() => {
    const unsub = orchestrator.subscribe(ms => {
      setMessages(ms);
      saveChat(ms);
      const last = [...ms].reverse().find(m => m.role === 'assistant' && m.tokPerSec);
      if (last?.tokPerSec) setLastTps(last.tokPerSec);
    });
    (async () => {
      const [saved, savedPersona] = await Promise.all([loadChat(), loadPersona()]);
      if (saved.length) orchestrator.restore(saved);
      orchestrator.setMode(savedPersona);
      setPersona(savedPersona);
      try {
        orchestrator.attachEngine(llamaEngine as any);
        await llamaEngine.load({ modelPath });
        setEngineReady(true);
      } catch (e: any) {
        setEngineError(String(e?.message ?? e));
      }
    })();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath]);

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, [messages.length, messages[messages.length - 1]?.text?.length]);

  const send = useCallback(
    (text: string) => {
      if (!engineReady || busy) {
        if (!engineReady) {
          Alert.alert('Model still waking up', 'Give it a few seconds to load into memory.');
        }
        return;
      }
      setBusy(true);
      orchestrator
        .send(text)
        .catch(() => {})
        .finally(() => setBusy(false));
    },
    [engineReady, busy, orchestrator],
  );

  const stop = useCallback(() => {
    orchestrator.stop().finally(() => setBusy(false));
  }, [orchestrator]);

  const doClear = useCallback(() => {
    Alert.alert('Clear conversation?', 'This erases the on-device history.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          orchestrator.clear();
          clearChat();
        },
      },
    ]);
  }, [orchestrator]);

  const pickPersona = useCallback(
    (m: PersonaMode) => {
      setPersona(m);
      orchestrator.setMode(m);
      savePersona(m);
    },
    [orchestrator],
  );

  const removeModel = useCallback(() => {
    Alert.alert(
      'Delete model file?',
      'Frees ~700MB. You can re-download anytime on Wi-Fi.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const info = getModelById(modelId);
            await llamaEngine.release().catch(() => {});
            await deleteModel(info.fileName).catch(() => {});
            onNeedModel();
          },
        },
      ],
    );
  }, [modelId, onNeedModel]);

  const awaitingFirstToken =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].text === '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ChatHeader
          tokPerSec={lastTps}
          ready={engineReady}
          onClear={doClear}
          onModels={() => setModelsOpen(true)}
        />
        <PersonaChips active={persona} onPick={pickPersona} />

        {engineError ? (
          <View style={styles.errWrap}>
            <Text style={styles.errTitle}>The model wouldn't wake up.</Text>
            <Text style={styles.errBody}>{engineError}</Text>
            <Pressable style={styles.errBtn} onPress={onNeedModel}>
              <Text style={styles.errBtnText}>Back to setup</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            ListEmptyComponent={
              engineReady ? (
                <EmptyState />
              ) : (
                <View style={styles.waking}>
                  <TypingDots />
                </View>
              )
            }
            ListFooterComponent={awaitingFirstToken ? <TypingDots /> : <View style={{ height: 8 }} />}
            contentContainerStyle={messages.length === 0 ? undefined : styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.personaNote}>
          <Text style={styles.personaNoteText}>
            {PERSONAS[persona].label} mode · {PERSONAS[persona].tagline} · context kept on-device
          </Text>
        </View>
        <ChatInput generating={busy} onSend={send} onStop={stop} />
      </KeyboardAvoidingView>

      {/* Model switcher sheet */}
      <Modal visible={modelsOpen} transparent animationType="slide" onRequestClose={() => setModelsOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setModelsOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Brains on this phone</Text>
            <Text style={styles.sheetSub}>Switch brains or free space. Downloads happen on Wi-Fi.</Text>
            {MODELS.map(m => (
              <ModelRow
                key={m.id}
                name={m.label}
                meta={`${m.quant} · ${m.sizeLabel}`}
                active={m.id === modelId}
                onPress={() => {
                  setModelsOpen(false);
                  if (m.id !== modelId) onSwitchModel(m.id);
                }}
              />
            ))}
            <Pressable style={styles.dangerBtn} onPress={() => { setModelsOpen(false); removeModel(); }}>
              <Text style={styles.dangerText}>Delete current model file</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={() => setModelsOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export function ModelRow({ name, meta, active, onPress }: { name: string; meta: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, active && styles.rowActive]}>
      <View>
        <Text style={[styles.rowName, active && styles.rowNameActive]}>{name}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export async function checkModelReady(id: string) {
  const info = getModelById(id);
  return modelExists(info.fileName);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  flex: { flex: 1 },
  list: { paddingVertical: 10, paddingBottom: 6 },
  waking: { paddingTop: 30 },
  personaNote: { alignItems: 'center', paddingBottom: 2 },
  personaNoteText: { fontSize: 11, color: palette.faint },
  errWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  errTitle: { fontFamily: 'Georgia', fontSize: 22, color: palette.pineDeep, fontWeight: '700' },
  errBody: { marginTop: 8, fontSize: 13.5, color: palette.danger, lineHeight: 19 },
  errBtn: { marginTop: 16, backgroundColor: palette.pine, borderRadius: 14, padding: 14, alignItems: 'center' },
  errBtnText: { color: '#FFFDF6', fontWeight: '800' },
  scrim: { flex: 1, backgroundColor: 'rgba(26,46,40,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: palette.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30, borderTopWidth: 1, borderColor: palette.line },
  sheetTitle: { fontFamily: 'Georgia', fontSize: 21, fontWeight: '700', color: palette.pineDeep },
  sheetSub: { marginTop: 4, fontSize: 12.5, color: palette.muted, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: palette.lineSoft, borderRadius: 14, padding: 13, marginTop: 8, backgroundColor: palette.paper },
  rowActive: { borderColor: palette.pine, backgroundColor: palette.mintSoft },
  rowName: { fontSize: 14.5, fontWeight: '700', color: palette.ink },
  rowNameActive: { color: palette.pineDeep },
  rowMeta: { marginTop: 2, fontSize: 12, color: palette.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: palette.pine },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.pine },
  dangerBtn: { marginTop: 14, borderWidth: 1, borderColor: palette.danger, borderRadius: 14, padding: 13, alignItems: 'center' },
  dangerText: { color: palette.danger, fontWeight: '700' },
  doneBtn: { marginTop: 10, backgroundColor: palette.pine, borderRadius: 14, padding: 14, alignItems: 'center' },
  doneText: { color: '#FFFDF6', fontWeight: '800' },
});
