class MobileCheckIn {
  constructor() {
    this.offlineData = [];
    this.init();
  }

  init() {
    this.loadOfflineData();
    this.bindEvents();
    this.setupOnlineListener();
    this.checkAndSync();
  }

  loadOfflineData() {
    const saved = localStorage.getItem('offline_check_ins');
    if (saved) {
      this.offlineData = JSON.parse(saved);
    }
  }

  saveOfflineData() {
    localStorage.setItem('offline_check_ins', JSON.stringify(this.offlineData));
    this.updateOfflineBadge();
  }

  updateOfflineBadge() {
    const badge = document.getElementById('offline-badge');
    if (badge) {
      badge.textContent = this.offlineData.length;
      badge.style.display = this.offlineData.length > 0 ? 'inline' : 'none';
    }
  }

  bindEvents() {
    document.querySelectorAll('.check-in-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleCheckIn(e));
    });

    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncOfflineData());
    }
  }

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.showToast('网络已连接，正在同步数据...');
      this.checkAndSync();
    });

    window.addEventListener('offline', () => {
      this.showToast('网络已断开，数据将暂存本地');
    });
  }

  async handleCheckIn(event) {
    const btn = event.currentTarget;
    const data = {
      registration_id: btn.dataset.registrationId,
      student_id: btn.dataset.studentId,
      session_id: btn.dataset.sessionId,
      checked_in_at: new Date().toISOString(),
      check_in_method: 'manual',
      offline_uuid: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    };

    if (navigator.onLine) {
      try {
        await this.submitOnline(data);
        btn.disabled = true;
        btn.textContent = '已签到';
        btn.classList.add('bg-green-500');
        this.showToast('签到成功');
      } catch (error) {
        this.saveOffline(data, btn);
      }
    } else {
      this.saveOffline(data, btn);
    }
  }

  async submitOnline(data) {
    const qrToken = document.querySelector('[data-qr-token]')?.dataset.qrToken;
    const response = await fetch(`/mobile/check_in/${qrToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('提交失败');
    }

    return response.json();
  }

  saveOffline(data, btn) {
    this.offlineData.push(data);
    this.saveOfflineData();

    if (btn) {
      btn.disabled = true;
      btn.textContent = '已签到(待同步)';
      btn.classList.add('bg-yellow-500');
    }

    this.showToast('已保存到本地，联网后自动同步');
  }

  checkAndSync() {
    if (navigator.onLine && this.offlineData.length > 0) {
      this.syncOfflineData();
    }
  }

  async syncOfflineData() {
    if (this.offlineData.length === 0) {
      this.showToast('没有需要同步的数据');
      return;
    }

    try {
      const response = await fetch('/mobile/check_ins/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: JSON.stringify({ check_ins: this.offlineData })
      });

      if (response.ok) {
        this.offlineData = [];
        this.saveOfflineData();
        this.showToast('同步成功');
        location.reload();
      } else {
        throw new Error('同步失败');
      }
    } catch (error) {
      this.showToast('同步失败，请稍后重试');
    }
  }

  showToast(message) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }
}

document.addEventListener('turbo:load', () => {
  if (document.querySelector('.mobile-check-in-page')) {
    new MobileCheckIn();
  }
});
