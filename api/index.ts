import { handle } from "hono/vercel";
import app from "../src/app";

// Vercel entry. The whole app runs as one Node function; vercel.json rewrites
// every path to it (static files in public/ are served first by the platform).
export const config = { runtime: "nodejs" };

export default handle(app);
