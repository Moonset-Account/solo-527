function getAuthHeaders() {
    const token = getCookie('access_token');
    if (token) {
        return {
            'Authorization': token,
            'Content-Type': 'application/json'
        };
    }
    return { 'Content-Type': 'application/json' };
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        deleteCookie('access_token');
        window.location.href = '/';
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function closeModal(modalElement) {
    modalElement.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            if (modal.style.display === 'flex') {
                closeModal(modal);
            }
        });
    }
});

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return '¥' + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusClass(status) {
    const statusMap = {
        'draft': 'badge-gray',
        'pending': 'badge-warning',
        'approved': 'badge-success',
        'rejected': 'badge-danger',
        'priced': 'badge-primary',
        'expired': 'badge-danger',
        'delivered': 'badge-success',
        'closed': 'badge-info',
        'active': 'badge-success',
        'inactive': 'badge-danger',
        'pending_audit': 'badge-warning',
        'audited': 'badge-success',
        'rejected_audit': 'badge-danger',
        'low': 'badge-success',
        'medium': 'badge-warning',
        'high': 'badge-danger',
        'unread': 'badge-primary',
        'read': 'badge-gray'
    };
    return statusMap[status] || 'badge-info';
}

function getStatusText(status) {
    const statusMap = {
        'draft': '草稿',
        'pending': '待审批',
        'approved': '已通过',
        'rejected': '已拒绝',
        'priced': '已报价',
        'expired': '已过期',
        'delivered': '已交付',
        'closed': '已关闭',
        'active': '启用',
        'inactive': '禁用',
        'pending_audit': '待审核',
        'audited': '已通过',
        'rejected_audit': '已拒绝',
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'unread': '未读',
        'read': '已读'
    };
    return statusMap[status] || status;
}

function getRoleText(role) {
    const roleMap = {
        'buyer': '采购员',
        'auditor': '审核员',
        'manager': '经理',
        'admin': '管理员'
    };
    return roleMap[role] || role;
}

function getNotificationIcon(type) {
    const iconMap = {
        'approval': 'fa-check-circle',
        'price_expiry': 'fa-clock',
        'delivery': 'fa-shipping-fast',
        'risk': 'fa-exclamation-triangle',
        'system': 'fa-bell'
    };
    return iconMap[type] || 'fa-bell';
}

function getNotificationClass(type) {
    const classMap = {
        'approval': 'text-primary',
        'price_expiry': 'text-warning',
        'delivery': 'text-success',
        'risk': 'text-danger',
        'system': 'text-info'
    };
    return classMap[type] || 'text-info';
}

