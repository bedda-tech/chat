# RAG & Intelligent Document Search

## Document Purpose
This document outlines the implementation of RAG (Retrieval Augmented Generation) and intelligent document search capabilities to enable users to upload documents, create knowledge bases, and have AI-powered conversations with their data.

---

## ⚠️ Dependencies

**Required Before Implementation:**
- ✅ **Usage Analytics & Monitoring** - For tracking document processing, storage, and query quotas
- ✅ **Pricing & Monetization** - RAG is a premium feature requiring tier enforcement
- ✅ **Prompt Caching** - Essential for cost efficiency (90% reduction on repeated document queries)

**Recommended (Enhances RAG):**
- **Advanced Streaming** - Stream search results and citations in real-time
- **Code Sandboxes** - Execute code found in documents
- **Vercel Workflow** - Long-running document processing pipelines

**Enables:**
- Enterprise knowledge bases
- Team collaboration (shared knowledge)
- Advanced AI capabilities (grounded reasoning)
- Enterprise integrations (Slack, Teams knowledge search)

**Implementation Timeline:** Month 4 (after Phase 1 complete)

---

## 1. Overview

**RAG (Retrieval Augmented Generation)** combines document retrieval with AI generation to:
- Chat with PDFs, documents, code repositories
- Build searchable knowledge bases
- Get accurate, cited answers from your documents
- Reduce hallucinations by grounding responses in real data
- Enable multi-document analysis

**Key Benefits**:
- **Accuracy**: AI cites specific passages from documents
- **Context**: Conversations stay grounded in your data
- **Scale**: Works with thousands of documents
- **Intelligence**: Semantic search finds relevant content
- **Cost-effective**: Only send relevant chunks to AI (vs entire docs)

## 2. Current State

### What We Have
- Basic document tool (`lib/ai/tools/create-document.ts`)
- Text embeddings tool (`lib/ai/tools/text-embeddings.ts`)
- No vector database
- No document chunking
- No retrieval system
- No knowledge base management

### What's Missing
- Vector database (Pinecone, Supabase Vector, pgvector)
- Document processing pipeline (chunking, parsing)
- Semantic search
- Citation generation
- Multi-document querying
- Knowledge base UI

## 3. Architecture

### High-Level Flow

```
User uploads document
    ↓
Parse & extract text (PDF, DOCX, TXT, MD, code)
    ↓
Split into chunks (500-1000 tokens each)
    ↓
Generate embeddings for each chunk
    ↓
Store in vector database with metadata
    ↓
User asks question
    ↓
Generate query embedding
    ↓
Semantic search: find top-k relevant chunks
    ↓
Send chunks + question to AI
    ↓
AI generates answer with citations
```

## 4. Technology Stack

### Vector Database Options

**Option 1: Supabase Vector (Recommended)**
```typescript
// Built on PostgreSQL pgvector extension
// Pros: Free tier, SQL queries, no new service
// Cons: Requires Supabase setup

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

**Option 2: Pinecone**
```typescript
// Dedicated vector database
// Pros: Fast, scalable, specialized
// Cons: Additional cost, separate service

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
```

**Option 3: pgvector (Local PostgreSQL)**
```typescript
// PostgreSQL extension
// Pros: Self-hosted, no additional cost, fast
// Cons: Requires PostgreSQL setup

// Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embedding Models

**Best Options**:
1. **OpenAI text-embedding-3-small**: Fast, cheap ($0.02/1M tokens)
2. **OpenAI text-embedding-3-large**: Higher quality ($0.13/1M tokens)
3. **Google Gecko**: Free tier available
4. **Voyage AI**: Specialized for retrieval

## 5. Database Schema

**File**: `db/schema/documents.sql`

