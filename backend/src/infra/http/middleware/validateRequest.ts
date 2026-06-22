import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError, ZodType } from "zod";

export function validate(schema: ZodType, target: "body" | "query" = "body") {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      req[target] = schema.parse(req[target]);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      throw err;
    }
  };
}
