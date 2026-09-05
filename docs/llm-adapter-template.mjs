// J.A.R.V.I.S. LLM provider adapter template.
// Keep credentials in process.env (for example LLM_API_KEY), never in this file.

const provider = {
  async generate({ system, messages }) {
    // Call your provider here and return the assistant text.
    throw new Error('Implement generate() for your LLM provider.');
  },

  async structuredOutput({ system, messages, schema }) {
    // Call your provider's structured/JSON endpoint and return a parsed object.
    throw new Error('Implement structuredOutput() for your LLM provider.');
  },

  async healthCheck() {
    // Return true when the provider is reachable and configured.
    return Boolean(process.env.LLM_API_KEY || process.env.LLM_BASE_URL);
  },
};

export default provider;
