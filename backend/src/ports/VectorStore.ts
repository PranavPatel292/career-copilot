export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  text: string;
  score: number;
}

export interface VectorStore {
  upsert(
    chunks: {
      id: string;
      tenantId: string;
      documentId: string;
      ordinal: number;
      text: string;
      embedding: number[];
    }[],
  ): Promise<void>;

  search(
    tenantId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]>;

  deleteByDocument(tenantId: string, documentId: string): Promise<void>;

  replaceDocumentChunks(
    tenantId: string,
    documentId: string,
    chunks: {
      id: string;
      tenantId: string;
      documentId: string;
      ordinal: number;
      text: string;
      embedding: number[];
    }[],
  ): Promise<void>;
}
