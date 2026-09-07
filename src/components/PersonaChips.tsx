import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PERSONAS, type PersonaMode } from '../agent/personas';
import { palette } from '../theme';

const ORDER: PersonaMode[] = ['general', 'study', 'code', 'write'];

export function PersonaChips({
  active,
  onPick,
}: {
  active: PersonaMode;
  onPick: (m: PersonaMode) => void;
}) {
  return (
    <View style={styles.row}>
      {ORDER.map(m => {
        const p = PERSONAS[m];
        const on = m === active;
        return (
          <Pressable
            key={m}
            onPress={() => onPick(m)}
            style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.label, on && styles.labelOn]}>{p.label}</Text>
            {on && <Text style={styles.tag}> · {p.tagline}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipOn: { backgroundColor: palette.pine, borderColor: palette.pine },
  label: { fontSize: 12.5, fontWeight: '700', color: palette.inkSoft },
  labelOn: { color: '#FFFDF6' },
  tag: { fontSize: 11.5, color: '#E7EFE4' },
});
