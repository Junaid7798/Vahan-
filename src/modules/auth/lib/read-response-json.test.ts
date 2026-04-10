import { describe, expect, it } from "vitest";
import { readResponseJson } from "./read-response-json";

describe("readResponseJson", () => {
  it("parses JSON response bodies", async () => {
    const response = new Response(JSON.stringify({ error: "Invalid credentials" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });

    await expect(readResponseJson<{ error: string }>(response)).resolves.toEqual({
      error: "Invalid credentials",
    });
  });

  it("returns null for non-JSON response bodies", async () => {
    const response = new Response('<div class="error">Something broke</div>', {
      headers: { "Content-Type": "text/html" },
      status: 500,
    });

    await expect(readResponseJson<{ error: string }>(response)).resolves.toBeNull();
  });
});
