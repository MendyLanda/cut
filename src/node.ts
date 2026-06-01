import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./app";

// Self-hosted / Docker entry. A persistent Node server serving the same app,
// with static files (built CSS, client JS, icons) served from ./public first.
const server = new Hono();
server.use("/*", serveStatic({ root: "./public" }));
server.route("/", app);

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

serve({ fetch: server.fetch, port, hostname }, (info) => {
  console.log(`Cut listening on http://${hostname}:${info.port}`);
});
