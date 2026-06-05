import api from './request';

export const setupOffline = () => {
  window.addEventListener('online', syncPendingRequests);
  
  window.addEventListener('offline', () => {
    console.log('网络已断开');
  });
};

export const syncPendingRequests = async () => {
  const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
  if (pendingQueue.length === 0) return;

  console.log(`网络已恢复，开始同步 ${pendingQueue.length} 个缓存请求...`);

  const remaining = [];
  
  for (const req of pendingQueue) {
    try {
      await api({
        url: req.url,
        method: req.method,
        data: req.data,
        params: req.params
      });
      console.log(`同步成功: ${req.method} ${req.url}`);
    } catch (error) {
      console.error(`同步失败: ${req.method} ${req.url}`, error);
      remaining.push(req);
    }
  }

  localStorage.setItem('pendingRequests', JSON.stringify(remaining));
  
  if (remaining.length === 0) {
    console.log('所有缓存请求同步完成');
  } else {
    console.log(`剩余 ${remaining.length} 个请求待同步`);
  }
};

export const saveOfflineData = (key, data) => {
  localStorage.setItem(`offline_${key}`, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

export const getOfflineData = (key, maxAge = 3600000) => {
  const cached = localStorage.getItem(`offline_${key}`);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > maxAge) {
    localStorage.removeItem(`offline_${key}`);
    return null;
  }
  
  return data;
};
