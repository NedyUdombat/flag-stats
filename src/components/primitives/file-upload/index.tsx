"use client";

import { FileIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/primitives/button";

interface FileUploadProps {
  name: string;
  label: string;
  defaultValue?: string | null;
}

export function FileUpload({ name, label, defaultValue }: FileUploadProps) {
  const [url, setUrl] = useState<string | null>(defaultValue ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData },
      );
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setUrl(data.secure_url);
    } catch {
      setError("Could not upload file. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url ?? ""} />
      <label htmlFor="fileUpload" className="text-sm font-medium">
        {label}
      </label>

      {url ? (
        <div className="flex items-center justify-between rounded-md border p-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <FileIcon className="size-4" />
            Attachment uploaded
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setUrl(null)}
            aria-label="Remove attachment"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            id="fileUpload"
            type="file"
            accept="image/*,application/pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm"
          />
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
