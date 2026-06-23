import { FastifyInstance } from "fastify";
import type { EventBus } from "../../../ports/EventBus.js";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function kbEventsRoutes(app: FastifyInstance, eventBus: EventBus) {
  app.get("/kb/events", async (req, reply) => {
    reply.hijack();
    const res = reply.raw;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");

    const tenantId = req.tenantId;

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.tenantId !== tenantId) return;
      const { tenantId: _omit, type, ...payload } = event;
      res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, HEARTBEAT_INTERVAL_MS);

    req.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
}
