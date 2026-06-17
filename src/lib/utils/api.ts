export interface ApiResult<T> {
	success: boolean;
	data: T;
	message?: string;
	total?: number;
	page?: number;
	pageSize?: number;
	totalPages?: number;
}

export async function apiFetch<T>(
	url: string,
	options?: RequestInit
): Promise<ApiResult<T>> {
	const defaultOptions: RequestInit = {
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'same-origin'
	};

	const res = await fetch(url, { ...defaultOptions, ...options });

	if (!res.ok) {
		let message = '请求失败';
		try {
			const err = await res.json();
			message = err.message || res.statusText;
		} catch {
			message = res.statusText;
		}
		throw new Error(message);
	}

	return res.json();
}

export function buildQueryString(params: Record<string, unknown>): string {
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			value.forEach((v) => searchParams.append(key, String(v)));
		} else {
			searchParams.append(key, String(value));
		}
	}
	const qs = searchParams.toString();
	return qs ? `?${qs}` : '';
}
