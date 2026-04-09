"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("mediaUpload");

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    startTransition(async () => {
      try {
        const compressed = await Promise.all(files.map((file) => compressImageFile(file)));
        onChange([...value, ...compressed]);
        toast({ title: t("preparedTitle"), description: t("preparedDescription") });
      } catch (error) {
        toast({ title: t("failedTitle"), description: error instanceof Error ? error.message : t("failedDescription"), variant: "destructive" });
      }
    });
  }

  function removeImage(fileName: string) {
    onChange(value.filter((item) => item.fileName !== fileName));
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>{t("title")}</Label>
          {value.length ? <span className="text-xs text-muted-foreground">{t("selectedCount", { count: value.length })}</span> : null}
        </div>
        <label
          className={`section-surface flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed px-5 py-8 text-center transition ${isDragging ? "border-primary bg-primary/5" : ""}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <span className="text-sm font-medium">{t("dropzoneTitle")}</span>
          <span className="mt-2 max-w-xs text-xs text-muted-foreground">{t("dropzoneDescription")}</span>
          <input accept="image/*" className="sr-only" multiple type="file" onChange={(event) => handleFiles(event.target.files)} />
        </label>
      </div>

      {isPending ? <p className="text-sm text-muted-foreground">{t("compressing")}</p> : null}

      {value.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((item) => (
            <div key={item.fileName} className="section-surface space-y-3 rounded-[24px] p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                <Image alt={item.fileName} fill src={item.dataUrl} className="object-cover" unoptimized />
              </div>
              <div className="space-y-1 text-sm">
                <p className="truncate font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">{t("compressionSummary", { from: formatSize(item.originalSize), to: formatSize(item.compressedSize) })}</p>
              </div>
              <Button className="rounded-xl" size="sm" type="button" variant="outline" onClick={() => removeImage(item.fileName)}>
                {t("remove")}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
