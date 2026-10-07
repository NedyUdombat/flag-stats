import "server-only";
import { createHash } from "node:crypto";
import { logServerError } from "@/lib/errors";
import { publicIdFromUrl } from "./url";

export async function deleteCloudinaryImage(
  url: string | null | undefined,
): Promise<void> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const publicId = url ? publicIdFromUrl(url) : null;
  if (!publicId || !cloud || !key || !secret) return;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(
      `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${secret}`,
    )
    .digest("hex");

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
      {
        method: "POST",
        body: new URLSearchParams({
          public_id: publicId,
          timestamp,
          api_key: key,
          signature,
          invalidate: "true",
        }),
      },
    );
    if (!res.ok)
      logServerError("cloudinary.destroy", new Error(`HTTP ${res.status}`));
  } catch (e) {
    logServerError("cloudinary.destroy", e);
  }
}

export async function cleanupReplacedImage(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
): Promise<void> {
  if (oldUrl && oldUrl !== newUrl) await deleteCloudinaryImage(oldUrl);
}
