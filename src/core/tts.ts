import type { AssistantConfig } from './types.js';

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function synthesizeSpeech(text: string, settings: AssistantConfig): Promise<{audio: ArrayBuffer; contentType: string}> {
  const apiKey = settings.elevenLabsApiKey?.trim() || process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = settings.elevenLabsVoiceId?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim();
  const modelId = settings.elevenLabsModel?.trim() || process.env.ELEVENLABS_MODEL?.trim() || 'eleven_multilingual_v2';
  if (!apiKey) throw new Error('ElevenLabs API key is not configured. Add it in Settings > Independent JARVIS Voice.');
  if (!voiceId) throw new Error('ElevenLabs voice ID is not configured. Add it in Settings > Independent JARVIS Voice.');

  const response = await fetch(`${ELEVENLABS_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'},
    body: JSON.stringify({
      text: text.slice(0, 5000),
      model_id: modelId,
      language_code: settings.voiceLanguage?.split('-')[0] || undefined,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        speed: Math.min(1.2, Math.max(0.7, Number(settings.voiceRate || 1))),
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Independent voice provider returned ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return {audio: await response.arrayBuffer(), contentType: response.headers.get('content-type') || 'audio/mpeg'};
}
