import OpenAI from 'openai';
import type { AssistantConfig } from './types.js';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini-tts';
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function styleInstructions(settings: AssistantConfig): string {
  const presets: Record<string, string> = {
    professional: 'Speak professionally, calmly, confidently, and clearly. Use measured pacing.',
    natural: 'Speak naturally and conversationally, with relaxed pacing and subtle expression.',
    warm: 'Speak warmly and reassuringly, with a friendly conversational tone.',
    authoritative: 'Speak with calm authority and confidence. Keep the delivery controlled and precise.',
    energetic: 'Speak with energetic, engaging delivery while remaining clear and intelligible.',
    cinematic: 'Speak with dramatic, cinematic presence. Build emphasis naturally without overacting.',
    custom: '',
  };
  return [presets[settings.voiceStyle] || presets.professional, settings.voiceInstructions?.trim()].filter(Boolean).join(' ');
}

function addGroqDirection(text: string, settings: AssistantConfig): string {
  const directions: Record<string, string> = {professional: '[professionally]', warm: '[warmly]', authoritative: '[authoritatively]', energetic: '[energetically]', cinematic: '[dramatically]'};
  const direction = directions[settings.voiceStyle];
  return direction ? `${direction} ${text.trim()}` : text.trim();
}

async function synthesizeOpenAI(text: string, settings: AssistantConfig) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OpenAI API key is not configured. Add OPENAI_API_KEY to the server environment.');
  const client = new OpenAI({apiKey, timeout: Number(process.env.OPENAI_TTS_TIMEOUT_MS || 120000), maxRetries: 2});
  const model = settings.openaiTtsModel?.trim() || process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const voice = settings.openaiTtsVoice?.trim() || process.env.OPENAI_TTS_VOICE?.trim() || 'cedar';
  const speed = clamp(Number(settings.voiceRate || 1), 0.25, 4);
  const instructions = styleInstructions(settings);
  const response = await client.audio.speech.create({model, voice, input: text.trim().slice(0, 4096), response_format: 'mp3', speed, ...(instructions ? {instructions} : {})});
  return {audio: await response.arrayBuffer(), contentType: 'audio/mpeg'};
}

async function synthesizeGroq(text: string, settings: AssistantConfig) {
  const apiKey = settings.groqApiKey?.trim() || process.env.GROQ_API_KEY?.trim();
  const model = settings.groqTtsModel?.trim() || process.env.GROQ_TTS_MODEL?.trim() || 'canopylabs/orpheus-v1-english';
  const voice = settings.groqTtsVoice?.trim() || process.env.GROQ_TTS_VOICE?.trim() || 'troy';
  if (!apiKey) throw new Error('Groq API key is not configured. Add it in Settings > Groq LLM.');
  if (text.trim().length > 200) throw new Error('Groq Orpheus TTS accepts a maximum of 200 characters per speech request.');
  const response = await fetch(GROQ_TTS_URL, {method: 'POST', headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'audio/wav'}, body: JSON.stringify({model, input: addGroqDirection(text, settings), voice, response_format: 'wav'})});
  if (!response.ok) { const detail = (await response.text()).slice(0, 500); throw new Error(`Groq TTS returned ${response.status}${detail ? `: ${detail}` : ''}`); }
  return {audio: await response.arrayBuffer(), contentType: response.headers.get('content-type') || 'audio/wav'};
}

export async function synthesizeSpeech(text: string, settings: AssistantConfig): Promise<{audio: ArrayBuffer; contentType: string}> {
  if (settings.speechProvider === 'openai') return synthesizeOpenAI(text, settings);
  if (settings.speechProvider === 'groq') return synthesizeGroq(text, settings);
  throw new Error('Cloud TTS is not enabled. Select OpenAI or Groq in Settings > Voice Output.');
}
