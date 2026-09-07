import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../theme';

interface Props {
  tokPerSec: number | null;
  ready: boolean;
  onClear: () => void;
  onModels: () => void;
}

export function ChatHeader({ tokPerSec, ready, onClear, onModels }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <View style={styles.sprout} />
          </View>
          <View>
            <Text style={styles.name}>Verdant</Text>
            <Text style={styles.sub}>offline · on-device</Text>
          </View>
        </View>
        <View style={styles.pills}>
          <View style={[styles.pill, ready ? styles.pillLive : styles.pillIdle]}>
            <View style={[styles.dot, ready ? styles.dotLive : styles.dotIdle]} />
            <Text style={styles.pillText}>
              {ready ? (tokPerSec ? `${tokPerSec} tok/s` : 'ready') : 'loading'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onModels} style={styles.chip}>
          <Text style={styles.chipText}>Models</Text>
        </Pressable>
        <Pressable onPress={onClear} style={styles.chip}>
          <Text style={styles.chipText}>Clear chat</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.paper,
    borderBottomWidth: 1,
    borderBottomColor: palette.lineSoft,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprout: {
    width: 13,
    height: 18,
    borderRadius: 8,
    backgroundColor: palette.lime,
    transform: [{ rotate: '24deg' }],
  },
  name: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '700', color: palette.pineDeep, letterSpacing: 0.3 },
  sub: { fontSize: 11.5, color: palette.muted, marginTop: 1 },
  pills: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  pillLive: { backgroundColor: palette.mintSoft, borderColor: palette.sage },
  pillIdle: { backgroundColor: palette.cardTint, borderColor: palette.line },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  dotLive: { backgroundColor: palette.moss },
  dotIdle: { backgroundColor: palette.amber },
  pillText: { fontSize: 12, color: palette.inkSoft, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12.5, color: palette.inkSoft, fontWeight: '600' },
});
