const API_BASE = '/api';
async function request(path, options) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}
export const api = {
    materials: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/materials${qs}`);
        },
        get: (id) => request(`/materials/${id}`),
        create: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
        reuseSuggestions: () => request('/materials/reuse-suggestions'),
    },
    tags: {
        list: () => request('/tags'),
        create: (data) => request('/tags', { method: 'POST', body: JSON.stringify(data) }),
        delete: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
    },
    scripts: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/scripts${qs}`);
        },
        get: (id) => request(`/scripts/${id}`),
        create: (data) => request('/scripts', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/scripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    schedules: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/schedules${qs}`);
        },
        get: (id) => request(`/schedules/${id}`),
        create: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    conversions: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/conversions${qs}`);
        },
        summary: () => request('/conversions/summary'),
        create: (data) => request('/conversions', { method: 'POST', body: JSON.stringify(data) }),
        batch: (data) => request('/conversions/batch', { method: 'POST', body: JSON.stringify(data) }),
    },
    exceptions: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/exceptions${qs}`);
        },
        get: (id) => request(`/exceptions/${id}`),
        update: (id, data) => request(`/exceptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    history: {
        list: (params) => {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            return request(`/history${qs}`);
        },
        byEntity: (entityType, entityId) => request(`/history/entity/${entityType}/${entityId}`),
    },
    dashboard: {
        overview: () => request('/dashboard/overview'),
        conversionTrend: (days) => request(`/dashboard/conversion-trend${days ? `?days=${days}` : ''}`),
        topMaterials: () => request('/dashboard/top-materials'),
        tagDistribution: () => request('/dashboard/tag-distribution'),
        detail: (id) => request(`/dashboard/detail/${id}`),
    },
};
