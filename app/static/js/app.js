(function () {
  'use strict';

  // ============== Toast 提示系统 ==============
  var QHToast = (function () {
    var container = null;

    function ensureContainer() {
      if (!container) {
        container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:360px';
        document.body.appendChild(container);
      }
      return container;
    }

    function show(message, type, duration) {
      type = type || 'info';
      duration = duration || 3000;
      var box = document.createElement('div');
      var colors = {
        success: 'background:linear-gradient(135deg,#3d8d69,#2D7A5E);color:#fff;border-color:#24624c;',
        error: 'background:linear-gradient(135deg,#dc3a38,#b52b29);color:#fff;border-color:#8f1f1e;',
        warning: 'background:linear-gradient(135deg,#e49040,#D4863B);color:#fff;border-color:#9f5325;',
        info: 'background:linear-gradient(135deg,#2f5f94,#1E3A5F);color:#fff;border-color:#1a3050;'
      };
      var icons = { success: '✓', error: '✕', warning: '!', info: 'ℹ' };
      box.style.cssText = colors[type] + 'padding:12px 16px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);pointer-events:auto;display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:500;line-height:1.5;animation:qh-toast-in .28s cubic-bezier(.2,.8,.2,1) both;min-width:240px;';
      box.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">' + icons[type] + '</span><div style="flex:1;min-width:0">' + message + '</div><button onclick="this.parentNode.remove()" style="background:transparent;border:none;color:rgba(255,255,255,.8);cursor:pointer;font-size:16px;padding:0 0 0 8px;line-height:1">×</button>';
      ensureContainer().appendChild(box);
      if (duration > 0) {
        setTimeout(function () {
          box.style.animation = 'qh-toast-out .22s ease-in both';
          setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 250);
        }, duration);
      }
    }

    return {
      success: function (m, d) { show(m, 'success', d); },
      error: function (m, d) { show(m, 'error', d || 5000); },
      warning: function (m, d) { show(m, 'warning', d); },
      info: function (m, d) { show(m, 'info', d); }
    };
  })();
  window.QHToast = QHToast;

  // ============== 金额格式化工具 ==============
  var QHFormat = {
    currency: function (value) {
      if (value === null || value === undefined || isNaN(Number(value))) return '¥0.00';
      var num = Number(value);
      return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    number: function (value, decimals) {
      if (value === null || value === undefined || isNaN(Number(value))) return '0';
      decimals = typeof decimals === 'number' ? decimals : 2;
      return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },
    date: function (input) {
      if (!input) return '—';
      var d;
      if (input instanceof Date) {
        d = input;
      } else if (typeof input === 'string') {
        d = new Date(input.replace(' ', 'T'));
        if (isNaN(d.getTime())) d = new Date(input);
      } else {
        d = new Date(input);
      }
      if (isNaN(d.getTime())) return String(input);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    datetime: function (input, withSeconds) {
      var base = this.date(input);
      if (base === '—') return base;
      var d = input instanceof Date ? input : new Date(typeof input === 'string' ? input.replace(' ', 'T') : input);
      if (isNaN(d.getTime())) return base;
      var t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      if (withSeconds) t += ':' + String(d.getSeconds()).padStart(2, '0');
      return base + ' ' + t;
    },
    relative: function (input) {
      var d = input instanceof Date ? input : new Date(typeof input === 'string' ? input.replace(' ', 'T') : input);
      if (isNaN(d.getTime())) return String(input);
      var diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return Math.floor(diff) + ' 秒前';
      if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
      if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
      if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
      return this.date(input);
    },
    fileSize: function (bytes) {
      if (!bytes || bytes <= 0) return '—';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
      return (bytes / 1073741824).toFixed(2) + ' GB';
    }
  };
  window.QHFormat = QHFormat;

  // ============== 金额输入框实时格式化 ==============
  function formatAmountInput(input) {
    if (!input || input.tagName !== 'INPUT') return;
    var raw = input.value.replace(/[^\d.]/g, '');
    if (raw === '') { input.value = ''; return; }
    var parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      raw = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (raw.startsWith('.')) raw = '0' + raw;
    input.value = raw;
  }
  window.formatAmountInput = formatAmountInput;

  function formatAmountDisplay(input, displayEl) {
    var val = parseFloat(input.value || 0);
    if (displayEl) displayEl.textContent = isNaN(val) ? '0.00' : val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  window.formatAmountDisplay = formatAmountDisplay;

  document.addEventListener('DOMContentLoaded', function () {
    var inputs = document.querySelectorAll('input.amount-input, input[data-amount]');
    inputs.forEach(function (el) {
      el.addEventListener('input', function () {
        formatAmountInput(el);
        var linkedId = el.getAttribute('data-display-target');
        if (linkedId) {
          var target = document.getElementById(linkedId);
          if (target) formatAmountDisplay(el, target);
        }
      });
      if (el.value) formatAmountInput(el);
    });
  });

  // ============== 确认对话框 ==============
  function QHConfirm(message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,29,31,.48);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:qh-fade-in .18s ease both;backdrop-filter:blur(2px);';
      var box = document.createElement('div');
      box.style.cssText = 'background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.22);max-width:420px;width:100%;overflow:hidden;animation:qh-pop-in .24s cubic-bezier(.2,.8,.2,1.1) both;';
      var title = options.title || '确认操作';
      var okText = options.okText || '确认';
      var cancelText = options.cancelText || '取消';
      var type = options.type || 'warning';
      var iconMap = { warning: '⚠', danger: '!', info: 'ℹ', success: '✓' };
      var iconColor = { warning: '#D4863B', danger: '#dc3a38', info: '#2f5f94', success: '#2D7A5E' };
      var okColor = type === 'danger' ? 'background:linear-gradient(180deg,#dc3a38,#b52b29);' : 'background:linear-gradient(180deg,#3d8d69,#2D7A5E);';
      box.innerHTML =
        '<div style="padding:20px 22px 0;display:flex;align-items:flex-start;gap:12px">' +
          '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0;background:' + (iconColor[type] ? iconColor[type] + '18' : '#ececea') + ';color:' + (iconColor[type] || '#4A4E53') + '">' + (iconMap[type] || '?') + '</div>' +
          '<div style="flex:1">' +
            '<div style="font-size:15px;font-weight:600;color:#1A1D1F;margin-bottom:6px;font-family:serif;">' + title + '</div>' +
            '<div style="font-size:13.5px;color:#4A4E53;line-height:1.65">' + message + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:18px 22px 22px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #ececea;margin-top:16px">' +
          '<button class="qh-cancel" style="padding:8px 18px;background:#fff;border:1px solid #d8d6d3;color:#4A4E53;border-radius:8px;font-size:13.5px;cursor:pointer;font-weight:500;">' + cancelText + '</button>' +
          '<button class="qh-ok" style="padding:8px 18px;' + okColor + 'color:#fff;border:1px solid transparent;border-radius:8px;font-size:13.5px;cursor:pointer;font-weight:500;">' + okText + '</button>' +
        '</div>';
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      function close(result) {
        overlay.style.animation = 'qh-fade-out .16s ease both';
        setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 180);
        resolve(result);
      }
      box.querySelector('.qh-cancel').addEventListener('click', function () { close(false); });
      box.querySelector('.qh-ok').addEventListener('click', function () { close(true); });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay && !options.sticky) close(false);
      });
      document.addEventListener('keydown', function keyHandler(e) {
        if (e.key === 'Escape') { document.removeEventListener('keydown', keyHandler); close(false); }
        if (e.key === 'Enter') { document.removeEventListener('keydown', keyHandler); close(true); }
      });
    });
  }
  window.QHConfirm = QHConfirm;

  // ============== HTMX 事件绑定 ==============
  document.addEventListener('htmx:configRequest', function (e) {
    if (!e.detail.headers['HX-Request']) {
      e.detail.headers['HX-Request'] = 'true';
    }
  });

  document.addEventListener('htmx:beforeRequest', function (e) {
    var indicator = e.detail.elt.getAttribute('hx-indicator');
    if (indicator) return;
    if (e.detail.elt.tagName === 'BUTTON' && !e.detail.elt.querySelector('.htmx-indicator')) {
      e.detail.elt.setAttribute('data-loading', 'true');
      e.detail.elt.style.opacity = '.75';
      e.detail.elt.style.pointerEvents = 'none';
    }
  });

  document.addEventListener('htmx:afterRequest', function (e) {
    var elt = e.detail.elt;
    if (elt && elt.tagName === 'BUTTON') {
      elt.style.opacity = '';
      elt.style.pointerEvents = '';
    }
    var xhr = e.detail.xhr;
    if (!xhr) return;
    var status = xhr.status;
    var contentType = xhr.getResponseHeader('Content-Type') || '';
    if (contentType.indexOf('application/json') >= 0 && xhr.responseText) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data && typeof data === 'object') {
          if (data._toast && typeof data._toast === 'object') {
            QHToast[data._toast.type || 'info'](data._toast.message, data._toast.duration);
          } else if (data._redirect) {
            QHToast.success('操作成功，正在跳转...');
            setTimeout(function () { window.location.href = data._redirect; }, 500);
          } else if (data.message && status >= 200 && status < 300) {
            QHToast.success(data.message);
          } else if (data.message && status >= 400) {
            QHToast.error(data.message);
          } else if (data.error) {
            QHToast.error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
          } else if (data.detail) {
            QHToast.error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
          }
        }
      } catch (err) {
      }
    }
    if (status === 401 || status === 403) {
      QHToast.error(status === 401 ? '登录已过期，请重新登录' : '没有权限执行此操作', 4000);
      if (status === 401) setTimeout(function () { window.location.reload(); }, 1200);
    }
    if (status >= 500) {
      QHToast.error('服务器错误，请稍后重试', 4000);
    }
    var loc = xhr.getResponseHeader('HX-Redirect');
    if (loc) {
      setTimeout(function () { window.location.href = loc; }, 300);
    }
  });

  document.addEventListener('htmx:responseError', function (e) {
    var msg = '请求失败';
    try {
      if (e.detail.xhr && e.detail.xhr.responseText) {
        var d = JSON.parse(e.detail.xhr.responseText);
        if (d && (d.message || d.detail || d.error)) msg = d.message || d.detail || d.error || msg;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
      }
    } catch (err) {
      if (e.detail.xhr && e.detail.xhr.statusText) msg = e.detail.xhr.statusText;
    }
    QHToast.error(msg, 4500);
  });

  document.addEventListener('htmx:swapError', function () {
    QHToast.error('页面内容更新失败，请刷新页面');
  });

  document.addEventListener('htmx:afterSwap', function () {
    document.querySelectorAll('input.amount-input, input[data-amount]').forEach(function (el) {
      if (!el._qhBound) {
        el._qhBound = true;
        el.addEventListener('input', function () {
          formatAmountInput(el);
        });
      }
    });
  });

  // ============== 表单校验提示 ==============
  function QHValidate(form) {
    var invalidFields = [];
    var required = form.querySelectorAll('[required]');
    required.forEach(function (el) {
      var tag = el.tagName;
      var val = (tag === 'SELECT' || tag === 'INPUT') ? (el.value || '').trim() : el.textContent;
      if (val === '' || val === null || val === undefined) {
        invalidFields.push({ el: el, msg: '此项为必填项' });
      }
    });
    var numeric = form.querySelectorAll('input[type="number"], input.amount-input, input[data-validate="number"]');
    numeric.forEach(function (el) {
      if (!el.value || !el.required && el.value === '') return;
      var n = Number(el.value);
      if (isNaN(n)) {
        invalidFields.push({ el: el, msg: '请输入有效数字' });
        return;
      }
      var min = parseFloat(el.getAttribute('min'));
      var max = parseFloat(el.getAttribute('max'));
      if (!isNaN(min) && n < min) {
        invalidFields.push({ el: el, msg: '最小值为 ' + min });
      }
      if (!isNaN(max) && n > max) {
        invalidFields.push({ el: el, msg: '最大值为 ' + max });
      }
    });
    var emails = form.querySelectorAll('input[type="email"]');
    emails.forEach(function (el) {
      if (!el.value) return;
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(el.value.trim())) {
        invalidFields.push({ el: el, msg: '邮箱格式不正确' });
      }
    });
    if (invalidFields.length > 0) {
      invalidFields.forEach(function (item, idx) {
        showFieldError(item.el, item.msg);
        if (idx === 0) {
          try { item.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
          setTimeout(function () { item.el.focus && item.el.focus(); }, 100);
        }
      });
      QHToast.warning(invalidFields[0].msg || '请检查表单填写');
      return false;
    }
    return true;
  }
  window.QHValidate = QHValidate;

  function showFieldError(el, message) {
    var oldMsg = el.parentNode.querySelector('.qh-field-error');
    if (oldMsg) oldMsg.parentNode.removeChild(oldMsg);
    el.style.transition = 'border-color .2s, box-shadow .2s';
    el.style.borderColor = '#ee8583';
    el.style.boxShadow = '0 0 0 3px rgba(220,58,56,.12)';
    var msg = document.createElement('div');
    msg.className = 'qh-field-error';
    msg.style.cssText = 'color:#b52b29;font-size:11.5px;margin-top:4px;line-height:1.5;animation:qh-fade-in .2s ease both;';
    msg.textContent = message;
    el.parentNode.insertBefore(msg, el.nextSibling);
    function clear() {
      el.style.borderColor = '';
      el.style.boxShadow = '';
      if (msg.parentNode) msg.parentNode.removeChild(msg);
      el.removeEventListener('input', clear);
      el.removeEventListener('change', clear);
    }
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  }

  document.addEventListener('submit', function (e) {
    if (e.target.getAttribute('data-qh-validate') === 'false') return;
    if (e.target.tagName !== 'FORM') return;
    if (!QHValidate(e.target)) e.preventDefault();
  }, true);

  // ============== 全局 hx-confirm 增强 ==============
  document.addEventListener('htmx:confirm', function (e) {
    if (e.detail.question) {
      e.preventDefault();
      QHConfirm(e.detail.question, {
        title: '操作确认',
        type: e.detail.elt.classList.contains('btn-danger') ? 'danger' : 'warning',
        okText: '确认',
        cancelText: '取消'
      }).then(function (ok) {
        if (ok) e.detail.issueRequest();
      });
    }
  });

  // ============== 通用工具函数 ==============
  var QHUtil = {
    qs: function (name, url) {
      url = url || window.location.href;
      name = name.replace(/[[\]]/g, '\\$&');
      var re = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
      var m = re.exec(url);
      if (!m) return null;
      if (!m[2]) return '';
      return decodeURIComponent(m[2].replace(/\+/g, ' '));
    },
    copyText: function (text) {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(text).then(function () {
          QHToast.success('已复制到剪贴板');
        }, function () {
          fallbackCopy(text);
        });
      }
      fallbackCopy(text);
      return Promise.resolve();
      function fallbackCopy(t) {
        var ta = document.createElement('textarea');
        ta.value = t;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); QHToast.success('已复制到剪贴板'); }
        catch (err) { QHToast.error('复制失败，请手动选择'); }
        document.body.removeChild(ta);
      }
    },
    debounce: function (fn, delay) {
      var timer = null;
      return function () {
        var ctx = this, args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, delay || 300);
      };
    },
    throttle: function (fn, limit) {
      var inThrottle = false;
      return function () {
        var ctx = this, args = arguments;
        if (!inThrottle) {
          fn.apply(ctx, args);
          inThrottle = true;
          setTimeout(function () { inThrottle = false; }, limit || 150);
        }
      };
    },
    escapeHtml: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    onReady: function (fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
      } else { fn(); }
    }
  };
  window.QHUtil = QHUtil;

  // ============== 注入动画 CSS ==============
  (function injectAnimations() {
    if (document.getElementById('qh-animations')) return;
    var style = document.createElement('style');
    style.id = 'qh-animations';
    style.textContent = [
      '@keyframes qh-toast-in { from { transform: translateY(-12px) translateX(12px); opacity: 0 } to { transform: translateY(0) translateX(0); opacity: 1 } }',
      '@keyframes qh-toast-out { to { transform: translateY(-8px); opacity: 0; margin-top: -8px } }',
      '@keyframes qh-fade-in { from { opacity: 0 } to { opacity: 1 } }',
      '@keyframes qh-fade-out { to { opacity: 0 } }',
      '@keyframes qh-pop-in { from { transform: scale(.92) translateY(8px); opacity: 0 } to { transform: scale(1) translateY(0); opacity: 1 } }'
    ].join('\n');
    document.head.appendChild(style);
  })();

})();
