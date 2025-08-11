// lib/utils.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get embedding vector using OpenAI
export async function getEmbedding(text) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small", // cost-effective and good quality
      input: text,
    });

    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding with OpenAI:", error);
    throw new Error("Failed to get embedding from OpenAI.");
  }
}

// Calculate cosine similarity
export function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

// Chunk text into smaller parts for embedding
export function chunkText(text, maxLen = 1000) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLen));
    i += maxLen;
  }
  return chunks;
}
