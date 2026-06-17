document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('htmx:beforeRequest', function(evt) {
        const formData = evt.detail.parameters;
        const method = evt.detail.verb;
        if (method === 'post' && formData && !formData.get('csrf_token')) {
            const csrfToken = getMetaCSRFToken();
            if (csrfToken) {
                formData.append('csrf_token', csrfToken);
            }
        }
    });
    
    document.body.addEventListener('htmx:afterRequest', function(evt) {
        const response = evt.detail.xhr;
        const redirectUrl = response.getResponseHeader('HX-Redirect');
        if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
        }
        
        const successMessage = response.getResponseHeader('HX-Trigger');
        if (successMessage && successMessage.includes('toast:')) {
            try {
                const toastData = JSON.parse(successMessage.replace('toast:', ''));
                showToast(toastData.type || 'success', toastData.title, toastData.message);
            } catch (e) {
                console.error('Toast parse error:', e);
            }
        }
        
        if (response.status === 200 && evt.detail.elt) {
            const closeModal = response.getResponseHeader('HX-Close-Modal');
            if (closeModal) {
                closeModal(null, closeModal);
            }
            
            const refreshPage = response.getResponseHeader('HX-Refresh');
            if (refreshPage === 'true') {
                setTimeout(() => window.location.reload(), 500);
            }
        }
    });
    
    document.body.addEventListener('htmx:error', function(evt) {
        console.error('HTMX error:', evt.detail);
        showToast('error', '操作失败', '网络错误，请稍后重试');
    });
    
    initAnimations();
});

function getMetaCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
}

function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const id = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="removeToast('${id}')">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);
    
    setTimeout(() => {
        removeToast(id);
    }, 4000);
}

function removeToast(id) {
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(event, modalId) {
    if (event) {
        event.stopPropagation();
    }
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('modal-show');
        document.body.style.overflow = '';
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

let currentOrderId = null;
let currentPhotoId = null;
let pendingToggles = new Set();
let batchToggleTimeout = null;

function togglePhoto(element, photoId) {
    const isSelected = element.classList.toggle('selected');
    const checkbox = element.querySelector('.photo-checkbox');
    const toolbarCount = document.getElementById('toolbarSelectedCount');
    const headerCount = document.getElementById('selectedCount');
    const confirmBtn = document.querySelector('.selection-toolbar .btn-primary');
    
    let currentCount = parseInt(headerCount.textContent) || 0;
    if (isSelected) {
        currentCount++;
    } else {
        currentCount--;
    }
    
    if (headerCount) headerCount.textContent = currentCount + ' 张';
    if (toolbarCount) toolbarCount.textContent = currentCount;
    
    if (confirmBtn) {
        confirmBtn.disabled = currentCount === 0;
    }
    
    if (isSelected && checkbox) {
        checkbox.classList.add('selected');
    } else if (checkbox) {
        checkbox.classList.remove('selected');
    }
    
    const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
    if (orderId) {
        pendingToggles.add(photoId);
        
        if (batchToggleTimeout) {
            clearTimeout(batchToggleTimeout);
        }
        
        batchToggleTimeout = setTimeout(() => {
            sendBatchToggle(orderId);
        }, 300);
    }
}

function sendBatchToggle(orderId) {
    if (pendingToggles.size === 0) return;
    
    const formData = new FormData();
    formData.append('photo_ids', JSON.stringify([...pendingToggles]));
    
    pendingToggles.clear();
    
    htmx.ajax('POST', `/api/orders/${orderId}/photos/batch-toggle`, {
        values: { photo_ids: JSON.stringify([...pendingToggles]) },
        target: '#selectedCount',
        swap: 'innerHTML'
    });
}

function selectAllPhotos() {
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        if (!photo.classList.contains('selected')) {
            photo.classList.add('selected');
            const checkbox = photo.querySelector('.photo-checkbox');
            if (checkbox) checkbox.classList.add('selected');
            
            const photoId = parseInt(photo.dataset.photoId);
            if (photoId) pendingToggles.add(photoId);
        }
    });
    
    const count = photos.length;
    const headerCount = document.getElementById('selectedCount');
    const toolbarCount = document.getElementById('toolbarSelectedCount');
    const confirmBtn = document.querySelector('.selection-toolbar .btn-primary');
    
    if (headerCount) headerCount.textContent = count + ' 张';
    if (toolbarCount) toolbarCount.textContent = count;
    if (confirmBtn) confirmBtn.disabled = count === 0;
    
    if (batchToggleTimeout) clearTimeout(batchToggleTimeout);
    batchToggleTimeout = setTimeout(() => {
        const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
        if (orderId) sendBatchToggle(orderId);
    }, 300);
}

