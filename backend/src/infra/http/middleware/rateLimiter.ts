import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { config } from "../../../config/index.js";

export const rateLimiter = fp(async (app: FastifyInstance) => {
  if (!config.rateLimit.enabled) return;

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
  });
});
