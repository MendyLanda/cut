import { Hono } from "hono";
import { Layout } from "../views/layout";
import { HomePage } from "../views/home";

export const home = new Hono();

home.get("/", (c) => c.html(<Layout><HomePage /></Layout>));
