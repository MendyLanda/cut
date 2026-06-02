import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { Layout } from "./views/layout.js";
import { NotFoundPage } from "./views/not-found.js";
import { home } from "./routes/home.js";
import { admin } from "./routes/admin.js";
import { keepalive } from "./routes/keepalive.js";
import { link } from "./routes/link.js";

export const app = new Hono();

// First: expose the request Context to lib/* (store, auth, ratelimit) via
// AsyncLocalStorage, so they can read the Cloudflare KV binding, cookies, and
// headers without `c` being threaded through every call.
app.use("*", contextStorage());

app.route("/", home);
app.route("/", keepalive);
app.route("/", admin);
// Last: the catch-all `/:slug` param route must not shadow the static routes
// above. Hono's router prioritizes static segments, but registering it last
// keeps intent obvious.
app.route("/", link);

app.notFound((c) =>
  c.html(
    <Layout title="Not found — Cut">
      <NotFoundPage />
    </Layout>,
    404,
  ),
);

export default app;
