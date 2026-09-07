import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';
import { formatBytes, type DownloadProgress } from '../services/downloader';
import type { ModelInfo } from '../models';

interface Props {
  model: ModelInfo;
  phase: 'idle' | 'downloading' | 'verifying' | 'loading' | 'error';
  progress: DownloadProgress;
  speed: number;
  error: string | null;
  onDownload: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onPickModel: () => void;
}

/**
 * First-launch experience: one-tap download of the GGUF with live progress,
 * then auto-transition into chat. Beige paper aesthetic, no generic AI look.
 */
export function SetupScreen({
  model, phase, progress, speed, error, onDownload, onCancel, onRetry, onPickModel,
}: Props) {
  const pct = Math.round((progress.fraction || 0) * 100);
  const busy = phase === 'downloading' || phase === 'verifying' || phase === 'loading';

  return (
    <View style={styles.page}>
      <View style={styles.badge}>
        <View style={styles.sprout} />
        <Text style={styles.badgeText}>VERDANT · PRIVATE BY DESIGN</Text>
      </View>

      <Text style={styles.title}>Your mind,{'\n'}now offline.</Text>
      <Text style={styles.sub}>
        One download, then Verdant thinks entirely on your phone — on flights,
        in basements, with zero accounts and zero tracking.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.modelName}>{model.label}</Text>
            <Text style={styles.modelMeta}>
              {model.quant} · {model.sizeLabel} · runs on CPU/GPU
            </Text>
          </View>
          <Pressable onPress={onPickModel} style={styles.swap}>
            <Text style={styles.swapText}>Change</Text>
          </Pressable>
        </View>

        <Text style={styles.desc}>{model.description}</Text>

        {/* Progress track */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${busy || pct > 0 ? Math.max(pct, 3) : 0}%` }]} />
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>
            {phase === 'idle' && `Ready when you are — ${model.sizeLabel}`}
            {phase === 'downloading' &&
              `${pct}% · ${formatBytes(progress.bytesWritten)} / ${formatBytes(progress.contentLength || model.sizeBytes)}`}
            {phase === 'verifying' && 'Checking file integrity…'}
            {phase === 'loading' && 'Waking the model into memory…'}
            {phase === 'error' && 'Paused — your progress is safe.'}
          </Text>
          {phase === 'downloading' && speed > 0 && (
            <Text style={styles.speed}>{formatBytes(speed)}/s</Text>
          )}
        </View>

        {error && (
          <View style={styles.err}>
            <Text style={styles.errText}>{error}</Text>
          </View>
        )}

        {phase === 'error' ? (
          <View style={styles.btnRow}>
            <Pressable onPress={onRetry} style={[styles.cta, styles.ctaPrimary]}>
              <Text style={styles.ctaText}>Retry download</Text>
            </Pressable>
            <Pressable onPress={onCancel} style={[styles.cta, styles.ctaGhost]}>
              <Text style={styles.ctaGhostText}>Cancel</Text>
            </Pressable>
          </View>
        ) : busy ? (
          <View style={styles.btnRow}>
            <View style={[styles.cta, styles.ctaBusy]}>
              <Text style={styles.ctaText}>
                {phase === 'loading' ? 'Loading…' : `${pct}% — fetching brain…`}
              </Text>
            </View>
            {phase === 'downloading' && (
              <Pressable onPress={onCancel} style={[styles.cta, styles.ctaGhost]}>
                <Text style={styles.ctaGhostText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable onPress={onDownload} style={[styles.cta, styles.ctaPrimary]}>
            <Text style={styles.ctaText}>Download {model.shortLabel} · {model.sizeLabel}</Text>
          </Pressable>
        )}

        <Text style={styles.fine}>
          Downloads once from Hugging Face over Wi-Fi. Afterwards the app needs
          no internet at all — the model lives in your phone's private storage.
        </Text>
      </View>

      <View style={styles.perks}>
        {[
          ['No account', 'opens straight into chat'],
          ['No cloud', 'tokens never leave RAM'],
          ['Free forever', 'no keys, no usage bills'],
        ].map(([a, b]) => (
          <View key={a} style={styles.perk}>
            <Text style={styles.perkA}>{a}</Text>
            <Text style={styles.perkB}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: palette.mintSoft, borderWidth: 1, borderColor: palette.line,
    alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  sprout: { width: 9, height: 13, borderRadius: 5, backgroundColor: palette.pine, transform: [{ rotate: '24deg' }] },
  badgeText: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', color: palette.pine },
  title: { fontFamily: 'Georgia', fontSize: 40, lineHeight: 44, fontWeight: '700', color: palette.pineDeep, marginTop: 16 },
  sub: { marginTop: 10, fontSize: 15, lineHeight: 22, color: palette.inkSoft },
  card: {
    marginTop: 18, backgroundColor: palette.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: palette.line, padding: 18,
    shadowColor: palette.shadow, shadowOpacity: 0.4, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modelName: { fontSize: 17, fontWeight: '800', color: palette.ink },
  modelMeta: { marginTop: 3, fontSize: 12.5, color: palette.muted },
  swap: { borderWidth: 1, borderColor: palette.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: palette.paper },
  swapText: { fontSize: 12, fontWeight: '700', color: palette.moss },
  desc: { marginTop: 10, fontSize: 13.5, lineHeight: 20, color: palette.inkSoft },
  track: { marginTop: 14, height: 12, borderRadius: 8, backgroundColor: palette.paperDeep, borderWidth: 1, borderColor: palette.lineSoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: palette.pine, borderRadius: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stat: { fontSize: 12.5, color: palette.inkSoft, fontWeight: '600', flex: 1 },
  speed: { fontSize: 12.5, color: palette.moss, fontWeight: '800' },
  err: { marginTop: 10, backgroundColor: palette.dangerSoft, borderRadius: 10, padding: 10 },
  errText: { fontSize: 12.5, color: palette.danger },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cta: { flex: 1, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  ctaPrimary: { backgroundColor: palette.pine },
  ctaBusy: { backgroundColor: palette.moss, opacity: 0.85 },
  ctaGhost: { flex: 0.45, backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.line },
  ctaText: { color: '#FFFDF6', fontSize: 15, fontWeight: '800' },
  ctaGhostText: { color: palette.inkSoft, fontSize: 14, fontWeight: '700' },
  fine: { marginTop: 12, fontSize: 11.5, lineHeight: 17, color: palette.faint },
  perks: { flexDirection: 'row', gap: 10, marginTop: 16 },
  perk: { flex: 1, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.lineSoft, borderRadius: 14, padding: 12 },
  perkA: { fontSize: 12.5, fontWeight: '800', color: palette.pineDeep },
  perkB: { marginTop: 3, fontSize: 11, lineHeight: 15, color: palette.muted },
});
