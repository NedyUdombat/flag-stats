"use client";

import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/primitives/button";
import { cn } from "@/utils/cn";
import { ACCEPT, useImageUpload } from "./use-image-upload";

interface ImageUploadProps {
  /** Hidden input name, submitted with the surrounding <form>. */
  name: string;
  label: string;
  defaultValue?: string | null;
  shape?: "circle" | "square";
}

export function ImageUpload({
  name,
  label,
  defaultValue,
  shape = "square",
}: ImageUploadProps) {
  const u = useImageUpload(defaultValue);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={u.value} />
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted",
            shape === "circle" ? "rounded-full" : "rounded-md",
          )}
        >
          {u.uploading ? (
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          ) : u.previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs
            <Image
              src={u.previewSrc}
              alt=""
              className="size-full object-cover"
            />
            // <img src={u.previewSrc} alt="" className="size-full object-cover" />
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
              disabled={u.uploading}
              onClick={u.pick}
            >
              <UploadIcon className="size-4" />
              {u.value
                ? `Change ${label.toLowerCase()}`
                : `Upload ${label.toLowerCase()}`}
            </Button>
            {u.value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={u.uploading}
                onClick={u.remove}
              >
                <XIcon className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={u.inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={u.onFileChange}
          />
          {u.error ? (
            <p className="text-xs text-destructive">{u.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
