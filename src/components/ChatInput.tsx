import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette, radius } from '../theme';

interface Props {
  generating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatInput({ generating, onSend, onStop }: Props) {
  const [value, setValue] = useState('');

  const send = () => {
    const t = value.trim();
    if (!t || generating) return;
    setValue('');
    onSend(t);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={generating ? 'Verdant is writing…' : 'Ask anything — works offline'}
          placeholderTextColor={palette.faint}
          multiline
          maxLength={4000}
          editable={!generating}
          onSubmitEditing={send}
          blurOnSubmit={false}
          style={styles.input}
          returnKeyType="send"
        />
        {generating ? (
          <Pressable onPress={onStop} style={[styles.btn, styles.stop]} accessibilityLabel="Stop generating">
            <View style={styles.stopSq} />
          </Pressable>
        ) : (
          <Pressable
            onPress={send}
            disabled={!value.trim()}
            style={[styles.btn, !value.trim() && styles.btnDim]}
            accessibilityLabel="Send message">
            <Text style={styles.arrow}>↑</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.hintRow}>
        {generating ? (
          <View style={styles.hintLive}>
            <ActivityIndicator size="small" color={palette.moss} />
            <Text style={styles.hintText}>  streaming on-device — tap ■ to stop</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>100% offline · nothing leaves your phone</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.line,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: palette.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    color: palette.ink,
    paddingVertical: 6,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.pine,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  btnDim: { opacity: 0.35 },
  arrow: { color: '#FFFDF6', fontSize: 20, fontWeight: '700', marginTop: -2 },
  stop: { backgroundColor: palette.danger },
  stopSq: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#fff' },
  hintRow: { alignItems: 'center', paddingVertical: 7 },
  hintLive: { flexDirection: 'row', alignItems: 'center' },
  hintText: { fontSize: 11.5, color: palette.muted },
});
