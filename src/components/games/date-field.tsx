"use client";

import { useEffect, useState } from "react";

type DateFieldProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function DateField({ disabled, onChange, value }: DateFieldProps) {
  const [draft, setDraft] = useState(formatDisplayDate(value));

  useEffect(() => {
    setDraft(formatDisplayDate(value));
  }, [value]);

  function updateDraft(nextDraft: string) {
    setDraft(nextDraft);

    if (!nextDraft.trim()) {
      onChange("");
      return;
    }

    const nextValue = parseDisplayDate(nextDraft);
    if (nextValue) onChange(nextValue);
  }

  function resetInvalidDraft() {
    if (!draft.trim() || parseDisplayDate(draft)) return;
    setDraft(formatDisplayDate(value));
  }

  return (
    <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={draft}
        disabled={disabled}
        onBlur={resetInvalidDraft}
        onChange={(event) => updateDraft(event.target.value)}
        className="rounded-md border border-line bg-surface px-3 py-2 text-white outline-none ring-blue-400 placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span className="contents">
        <button type="button" disabled={disabled} onClick={() => onChange(getTodayInputValue())} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
          Today
        </button>
        <button type="button" disabled={disabled} onClick={() => onChange("")} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
          Clear
        </button>
      </span>
    </span>
  );
}

export function formatDisplayDate(value: string | null) {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function parseDisplayDate(value: string) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}
