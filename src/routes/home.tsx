import { Hono } from "hono";
import { Layout } from "../views/layout.js";
import { HomePage } from "../views/home.js";

export const home = new Hono();

home.get("/", (c) => c.html(<Layout><HomePage /></Layout>));
