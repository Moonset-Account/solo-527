import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays } from "date-fns";
import { LOW_SAMPLE_THRESHOLD } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskName(name: string): string {
  if (!name) return "";
  return name[0] + "*".repeat(name.length - 1);
}

export function calculateWaitDays(
  originalEnrollTime: Date,
  convertedTime?: Date
): number {
  const end = convertedTime ?? new Date();
  return differenceInDays(end, originalEnrollTime);
}

export function isLowSample(count: number, threshold = LOW_SAMPLE_THRESHOLD): boolean {
  return count < threshold;
}

export function getSuggestion(
  waitlistCount: number,
  capacity: number
): "urgent" | "recommended" | "normal" {
  const ratio = waitlistCount / capacity;
  if (ratio >= 0.8) return "urgent";
  if (ratio >= 0.5) return "recommended";
  return "normal";
}
