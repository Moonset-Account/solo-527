export function mapToObject<K extends string, V>(
  map: Map<K, V>
): Record<K, V> {
  const obj = {} as Record<K, V>;
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

export function objectToMap<K extends string, V>(
  obj: Record<K, V>
): Map<K, V> {
  const map = new Map<K, V>();
  for (const key of Object.keys(obj) as K[]) {
    map.set(key, obj[key]);
  }
  return map;
}

export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  if (value instanceof Map) {
    const clonedMap = new Map();
    for (const [k, v] of value) {
      clonedMap.set(deepClone(k), deepClone(v));
    }
    return clonedMap as unknown as T;
  }
  if (value instanceof Set) {
    const clonedSet = new Set();
    for (const v of value) {
      clonedSet.add(deepClone(v));
    }
    return clonedSet as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }
  const clonedObj = {} as Record<string, unknown>;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    clonedObj[key] = deepClone((value as Record<string, unknown>)[key]);
  }
  return clonedObj as T;
}

export function jsonStringifySafe(value: unknown, space?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      if (val instanceof Map) {
        return mapToObject(val as Map<string, unknown>);
      }
      if (val instanceof Set) {
        return Array.from(val);
      }
      return val;
    },
    space
  );
}
