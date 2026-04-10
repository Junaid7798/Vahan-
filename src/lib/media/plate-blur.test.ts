/* @vitest-environment node */

import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { blurPlateRegion } from "./plate-blur";

describe("blurPlateRegion", () => {
  it("returns a blurred webp variant with the same dimensions", async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 450,
        channels: 3,
        background: "#d4d4d8",
      },
    })
      .composite([
        {
          input: {
            create: {
              width: 260,
              height: 70,
              channels: 3,
              background: "#111827",
            },
          },
          left: 270,
          top: 300,
        },
      ])
      .png()
      .toBuffer();

    const blurred = await blurPlateRegion(source);
    const metadata = await sharp(blurred.buffer).metadata();

    expect(blurred.contentType).toBe("image/webp");
    expect(blurred.extension).toBe("webp");
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(450);
    expect(blurred.buffer.equals(source)).toBe(false);
  });
});
