"use client";

import { CustomSelect } from "@/components/games/custom-select";
import { GAME_STATUSES } from "@/lib/statuses";

type StatusSelectProps = {
  className?: string;
  disabled?: boolean;
  onChange?: (event: { target: { value: string } }) => void;
  onOpenChange?: (isOpen: boolean) => void;
  stableWidth?: boolean;
  value?: string;
};

const STATUS_OPTIONS = GAME_STATUSES.map((status) => ({ value: status, label: status }));

export function StatusSelect(props: StatusSelectProps) {
  return <CustomSelect {...props} options={STATUS_OPTIONS} />;
}
