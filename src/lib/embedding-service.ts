// Jina Embeddings API configuration
const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_EMBEDDINGS_MODEL = process.env.JINA_EMBEDDINGS_MODEL || 'jina-embeddings-v3';

if (!JINA_API_KEY) {
  throw new Error('JINA_API_KEY environment variable is required');
}

// Helper function to call Jina Embeddings API
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: JINA_EMBEDDINGS_MODEL,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Jina returns embeddings in the 'data' field with each item having an 'embedding' field
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error('Error calling Jina embeddings API:', error);
    throw error;
  }
}

// Helper function to generate single embedding
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
} 