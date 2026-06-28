"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { GameImage } from "@/components/games/game-image";

type GameBannerPreviewProps = {
  src: string | null;
  alt: string;
  subtitle: string;
};

export function GameBannerPreview({ src, alt, subtitle }: GameBannerPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function openPreview() {
    if (src) setIsOpen(true);
  }

  function openPreviewWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview();
    }
  }

  return (
    <>
      <div
        role={src ? "button" : undefined}
        tabIndex={src ? 0 : undefined}
        onClick={openPreview}
        onKeyDown={openPreviewWithKeyboard}
        className="group relative min-h-[260px] w-full overflow-hidden rounded-lg border border-line bg-surface text-left outline-none ring-blue-400 focus:ring-2 sm:min-h-[420px]"
        aria-label={src ? "Open full image preview for " + alt : undefined}
      >
        <GameImage src={src} alt={alt} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        {src ? (
          <div className="absolute right-4 top-4 rounded-md bg-black/55 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
            Preview image
          </div>
        ) : null}
        <div className="absolute bottom-0 max-w-4xl p-6 sm:p-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{alt}</h1>
          <p className="mt-3 text-sm text-slate-200">{subtitle}</p>
        </div>
      </div>

      {isOpen && src ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={"Image preview for " + alt}
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
            className="absolute right-4 top-4 rounded-md border border-white/20 bg-black/60 p-2 text-white hover:bg-black"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-[85vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
          </div>
        </div>
      ) : null}
    </>
  );
}
