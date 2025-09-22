// Import Qwen3 embedding service (FastAPI-based)
import { generateEmbeddings as generateQwen3Embeddings, generateSingleEmbedding as generateSingleQwen3Embedding } from './qwen3-embedding-service';

// Main function - uses Qwen3-Embedding-0.6B model via FastAPI
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    return await generateQwen3Embeddings(texts);
  } catch (error) {
    console.error('Error generating embeddings with Qwen3-Embedding-0.6B:', error);
    throw error;
  }
}

// Helper function to generate single embedding
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
} 