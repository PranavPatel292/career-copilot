import { z } from "zod";

export const ingestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  text: z.string().min(10, "Text too short to be useful"),
});

export const querySchema = z.object({
  question: z.string().min(3, "Question too short"),
});
