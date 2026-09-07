/**
 * Tiny persistence layer over AsyncStorage.
 * Stores: chat history, selected model, persona mode, onboarding flag.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UIMessage } from '../agent/orchestrator';
import type { PersonaMode } from '../agent/personas';

const K = {
  chat: '@verdant/chat/v1',
  modelId: '@verdant/modelId/v1',
  persona: '@verdant/persona/v1',
  onboarded: '@verdant/onboarded/v1',
};

export async function loadChat(): Promise<UIMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(K.chat);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-100) : [];
  } catch {
    return [];
  }
}

export async function saveChat(msgs: UIMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(K.chat, JSON.stringify(msgs.slice(-100)));
  } catch {
    /* storage full / unavailable — chat still works in memory */
  }
}

export async function clearChat(): Promise<void> {
  try {
    await AsyncStorage.removeItem(K.chat);
  } catch {
    /* noop */
  }
}

export async function loadModelId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(K.modelId);
  } catch {
    return null;
  }
}

export async function saveModelId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(K.modelId, id);
  } catch {
    /* noop */
  }
}

export async function loadPersona(): Promise<PersonaMode> {
  try {
    const v = await AsyncStorage.getItem(K.persona);
    return v === 'study' || v === 'code' || v === 'write' ? v : 'general';
  } catch {
    return 'general';
  }
}

export async function savePersona(m: PersonaMode): Promise<void> {
  try {
    await AsyncStorage.setItem(K.persona, m);
  } catch {
    /* noop */
  }
}
