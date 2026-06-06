function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatCurrency(num) {
    return '¥' + formatNumber(num);
}

function formatPercent(num) {
    return formatNumber(num) + '%';
}

function getDateRange(days = 30) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    };
}

async function fetchAPI(url, options = {}) {
    const defaultOptions = {
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Accept': 'application/json'
        }
    };
    const mergedOptions = { ...defaultOptions, ...options };
    const response = await fetch(url, mergedOptions);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
        } else if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
        }
    });
    return searchParams.toString();
}

const COLORS = {
    primary: '#2D5A27',
    primaryLight: '#3D7A35',
    warning: '#E67E22',
    warningLight: '#F39C12',
    trial: '#F1C40F',
    danger: '#E74C3C',
    success: '#27AE60',
    gray: '#7F8C8D',
    grayLight: '#BDC3C7'
};
