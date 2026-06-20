import { clsx } from 'clsx';
export function cn(...inputs) {
    return clsx(inputs);
}
export function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function formatNumber(num) {
    if (num == null)
        return '0';
    if (num >= 10000)
        return `${(num / 10000).toFixed(1)}万`;
    return num.toLocaleString('zh-CN');
}
