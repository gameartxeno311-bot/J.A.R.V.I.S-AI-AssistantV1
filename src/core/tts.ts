import type { AssistantConfig } from './types.js';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';

export async function synthesizeSpeech(text: string, settings: AssistantConfig): Promise<{audio: ArrayBuffer; contentType: string}> {
  const apiKey = settings.groqApiKey?.trim() || process.env.GROQ_API_KEY?.trim();
  const model = settings.groqTtsModel?.trim() || process.env.GROQ_TTS_MODEL?.trim() || 'canopylabs/orpheus-v1-english';
  const voice = settings.groqTtsVoice?.trim() || process.env.GROQ_TTS_VOICE?.trim() || 'troy';
  if (!apiKey) throw new Error('Groq API key is not configured. Add it in Settings > Groq LLM.');
  if (text.trim().length > 200) throw new Error('Groq Orpheus TTS accepts a maximum of 200 characters per speech request.');

  const response = await fetch(GROQ_TTS_URL, {
    method: 'POST',
    headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'audio/wav'},
    body: JSON.stringify({
      model,
      input: text.trim(),
      voice,
      response_format: 'wav',
      speed: Math.min(5, Math.max(0.5, Number(settings.voiceRate || 1))),
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Groq TTS returned ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return {audio: await response.arrayBuffer(), contentType: response.headers.get('content-type') || 'audio/wav'};
}
