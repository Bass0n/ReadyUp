"use client";

import { CustomSelect } from "@/components/games/custom-select";

const RATINGS = [
  { value: "10", label: "(10) Masterpiece", displayLabel: "10" },
  { value: "9", label: "(9) Great", displayLabel: "9" },
  { value: "8", label: "(8) Very Good", displayLabel: "8" },
  { value: "7", label: "(7) Good", displayLabel: "7" },
  { value: "6", label: "(6) Fine", displayLabel: "6" },
  { value: "5", label: "(5) Average", displayLabel: "5" },
  { value: "4", label: "(4) Bad", displayLabel: "4" },
  { value: "3", label: "(3) Very Bad", displayLabel: "3" },
  { value: "2", label: "(2) Horrible", displayLabel: "2" },
  { value: "1", label: "(1) Appalling", displayLabel: "1" }
];

const RATING_OPTIONS = [{ value: "", label: "No rating" }, ...RATINGS];

type RatingSelectProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (event: { target: { value: string } }) => void;
  onOpenChange?: (isOpen: boolean) => void;
  value?: string;
};

export function RatingSelect(props: RatingSelectProps) {
  return <CustomSelect {...props} options={RATING_OPTIONS} />;
}
