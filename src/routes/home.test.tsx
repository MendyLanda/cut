import assert from "node:assert/strict";
import { describe, it } from "node:test";
import app from "../app.js";

async function requestHome(mode?: string): Promise<Response> {
  const previous = process.env.HOME_PAGE;

  if (mode === undefined) delete process.env.HOME_PAGE;
  else process.env.HOME_PAGE = mode;

  try {
    return await app.request("http://localhost/");
  } finally {
    if (previous === undefined) delete process.env.HOME_PAGE;
    else process.env.HOME_PAGE = previous;
  }
}

describe("GET /", () => {
  it("renders the landing page when HOME_PAGE is not set", async () => {
    const response = await requestHome();

    assert.equal(response.status, 200);
    assert.match(await response.text(), /Cut your links/);
  });

  it("renders the landing page when HOME_PAGE is default", async () => {
    const response = await requestHome("default");

    assert.equal(response.status, 200);
    assert.match(await response.text(), /Cut your links/);
  });

  it("returns an empty 404 when HOME_PAGE is 404", async () => {
    // Passing bindings here exercises the Cloudflare request-env path. The
    // other cases use process.env, as Node and Vercel do.
    const response = await app.request("http://localhost/", undefined, {
      HOME_PAGE: "404",
    });

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "");
  });

  it("redirects to the admin page when HOME_PAGE is admin", async () => {
    const response = await requestHome("admin");

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/admin");
  });

  it("falls back to the landing page for an unknown value", async () => {
    const response = await requestHome("unknown");

    assert.equal(response.status, 200);
    assert.match(await response.text(), /Cut your links/);
  });
});
