import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSSクラスをマージするユーティリティ関数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
