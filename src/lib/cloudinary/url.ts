const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function isOwnImageUrl(value: string): boolean {
  if (!CLOUD) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(`/${CLOUD}/image/upload/`)
    );
  } catch {
    return false;
  }
}

export function publicIdFromUrl(value: string): string | null {
  if (!isOwnImageUrl(value)) return null;
  const rest = new URL(value).pathname.split("/image/upload/")[1];
  if (!rest) return null;
  const parts = rest.split("/");
  const v = parts.findIndex((p) => /^v\d+$/.test(p));
  const idParts = v >= 0 ? parts.slice(v + 1) : parts;
  if (idParts.length === 0) return null;
  idParts[idParts.length - 1] = idParts[idParts.length - 1].replace(
    /\.[A-Za-z0-9]+$/,
    "",
  );
  return decodeURIComponent(idParts.join("/"));
}
