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
    <div className="space-y-3">
      <input type="hidden" name={name} value={u.value} />

      <div
        className={cn(
          "flex flex-col items-center gap-5 rounded-xl px-0 py-5 text-center transition-colors",
          "hover:border-border/90",
        )}
      >
        {/* Image Preview */}
        <div
          className={cn(
            "relative flex size-28 shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted/30",
            shape === "circle" ? "rounded-full" : "rounded-xl",
          )}
        >
          {u.uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2Icon className="size-7 animate-spin text-accent-gold" />
            </div>
          ) : u.previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs
            <Image
              src={u.previewSrc}
              alt={`${label} preview`}
              className="size-full object-cover"
              width={112}
              height={112}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="size-8 opacity-50" />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                No image
              </span>
            </div>
          )}
        </div>

        {/* Upload Content */}
        <div className="flex w-full flex-col items-center gap-3">
          {/* Actions */}
          <div className="flex flex-col w-full items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={u.uploading}
              onClick={u.pick}
              className="gap-2 px-4 py-2 font-sans font-normal w-full flex-1"
            >
              {u.uploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}

              {u.value
                ? `Change ${label.toLowerCase()}`
                : `Upload ${label.toLowerCase()}`}
            </Button>

            {u.value && (
              <Button
                type="button"
                variant="accent"
                size="sm"
                disabled={u.uploading}
                onClick={u.remove}
                className="gap-2 px-4 py-2  w-full flex-1 font-sans font-normal text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-4" />
                Remove
              </Button>
            )}
          </div>

          {/* File Input */}
          <input
            ref={u.inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={u.onFileChange}
          />

          {u.error && (
            <p className="w-full text-xs text-destructive">{u.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
