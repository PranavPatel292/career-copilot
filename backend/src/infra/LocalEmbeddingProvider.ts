import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import { EmbeddingProvider } from "../ports/EmbeddingProvider";

// 384-dim, small & fast. Drop-in upgrade later: "Xenova/bge-small-en-v1.5" (also 384).
const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";

export class LocalEmbeddingProvider implements EmbeddingProvider {
  private extractor: Promise<FeatureExtractionPipeline>;

  constructor(model: string = DEFAULT_MODEL) {
    this.extractor = pipeline("feature-extraction", model);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const extractor = await this.extractor;
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return output.tolist() as number[][];
  }
}
