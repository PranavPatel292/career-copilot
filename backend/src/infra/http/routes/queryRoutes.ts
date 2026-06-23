import { FastifyInstance, FastifyReply } from "fastify";
import { config } from "../../../config/index.js";
import type { StreamEvent } from "../../../domain/entities.js";
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
      const wantsSse = req.headers.accept === "text/event-stream";

      if (!wantsSse) {
        try {
          const answer = await answerQuery.execute(req.tenantId, question);
          return reply.send(answer);
        } catch (err: any) {
          return handleGuardError(err, reply);
        }
      }

      const stream = answerQuery.executeStream(req.tenantId, question);

      // Peek the first event before touching the response: InputGuard runs
      // lazily inside prepare(), which only executes on the first .next()
      // call, not when the generator function itself is invoked above. So
      // a guard rejection can still be caught here and mapped to 422 JSON
      // instead of a half-opened SSE stream.
      let first: IteratorResult<StreamEvent>;
      try {
        first = await stream.next();
      } catch (err: any) {
        return handleGuardError(err, reply);
      }

      if (first.done) {
        return reply.status(500).send({ error: "Empty stream" });
      }

      if (first.value.type === "instant") {
        // Cache hit or low-confidence refusal — send plain JSON even though
        // the client asked for SSE, same as the non-streaming path.
        return reply.send(first.value.answer);
      }

      reply.hijack();
      const res = reply.raw;
      // reply.hijack() bypasses Fastify's normal response pipeline, which is
      // where @fastify/cors injects Access-Control-Allow-Origin — so it has
      // to be set by hand here, same as kbEventsRoutes.ts.
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": config.cors.origin,
      });

      const writeEvent = (event: StreamEvent) => {
        const { type, ...payload } = event;
        res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
      };

      writeEvent(first.value);
      for await (const event of stream) {
        writeEvent(event);
      }
      res.end();
    },
  );
}

function handleGuardError(err: any, reply: FastifyReply) {
  if (err.message?.includes("rejected") || err.message?.includes("too long")) {
    return reply.status(422).send({ error: err.message });
  }
  throw err;
}
