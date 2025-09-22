// Qwen3-Embedding-0.6B Service using FastAPI
// This service connects to the Docker-deployed Qwen3 embedding model on Hugging Face Spaces

const QWEN3_API_BASE = 'https://ojochegbeng-pansgpt.hf.space';

interface Qwen3HealthResponse {
  status: string;
  model_loaded: boolean;
  model_name: string;
  model_type: string;
  device: string;
  max_length: number;
  embedding_dimension: number;
}

interface Qwen3EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface Qwen3SimilarityResponse {
  similarity: number;
  model: string;
}

// Cache for health check to avoid repeated calls
let healthCache: { data: Qwen3HealthResponse | null; timestamp: number } = {
  data: null,
  timestamp: 0
};

const HEALTH_CACHE_DURATION = 30000; // 30 seconds

// Check if the Qwen3 API is healthy
async function checkQwen3Health(): Promise<Qwen3HealthResponse> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (healthCache.data && (now - healthCache.timestamp) < HEALTH_CACHE_DURATION) {
    return healthCache.data;
  }

  try {
    const response = await fetch(`${QWEN3_API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    const healthData: Qwen3HealthResponse = await response.json();
    
    // Cache the health data
    healthCache.data = healthData;
    healthCache.timestamp = now;
    
    return healthData;
  } catch (error) {
    console.error('Qwen3 health check failed:', error);
    throw new Error('Qwen3 embedding service is not available');
  }
}

// Generate embeddings using Qwen3-Embedding-0.6B model with batching
export async function generateQwen3Embeddings(texts: string[]): Promise<number[][]> {
  try {
    // Check health first
    const health = await checkQwen3Health();
    
    if (!health.model_loaded) {
      throw new Error('Qwen3 model is not loaded on the server');
    }

    console.log(`Generating embeddings for ${texts.length} texts using ${health.model_type} (${health.embedding_dimension}D)`);

    // If we have many texts, batch them to avoid overwhelming the API
    const BATCH_SIZE = 5; // Process 5 texts at a time for better reliability
    const allEmbeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(texts.length/BATCH_SIZE)} with ${batch.length} texts`);
      
      try {
        const batchEmbeddings = await processBatch(batch, health);
        allEmbeddings.push(...batchEmbeddings);
        console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} failed:`, error);
        throw error; // Stop processing if any batch fails
      }
      
      // Add a longer delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < texts.length) {
        console.log(`Waiting 500ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Successfully generated ${allEmbeddings.length} embeddings (${allEmbeddings[0]?.length || 0}D)`);
    return allEmbeddings;

  } catch (error) {
    console.error('Error calling Qwen3 embeddings API:', error);
    throw error;
  }
}

// Process a single batch of texts - using individual API calls for reliability
async function processBatch(texts: string[], health: any): Promise<number[][]> {
  console.log(`Processing ${texts.length} texts individually with Qwen3 API`);
  
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i++) {
    try {
      console.log(`Processing text ${i + 1}/${texts.length}: ${texts[i].substring(0, 50)}...`);
      
      // Try different single-text API formats
      const formats = [
        { data: [texts[i]], normalize: true },
        { input: [texts[i]], normalize: true },
        { texts: [texts[i]], normalize: true },
        { data: texts[i], normalize: true },
        { input: texts[i], normalize: true },
        { texts: texts[i] },
        { data: texts[i] }
      ];
      
      let success = false;
      let lastError: Error | null = null;
      
      for (let j = 0; j < formats.length && !success; j++) {
        try {
          const requestBody = formats[j];
          console.log(`Trying single-text format ${j + 1} for text ${i + 1}`);
          
          const response = await fetch(`${QWEN3_API_BASE}/api/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen3 API error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const responseData = await response.json();
          console.log(`Text ${i + 1} response structure:`, {
            hasData: !!responseData.data,
            dataType: Array.isArray(responseData.data) ? 'array' : typeof responseData.data,
            dataLength: Array.isArray(responseData.data) ? responseData.data.length : 'N/A',
            responseKeys: Object.keys(responseData)
          });
          
          // Extract embedding
          let embedding: number[];
          if (Array.isArray(responseData.data) && responseData.data.length > 0) {
            embedding = responseData.data[0];
          } else if (Array.isArray(responseData) && responseData.length > 0) {
            embedding = responseData[0];
          } else if (Array.isArray(responseData.data)) {
            embedding = responseData.data;
          } else {
            throw new Error('Invalid response format - no embedding found');
          }
          
          if (!Array.isArray(embedding)) {
            throw new Error('Embedding is not an array');
          }
          
          // Validate embedding dimensions
          const expectedDim = health.embedding_dimension;
          if (embedding.length !== expectedDim) {
            console.warn(`Text ${i + 1} embedding has dimension ${embedding.length}, expected ${expectedDim}`);
          }
          
          embeddings.push(embedding);
          console.log(`✅ Successfully generated embedding for text ${i + 1} (${embedding.length}D)`);
          success = true;
          
        } catch (error) {
          lastError = error as Error;
          console.warn(`Single-text format ${j + 1} failed for text ${i + 1}:`, error);
        }
      }
      
      if (!success) {
        throw lastError || new Error(`All single-text formats failed for text ${i + 1}`);
      }
      
      // Add delay between requests to avoid rate limiting
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Failed to process text ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Successfully processed all ${embeddings.length} texts individually`);
  return embeddings;
}

// Generate single embedding using Qwen3-Embedding-0.6B model
export async function generateSingleQwen3Embedding(text: string): Promise<number[]> {
  try {
    const embeddings = await generateQwen3Embeddings([text]);
    return embeddings[0];
  } catch (error) {
    console.error('Error generating single Qwen3 embedding:', error);
    throw error;
  }
}

// Compute similarity between two texts using Qwen3
export async function computeQwen3Similarity(text1: string, text2: string): Promise<number> {
  try {
    const response = await fetch(`${QWEN3_API_BASE}/api/similarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text1: text1,
        text2: text2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen3 similarity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: Qwen3SimilarityResponse = await response.json();
    return data.similarity;

  } catch (error) {
    console.error('Error calling Qwen3 similarity API:', error);
    throw error;
  }
}