function clearAllPhotos() {
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        if (photo.classList.contains('selected')) {
            photo.classList.remove('selected');
            const checkbox = photo.querySelector('.photo-checkbox');
            if (checkbox) checkbox.classList.remove('selected');
            
            const photoId = parseInt(photo.dataset.photoId);
            if (photoId) pendingToggles.add(photoId);
        }
    });
    
    const headerCount = document.getElementById('selectedCount');
    const toolbarCount = document.getElementById('toolbarSelectedCount');
    const confirmBtn = document.querySelector('.selection-toolbar .btn-primary');
    
    if (headerCount) headerCount.textContent = '0 张';
    if (toolbarCount) toolbarCount.textContent = '0';
    if (confirmBtn) confirmBtn.disabled = true;
    
    if (batchToggleTimeout) clearTimeout(batchToggleTimeout);
    batchToggleTimeout = setTimeout(() => {
        const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
        if (orderId) sendBatchToggle(orderId);
    }, 300);
}

function invertSelection() {
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        const isSelected = photo.classList.toggle('selected');
        const checkbox = photo.querySelector('.photo-checkbox');
        
        if (isSelected && checkbox) {
            checkbox.classList.add('selected');
        } else if (checkbox) {
            checkbox.classList.remove('selected');
        }
        
        const photoId = parseInt(photo.dataset.photoId);
        if (photoId) pendingToggles.add(photoId);
    });
    
    const count = document.querySelectorAll('.photo-item.selected').length;
    const headerCount = document.getElementById('selectedCount');
    const toolbarCount = document.getElementById('toolbarSelectedCount');
    const confirmBtn = document.querySelector('.selection-toolbar .btn-primary');
    
    if (headerCount) headerCount.textContent = count + ' 张';
    if (toolbarCount) toolbarCount.textContent = count;
    if (confirmBtn) confirmBtn.disabled = count === 0;
    
    if (batchToggleTimeout) clearTimeout(batchToggleTimeout);
    batchToggleTimeout = setTimeout(() => {
        const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
        if (orderId) sendBatchToggle(orderId);
    }, 300);
}

function confirmSelection() {
    const count = document.querySelectorAll('.photo-item.selected').length;
    if (count === 0) {
        showToast('warning', '请选择照片', '请至少选择一张照片');
        return;
    }
    
    const confirmCount = document.getElementById('confirmCount');
    if (confirmCount) confirmCount.textContent = count;
    
    showModal('confirmModal');
}

let currentPreviewFileId = null;

function previewFile(fileId) {
    currentPreviewFileId = fileId;
    const previewContent = document.getElementById('previewContent');
    const previewTitle = document.getElementById('previewTitle');
    
    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        const fileName = fileItem.querySelector('.file-name')?.textContent || '文件预览';
        if (previewTitle) previewTitle.textContent = fileName;
        
        const img = fileItem.querySelector('img');
        if (img) {
            previewContent.innerHTML = `<img src="${img.src}" alt="${fileName}" style="max-width: 100%; max-height: 60vh; border-radius: 8px;">`;
        } else {
            previewContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 80px; margin-bottom: 16px;">📄</div>
                    <p style="color: var(--text-secondary);">此文件类型暂不支持预览</p>
                    <p style="color: var(--text-muted); font-size: 14px;">请下载后查看</p>
                </div>
            `;
        }
    }
    
    showModal('previewModal');
}

function downloadCurrentPreview() {
    if (currentPreviewFileId) {
        const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
        if (orderId) {
            downloadFile(currentPreviewFileId);
        }
    }
}

function downloadFile(fileId) {
    const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
    if (orderId) {
        window.location.href = `/api/orders/${orderId}/files/${fileId}/download`;
        
        const downloadedCount = document.getElementById('downloadedCount');
        if (downloadedCount) {
            let current = parseInt(downloadedCount.textContent) || 0;
            downloadedCount.textContent = (current + 1) + ' 个';
        }
    }
}

function downloadAll() {
    const orderId = window.location.pathname.match(/\/orders\/(\d+)/)?.[1];
    if (orderId) {
        showToast('info', '正在准备下载', '正在打包所有文件，请稍候...');
        window.location.href = `/api/orders/${orderId}/download-all`;
    }
}

function handleException(exceptionId) {
    const form = document.getElementById('handleForm');
    if (form) {
        form.action = `/api/exceptions/${exceptionId}/handle`;
        form.setAttribute('hx-post', `/api/exceptions/${exceptionId}/handle`);
    }
    showModal('handleModal');
}

function closeException(exceptionId) {
    if (confirm('确定要关闭此异常工单吗？关闭后将无法再进行处理。')) {
        htmx.ajax('POST', `/api/exceptions/${exceptionId}/close`, {
            target: 'body',
            swap: 'none'
        });
    }
}

function showLogs(exceptionId) {
    const logsContent = document.getElementById('logsContent');
    if (logsContent) {
        logsContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">加载中...</p>
            </div>
        `;
    }
    
    showModal('logsModal');
    
    htmx.ajax('GET', `/api/exceptions/${exceptionId}/logs`, {
        target: '#logsContent',
        swap: 'innerHTML'
    });
}

