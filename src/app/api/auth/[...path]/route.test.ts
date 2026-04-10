/* @vitest-environment node */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPendingDemoUser } from "@/lib/demo/portal-users";
import { POST } from "./route";

vi.mock("@/lib/demo/portal-users", () => ({
  createPendingDemoUser: vi.fn(),
}));

describe("auth route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("returns a JSON error response when demo signup persistence fails", async () => {
    vi.mocked(createPendingDemoUser).mockRejectedValue(new Error("Disk write failed"));

    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "Mumbai",
        email: "user@example.com",
        fullName: "Test User",
        password: "password123",
        phone: "9999999999",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ["signup"] }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.any(String),
      }),
    );
  });
});