// Retry mechanism for Qwen3 API
async function generateQwen3EmbeddingsWithRetry(texts: string[], maxRetries: number = 3): Promise<number[][]> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Qwen3 API attempt ${attempt}/${maxRetries}`);
      return await generateQwen3Embeddings(texts);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Qwen3 API attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Clear health cache for retry
        healthCache.data = null;
        healthCache.timestamp = 0;
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Qwen3 API failed after all retries');
}

// Fallback to Jina if Qwen3 fails
export async function generateEmbeddingsWithFallback(texts: string[]): Promise<number[][]> {
  try {
    // Try Qwen3 first with retry
    return await generateQwen3EmbeddingsWithRetry(texts);
  } catch (qwen3Error) {
    console.warn('Qwen3 API failed after retries, falling back to Jina:', qwen3Error);
    
    // Fallback to Jina
    const JINA_API_KEY = process.env.JINA_API_KEY;
    const JINA_EMBEDDINGS_MODEL = process.env.JINA_EMBEDDINGS_MODEL || 'jina-embeddings-v3';

    if (!JINA_API_KEY) {
      throw new Error('Both Qwen3 and Jina APIs failed. JINA_API_KEY not available for fallback.');
    }

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
    return data.data.map((item: any) => item.embedding);
  }
}

// Main function that uses Qwen3 with Jina fallback
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  console.log(`🔄 Starting embedding generation for ${texts.length} texts...`);
  
  // For single text, use the optimized single embedding endpoint
  if (texts.length === 1) {
    try {
      console.log('Single text - using single Qwen3 embedding...');
      const embedding = await generateSingleQwen3Embedding(texts[0]);
      console.log(`✅ Single Qwen3 embedding successful (${embedding.length}D)`);
      return [embedding];
    } catch (error) {
      console.warn('Single Qwen3 embedding failed, falling back to Jina:', error);
      return await generateEmbeddingsWithFallback(texts);
    }
  }
  
  // For multiple texts, try Qwen3 first, then fallback to Jina
  try {
    console.log(`🔄 Attempting to generate ${texts.length} embeddings with Qwen3...`);
    const result = await generateQwen3Embeddings(texts);
    console.log(`✅ Qwen3 batch processing successful - generated ${result.length} embeddings`);
    return result;
  } catch (qwen3Error) {
    console.warn('❌ Qwen3 batch processing failed, falling back to Jina:', qwen3Error);
    try {
      const result = await generateEmbeddingsWithFallback(texts);
      console.log(`✅ Jina fallback successful - generated ${result.length} embeddings`);
      return result;
    } catch (jinaError) {
      console.error('❌ Both Qwen3 and Jina failed:', jinaError);
      throw new Error(`Embedding generation failed: Qwen3 error: ${qwen3Error}, Jina error: ${jinaError}`);
    }
  }
}

// Helper function to generate single embedding
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  return await generateSingleQwen3Embedding(text);
}

// Get model information
export async function getModelInfo(): Promise<Qwen3HealthResponse> {
  return await checkQwen3Health();
}

