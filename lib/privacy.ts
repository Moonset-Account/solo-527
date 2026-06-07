import SHA256 from "crypto-js/sha256";

const PRIVACY_SALT = "return-dashboard-salt-2024";

export function hashUserId(userId: string): string {
  return SHA256(userId + PRIVACY_SALT).toString();
}

export function maskString(str: string, start = 3, end = 2): string {
  if (!str || str.length <= start + end) return "***";
  return str.slice(0, start) + "****" + str.slice(-end);
}

export const SENSITIVE_FIELDS = [
  "customerName",
  "customerPhone",
  "customerEmail",
  "customerAddress",
  "receiverName",
  "receiverPhone",
];

export function sanitizeRecord<T extends Record<string, unknown>>(
  record: T,
  sensitiveFields: string[] = SENSITIVE_FIELDS
): T {
  const sanitized = { ...record };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }
  return sanitized;
}

export function identifyRepeatUsers(
  userHashes: string[],
  threshold = 3
): Set<string> {
  const counts = new Map<string, number>();
  for (const hash of userHashes) {
    counts.set(hash, (counts.get(hash) || 0) + 1);
  }
  const repeats = new Set<string>();
  for (const [hash, count] of Array.from(counts.entries())) {
    if (count >= threshold) {
      repeats.add(hash);
    }
  }
  return repeats;
}
