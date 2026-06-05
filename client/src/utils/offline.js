import api from './request';
import { showToast } from 'vant';

export const setupOffline = () => {
  window.addEventListener('online', () => {
    console.log('网络已恢复');
    syncPendingRequests();
    syncOfflinePhotos();
    syncOfflineMaintenance();
  });
  
  window.addEventListener('offline', () => {
    console.log('网络已断开');
    showToast('网络已断开，部分功能将使用离线模式');
  });

  if (navigator.onLine) {
    setTimeout(() => {
      syncPendingRequests();
      syncOfflinePhotos();
      syncOfflineMaintenance();
    }, 1000);
  }
};

export const isOnline = () => navigator.onLine;

const generateRequestKey = (url, method, data, params) => {
  return `${method}:${url}:${JSON.stringify(data || {})}:${JSON.stringify(params || {})}`;
};

export const addPendingRequest = (url, method, data, params, type = 'request') => {
  const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
  const key = generateRequestKey(url, method, data, params);
  
  const exists = pendingQueue.some(req => 
    generateRequestKey(req.url, req.method, req.data, req.params) === key
  );
  
  if (exists) {
    console.log('请求已在队列中，跳过重复入队');
    return false;
  }
  
  pendingQueue.push({
    url,
    method,
    data,
    params,
    type,
    timestamp: Date.now()
  });
  localStorage.setItem('pendingRequests', JSON.stringify(pendingQueue));
  console.log('请求已加入离线队列:', url);
  return true;
};

export const syncPendingRequests = async () => {
  const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
  if (pendingQueue.length === 0) return;

  console.log(`开始同步 ${pendingQueue.length} 个缓存请求...`);

  const remaining = [];
  let successCount = 0;
  
  for (const req of pendingQueue) {
    try {
      await api({
        url: req.url,
        method: req.method,
        data: req.data,
        params: req.params
      });
      successCount++;
      console.log(`同步成功: ${req.method} ${req.url}`);
    } catch (error) {
      console.error(`同步失败: ${req.method} ${req.url}`, error);
      remaining.push(req);
    }
  }

  localStorage.setItem('pendingRequests', JSON.stringify(remaining));
  
  if (successCount > 0) {
    showToast(`已同步 ${successCount} 条离线数据`);
  }
  
  if (remaining.length === 0) {
    console.log('所有缓存请求同步完成');
  } else {
    console.log(`剩余 ${remaining.length} 个请求待同步`);
  }
};

export const getPendingCount = () => {
  const pendingQueue = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
  const photoQueue = JSON.parse(localStorage.getItem('offlinePhotos') || '[]');
  return pendingQueue.length + photoQueue.length;
};

export const saveOfflinePhoto = (borrowId, photoData, description = '') => {
  const photoQueue = JSON.parse(localStorage.getItem('offlinePhotos') || '[]');
  photoQueue.push({
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    borrowId,
    photoData,
    description,
    timestamp: Date.now()
  });
  localStorage.setItem('offlinePhotos', JSON.stringify(photoQueue));
  console.log('照片已缓存，将在联网后上传');
  return true;
};

export const saveOfflineMaintenance = (toolId, data, photos = []) => {
  const maintenanceQueue = JSON.parse(localStorage.getItem('offlineMaintenance') || '[]');
  maintenanceQueue.push({
    id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    toolId,
    data,
    photos,
    timestamp: Date.now()
  });
  localStorage.setItem('offlineMaintenance', JSON.stringify(maintenanceQueue));
  console.log('维修申报已缓存');
  return true;
};

export const syncOfflinePhotos = async () => {
  const photoQueue = JSON.parse(localStorage.getItem('offlinePhotos') || '[]');
  if (photoQueue.length === 0) return;

  console.log(`开始同步 ${photoQueue.length} 张缓存照片...`);
  
  const remaining = [];
  
  for (const photo of photoQueue) {
    try {
      const formData = new FormData();
      formData.append('photo', dataURLtoBlob(photo.photoData), `photo_${photo.id}.jpg`);
      if (photo.description) {
        formData.append('description', photo.description);
      }
      
      await api.post(`/borrows/${photo.borrowId}/return-photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('照片同步成功:', photo.id);
    } catch (error) {
      console.error('照片同步失败:', photo.id, error);
      remaining.push(photo);
    }
  }
  
  localStorage.setItem('offlinePhotos', JSON.stringify(remaining));
};

export const syncOfflineMaintenance = async () => {
  const maintenanceQueue = JSON.parse(localStorage.getItem('offlineMaintenance') || '[]');
  if (maintenanceQueue.length === 0) return;

  const remaining = [];
  
  for (const maint of maintenanceQueue) {
    try {
      if (maint.photos && maint.photos.length > 0) {
        const formData = new FormData();
        Object.keys(maint.data).forEach(key => {
          formData.append(key, maint.data[key]);
        });
        maint.photos.forEach((p, idx) => {
          formData.append('photos', dataURLtoBlob(p), `photo_${idx}.jpg`);
        });
        await api.post('/maintenances', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/maintenances', maint.data);
      }
      console.log('维修申报同步成功:', maint.id);
    } catch (error) {
      console.error('维修申报同步失败:', maint.id, error);
      remaining.push(maint);
    }
  }
  
  localStorage.setItem('offlineMaintenance', JSON.stringify(remaining));
};

const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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

export const clearAllOffline = () => {
  localStorage.removeItem('pendingRequests');
  localStorage.removeItem('offlinePhotos');
  localStorage.removeItem('offlineMaintenance');
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('offline_')) {
      localStorage.removeItem(key);
    }
  });
};
