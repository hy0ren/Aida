import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return;
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Accepts a full data URL (`data:...;base64,...`) or raw base64 (treated as octet-stream).
 */
export async function uploadBase64ToCloudinary(
  dataUriOrBase64: string,
  options: { folder: string; publicId: string }
): Promise<{ secureUrl: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  ensureConfigured();
  const data = dataUriOrBase64.trim().startsWith("data:")
    ? dataUriOrBase64.trim()
    : `data:application/octet-stream;base64,${dataUriOrBase64.trim()}`;

  const res = await cloudinary.uploader.upload(data, {
    folder: options.folder,
    public_id: options.publicId,
    resource_type: "auto",
  });

  return { secureUrl: res.secure_url, publicId: res.public_id };
}
