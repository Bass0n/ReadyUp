import type { SelectHTMLAttributes } from "react";
import { GAME_STATUSES } from "@/lib/statuses";

type StatusSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function StatusSelect(props: StatusSelectProps) {
  return (
    <select {...props} className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-white outline-none ring-blue-400 focus:ring-2">
      {GAME_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
