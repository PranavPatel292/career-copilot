import { LocalEmbeddingProvider } from "../infra/LocalEmbeddingProvider.js";

const provider = new LocalEmbeddingProvider();
const [react, frameworks, sourdough] = await provider.embed([
  "I build frontends with React",
  "I work with component-based UI frameworks",
  "I bake sourdough bread on weekends",
]);

const cos = (x: number[], y: number[]) =>
  x.reduce((s, xi, i) => s + xi * y[i], 0);
console.log("dimensions:", react.length);
console.log(
  "react ↔ frameworks (should be high):",
  cos(react, frameworks).toFixed(3),
);
console.log(
  "react ↔ sourdough (should be low):  ",
  cos(react, sourdough).toFixed(3),
);
