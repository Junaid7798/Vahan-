export interface MediaInput {
  blurredStoragePath?: string;
  displayOrder: number;
  originalStoragePath?: string;
  storagePath: string;
}

export interface PersistedVehicleMedia {
  blurredStoragePath: string;
  displayOrder: number;
  originalStoragePath: string;
}

interface VehicleMediaVariantRow {
  display_order?: number | null;
  id: string;
  is_blurred?: boolean | null;
  media_type?: string | null;
  storage_path: string;
}

export function buildVehicleMediaRows(listingId: string, media: PersistedVehicleMedia[]) {
  return media.flatMap((item) => [
    {
      display_order: item.displayOrder,
      is_blurred: false,
      listing_id: listingId,
      media_type: "image",
      storage_path: item.originalStoragePath,
    },
    {
      display_order: item.displayOrder,
      is_blurred: true,
      listing_id: listingId,
      media_type: "image",
      storage_path: item.blurredStoragePath,
    },
  ]);
}

export function getNewStoragePaths(inputMedia: MediaInput[], persistedMedia: PersistedVehicleMedia[]) {
  const knownPaths = new Set(
    inputMedia.flatMap((item) =>
      [item.storagePath, item.originalStoragePath, item.blurredStoragePath].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  return persistedMedia
    .flatMap((item) => [item.originalStoragePath, item.blurredStoragePath])
    .filter((path) => !knownPaths.has(path));
}

export function selectVehicleMediaVariants(
  rows: VehicleMediaVariantRow[],
  preferOriginal: boolean,
) {
  const grouped = rows.reduce<Map<number, VehicleMediaVariantRow[]>>((map, row) => {
    const displayOrder = row.display_order ?? 0;
    const current = map.get(displayOrder) ?? [];
    current.push(row);
    map.set(displayOrder, current);
    return map;
  }, new Map());

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left - right)
    .flatMap(([displayOrder, variants]) => {
      const original = variants.find((item) => !item.is_blurred);
      const blurred = variants.find((item) => item.is_blurred);
      const selected = preferOriginal ? original ?? blurred : blurred ?? original;

      if (!selected) {
        return [];
      }

      return [
        {
          blurredStoragePath: blurred?.storage_path,
          displayOrder,
          id: selected.id,
          isBlurred: Boolean(selected.is_blurred),
          mediaType: selected.media_type ?? "image",
          originalStoragePath: original?.storage_path,
          storagePath: selected.storage_path,
        },
      ];
    });
}
