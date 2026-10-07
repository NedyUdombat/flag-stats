"use client";

import { type ChangeEvent, useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT = ALLOWED_TYPES.join(",");

export function useImageUpload(defaultValue?: string | null) {
  const [value, setValue] = useState(defaultValue ?? ""); // only ever a finished URL
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;
    setError(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError(
        "Image upload isn't configured yet (missing Cloudinary environment variables).",
      );
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body,
        },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data: { secure_url: string } = await res.json();
      setValue(data.secure_url);
    } catch {
      setError("Couldn't upload that image. Please try again.");
    } finally {
      setUploading(false);
      setLocalPreview(null);
      URL.revokeObjectURL(preview);
    }
  }

  return {
    value,
    previewSrc: localPreview ?? value,
    uploading,
    error,
    inputRef,
    onFileChange,
    pick: () => inputRef.current?.click(),
    remove: () => setValue(""),
  };
}

export { MAX_BYTES };
