"use client";

import { useCallback, useRef, useState } from "react";
import { Move, Check, RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ImageFocalPointProps {
  imageUrl: string;
  focalPoint?: { x: number; y: number };
  onSave: (point: { x: number; y: number }) => void;
  onReset: () => void;
}

/**
 * Drag-to-reposition editor for slide images.
 * Shows the full image with a crosshair. User drags to set the focal point
 * which controls object-position on the rendered image.
 */
export function ImageFocalPointEditor({
  imageUrl,
  focalPoint,
  onSave,
  onReset,
}: ImageFocalPointProps) {
  const [editing, setEditing] = useState(false);
  const [point, setPoint] = useState(focalPoint ?? { x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPoint({ x: Math.round(x), y: Math.round(y) });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updatePoint(e);

      const handleMove = (ev: MouseEvent) => {
        if (isDragging.current) updatePoint(ev);
      };
      const handleUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [updatePoint],
  );

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs text-gray-400 hover:text-[#5B8A8A]"
        onClick={() => setEditing(true)}
      >
        <Move className="h-3 w-3" />
        Reposition
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Drag to set focal point ({point.x}%, {point.y}%)
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] text-gray-500 hover:text-white"
            onClick={() => {
              onReset();
              setPoint({ x: 50, y: 50 });
              setEditing(false);
            }}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Center
          </Button>
          <Button
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            style={{ backgroundColor: "#2D5A5A" }}
            onClick={() => {
              onSave(point);
              setEditing(false);
            }}
          >
            <Check className="h-2.5 w-2.5" />
            Apply
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative cursor-crosshair overflow-hidden rounded-lg border border-white/10"
        style={{ aspectRatio: "16 / 9" }}
        onMouseDown={handleMouseDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Reposition preview"
          className="h-full w-full object-cover"
          style={{ objectPosition: `${point.x}% ${point.y}%` }}
          draggable={false}
        />
        {/* Crosshair indicator */}
        <div
          className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </div>
        {/* Rule of thirds grid */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/10" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/10" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/10" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
