import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

/** Three-dot typing indicator in Verdant sage. */
export function TypingDots() {
  return (
    <View style={styles.row}>
      <View style={styles.leaf}>
        <View style={styles.leafInner} />
      </View>
      <View style={styles.bubble}>
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, { opacity: 1 - i * 0.25 }]} />
          ))}
        </View>
        <Text style={styles.label}>thinking on-device…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginVertical: 5 },
  leaf: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: palette.mintSoft,
    borderWidth: 1, borderColor: palette.line, alignItems: 'center',
    justifyContent: 'center', marginRight: 8, marginBottom: 4,
  },
  leafInner: { width: 10, height: 14, borderRadius: 7, backgroundColor: palette.pine, transform: [{ rotate: '24deg' }] },
  bubble: {
    backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line,
    borderRadius: 20, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.moss },
  label: { fontSize: 12, color: palette.faint, fontStyle: 'italic' },
});
