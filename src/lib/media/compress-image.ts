export interface CompressedImageResult {
  blurredStoragePath?: string;
  compressedSize: number;
  dataUrl: string;
  fileName: string;
  originalSize: number;
  originalStoragePath?: string;
  storagePath?: string;
}

async function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be loaded."));
    };
    image.src = url;
  });
}

export async function compressImageFile(file: File) {
  const image = await loadImage(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not available in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("The image could not be compressed."));
        return;
      }
      resolve(result);
    }, "image/webp", 0.84);
  });

  return {
    compressedSize: blob.size,
    dataUrl: await readAsDataUrl(blob),
    fileName: file.name,
    originalSize: file.size,
  } satisfies CompressedImageResult;
}
