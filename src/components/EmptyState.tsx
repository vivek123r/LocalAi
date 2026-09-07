import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export function EmptyState() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.grove}>
          <View style={[styles.stem, { height: 26 }]} />
          <View style={[styles.stem, { height: 36 }]} />
          <View style={[styles.stem, { height: 22 }]} />
        </View>
        <Text style={styles.title}>A quiet mind, on your phone.</Text>
        <Text style={styles.body}>
          Verdant runs entirely offline. Ask for ideas, explanations, drafts or
          code — no account, no cloud, no trace.
        </Text>
        <View style={styles.examples}>
          {['Explain photosynthesis simply', 'Draft a polite leave message', 'Python: read a CSV safely'].map(e => (
            <View key={e} style={styles.ex}>
              <Text style={styles.exText}>“{e}”</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, alignItems: 'center' },
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 24,
    padding: 22,
    width: '100%',
    shadowColor: palette.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  grove: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 14 },
  stem: {
    width: 10,
    borderRadius: 6,
    backgroundColor: palette.sage,
    opacity: 0.85,
  },
  title: { fontFamily: 'Georgia', fontSize: 24, color: palette.pineDeep, fontWeight: '700', lineHeight: 30 },
  body: { marginTop: 8, fontSize: 14.5, lineHeight: 21, color: palette.inkSoft },
  examples: { marginTop: 14, gap: 8 },
  ex: {
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  exText: { fontSize: 13, color: palette.inkSoft, fontStyle: 'italic' },
});