function toggleTestAccount(userId, isTest) {
    htmx.ajax('POST', `/api/admin/users/${userId}/test-account`, {
        values: { is_test_account: isTest },
        target: 'body',
        swap: 'none'
    });
}

function resetPassword(userId) {
    const newPassword = prompt('请输入新密码：');
    if (newPassword && newPassword.length >= 6) {
        htmx.ajax('POST', `/api/admin/users/${userId}/reset-password`, {
            values: { password: newPassword },
            target: 'body',
            swap: 'none'
        });
    } else if (newPassword) {
        showToast('error', '密码太短', '密码长度至少6位');
    }
}

function toggleUserStatus(userId, isActive) {
    const action = isActive ? '启用' : '禁用';
    if (confirm(`确定要${action}此用户吗？`)) {
        htmx.ajax('POST', `/api/admin/users/${userId}/status`, {
            values: { is_active: isActive },
            target: 'body',
            swap: 'none'
        });
    }
}

function clearTestData() {
    if (confirm('确定要清除所有测试数据吗？此操作不可恢复！')) {
        htmx.ajax('POST', '/api/admin/clear-test-data', {
            target: 'body',
            swap: 'none'
        });
    }
}

function exportTraceReport() {
    const params = new URLSearchParams(window.location.search);
    window.location.href = `/api/trace/export?${params.toString()}`;
}

function exportAuditLog() {
    const params = new URLSearchParams(window.location.search);
    window.location.href = `/api/admin/audit/export?${params.toString()}`;
}

function markInvoiced(invoiceId) {
    const invoiceNo = prompt('请输入发票号：');
    if (invoiceNo) {
        const invoiceDate = prompt('请输入开票日期（YYYY-MM-DD）：', new Date().toISOString().split('T')[0]);
        if (invoiceDate) {
            htmx.ajax('POST', `/api/invoices/${invoiceId}/mark-invoiced`, {
                values: { invoice_no: invoiceNo, invoice_date: invoiceDate },
                target: 'body',
                swap: 'none'
            });
        }
    }
}

function markPaid(invoiceId) {
    const paymentDate = prompt('请输入回款日期（YYYY-MM-DD）：', new Date().toISOString().split('T')[0]);
    if (paymentDate) {
        htmx.ajax('POST', `/api/invoices/${invoiceId}/mark-paid`, {
            values: { payment_date: paymentDate },
            target: 'body',
            swap: 'none'
        });
    }
}

function extendAuth(authId) {
    const endDate = prompt('请输入新的到期日期（YYYY-MM-DD）：');
    if (endDate) {
        htmx.ajax('POST', `/api/authorizations/${authId}/extend`, {
            values: { end_date: endDate },
            target: 'body',
            swap: 'none'
        });
    }
}

function initAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in-up, .stagger-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    document.querySelectorAll('.stagger-item').forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.05}s`;
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.modal-show').forEach(modal => {
            modal.classList.remove('modal-show');
        });
        document.body.style.overflow = '';
    }
    
    if (e.ctrlKey && e.key === 'a' && window.location.pathname.includes('/selection')) {
        e.preventDefault();
        selectAllPhotos();
    }
    
    if (e.key === 'Enter' && window.location.pathname.includes('/selection')) {
        const confirmBtn = document.querySelector('.selection-toolbar .btn-primary');
        if (confirmBtn && !confirmBtn.disabled) {
            e.preventDefault();
            confirmSelection();
        }
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .toast {
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .toast-show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .toast-hide {
        opacity: 0;
        transform: translateX(100%);
    }
    
    .modal-overlay {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .modal-overlay.modal-show {
        opacity: 1;
        visibility: visible;
    }
    
    .modal {
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .modal-overlay.modal-show .modal {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    
    .photo-checkbox {
        transition: all 0.2s ease;
    }
    
    .photo-checkbox.selected {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
