export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function parsePagination(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '20', 10)));
  return { page, pageSize };
}

export function generateMemberNo(campId: string): string {
  const shortId = campId.split('-')[0].toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `M-${shortId}-${timestamp}-${random}`;
}