async function loadNotificationBadge() {
    try {
        const response = await fetch('/api/notification/unread-count', {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('notificationBadge');
            const pendingBadge = document.getElementById('pendingBadge');
            
            if (badge) {
                if (data.unread_count > 0) {
                    badge.textContent = data.unread_count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
            
            if (pendingBadge && data.pending_approval_count !== undefined) {
                if (data.pending_approval_count > 0) {
                    pendingBadge.textContent = data.pending_approval_count;
                    pendingBadge.classList.remove('hidden');
                } else {
                    pendingBadge.classList.add('hidden');
                }
            }
        }
    } catch (e) {
        console.error('Failed to load notification badge:', e);
    }
}

async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`/api/notification/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            loadNotificationBadge();
            return true;
        }
    } catch (e) {
        console.error('Failed to mark notification read:', e);
    }
    return false;
}

async function markAllNotificationsRead() {
    if (!confirm('确定要将所有通知标记为已读吗？')) return;
    
    try {
        const response = await fetch('/api/notification/read-all', {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showToast('已全部标记为已读', 'success');
            loadNotificationBadge();
            if (typeof refreshNotificationList === 'function') {
                refreshNotificationList();
            }
        }
    } catch (e) {
        console.error('Failed to mark all notifications read:', e);
        showToast('操作失败，请稍后重试', 'error');
    }
}

function setupFileUpload(inputId, previewId, multiple = true) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', () => {
        updateFilePreview(input, preview, multiple);
    });
    
    const dropZone = input.closest('.file-upload-area');
    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target === dropZone || e.target.closest('.upload-hint')) {
                input.click();
            }
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                if (multiple) {
                    const dt = new DataTransfer();
                    for (let i = 0; i < input.files.length; i++) {
                        dt.items.add(input.files[i]);
                    }
                    for (let i = 0; i < e.dataTransfer.files.length; i++) {
                        dt.items.add(e.dataTransfer.files[i]);
                    }
                    input.files = dt.files;
                } else {
                    input.files = e.dataTransfer.files;
                }
                updateFilePreview(input, preview, multiple);
            }
        });
    }
}

function updateFilePreview(input, preview, multiple) {
    preview.innerHTML = '';
    const files = Array.from(input.files);
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const ext = file.name.split('.').pop().toLowerCase();
        let iconClass = 'fa-file';
        let iconType = '';
        
        if (['pdf'].includes(ext)) {
            iconClass = 'fa-file-pdf';
            iconType = 'pdf';
        } else if (['doc', 'docx'].includes(ext)) {
            iconClass = 'fa-file-word';
            iconType = 'word';
        } else if (['xls', 'xlsx'].includes(ext)) {
            iconClass = 'fa-file-excel';
            iconType = 'excel';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
            iconClass = 'fa-file-image';
            iconType = 'image';
        } else if (['zip', 'rar', '7z'].includes(ext)) {
            iconClass = 'fa-file-archive';
            iconType = 'zip';
        }
        
        fileItem.innerHTML = `
            <div class="file-icon ${iconType}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-800 truncate">${file.name}</div>
                <div class="text-xs text-gray-500">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" onclick="removeFile(${index}, '${input.id}', '${preview.id}', ${multiple})" 
                    class="text-gray-400 hover:text-danger transition">
                <i class="fas fa-times"></i>
            </button>
        `;
        preview.appendChild(fileItem);
    });
}

function removeFile(index, inputId, previewId, multiple) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const files = Array.from(input.files);
    files.splice(index, 1);
    
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    input.files = dt.files;
    
    updateFilePreview(input, preview, multiple);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

function confirmDelete(message = '确定要删除吗？此操作不可恢复。') {
    return confirm(message);
}

function confirmAction(message) {
    return confirm(message);
}

document.addEventListener('DOMContentLoaded', () => {
    loadNotificationBadge();
    setInterval(loadNotificationBadge, 30000);
    
    document.querySelectorAll('[data-toggle="tab"]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });
    
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) showModal(modalId);
        });
    });
    
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });
});

document.addEventListener('htmx:afterRequest', (evt) => {
    const xhr = evt.detail.xhr;
    if (xhr.status === 401) {
        deleteCookie('access_token');
        window.location.href = '/';
        return;
    }
    
    if (xhr.status === 403) {
        showToast('权限不足，无法执行此操作', 'error');
        return;
    }
    
    const trigger = evt.detail.elt;
    const successMessage = trigger?.getAttribute('data-success-message');
    const errorMessage = trigger?.getAttribute('data-error-message');
    const reloadPage = trigger?.hasAttribute('data-reload');
    const redirectUrl = trigger?.getAttribute('data-redirect');
    const refreshBadge = trigger?.hasAttribute('data-refresh-badge');
    
    if (xhr.status >= 200 && xhr.status < 300) {
        if (successMessage) {
            showToast(successMessage, 'success');
        }
        if (refreshBadge) {
            loadNotificationBadge();
        }
        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else if (reloadPage) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } else {
        if (errorMessage) {
            showToast(errorMessage, 'error');
        } else if (xhr.status >= 400) {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.detail) {
                    showToast(data.detail, 'error');
                }
            } catch (e) {
                showToast('操作失败，请稍后重试', 'error');
            }
        }
    }
});

document.addEventListener('htmx:configRequest', (evt) => {
    const token = getCookie('access_token');
    if (token) {
        evt.detail.headers['Authorization'] = token;
    }
});
