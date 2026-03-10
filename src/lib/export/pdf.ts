"use client";

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const SLIDE_W = 960;
const SLIDE_H = 540;
const PDF_W = 254; // mm (landscape 16:9)
const PDF_H = 142.875; // mm (16:9 ratio)

/**
 * Export rendered slide elements to PDF.
 * Caller is responsible for having the slides rendered in the DOM.
 */
export async function exportSlidesToPdf(
  title: string,
  slideElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (slideElements.length === 0) return;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [PDF_W, PDF_H],
  });

  for (let i = 0; i < slideElements.length; i++) {
    onProgress?.(i + 1, slideElements.length);

    const canvas = await html2canvas(slideElements[i]!, {
      width: SLIDE_W,
      height: SLIDE_H,
      scale: 2, // 2x for crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) pdf.addPage([PDF_W, PDF_H], "landscape");
    pdf.addImage(imgData, "JPEG", 0, 0, PDF_W, PDF_H);
  }

  pdf.save(`${sanitizeFilename(title)}.pdf`);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
}
