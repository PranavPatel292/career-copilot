import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800, // characters per chunk
  chunkOverlap: 100, // overlap to preserve context across boundaries
});

export async function chunkText(text: string): Promise<string[]> {
  return splitter.splitText(text);
}