```sql
-- Document collections (knowledge bases)
CREATE TABLE document_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Settings
  chunk_size INT DEFAULT 1000,
  chunk_overlap INT DEFAULT 200,
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',

  -- Stats
  document_count INT DEFAULT 0,
  chunk_count INT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user (user_id)
);

-- Individual documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Document metadata
  filename VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- pdf, docx, txt, md, etc.
  file_size BIGINT NOT NULL, -- bytes
  file_url TEXT, -- Storage URL (S3, Supabase Storage)

  -- Content
  content TEXT NOT NULL, -- Full text content
  summary TEXT, -- AI-generated summary

  -- Processing
  status VARCHAR(50) DEFAULT 'processing', -- processing, ready, failed
  error_message TEXT,

  -- Stats
  token_count INT,
  chunk_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_collection (collection_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);

-- Document chunks with embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,

  -- Chunk content
  content TEXT NOT NULL,
  chunk_index INT NOT NULL, -- Position in document (0, 1, 2...)

  -- Embedding (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),

  -- Metadata
  metadata JSONB, -- Page number, section, etc.
  token_count INT,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_document (document_id),
  INDEX idx_collection (collection_id)
);

-- Create vector index for fast similarity search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Search queries (analytics)
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES document_collections(id) ON DELETE CASCADE,

  query TEXT NOT NULL,
  results_count INT,
  response_time_ms INT,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user (user_id),
  INDEX idx_collection (collection_id)
);
```

## 6. Document Processing Pipeline

