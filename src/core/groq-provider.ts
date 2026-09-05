import type { AssistantConfig, LLMProvider } from './types.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';
type ChatMessage = { role: string; content: string };
type GroqResponse = { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };

export class GroqLLM implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config?: Partial<AssistantConfig>) {
    this.apiKey = config?.groqApiKey?.trim() || process.env.GROQ_API_KEY?.trim() || '';
    this.model = config?.groqModel?.trim() || process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
    if (!this.apiKey) throw new Error('Groq API key is not configured. Add it in Settings > Groq LLM.');
  }

  async generate(input: { system: string; messages: ChatMessage[] }): Promise<string> {
    const response = await this.request([{ role: 'system', content: input.system }, ...input.messages]);
    return response.choices?.[0]?.message?.content?.trim() || '';
  }

  async structuredOutput<T>(input: { system: string; messages: ChatMessage[]; schema: unknown }): Promise<T> {
    const schemaText = JSON.stringify(input.schema);
    const system = `${input.system}\nReturn ONLY valid JSON. Do not use markdown fences or commentary. The JSON must conform to this schema: ${schemaText}`;
    const response = await this.request([{ role: 'system', content: system }, ...input.messages]);
    const content = response.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(cleaned) as T; }
    catch { throw new Error('Groq returned invalid JSON for structured output.'); }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${this.apiKey}` } });
      return response.ok;
    } catch { return false; }
  }

  private async request(messages: ChatMessage[]): Promise<GroqResponse> {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, temperature: 0.7 }),
    });
    const data = (await response.json()) as GroqResponse;
    if (!response.ok) throw new Error(data.error?.message || `Groq API request failed with HTTP ${response.status}.`);
    return data;
  }
}
