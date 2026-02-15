"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, File } from "lucide-react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload: (base64: string, filename: string) => void;
  isUploading: boolean;
  uploadedFile: { name: string; format: string } | null;
  onClearFile: () => void;
}

export function ContentInput({
  value,
  onChange,
  onFileUpload,
  isUploading,
  uploadedFile,
  onClearFile,
}: ContentInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // For text files, use the text directly
        if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md")) {
          onChange(result);
          return;
        }
        // For PDF/DOCX, send base64
        const base64 = result.split(",")[1];
        if (base64) onFileUpload(base64, file.name);
      };

      if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md")) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    },
    [onChange, onFileUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">Source Content</label>

      {uploadedFile ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <File className="h-5 w-5 shrink-0 text-[#5B8A8A]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{uploadedFile.name}</p>
            <p className="text-xs text-gray-400">
              Parsed as {uploadedFile.format.toUpperCase()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={onClearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              isDragging
                ? "border-[#5B8A8A] bg-[#2D5A5A]/10"
                : "border-white/10 hover:border-white/20"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Textarea
              placeholder="Paste your training content here, or drag and drop a file..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[200px] resize-y border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-400 hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Parsing..." : "Upload file"}
            </Button>
            <span className="text-xs text-gray-500">PDF, DOCX, TXT, or MD</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
