"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for resizable panels
 */
export function useResizable(
  initialWidth: number,
  minWidth: number,
  maxWidth: number,
  storageKey: string
) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return initialWidth;
    const stored = localStorage.getItem(storageKey);
    return stored
      ? Math.max(minWidth, Math.min(maxWidth, parseInt(stored, 10)))
      : initialWidth;
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(storageKey, width.toString());
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minWidth, maxWidth, storageKey, width]);

  // Persist width changes
  useEffect(() => {
    if (!isDragging && typeof window !== "undefined") {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, isDragging, storageKey]);

  return { width, setWidth, isDragging, handleMouseDown };
}

export default useResizable;
