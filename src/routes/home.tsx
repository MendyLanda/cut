import { Hono } from "hono";
import { envVar } from "../../lib/env.js";
import { Layout } from "../views/layout.js";
import { HomePage } from "../views/home.js";

export const home = new Hono();

home.get("/", (c) => {
  switch (envVar("HOME_PAGE")) {
    case "404":
      return c.body(null, 404);
    case "admin":
      return c.redirect("/admin");
    default:
      return c.html(
        <Layout>
          <HomePage />
        </Layout>,
      );
  }
});
