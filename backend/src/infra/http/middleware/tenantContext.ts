import { FastifyInstance, FastifyRequest } from "fastify";

import fp from "fastify-plugin";
import { config } from "../../../config";

declare module "fastify" {
  interface FastifyRequest {
    tenantId: string;
  }
}

export const tenantContext = fp(async (app: FastifyInstance) => {
  app.decorateRequest("tenantId", "");

  app.addHook("preHandler", async (req: FastifyRequest) => {
    if (config.auth.mode === "dev") {
      // V1: fixed dev tenant
      req.tenantId = "t_dev";
    } else {
      // V2: extract from JWT / Cognito token
      const header = req.headers.authorization;
      if (!header) throw { statusCode: 401, message: "Missing auth" };
      // TODO: validate token, extract tenantId
      req.tenantId = "t_from_token";
    }
  });
});
