import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../theme';
import type { UIMessage } from '../agent/orchestrator';

function timeOf(id: string): string {
  const n = parseInt(id.split('-')[0] ?? '', 36);
  if (!Number.isFinite(n)) return '';
  const d = new Date(n);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      {!isUser && (
        <View style={styles.leaf}>
          <View style={styles.leafInner} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.user : styles.ai]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAi]}>
          {msg.text || '…'}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.stamp, isUser ? styles.stampUser : styles.stampAi]}>
            {timeOf(msg.id)}
            {!isUser && msg.tokPerSec ? `  ·  ${msg.tokPerSec} tok/s` : ''}
            {!isUser && msg.stopped ? '  ·  stopped' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
    paddingHorizontal: 16,
  },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  leaf: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.mintSoft,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  leafInner: {
    width: 10,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.pine,
    transform: [{ rotate: '24deg' }],
    opacity: 0.9,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.lg,
  },
  user: {
    backgroundColor: palette.pine,
    borderBottomRightRadius: 6,
    shadowColor: palette.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ai: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderBottomLeftRadius: 6,
    shadowColor: palette.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  text: { fontSize: 15.5, lineHeight: 22 },
  textUser: { color: '#FFFDF6' },
  textAi: { color: palette.inkSoft },
  meta: { marginTop: 6 },
  stamp: { fontSize: 11 },
  stampUser: { color: 'rgba(255,253,246,0.65)', textAlign: 'right' },
  stampAi: { color: palette.faint },
});
