import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function releaseYear(released: string | null) {
  return released ? released.slice(0, 4) : null;
}
