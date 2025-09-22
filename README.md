---
title: Qwen Embedding Model API
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# Qwen Embedding Model API

A stable, Docker-based API for generating text embeddings using the Qwen model. This space provides a reliable service for your applications that need text embeddings.

## Features

- **Single Text Embedding**: Generate embeddings for individual texts
- **Batch Processing**: Process multiple texts efficiently
- **Similarity Calculation**: Compute cosine similarity between embeddings
- **Docker-based**: Stable deployment with containerization
- **Health Monitoring**: Built-in health check endpoints
- **Fallback Support**: Automatic fallback to sentence-transformers if needed

## API Endpoints

### 1. Single Text Embedding
```bash
POST /api/predict
Content-Type: application/json

{
    "data": ["Your text here"]
}
```

### 2. Batch Text Embedding
```bash
POST /api/predict
Content-Type: application/json

{
    "data": [["Text 1", "Text 2", "Text 3"]]
}
```

### 3. Health Check
```bash
GET /health
```

## Usage Examples

### Python
```python
import requests
import json

# Single text embedding
response = requests.post(
    "https://your-space-name.hf.space/api/predict",
    json={"data": ["Hello, world!"]}
)
embedding = response.json()["data"][0]

# Batch embedding
response = requests.post(
    "https://your-space-name.hf.space/api/predict",
    json={"data": [["Text 1", "Text 2", "Text 3"]]}
)
embeddings = response.json()["data"][0]
```

### JavaScript
```javascript
// Single text embedding
const response = await fetch("https://your-space-name.hf.space/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: ["Hello, world!"] })
});
const embedding = (await response.json()).data[0];

// Batch embedding
const response = await fetch("https://your-space-name.hf.space/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [["Text 1", "Text 2", "Text 3"]] })
});
const embeddings = (await response.json()).data[0];
```

## Model Information

- **Base Model**: Qwen2.5-0.5B-Instruct
- **Embedding Dimension**: 384 (fallback) or model-specific
- **Max Input Length**: 512 tokens
- **Device**: Auto-detects CUDA/CPU

## Docker Configuration

This space uses Docker for stable deployment:

- **Base Image**: Python 3.11-slim
- **Port**: 7860
- **Health Check**: Built-in monitoring
- **Non-root User**: Security best practices

## Performance

- **Single Text**: ~100-500ms (depending on hardware)
- **Batch Processing**: Optimized for multiple texts
- **Memory Usage**: ~2-4GB RAM
- **Concurrent Requests**: Supports multiple simultaneous requests

## Error Handling

The API includes comprehensive error handling:

- **Model Loading**: Automatic fallback to sentence-transformers
- **Input Validation**: Handles malformed requests gracefully
- **Rate Limiting**: Built-in protection against abuse
- **Health Monitoring**: Continuous status checking

## Integration with Your App

To integrate this API with your existing PansGPT application:

1. Update your `qwen-embedding-service.ts` to use the new endpoint
2. Replace the Gradio client connection with direct HTTP calls
3. Update the API URL to point to your new Hugging Face Space

## Monitoring

- **Health Endpoint**: `/health` for status checks
- **Logging**: Comprehensive logging for debugging
- **Metrics**: Built-in performance monitoring

## Support

For issues or questions:
- Check the health endpoint first
- Review the logs for error details
- Ensure your input format matches the expected structure

---

**Note**: This space is optimized for stability and reliability. The Docker-based deployment ensures consistent performance across different environments.