**File**: `lib/rag/document-processor.ts`

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdf from 'pdf-parse';
import mammoth from 'mammoth'; // For DOCX
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export class DocumentProcessor {
  /**
   * Process uploaded document
   */
  static async processDocument(
    file: File,
    collectionId: string,
    userId: string
  ): Promise<string> {
    // 1. Extract text from file
    const text = await this.extractText(file);

    // 2. Create document record
    const documentId = await this.createDocument({
      collectionId,
      userId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: text,
      status: 'processing',
    });

    // 3. Split into chunks
    const chunks = await this.splitIntoChunks(text);

    // 4. Generate embeddings and store
    await this.generateAndStoreEmbeddings(documentId, collectionId, chunks);

    // 5. Generate summary
    const summary = await this.generateSummary(text);
    await this.updateDocument(documentId, { summary, status: 'ready' });

    return documentId;
  }

  /**
   * Extract text from various file formats
   */
  private static async extractText(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();

    if (file.type === 'application/pdf') {
      const data = await pdf(Buffer.from(buffer));
      return data.text;
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return result.value;
    }

    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return new TextDecoder().decode(buffer);
    }

    throw new Error(`Unsupported file type: ${file.type}`);
  }

  /**
   * Split text into chunks with overlap
   */
  private static async splitIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: overlap,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await splitter.splitText(text);
    return chunks;
  }

  /**
   * Generate embeddings and store in vector DB
   */
  private static async generateAndStoreEmbeddings(
    documentId: string,
    collectionId: string,
    chunks: string[]
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: chunk,
      });

      // Store in database
      await db.query(`
        INSERT INTO document_chunks (document_id, collection_id, content, chunk_index, embedding, token_count)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        documentId,
        collectionId,
        chunk,
        i,
        JSON.stringify(embedding), // pgvector accepts JSON array
        Math.ceil(chunk.length / 4) // Rough token estimate
      ]);
    }
  }

  /**
   * Generate document summary
   */
  private static async generateSummary(text: string): Promise<string> {
    const { text: summary } = await generateText({
      model: gateway.languageModel('anthropic/claude-3.5-haiku'), // Fast, cheap
      prompt: `Summarize this document in 2-3 sentences:\n\n${text.slice(0, 5000)}`,
    });

    return summary;
  }
}
```

## 7. Semantic Search

**File**: `lib/rag/search.ts`

```typescript
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export class SemanticSearch {
  /**
   * Search documents using semantic similarity
   */
  static async search(
    query: string,
    collectionId: string,
    topK = 5
  ): Promise<SearchResult[]> {
    const startTime = Date.now();

    // 1. Generate query embedding
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: query,
    });

    // 2. Perform vector similarity search
    const results = await db.query(`
      SELECT
        c.id,
        c.content,
        c.chunk_index,
        c.metadata,
        d.filename,
        d.id as document_id,
        1 - (c.embedding <=> $1::vector) as similarity
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.collection_id = $2
      ORDER BY c.embedding <=> $1::vector
      LIMIT $3
    `, [JSON.stringify(queryEmbedding), collectionId, topK]);

    // 3. Record search analytics
    await this.recordSearch(query, collectionId, results.rows.length, Date.now() - startTime);

    return results.rows;
  }

  /**
   * Search with metadata filters
   */
  static async searchWithFilters(
    query: string,
    collectionId: string,
    filters: {
      fileType?: string;
      filename?: string;
      dateRange?: { start: Date; end: Date };
    },
    topK = 5
  ): Promise<SearchResult[]> {
    // Similar to above but with WHERE clauses for filters
  }

  private static async recordSearch(
    query: string,
    collectionId: string,
    resultsCount: number,
    responseTime: number
  ): Promise<void> {
    await db.query(`
      INSERT INTO search_queries (collection_id, query, results_count, response_time_ms)
      VALUES ($1, $2, $3, $4)
    `, [collectionId, query, resultsCount, responseTime]);
  }
}
```

## 8. RAG Query Handler

**File**: `lib/rag/query.ts`

```typescript
import { generateText } from 'ai';
import { gateway } from '@/lib/ai/providers';
import { SemanticSearch } from './search';

export class RAGQuery {
  /**
   * Answer question using RAG
   */
  static async query(
    question: string,
    collectionId: string,
    modelId: string,
    options?: {
      topK?: number;
      includeC citations?: boolean;
      conversationHistory?: Message[];
    }
  ): Promise<RAGResponse> {
    const topK = options?.topK || 5;

    // 1. Retrieve relevant chunks
    const searchResults = await SemanticSearch.search(question, collectionId, topK);

    // 2. Build context from chunks
    const context = searchResults
      .map((result, idx) => {
        return `[Source ${idx + 1}: ${result.filename}, chunk ${result.chunk_index}]\n${result.content}`;
      })
      .join('\n\n---\n\n');

    // 3. Build prompt with context
    const systemPrompt = `You are a helpful AI assistant that answers questions based on provided documents.

**Instructions**:
1. Only use information from the provided context
2. If the answer is not in the context, say "I don't have enough information to answer that"
3. Cite your sources using [Source N] notation
4. Be concise and accurate

**Context**:
${context}`;

    // 4. Generate answer with citations
    const { text, usage } = await generateText({
      model: gateway.languageModel(modelId),
      messages: [
        { role: 'system', content: systemPrompt },
        ...(options?.conversationHistory || []),
        { role: 'user', content: question },
      ],
      experimental_providerMetadata: {
        // Cache the context for subsequent questions
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
    });

    // 5. Extract citations
    const citations = this.extractCitations(text, searchResults);

    return {
      answer: text,
      citations,
      sources: searchResults,
      usage,
    };
  }

  /**
   * Extract citation references from response
   */
  private static extractCitations(
    text: string,
    searchResults: SearchResult[]
  ): Citation[] {
    const citations: Citation[] = [];
    const regex = /\[Source (\d+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const sourceNum = parseInt(match[1]) - 1;
      if (searchResults[sourceNum]) {
        citations.push({
          sourceNumber: sourceNum + 1,
          filename: searchResults[sourceNum].filename,
          documentId: searchResults[sourceNum].document_id,
          chunkIndex: searchResults[sourceNum].chunk_index,
          content: searchResults[sourceNum].content,
        });
      }
    }

    return citations;
  }
}
```

## 9. API Routes

**File**: `app/api/rag/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/rag/document-processor';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const collectionId = formData.get('collectionId') as string;
  const userId = req.headers.get('x-user-id')!; // From auth middleware

  if (!file || !collectionId) {
    return NextResponse.json(
      { error: 'File and collectionId required' },
      { status: 400 }
    );
  }

  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large (max 50MB)' },
      { status: 400 }
    );
  }

  try {
    const documentId = await DocumentProcessor.processDocument(file, collectionId, userId);

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document uploaded and processing',
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/rag/query/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { RAGQuery } from '@/lib/rag/query';

export async function POST(req: NextRequest) {
  const { question, collectionId, modelId } = await req.json();

  if (!question || !collectionId) {
    return NextResponse.json(
      { error: 'Question and collectionId required' },
      { status: 400 }
    );
  }

  try {
    const response = await RAGQuery.query(question, collectionId, modelId || 'anthropic/claude-sonnet-4');

    return NextResponse.json(response);
  } catch (error) {
    console.error('RAG query error:', error);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
```

## 10. UI Components

**File**: `components/rag/document-upload.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

export function DocumentUpload({ collectionId }: { collectionId: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collectionId', collectionId);

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Document uploaded:', data.documentId);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <input
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {uploading ? (
          <Loader2 className="h-12 w-12 mx-auto animate-spin" />
        ) : (
          <Upload className="h-12 w-12 mx-auto" />
        )}
        <p className="mt-4 text-sm text-gray-600">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          PDF, DOCX, TXT, MD (max 50MB)
        </p>
      </label>
    </div>
  );
}
```

**File**: `components/rag/rag-chat.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Message, Citation } from '@/types';

export function RAGChat({ collectionId }: { collectionId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          collectionId,
          modelId: 'anthropic/claude-sonnet-4',
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
        },
      ]);
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, idx) => (
          <div key={idx} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}

              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                  <p className="font-semibold">Sources:</p>
                  {message.citations.map((citation, citIdx) => (
                    <p key={citIdx}>
                      [{citation.sourceNumber}] {citation.filename}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-center text-gray-500">Thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="w-full px-4 py-2 border rounded-lg"
          disabled={loading}
        />
      </form>
    </div>
  );
}
```

## 11. Advanced Features

### Multi-Document Comparison

```typescript
async function compareDocuments(question: string, documentIds: string[]) {
  const results = await Promise.all(
    documentIds.map(id => RAGQuery.query(question, id, 'anthropic/claude-sonnet-4'))
  );

  // Compare answers across documents
  return results;
}
```

### Hybrid Search (Keyword + Semantic)

```typescript
async function hybridSearch(query: string, collectionId: string) {
  // 1. Semantic search
  const semanticResults = await SemanticSearch.search(query, collectionId, 10);

  // 2. Keyword search (full-text search)
  const keywordResults = await db.query(`
    SELECT * FROM document_chunks
    WHERE collection_id = $1 AND content ILIKE $2
    LIMIT 10
  `, [collectionId, `%${query}%`]);

  // 3. Merge and re-rank
  return mergeResults(semanticResults, keywordResults.rows);
}
```

### Reranking

Use a reranking model to improve search quality:

```typescript
import { Cohere } from 'cohere-ai';

const cohere = new Cohere({ apiKey: process.env.COHERE_API_KEY });

async function rerankResults(query: string, results: SearchResult[]) {
  const reranked = await cohere.rerank({
    query,
    documents: results.map(r => r.content),
    topN: 5,
  });

  return reranked.results.map(r => results[r.index]);
}
```

## 12. Cost Analysis

### Embedding Costs

**text-embedding-3-small**: $0.02 per 1M tokens
- 100-page PDF: ~50k tokens
- Embedding cost: $0.001
- Per user per month (10 docs): ~$0.01

**Storage Costs** (pgvector):
- Embedding size: 1536 dimensions × 4 bytes = 6KB per chunk
- 100 chunks per document: 600KB
- 1000 users × 10 docs: 6GB storage (~$1/month)

**Query Costs**:
- Vector search: Nearly free (database operation)
- AI generation: Standard model costs (but reduced via RAG!)

### ROI

**Without RAG**:
- Send entire 50k token document with each question
- 10 questions = 500k tokens
- Cost: $1.50 (at $3/1M tokens for Claude Sonnet)

**With RAG**:
- Send only 5k tokens (top chunks)
- 10 questions = 50k tokens
- Cost: $0.15
- **Savings: 90%**

## 13. Implementation Checklist

- [ ] Set up vector database (Supabase/pgvector)
- [ ] Create database schema for documents and embeddings
- [ ] Implement document processor (PDF, DOCX, TXT parsing)
- [ ] Implement text chunking
- [ ] Integrate embedding generation (OpenAI)
- [ ] Build semantic search
- [ ] Create RAG query handler
- [ ] Build API routes (upload, query, list)
- [ ] Design UI for document upload
- [ ] Build RAG chat interface
- [ ] Add citation display
- [ ] Implement document management (list, delete)
- [ ] Add collection/knowledge base management
- [ ] Test with various document types
- [ ] Optimize chunk size and overlap
- [ ] Add reranking (optional)
- [ ] Build analytics dashboard

## 14. Testing Plan

### Unit Tests
- Document parsing (PDF, DOCX, TXT)
- Text chunking
- Embedding generation
- Vector similarity search

### Integration Tests
- Full document upload pipeline
- RAG query with mock data
- Citation extraction

### E2E Tests
- Upload document, verify processing
- Ask question, verify cited answer
- Multi-document search

---

**Document Version**: 1.0
**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Planning Phase
**Priority**: High (Premium tier feature)
**Estimated Effort**: 2-3 weeks
**Expected Value**: 90% cost reduction for document workflows
