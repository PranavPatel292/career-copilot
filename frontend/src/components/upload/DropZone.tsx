import { useRef, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload documents"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-5 py-7 text-center transition-colors",
        isDragOver && "border-chip-text bg-chip-bg/10",
      )}
    >
      <IconUpload className="size-6 text-tertiary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Drop .md or .txt files here, or click to browse
      </p>
      <p className="text-xs text-tertiary">Up to 10 files, 5MB each</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".md,.txt"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
