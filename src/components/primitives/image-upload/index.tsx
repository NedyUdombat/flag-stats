"use client";

import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/primitives/button";
import { cn } from "@/utils/cn";

interface ImageUploadProps {
  /** Hidden input name — this is what actually submits with the surrounding <form>, same as a text URL field would have. */
  name: string;
  label: string;
  defaultValue?: string | null;
  shape?: "circle" | "square";
}

/**
 * Uploads directly to Cloudinary from the browser using an unsigned upload
 * preset (no server round-trip, no API secret ever touches the client —
 * only the cloud name + preset name, both public/safe by design once the
 * preset itself is configured with restrictions in the Cloudinary
 * dashboard: allowed formats, max file size, folder). The resulting
 * secure_url is written into a hidden input with `name`, so every existing
 * form/action that expected a plain "photoUrl"/"logoUrl" text field keeps
 * working unchanged — this component is a drop-in replacement for that
 * text input, not a new data path.
 */
export function ImageUpload({
  name,
  label,
  defaultValue,
  shape = "square",
}: ImageUploadProps) {
  const [preview, setPreview] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!cloudName || !uploadPreset) {
      setError(
        "Image upload isn't configured yet (missing Cloudinary environment variables).",
      );
      return;
    }

    // Instant local preview while the real upload is in flight.
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data: { secure_url: string } = await response.json();
      setPreview(data.secure_url);
    } catch {
      setError("Couldn't upload that image. Please try again.");
      setPreview(defaultValue ?? "");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={preview} />
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted",
            shape === "circle" ? "rounded-full" : "rounded-md",
          )}
        >
          {uploading ? (
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external Cloudinary URLs, not a domain we can allowlist for next/image
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="size-4" />
              {preview
                ? `Change ${label.toLowerCase()}`
                : `Upload ${label.toLowerCase()}`}
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => setPreview("")}
              >
                <XIcon className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
