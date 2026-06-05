export function extractName(obj: unknown, fallback = '-'): string {
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj === 'object' && 'name' in obj && typeof (obj as Record<string, unknown>).name === 'string') {
    return (obj as Record<string, string>).name;
  }
  return fallback;
}

export function extractId(obj: unknown): string | null {
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj === 'object' && '_id' in obj && typeof (obj as Record<string, unknown>)._id === 'string') {
    return (obj as Record<string, string>)._id;
  }
  if (obj && typeof obj === 'object' && '$oid' in obj && typeof (obj as Record<string, unknown>).$oid === 'string') {
    return (obj as Record<string, string>).$oid;
  }
  return null;
}
