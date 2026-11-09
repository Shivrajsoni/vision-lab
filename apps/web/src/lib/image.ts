export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export class ImageLoadError extends Error {}

export interface LoadedImage {
  bitmap: ImageBitmap;
  name: string;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Decode a user-chosen file into pixels, entirely in the browser.
 * Decoding (rather than trusting the file) rejects anything that is not really an image,
 * and applies the camera's rotation so models see the photo the right way up.
 */
export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageLoadError("That file is not an image. Choose a JPEG, PNG or WebP.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageLoadError("That image is larger than 20 MB. Choose a smaller one.");
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { bitmap, name: file.name, originalWidth: bitmap.width, originalHeight: bitmap.height };
  } catch {
    throw new ImageLoadError("This browser could not read that image. Try a JPEG or PNG.");
  }
}

/** Size after shrinking so the longer side is at most `maxSide`. Never enlarges. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Draw `source` to fill a w×h canvas, cropping the overflow (like CSS object-fit: cover). */
export function drawCover(ctx: CanvasRenderingContext2D, source: ImageBitmap, w: number, h: number): void {
  const scale = Math.max(w / source.width, h / source.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(source, (source.width - sw) / 2, (source.height - sh) / 2, sw, sh, 0, 0, w, h);
}
