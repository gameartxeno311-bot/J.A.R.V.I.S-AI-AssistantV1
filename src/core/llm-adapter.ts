import { pathToFileURL } from 'node:url';
import { StubLLM } from './agent.js';
import type { AssistantConfig, LLMProvider } from './types.js';

export function validateLLMProvider(value: unknown): LLMProvider {
  const candidate = (value as {default?: unknown})?.default ?? value;
  if (!candidate || typeof candidate !== 'object') throw new Error('Adapter must export an object or default object.');
  const provider = candidate as Record<string, unknown>;
  for (const method of ['generate', 'structuredOutput', 'healthCheck']) if (typeof provider[method] !== 'function') throw new Error(`Adapter is missing required method: ${method}().`);
  return candidate as LLMProvider;
}

export async function loadLLMProvider(config: AssistantConfig, adapterDir: string): Promise<LLMProvider> {
  if (!config.llmAdapterEnabled || !config.llmAdapterFileName) return new StubLLM();
  if (!/^[a-zA-Z0-9._-]+\.(mjs|js)$/i.test(config.llmAdapterFileName)) throw new Error('Invalid LLM adapter filename.');
  const moduleUrl = pathToFileURL(`${adapterDir}/${config.llmAdapterFileName}`).href + `?v=${Date.now()}`;
  return validateLLMProvider(await import(moduleUrl));
}
