import OpenAI from 'openai';
import type { AssistantConfig, LLMProvider } from './types.js';

type ChatMessage = { role: string; content: string };

const DEFAULT_MODEL = 'gpt-5.5';
const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * OpenAI Responses API adapter for the J.A.R.V.I.S. LLMProvider interface.
 * Credentials are read from server-side environment variables only.
 */
export class OpenAILLM implements LLMProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(_config?: Partial<AssistantConfig>) {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || '';
    this.model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in the server environment.');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
      maxRetries: 2,
    });
  }

  async generate(input: { system: string; messages: ChatMessage[] }): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: 'system', content: input.system },
        ...input.messages.map((message) => ({
          role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: message.content,
        })),
      ],
    });

    return response.output_text?.trim() || '';
  }

  async structuredOutput<T>(input: {
    system: string;
    messages: ChatMessage[];
    schema: unknown;
  }): Promise<T> {
    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: 'system', content: `${input.system}\nReturn only data matching the supplied JSON schema.` },
        ...input.messages.map((message) => ({
          role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: message.content,
        })),
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'jarvis_structured_output',
          strict: false,
          schema: input.schema as Record<string, unknown>,
        },
      },
    });

    const content = response.output_text?.trim() || '';
    if (!content) throw new Error('OpenAI returned an empty structured response.');

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new Error('OpenAI returned invalid JSON for structured output.');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
