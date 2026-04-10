/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { blurPlateRegion } from "@/lib/media/plate-blur";
import { uploadVehicleMedia } from "./portal-storage";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/media/plate-blur", () => ({
  blurPlateRegion: vi.fn(),
}));

describe("uploadVehicleMedia", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(blurPlateRegion).mockResolvedValue({
      buffer: Buffer.from("blurred-image"),
      contentType: "image/webp",
      extension: "webp",
    });
  });

  it("uploads original and blurred variants for new images", async () => {
    const uploadCalls: Array<{ path: string; type?: string }> = [];
    const client = {
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(),
          upload: vi.fn(async (path: string, _buffer: Buffer, options: { contentType?: string }) => {
            uploadCalls.push({ path, type: options.contentType });
            return { error: null };
          }),
        })),
      },
    };

    vi.mocked(createAdminClient).mockReturnValue(client as never);

    const uploaded = await uploadVehicleMedia("listing-1", [
      {
        displayOrder: 1,
        storagePath: "data:image/png;base64,AAAA",
      },
    ]);

    expect(uploadCalls).toHaveLength(2);
    expect(uploadCalls[0]?.path).toMatch(/^listing-1\/.+\.png$/);
    expect(uploadCalls[1]?.path).toMatch(/^listing-1\/.+-blurred\.webp$/);
    expect(uploaded).toEqual([
      expect.objectContaining({
        blurredStoragePath: expect.stringMatching(/^listing-1\/.+-blurred\.webp$/),
        displayOrder: 1,
        originalStoragePath: expect.stringMatching(/^listing-1\/.+\.png$/),
      }),
    ]);
  });
});
