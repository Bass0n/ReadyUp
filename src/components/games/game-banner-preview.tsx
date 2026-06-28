"use client";

import Image from "next/image";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent
} from "react";
import { GameImage } from "@/components/games/game-image";

type GameBannerPreviewProps = {
  src: string | null;
  alt: string;
  subtitle: string;
  trailerVideoId: string | null;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type Size = {
  width: number;
  height: number;
};

const ZOOM_SCALE = 2.25;
const DRAG_THRESHOLD = 4;

export function GameBannerPreview({ src, alt, subtitle, trailerVideoId }: GameBannerPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setIsZoomed(false);
    setOffset({ x: 0, y: 0 });
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") closePreview();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closePreview, isOpen]);

  function openPreview() {
    if (!src) return;
    setIsZoomed(false);
    setOffset({ x: 0, y: 0 });
    setIsOpen(true);
  }

  function openPreviewWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview();
    }
  }

  function getVisibleImageRect(imageFrame: HTMLDivElement) {
    const frameRect = imageFrame.getBoundingClientRect();
    if (!naturalSize) return frameRect;

    const frameRatio = frameRect.width / frameRect.height;
    const imageRatio = naturalSize.width / naturalSize.height;

    if (imageRatio > frameRatio) {
      const height = frameRect.width / imageRatio;
      return new DOMRect(frameRect.left, frameRect.top + (frameRect.height - height) / 2, frameRect.width, height);
    }

    const width = frameRect.height * imageRatio;
    return new DOMRect(frameRect.left + (frameRect.width - width) / 2, frameRect.top, width, frameRect.height);
  }

  function isPointOnImage(clientX: number, clientY: number) {
    if (!imageFrameRef.current) return false;
    const imageRect = getVisibleImageRect(imageFrameRef.current);
    return clientX >= imageRect.left && clientX <= imageRect.right && clientY >= imageRect.top && clientY <= imageRect.bottom;
  }

  function zoomInAtPoint(clientX: number, clientY: number, imageFrame: HTMLDivElement) {
    const rect = imageFrame.getBoundingClientRect();
    const cursorXFromCenter = clientX - rect.left - rect.width / 2;
    const cursorYFromCenter = clientY - rect.top - rect.height / 2;

    setOffset({
      x: -cursorXFromCenter * (ZOOM_SCALE - 1),
      y: -cursorYFromCenter * (ZOOM_SCALE - 1)
    });
    setIsZoomed(true);
  }

  function zoomOut() {
    setOffset({ x: 0, y: 0 });
    setIsZoomed(false);
  }

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isPointOnImage(event.clientX, event.clientY)) return;

    event.stopPropagation();

    if (!isZoomed) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false
    };
  }

  function handlePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.stopPropagation();

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      dragState.moved = true;
    }

    setOffset({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY
    });
  }

  function handlePreviewPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!isPointOnImage(event.clientX, event.clientY) && !dragState) return;

    event.stopPropagation();

    if (dragState?.moved) return;

    if (isZoomed) {
      zoomOut();
      return;
    }

    if (imageFrameRef.current) {
      zoomInAtPoint(event.clientX, event.clientY, imageFrameRef.current);
    }
  }

  function handlePreviewPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
  }

  function handlePreviewClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (isPointOnImage(event.clientX, event.clientY)) {
      event.stopPropagation();
    }
  }

  return (
    <>
      <section className="rounded-lg border border-line bg-panel p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(220px,320px)_1fr] lg:items-start">
          <div
            role={src ? "button" : undefined}
            tabIndex={src ? 0 : undefined}
            onClick={openPreview}
            onKeyDown={openPreviewWithKeyboard}
            className="group relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-surface text-left outline-none ring-blue-400 focus:ring-2 lg:h-[427px] lg:max-w-none lg:aspect-auto"
            aria-label={src ? "Open full image preview for " + alt : undefined}
          >
            <GameImage src={src} alt={alt} priority />
            {src ? (
              <div className="absolute right-3 top-3 rounded-md bg-black/55 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
                Preview image
              </div>
            ) : null}
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-surface lg:h-[427px] lg:aspect-auto">
            {trailerVideoId ? (
              <iframe
                src={"https://www.youtube-nocookie.com/embed/" + trailerVideoId}
                title={alt + " trailer"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No trailer available
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{alt}</h1>
          <p className="mt-3 text-sm text-slate-300">{subtitle}</p>
        </div>
      </section>

      {isOpen && src ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={"Image preview for " + alt}
          onClick={closePreview}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closePreview();
            }}
            className="absolute right-4 top-4 rounded-md border border-white/20 bg-black/60 p-2 text-white hover:bg-black"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className={"absolute inset-0 touch-none overflow-visible " + (isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
            onClick={handlePreviewClick}
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
            onPointerCancel={handlePreviewPointerCancel}
          >
            <div className="flex h-full w-full items-center justify-center p-4">
              <div
                ref={imageFrameRef}
                className="relative h-[85vh] w-full max-w-6xl"
                style={{
                  transform: "translate3d(" + offset.x + "px, " + offset.y + "px, 0) scale(" + (isZoomed ? ZOOM_SCALE : 1) + ")",
                  transition: dragStateRef.current ? "none" : "transform 160ms ease-out"
                }}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="select-none object-contain"
                  priority
                  draggable={false}
                  onLoad={(event) => {
                    setNaturalSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
