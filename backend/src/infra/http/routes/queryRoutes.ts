import { FastifyInstance } from "fastify";
import { AnswerCareerQuery } from "../../../use-cases/AnswerCareerQuery.js";
import { validate } from "../middleware/validateRequest.js";
import { querySchema } from "../schema/index.js";

export function queryRoutes(
  app: FastifyInstance,
  answerQuery: AnswerCareerQuery,
) {
  app.post(
    "/query",
    {
      preHandler: validate(querySchema),
    },
    async (req, reply) => {
      const { question } = req.body as { question: string };

      try {
        const answer = await answerQuery.execute(req.tenantId, question);
        return reply.send(answer);
      } catch (err: any) {
        // InputGuard rejections come as thrown errors
        if (
          err.message?.includes("rejected") ||
          err.message?.includes("too long")
        ) {
          return reply.status(422).send({ error: err.message });
        }
        throw err;
      }
    },
  );
}
