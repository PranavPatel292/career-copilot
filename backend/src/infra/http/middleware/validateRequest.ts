import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError, ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      req.body = schema.parse(req.body);
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
