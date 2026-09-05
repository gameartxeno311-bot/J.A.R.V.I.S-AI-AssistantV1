import type { AssistantConfig } from './types.js';

export const DEFAULT_SETTINGS: AssistantConfig = {
  assistantName: 'J.A.R.V.I.S.', userName: 'Shadow', preferredFormOfAddress: '', personalityMode: 'professional-aide', verbosity: 'balanced', humorLevel: 0.15, proactivityLevel: 0.4, confirmationPolicy: 'confirm-high-risk', timezone: 'UTC', privacyMode: false,
  voiceEnabled: true, voiceName: '', voiceRate: 0.98, voicePitch: 0.92, voiceVolume: 1, voiceLanguage: 'en-US', speechProvider: 'browser', elevenLabsApiKey: '', elevenLabsVoiceId: '', elevenLabsModel: 'eleven_multilingual_v2', customVoiceFileName: '', customVoiceUrl: '',
  groqApiKey: '', groqModel: 'openai/gpt-oss-20b', llmAdapterEnabled: false, llmAdapterName: '', llmAdapterFileName: '', notificationsEnabled: true, soundEffectsEnabled: true, theme: 'red',
};

export type PersistedSettings = AssistantConfig;
export function normalizeSettings(input: Partial<AssistantConfig>): AssistantConfig {
  const s = {...DEFAULT_SETTINGS, ...input};
  s.assistantName = String(s.assistantName || DEFAULT_SETTINGS.assistantName).trim().slice(0, 80); s.userName = String(s.userName ?? '').trim().slice(0, 80); s.preferredFormOfAddress = String(s.preferredFormOfAddress ?? '').trim().slice(0, 80);
  s.speechProvider = s.speechProvider === 'elevenlabs' ? 'elevenlabs' : 'browser'; s.elevenLabsApiKey = String(s.elevenLabsApiKey ?? '').trim().slice(0, 500); s.elevenLabsVoiceId = String(s.elevenLabsVoiceId ?? '').trim().slice(0, 120); s.elevenLabsModel = String(s.elevenLabsModel || DEFAULT_SETTINGS.elevenLabsModel).trim().slice(0, 120);
  s.customVoiceFileName = String(s.customVoiceFileName ?? '').trim().slice(0, 160); s.customVoiceUrl = String(s.customVoiceUrl ?? '').trim().slice(0, 500);
  s.groqApiKey = String(s.groqApiKey ?? '').trim().slice(0, 500); s.groqModel = String(s.groqModel || DEFAULT_SETTINGS.groqModel).trim().slice(0, 120);
  s.llmAdapterName = String(s.llmAdapterName ?? '').trim().slice(0, 120); s.llmAdapterFileName = String(s.llmAdapterFileName ?? '').trim().slice(0, 160); s.llmAdapterEnabled = Boolean(s.llmAdapterEnabled);
  s.humorLevel = Math.max(0, Math.min(1, Number(s.humorLevel))); s.proactivityLevel = Math.max(0, Math.min(1, Number(s.proactivityLevel))); s.voiceRate = Math.max(0.5, Math.min(2, Number(s.voiceRate))); s.voicePitch = Math.max(0, Math.min(2, Number(s.voicePitch))); s.voiceVolume = Math.max(0, Math.min(1, Number(s.voiceVolume)));
  return s;
}
