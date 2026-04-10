import { describe, expect, it } from "vitest";
import {
  buildVehicleMediaRows,
  getNewStoragePaths,
  selectVehicleMediaVariants,
} from "./vehicle-media-variants";

describe("vehicle media variants", () => {
  it("builds original and blurred media rows for persistence", () => {
    expect(
      buildVehicleMediaRows("listing-1", [
        {
          blurredStoragePath: "listing-1/photo-1-blurred.webp",
          displayOrder: 1,
          originalStoragePath: "listing-1/photo-1.webp",
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        display_order: 1,
        is_blurred: false,
        listing_id: "listing-1",
        storage_path: "listing-1/photo-1.webp",
      }),
      expect.objectContaining({
        display_order: 1,
        is_blurred: true,
        listing_id: "listing-1",
        storage_path: "listing-1/photo-1-blurred.webp",
      }),
    ]);
  });

  it("tracks newly created original and blurred storage paths", () => {
    expect(
      getNewStoragePaths(
        [
          {
            blurredStoragePath: "listing-1/existing-blurred.webp",
            displayOrder: 1,
            originalStoragePath: "listing-1/existing.webp",
            storagePath: "listing-1/existing.webp",
          },
          {
            displayOrder: 2,
            storagePath: "data:image/webp;base64,AAAA",
          },
        ],
        [
          {
            blurredStoragePath: "listing-1/existing-blurred.webp",
            displayOrder: 1,
            originalStoragePath: "listing-1/existing.webp",
          },
          {
            blurredStoragePath: "listing-1/new-blurred.webp",
            displayOrder: 2,
            originalStoragePath: "listing-1/new.webp",
          },
        ],
      ),
    ).toEqual(["listing-1/new.webp", "listing-1/new-blurred.webp"]);
  });

  it("selects the right variant for public and staff viewers", () => {
    const rows = [
      {
        display_order: 1,
        id: "original-1",
        is_blurred: false,
        media_type: "image",
        storage_path: "listing-1/photo-1.webp",
      },
      {
        display_order: 1,
        id: "blurred-1",
        is_blurred: true,
        media_type: "image",
        storage_path: "listing-1/photo-1-blurred.webp",
      },
    ];

    expect(selectVehicleMediaVariants(rows, false)).toEqual([
      expect.objectContaining({
        blurredStoragePath: "listing-1/photo-1-blurred.webp",
        originalStoragePath: "listing-1/photo-1.webp",
        storagePath: "listing-1/photo-1-blurred.webp",
      }),
    ]);

    expect(selectVehicleMediaVariants(rows, true)).toEqual([
      expect.objectContaining({
        blurredStoragePath: "listing-1/photo-1-blurred.webp",
        originalStoragePath: "listing-1/photo-1.webp",
        storagePath: "listing-1/photo-1.webp",
      }),
    ]);
  });
});
