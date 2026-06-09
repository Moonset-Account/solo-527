const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;

function getClient() {
  if (client) return client;
  client = new OpenAI({
    apiKey: config.openai.apiKey,
    baseURL: config.openai.baseURL,
    maxRetries: config.openai.maxRetries,
    timeout: config.openai.timeout,
  });
  return client;
}

async function createEmbedding(text) {
  const startTime = Date.now();
  try {
    const openai = getClient();
    const response = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: text.slice(0, 8000),
    });
    const latency = Date.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;
    logger.debug(`Embedding created in ${latency}ms, tokens: ${tokens}`);
    return {
      vector: response.data[0].embedding,
      tokens,
      latencyMs: latency,
    };
  } catch (error) {
    logger.error('Embedding creation failed', { error: error.message });
    throw error;
  }
}

async function createBatchEmbeddings(texts) {
  const startTime = Date.now();
  const validTexts = texts.map(t => (t || '').slice(0, 8000));
  try {
    const openai = getClient();
    const response = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: validTexts,
    });
    const latency = Date.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;
    const vectors = response.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);
    logger.info(`Batch embeddings: ${texts.length} texts, ${latency}ms, ${tokens} tokens`);
    return { vectors, tokens, latencyMs: latency };
  } catch (error) {
    logger.error('Batch embedding failed', { error: error.message });
    throw error;
  }
}

async function chatCompletion(messages, options = {}) {
  const startTime = Date.now();
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: config.openai.chatModel,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.max_tokens ?? 2000,
      response_format: options.response_format || { type: 'json_object' },
    });
    const latency = Date.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;
    const content = response.choices[0]?.message?.content || '{}';
    logger.debug(`Chat completion: ${latency}ms, tokens: ${tokens}`);
    return { content, tokens, latencyMs: latency };
  } catch (error) {
    logger.error('Chat completion failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  getClient,
  createEmbedding,
  createBatchEmbeddings,
  chatCompletion,
};
