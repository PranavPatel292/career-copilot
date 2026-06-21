import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ImportFromGitHub } from "../../../use-cases/ImportFromGitHub.js";
import { validate } from "../middleware/validateRequest.js";

const githubSchema = z.object({
  username: z.string().min(1, "GitHub username is required"),
  token: z.string().optional(),
});

export function githubRoutes(
  app: FastifyInstance,
  importGithub: ImportFromGitHub,
) {
  app.post(
    "/ingest/github",
    {
      preHandler: validate(githubSchema),
    },
    async (req, reply) => {
      const { username, token } = req.body as {
        username: string;
        token?: string;
      };
      const result = await importGithub.execute(req.tenantId, username, token);
      return reply.status(201).send(result);
    },
  );
}
