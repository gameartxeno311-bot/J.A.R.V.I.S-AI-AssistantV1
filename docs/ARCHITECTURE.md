# Architecture

## Runtime flow

1. API/voice adapters normalize input into events.
2. The agent retrieves only relevant short-term context and memory.
3. The LLM provider produces natural language or structured plans.
4. Planned tool calls pass through the registry and permission gate.
5. Tool results are treated as untrusted data and verified before claims of success.
6. Significant actions are written to the audit trail.
7. EventBus subscribers provide the foundation for reminders, monitors and proactive notifications.

## Modules

- `src/core/types.ts` — domain contracts and provider interfaces.
- `src/core/store.ts` — SQLite persistence.
- `src/core/tools.ts` — tool registry, schema validation and filesystem sandbox.
- `src/core/agent.ts` — conversational agent and planning boundary.
- `src/core/events.ts` — event bus and proactive rule primitive.
- `src/server.ts` — HTTP integration layer.

## Extension points

Implement provider adapters behind `LLMProvider` for the user's existing LLM. Add STT/TTS adapters with the same principle. Add calendar, notes, tasks, web research and application adapters as narrowly scoped tools rather than arbitrary shell access.

The repository deliberately does not replace an existing frontend. The API is designed to be consumed by the existing interface through REST and can be extended with SSE/WebSocket streaming.
