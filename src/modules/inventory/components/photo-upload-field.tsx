"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { compressImageFile, CompressedImageResult } from "@/lib/media/compress-image";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PhotoUploadFieldProps {
  onChange: (items: CompressedImageResult[]) => void;
  value: CompressedImageResult[];
}

function formatSize(size: number) {
  return `${(size / 1024).toFixed(0)} KB`;
}

export function PhotoUploadField({ onChange, value }: PhotoUploadFieldProps) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    startTransition(async () => {
      try {
        const compressed = await Promise.all(files.map((file) => compressImageFile(file)));
        onChange([...value, ...compressed]);
        toast({ title: "Photos prepared", description: "Images were compressed before upload to reduce storage usage." });
      } catch (error) {
        toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Images could not be prepared.", variant: "destructive" });
      }
    });
  }

  function removeImage(fileName: string) {
    onChange(value.filter((item) => item.fileName !== fileName));
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <Label>Photos</Label>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-10 text-center transition ${isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-background"}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <span className="text-sm font-medium">Drop images here or click to choose files</span>
          <span className="mt-2 text-xs text-muted-foreground">Images are resized to a maximum edge of 1600px and converted to WebP at high quality.</span>
          <input accept="image/*" className="sr-only" multiple type="file" onChange={(event) => handleFiles(event.target.files)} />
        </label>
      </div>

      {isPending ? <p className="text-sm text-muted-foreground">Compressing images...</p> : null}

      {value.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((item) => (
            <div key={item.fileName} className="space-y-3 rounded-3xl border border-border/60 bg-background p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                <Image alt={item.fileName} fill src={item.dataUrl} className="object-cover" unoptimized />
              </div>
              <div className="space-y-1 text-sm">
                <p className="truncate font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.originalSize)} to {formatSize(item.compressedSize)}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeImage(item.fileName)}>Remove</Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
