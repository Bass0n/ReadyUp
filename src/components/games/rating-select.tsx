import type { SelectHTMLAttributes } from "react";

type RatingSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function RatingSelect(props: RatingSelectProps) {
  return (
    <select {...props} className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-white outline-none ring-blue-400 focus:ring-2">
      <option value="">No rating</option>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
        <option key={rating} value={rating}>
          {rating}/10
        </option>
      ))}
    </select>
  );
}
