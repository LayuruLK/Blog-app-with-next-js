// lib/utils.js
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

// Initialize the Hugging Face Embedding Model via LangChain
const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: process.env.HF_API_TOKEN,
});

export async function getEmbedding(text) {
  try {
    const vector = await embeddings.embedQuery(text);
    return vector;
  } catch (error) {
    console.error("Error generating embedding with LangChain:", error);
    throw new Error("Failed to get embedding from Hugging Face.");
  }
}

export function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

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