import type { SelectHTMLAttributes } from "react";

const RATINGS = [
  { value: 10, label: "(10) Masterpiece" },
  { value: 9, label: "(9) Great" },
  { value: 8, label: "(8) Very Good" },
  { value: 7, label: "(7) Good" },
  { value: 6, label: "(6) Fine" },
  { value: 5, label: "(5) Average" },
  { value: 4, label: "(4) Bad" },
  { value: 3, label: "(3) Very Bad" },
  { value: 2, label: "(2) Horrible" },
  { value: 1, label: "(1) Appalling" }
];

type RatingSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function compactRatingValue(value: RatingSelectProps["value"] | RatingSelectProps["defaultValue"]) {
  const selectedValue = Array.isArray(value) ? value[0] : value;
  return selectedValue === undefined || selectedValue === null || selectedValue === "" ? "No rating" : String(selectedValue);
}

export function RatingSelect({ className, defaultValue, value, ...props }: RatingSelectProps) {
  const selectedRating = compactRatingValue(value ?? defaultValue);

  return (
    <span className={"relative block " + (className ?? "")}>
      <select
        {...props}
        value={value}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-transparent outline-none ring-blue-400 focus:ring-2"
      >
        <option className="bg-surface text-white" value="">No rating</option>
        {RATINGS.map((rating) => (
          <option className="bg-surface text-white" key={rating.value} value={rating.value}>
            {rating.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute left-3 top-1/2 max-w-[calc(100%-2.75rem)] -translate-y-1/2 truncate text-sm text-white">
        {selectedRating}
      </span>
    </span>
  );
}
