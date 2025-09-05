# PansGPT - AI-Powered Educational Assistant

## 🎯 **Jina Embeddings Integration**

This application now uses **Jina Embeddings API** for all embedding operations, providing enterprise-grade embedding capabilities without the need for local model deployment.

## 🚀 **Quick Start**

1. **Set up environment variables:**
   ```bash
   # Create .env.local file with:
   JINA_API_KEY=jina_039036c9121a40fca5397f08d088fd69UlPcMcmiWpqGdK4WCDu8vfZeLWwx
   JINA_EMBEDDINGS_MODEL=jina-embeddings-v3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Test the integration:**
   ```bash
   npx tsx test-jina-embeddings.ts
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## 🔧 **What Changed**

### ✅ **Removed Components**
- Local embedding service (`embedding-service/` directory)
- EC2 deployment scripts (`ec2-deployment/` directory)
- Docker configuration for embedding service
- All sentence-transformers dependencies
- Old embedding service URLs and configurations

### ✅ **Updated Components**
- `src/lib/embedding-service.ts` - Now uses Jina API directly
- `src/app/api/search/route.ts` - Updated to use new embedding service
- `src/app/api/admin/documents/upload/route.ts` - Removed old service URL

## 🎉 **Benefits of Jina Embeddings**

1. **Simplified Architecture**: No need for separate embedding service
2. **Better Performance**: Jina embeddings are optimized and fast
3. **Reduced Infrastructure**: No need to manage EC2 instances or Docker containers
4. **Cost Effective**: Pay per API call instead of maintaining servers
5. **Reliability**: Jina provides enterprise-grade embedding service
6. **High Quality**: State-of-the-art embedding models

## 📁 **Key Files**

- `src/lib/embedding-service.ts` - Jina API integration
- `test-jina-embeddings.ts` - Test script for embeddings
- `JINA_EMBEDDINGS_SETUP.md` - Detailed setup guide

## 🚀 **Features**

- **Document Upload & Processing**: Upload educational documents and automatically generate embeddings
- **Semantic Search**: Find relevant content using vector similarity search
- **Quiz Generation**: AI-powered quiz creation from uploaded content
- **User Management**: Authentication and subscription management
- **Real-time Chat**: Interactive AI assistant for educational queries

## 💡 **Why Jina Embeddings?**

- **No Infrastructure Management**: No servers to maintain
- **Instant Scaling**: Handles any volume of requests
- **High Performance**: Optimized for speed and accuracy
- **Cost Effective**: Pay only for what you use
- **Enterprise Grade**: Reliable and secure API service

Your application now has a much simpler and more reliable embedding architecture! 