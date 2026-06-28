"use client";

import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

type CustomSelectOption = { value: string; label: string; displayLabel?: string };
type CustomSelectChangeEvent = { target: { value: string } };
type MenuPosition = { left: number; top: number; width: number };

type CustomSelectProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (event: CustomSelectChangeEvent) => void;
  onOpenChange?: (isOpen: boolean) => void;
  options: CustomSelectOption[];
  value?: string;
};

export function CustomSelect({ className, defaultValue = "", disabled, onChange, onOpenChange, options, value }: CustomSelectProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];
  const closedMinWidth = useMemo(() => {
    const longestDisplayLabel = Math.max(...options.map((option) => (option.displayLabel ?? option.label).length));
    return Math.max(longestDisplayLabel + 5, 8) + "ch";
  }, [options]);
  const menuMinWidth = useMemo(() => {
    const longestLabel = Math.max(...options.map((option) => option.label.length));
    return Math.max(longestLabel + 4, 8) + "ch";
  }, [options]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    function updateMenuPosition() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({ left: rect.left + rect.width / 2 + window.scrollX, top: rect.bottom + window.scrollY + 4, width: rect.width });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    window.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => window.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function selectOption(nextValue: string) {
    setInternalValue(nextValue);
    onChange?.({ target: { value: nextValue } });
    setIsOpen(false);
  }

  const menu = isOpen && menuPosition ? (
    <div
      ref={menuRef}
      data-readyup-dropdown-menu="true"
      className="absolute z-[2000] overflow-hidden rounded-md border border-line bg-surface shadow-xl"
      role="listbox"
      style={{ left: menuPosition.left, top: menuPosition.top, minWidth: menuMinWidth, transform: "translateX(-50%)", width: menuPosition.width }}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <button
            key={option.value || "empty"}
            type="button"
            onClick={() => selectOption(option.value)}
            className={"block w-full px-3 py-2 text-center text-sm transition " + (isSelected ? "bg-blue-300 text-surface" : "text-white hover:bg-white/10")}
            role="option"
            aria-selected={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <span ref={rootRef} className={"relative block " + (className ?? "")} style={{ minWidth: closedMinWidth }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="relative w-full rounded-md border border-line bg-surface py-2 pl-3 pr-8 text-center text-sm text-white outline-none ring-blue-400 hover:bg-white/5 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-center">{selectedOption?.displayLabel ?? selectedOption?.label}</span>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" aria-hidden="true" />
      </button>
      {isMounted && menu ? createPortal(menu, document.body) : null}
    </span>
  );
}
