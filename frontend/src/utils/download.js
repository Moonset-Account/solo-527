import request from './request.js';

export const downloadFile = async (url, params, fileName) => {
  try {
    const response = await request.get(url, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
};

export const exportBills = (params) => {
  const queryString = new URLSearchParams(params).toString();
  window.open(`/api/statistics/export/bills?${queryString}`, '_blank');
};

export const exportTransactions = (params) => {
  const queryString = new URLSearchParams(params).toString();
  window.open(`/api/statistics/export/transactions?${queryString}`, '_blank');
};

export const exportPayments = (params) => {
  const queryString = new URLSearchParams(params).toString();
  window.open(`/api/statistics/export/payments?${queryString}`, '_blank');
};

export const exportCollections = (params) => {
  const queryString = new URLSearchParams(params).toString();
  window.open(`/api/statistics/export/collections?${queryString}`, '_blank');
};
