# Jina Embeddings Setup

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Jina Embeddings API Configuration
JINA_API_KEY=jina_039036c9121a40fca5397f08d088fd69UlPcMcmiWpqGdK4WCDu8vfZeLWwx
JINA_EMBEDDINGS_MODEL=jina-embeddings-v3
```

## What Changed

### Removed Components
- ✅ Local embedding service (`embedding-service/` directory)
- ✅ EC2 deployment scripts (`ec2-deployment/` directory)
- ✅ Docker configuration for embedding service
- ✅ All sentence-transformers dependencies
- ✅ Old embedding service URLs and configurations

### Updated Components
- ✅ `src/lib/embedding-service.ts` - Now uses Jina API directly
- ✅ `src/app/api/search/route.ts` - Updated to use new embedding service
- ✅ `src/app/api/admin/documents/upload/route.ts` - Removed old service URL

### Benefits
1. **Simplified Architecture**: No need for separate embedding service
2. **Better Performance**: Jina embeddings are optimized and fast
3. **Reduced Infrastructure**: No need to manage EC2 instances or Docker containers
4. **Cost Effective**: Pay per API call instead of maintaining servers
5. **Reliability**: Jina provides enterprise-grade embedding service

## Testing

To test the new integration:

1. Set the environment variables
2. Start your Next.js application
3. Try uploading a document
4. Test the search functionality

The system will now use Jina's `jina-embeddings-v3` model for all embedding operations.
