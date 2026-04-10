import "server-only";

import sharp from "sharp";

const BLUR_SIGMA = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPlateRegion(width: number, height: number) {
  const regionWidth = clamp(Math.round(width * 0.34), 120, width);
  const regionHeight = clamp(Math.round(height * 0.12), 36, height);
  const left = clamp(Math.round((width - regionWidth) / 2), 0, Math.max(0, width - regionWidth));
  const top = clamp(Math.round(height * 0.72), 0, Math.max(0, height - regionHeight));

  return {
    height: regionHeight,
    left,
    top,
    width: regionWidth,
  };
}

export async function blurPlateRegion(buffer: Buffer) {
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions for plate blur.");
  }

  const region = getPlateRegion(metadata.width, metadata.height);
  const plateRegion = await image.clone().extract(region).blur(BLUR_SIGMA).toBuffer();
  const blurred = await image
    .composite([{ input: plateRegion, left: region.left, top: region.top }])
    .webp({ quality: 84 })
    .toBuffer();

  return {
    buffer: blurred,
    contentType: "image/webp" as const,
    extension: "webp" as const,
  };
}
