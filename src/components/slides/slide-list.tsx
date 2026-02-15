"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import type { SlideData } from "~/lib/ai/types";
import { SlidePreview } from "./slide-preview";

interface SlideListProps {
  slides: SlideData[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onReorder?: (slideIds: string[]) => void;
  onDuplicate?: (slideId: string) => void;
  onDelete?: (slideId: string) => void;
  onAddSlide?: () => void;
}

export function SlideList({
  slides,
  activeSlideId,
  onSelectSlide,
  onReorder,
  onDuplicate,
  onDelete,
  onAddSlide,
}: SlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...slides];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved!);
      onReorder(reordered.map((s) => s.id));
    },
    [slides, onReorder],
  );

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400">No slides generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {slides.map((slide, i) => (
            <SortableSlideItem
              key={slide.id}
              slide={slide}
              index={i}
              isActive={activeSlideId === slide.id}
              onClick={() => onSelectSlide(slide.id)}
              onDuplicate={onDuplicate ? () => onDuplicate(slide.id) : undefined}
              onDelete={onDelete ? () => onDelete(slide.id) : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {onAddSlide && (
        <button
          type="button"
          onClick={onAddSlide}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-3 text-xs text-gray-500 transition-colors hover:border-[#5B8A8A]/40 hover:text-[#5B8A8A]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Slide
        </button>
      )}
    </div>
  );
}

function SortableSlideItem({
  slide,
  index,
  isActive,
  onClick,
  onDuplicate,
  onDelete,
}: {
  slide: SlideData;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SlidePreview
        slide={slide}
        index={index}
        isActive={isActive}
        onClick={onClick}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
