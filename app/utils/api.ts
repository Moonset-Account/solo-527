export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path.startsWith("http") ? path : `/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export function getStatusBadge(status: string) {
  const map: Record<string, { class: string; label: string }> = {
    pending: { class: "badge-pending", label: "待审批" },
    approved: { class: "badge-approved", label: "已批准" },
    rejected: { class: "badge-rejected", label: "已拒绝" },
    picked: { class: "badge-picked", label: "已领取" },
    extended: { class: "badge-extended", label: "已延期" },
    returned: { class: "badge-returned", label: "已归还" },
    damaged: { class: "badge-damaged", label: "有损坏" },
    lost: { class: "badge-lost", label: "已丢失" },
  };
  return map[status] || { class: "badge-pending", label: status };
}

export function getDepositStatusBadge(status: string) {
  const map: Record<string, { class: string; label: string }> = {
    unfrozen: { class: "badge-pending", label: "未冻结" },
    frozen: { class: "badge-approved", label: "已冻结" },
    deducted: { class: "badge-damaged", label: "已扣除" },
    refunded: { class: "badge-returned", label: "已退还" },
  };
  return map[status] || { class: "badge-pending", label: status };
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN");
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("zh-CN");
}

export function isOverdue(expectedReturn: string | Date, status: string) {
  if (!["picked", "extended"].includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(expectedReturn);
  expected.setHours(0, 0, 0, 0);
  return expected < today;
}
