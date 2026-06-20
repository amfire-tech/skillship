/*
 * File:    frontend/src/lib/logo.ts
 * Purpose: Read a picked image File into a base64 data-URL for the school-logo
 *          field. Logos are stored inline on the School record (no media-server
 *          infra), so the browser does the encoding and sends a plain JSON
 *          string. Mirrors the backend cap in apps/schools/serializers.py.
 * Owner:   Pranav
 */

// ~700k chars of base64 ≈ a ~512 KB image — matches MAX_LOGO_CHARS on the API.
export const MAX_LOGO_CHARS = 700_000;
export const ACCEPTED_LOGO_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG, WEBP or SVG).");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
  if (dataUrl.length > MAX_LOGO_CHARS) {
    throw new Error("That image is too large. Please use a logo under ~500 KB.");
  }
  return dataUrl;
}
