const { pipeline } = require('@xenova/transformers');
const debateDataset = require('./debateDataset');

let embedder = null;
let datasetEmbeddings = null;

// Load the embedding model once when the server starts
const initializeRAG = async () => {
  console.log('[RAG] Loading embedding model (first run may take a moment)...');
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('[RAG] Computing embeddings for debate dataset...');
  const texts = debateDataset.map((item) => item.text);
  const embeddings = [];

  for (const text of texts) {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
  }

  datasetEmbeddings = embeddings;
  console.log(`[RAG] Indexed ${debateDataset.length} debate knowledge entries.`);
};

// Cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Given a query, find the top N most relevant dataset entries
const retrieveRelevantContext = async (query, topN = 4) => {
  if (!embedder || !datasetEmbeddings) {
    console.log('[RAG] Not initialized yet, returning empty context');
    return [];
  }

  const queryOutput = await embedder(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(queryOutput.data);

  const scored = debateDataset.map((item, index) => ({
    text: item.text,
    category: item.category,
    score: cosineSimilarity(queryEmbedding, datasetEmbeddings[index]),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
};

module.exports = { initializeRAG, retrieveRelevantContext };