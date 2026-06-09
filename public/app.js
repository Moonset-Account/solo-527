const API = {
  async request(path, method = 'GET', body = null, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (opts.fileUpload) delete headers['Content-Type'];
    const res = await fetch(path.startsWith('http') ? path : path.startsWith('/') ? path : '/api' + path, {
      method, headers,
      body: body ? (opts.fileUpload ? body : JSON.stringify(body)) : null,
    });
    let data;
    try { data = await res.json(); } catch(e) { data = { code: res.status, message: res.statusText }; }
    if (res.status === 401 && !path.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      renderLogin();
      throw new Error('未登录');
    }
    return data;
  },
  get(p, q) { const qs = q ? '?' + new URLSearchParams(q).toString() : ''; return this.request(p + qs, 'GET'); },
  post(p, b, o) { return this.request(p, 'POST', b, o); },
  put(p, b) { return this.request(p, 'PUT', b); },
  _delete(p) { return this.request(p, 'DELETE'); },
};

const MENU = [
  { section: '工作台' },
  { id: 'dashboard', icon: '📊', label: '综合看板', perms: ['stats:view_all', 'stats:view_basic'] },
  { id: 'inference', icon: '🤖', label: '工单分拨推理', perms: ['ticket:assign'] },
  { id: 'review', icon: '✅', label: '待复核队列', badge: 'review', perms: ['ticket:review'] },
  { id: 'tickets', icon: '📋', label: '工单管理', perms: ['ticket:view_all'] },
  { section: '数据与评估' },
  { id: 'historical', icon: '📚', label: '历史工单库', perms: ['data:import', 'data:export', 'stats:view_basic'] },
  { id: 'evaluation', icon: '🎯', label: '验收评估面板', perms: ['model:evaluate', 'stats:view_all'] },
  { id: 'vector', icon: '🔍', label: '向量索引管理', perms: ['model:configure', 'model:evaluate'] },
  { section: '系统' },
  { id: 'meta', icon: '⚙️', label: '系统元数据', perms: ['stats:view_basic'] },
  { id: 'users', icon: '👥', label: '用户管理', perms: ['user:view'] },
];

let currentUser = null;
let currentPage = 'dashboard';
let reviewBadgeCount = 0;
let metaCache = null;

function $(s) { return document.querySelector(s); }
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== null && v !== undefined) e.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  });
  return e;
}

function toast(msg, type = 'info', duration = 2800) {
  const t = $('#toast');
  t.className = 'toast show ' + (type !== 'info' ? type : '');
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, duration);
}

function hasPerm(p) {
  if (!currentUser) return false;
  const ps = currentUser.permissions || [];
  return Array.isArray(p) ? p.some(x => ps.includes(x)) : ps.includes(p);
}

function fmtDate(s, withTime = true) {
  if (!s) return '-';
  const d = new Date(s);
  const pad = n => n.toString().padStart(2, '0');
  const base = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return withTime ? `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
}

function statusText(s) {
  return { auto_assigned: '自动分拨', reviewing: '复核中', reassigned: '人工改标',
    closed: '已关闭', escalated: '已升级', pending: '待处理' }[s] || s;
}

function tagClassForStatus(s) {
  return { auto_assigned: 'tag-success', reviewing: 'tag-warning', reassigned: 'tag-purple',
    closed: 'tag-gray', escalated: 'tag-danger', pending: 'tag-info' }[s] || 'tag-gray';
}

function tagClassForUrgency(u) {
  return { '特急': 'tag-danger', '紧急': 'tag-warning', '一般': 'tag-primary', '缓办': 'tag-gray' }[u] || 'tag-gray';
}

function confClass(v) { return v >= 0.85 ? 'high' : v >= 0.7 ? 'medium' : 'low'; }

function logout(e) {
  e && e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  renderLogin();
}

async function refreshReviewBadge() {
  try {
    const r = await API.get('/review-queue', { pageSize: 1 });
    reviewBadgeCount = r.data?.total || 0;
  } catch (e) { reviewBadgeCount = 0; }
}

function renderSidebar() {
  const nav = $('#nav-menu');
  nav.innerHTML = '';
  MENU.forEach(m => {
    if (m.section) { nav.appendChild(el('div', { class: 'nav-section' }, m.section)); return; }
    if (m.perms && !m.perms.some(hasPerm)) return;
    const children = [el('span', { class: 'nav-icon' }, m.icon), el('span', {}, m.label)];
    if (m.badge === 'review' && reviewBadgeCount > 0) {
      children.push(el('span', { class: 'nav-badge' }, String(reviewBadgeCount)));
    }
    nav.appendChild(el('a', {
      class: 'nav-item' + (currentPage === m.id ? ' active' : ''),
      href: '#', onclick: (e) => { e.preventDefault(); goTo(m.id); },
    }, children));
  });
  if (currentUser) {
    const roleText = { admin: '管理员', supervisor: '主管', operator: '接线员' }[currentUser.role];
    $('#user-name').textContent = `${currentUser.name}（${roleText}）`;
  }
}

function goTo(page) {
  currentPage = page;
  const titles = {
    dashboard: '综合看板', inference: '工单分拨推理', review: '待复核队列',
    tickets: '工单管理', historical: '历史工单库', evaluation: '验收评估面板',
    vector: '向量索引管理', meta: '系统元数据', users: '用户管理',
  };
  $('#page-title').textContent = titles[page] || '工作台';
  renderSidebar();
  const renderers = {
    dashboard: renderDashboard, inference: renderInference, review: renderReview,
    tickets: renderTickets, historical: renderHistorical, evaluation: renderEvaluation,
    vector: renderVector, meta: renderMeta, users: renderUsers,
  };
  (renderers[page] || renderDashboard)();
  if (page === 'review' || page === 'dashboard') refreshReviewBadge();
}

function goToInference() { goTo('inference'); }

async function getMeta() {
  if (metaCache) return metaCache;
  try {
    const r = await API.get('/data/meta');
    metaCache = r.data;
  } catch (e) { metaCache = { categories: [], urgency_levels: [], departments: [], high_risk_categories: [], thresholds: {} }; }
  return metaCache;
}

async function loadEnvTag() {
  try { const r = await API.get('/health'); $('#env-tag').textContent = (r.data?.env || 'dev').toUpperCase() + ' ' + r.data?.version; } catch (e) {}
}

async function init() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) { renderLogin(); return; }
  try {
    currentUser = JSON.parse(userStr);
    const r = await API.get('/auth/me');
    if (r.code !== 0) throw new Error('invalid');
    currentUser = r.data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    document.body.style.background = '';
    await refreshReviewBadge();
    renderSidebar();
    goTo('dashboard');
    loadEnvTag();
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    renderLogin();
  }
}

function renderLogin() {
  const app = $('#app');
  app.innerHTML = '';
  document.body.style.background = '';
  const page = el('div', { class: 'login-page' }, [
    el('div', { class: 'login-box' }, [
      el('div', { class: 'login-logo' }, [
        el('div', { class: 'login-logo-icon' }, '🏘️'),
        el('div', { class: 'login-title' }, '社区热线诉求分拨助手'),
        el('div', { class: 'login-subtitle' }, '模型工作台 · 试运行版'),
      ]),
      el('form', { onsubmit: async (e) => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        try {
          const r = await API.post('/auth/login', { email, password });
          if (r.code === 0) {
            localStorage.setItem('token', r.data.token);
            localStorage.setItem('user', JSON.stringify(r.data.user));
            currentUser = r.data.user;
            toast('登录成功', 'success');
            setTimeout(() => location.reload(), 400);
          } else toast(r.message || '登录失败', 'error');
        } catch (err) { toast('网络错误', 'error'); }
      }}, [
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '邮箱账号'),
          el('input', { id: 'login-email', class: 'form-control', type: 'email', value: 'supervisor@community.gov', required: '' }),
        ]),
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '登录密码'),
          el('input', { id: 'login-password', class: 'form-control', type: 'password', value: 'Super@123456', required: '' }),
        ]),
        el('button', { class: 'btn btn-primary', style: 'width:100%;padding:11px;margin-top:4px;' }, '登 录'),
      ]),
      el('div', { style: 'margin-top:18px;padding-top:16px;border-top:1px dashed var(--border);' }, [
        el('div', { style: 'font-size:12px;color:var(--text-muted);margin-bottom:8px;font-weight:600;' }, '演示账号'),
        el('div', { html: `管理员: admin@community.gov / Admin@123456<br/>热线主管: supervisor@community.gov / Super@123456<br/>接线员: operator@community.gov / Oper@123456`,
          style: 'font-size:11.5px;color:var(--text-muted);line-height:1.8;' }),
      ]),
    ]),
  ]);
  app.appendChild(page);
}

function statCard(label, value, color, sub) {
  const cls = { blue: '', green: 'success', warning: 'warning', danger: 'danger', info: 'info', purple: 'purple' }[color] || '';
  const c = el('div', { class: 'stat-card ' + cls }, [
    el('div', { class: 'stat-label' }, label),
    el('div', { class: 'stat-value' }, String(value)),
  ]);
  if (sub) c.appendChild(el('div', { class: 'stat-trend' }, sub));
  return c;
}

function chartBar(label, value, max, color) {
  const pct = max > 0 ? (value / max * 100) : 0;
  return el('div', { class: 'chart-item' }, [
    el('span', { class: 'chart-label', title: label }, label.length > 8 ? label.slice(0,7)+'…' : label),
    el('div', { class: 'chart-bar' }, [ el('div', { class: 'chart-bar-fill', style: `width:${pct}%;background:${color};` }) ]),
    el('span', { class: 'chart-value' }, String(value)),
  ]);
}

async function renderDashboard() {
  const c = $('#content');
  c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div>加载中...</div>';
  try {
    const r = await API.get('/dashboard/stats');
    const d = r.data;
    c.innerHTML = '';
    c.appendChild(el('div', { class: 'stats-grid' }, [
      statCard('今日受理工单', d.today.total, 'blue', '含自动分拨 + 人工录入'),
      statCard('自动分拨', d.today.auto_assigned, 'green', `自动分拨率 ${d.auto_rate}%`),
      statCard('待复核处理', d.today.reviewing, 'warning', `🚨 高风险 ${d.today.high_risk} 件`),
      statCard('今日已关闭', d.today.closed, 'info', '按流程办结的工单'),
      statCard('7日平均置信度', `${(d.avg_confidence_7d.category*100).toFixed(1)}%`, 'purple', `分类/科室/紧急度 平均`),
      statCard('复核通过率', `${d.review_stats.approve_rate || 0}%`, d.review_stats.modify_rate > 20 ? 'warning' : 'green', `改标率 ${d.review_stats.modify_rate || 0}%`),
    ]));

    const charts = el('div', { class: 'chart-row' });
    if (d.by_category?.length) {
      const max = Math.max(...d.by_category.map(x => x.count));
      charts.appendChild(el('div', { class: 'card', style: 'margin-bottom:0' }, [
        el('div', { class: 'card-title' }, '诉求类别分布 (Top 10)'),
        el('div', { style: 'margin-top:12px' }, d.by_category.slice(0, 10).map(x => chartBar(x.category, x.count, max, 'var(--primary)'))),
      ]));
    }
    if (d.by_urgency?.length) {
      const max = Math.max(...d.by_urgency.map(x => x.count), 1);
      charts.appendChild(el('div', { class: 'card', style: 'margin-bottom:0' }, [
        el('div', { class: 'card-title' }, '紧急程度分布'),
        el('div', { style: 'margin-top:12px' }, d.by_urgency.map(x => {
          const color = x.urgency === '特急' ? 'var(--danger)' : x.urgency === '紧急' ? 'var(--warning)' : 'var(--primary)';
          return chartBar(x.urgency, x.count, max, color);
        })),
      ]));
    }
    if (d.by_department?.length) {
      const max = Math.max(...d.by_department.map(x => x.count));
      charts.appendChild(el('div', { class: 'card', style: 'margin-bottom:0' }, [
        el('div', { class: 'card-title' }, '承办科室工单 (近7日)'),
        el('div', { style: 'margin-top:12px' }, d.by_department.slice(0, 8).map(x => chartBar(x.department_name || x.department_code, x.count, max, 'var(--purple)'))),
      ]));
    }
    if (charts.children.length) c.appendChild(charts);
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div>加载失败: ${e.message}</div>`;
  }
}

const SAMPLES = [
  { content: '我是望京街道南湖东园小区的居民，我们小区2号楼3单元的电梯坏了三天了，一直没人修，楼里住着很多老人和孩子，上下楼特别不方便，而且万一有急事消防车救护车都上不去，存在严重安全隐患，请赶紧派人来协调物业维修！', district: '朝阳区', block: '望京街道', community: '南湖东园小区', orig: '市政设施' },
  { content: '反映朝阳北路和青年路交叉口西南角，有个井盖塌陷了一个坑，晚上骑车特别危险，已经有人摔到了，希望赶紧修一下', district: '朝阳区', orig: '市政设施' },
  { content: '我们小区门口旁边的小路上，每天晚上都有一堆人摆烧烤摊，油烟特别大，噪音吵到半夜两三点，小孩老人都没法休息，报过警也没用', orig: '城市管理' },
  { content: '我要举报XX工地在没有任何手续的情况下擅自施工，而且不戴安全帽，还让工人高空违章作业，昨天差点出人命', orig: '安全生产' },
  { content: '我们公司20多个农民工兄弟干了一年，老板一直拖欠工资不给，马上过年了，我们准备集体去区政府上访，今天下午就在区政府门口集合', orig: '劳动保障' },
  { content: '您好我想咨询一下，60岁以上的老人办理公交老年卡需要什么材料，去哪办，多长时间能拿到？', orig: '民政救助' },
];

function fillSample() {
  const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  const setV = (id, v) => { const e = document.getElementById(id); if (e && v) e.value = v; };
  setV('f-content', s.content); setV('f-district', s.district); setV('f-block', s.block);
  setV('f-community', s.community); setV('f-origcat', s.orig);
  toast('已填充示例数据', 'success');
}

async function renderInference() {
  const c = $('#content');
  c.innerHTML = '';
  const meta = await getMeta();
  c.appendChild(el('div', { class: 'progress-steps', id: 'inf-steps' }, [
    el('div', { class: 'progress-step current', id: 'step-1' }, '1 录入信息'),
    el('div', { class: 'progress-step', id: 'step-2' }, '2 AI推理'),
    el('div', { class: 'progress-step', id: 'step-3' }, '3 结果确认'),
  ]));
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, '诉求信息录入'),
        el('div', { class: 'card-subtitle' }, '模型自动完成：分类 · 紧急度 · 科室推荐 · 相似工单检索 · 高风险识别'),
      ]),
      el('button', { class: 'btn btn-outline btn-sm', onclick: fillSample }, '📋 随机填充示例'),
    ]),
    buildInferenceForm(meta),
    el('div', { style: 'display:flex;gap:10px;justify-content:flex-end;margin-top:10px;' }, [
      el('button', { class: 'btn btn-outline', onclick: () => document.getElementById('inf-form').reset() }, '清空'),
      el('button', { class: 'btn btn-outline', id: 'btn-dry', onclick: () => runInference(true) }, '🔍 仅推理预览'),
      el('button', { class: 'btn btn-primary', id: 'btn-run', onclick: () => runInference(false) }, '🚀 正式分拨入库'),
    ]),
  ]));
  c.appendChild(el('div', { id: 'inf-result', style: 'display:none;' }));
}

function buildInferenceForm(meta) {
  const opts = arr => arr.map(x => el('option', { value: x }, x));
  return el('form', { id: 'inf-form', onsubmit: e => e.preventDefault() }, [
    el('div', { class: 'form-row' }, [
      el('div', { class: 'form-group' }, [
        el('label', { class: 'form-label' }, [el('span', { class: 'required' }, '*'), '来电文本 (越详细越好)']),
        el('textarea', { id: 'f-content', class: 'form-control', rows: 6, required: '',
          placeholder: '请完整录入：发生时间、具体地点、人物、事件经过、涉及数量、已采取措施、诉求期望等...' }),
      ]),
      el('div', {}, [
        el('div', { class: 'form-row' }, [
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '工单编号 (可选)'),
            el('input', { id: 'f-ticketno', class: 'form-control', placeholder: '不填则自动生成' }),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '来电人'),
            el('input', { id: 'f-name', class: 'form-control' }),
          ]),
        ]),
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '联系电话'),
          el('input', { id: 'f-phone', class: 'form-control', placeholder: '11位手机号 (会自动脱敏存储)' }),
        ]),
        el('div', { class: 'form-row-3' }, [
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '区/县'),
            el('select', { id: 'f-district', class: 'form-control' }, [
              el('option', { value: '' }, '请选择'),
              ...['朝阳区','海淀区','西城区','东城区','丰台区','石景山区','通州区','昌平区','大兴区','顺义区','房山区'].map(x => el('option', { value: x }, x)),
            ]),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '街道'),
            el('input', { id: 'f-block', class: 'form-control' }),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '社区/小区'),
            el('input', { id: 'f-community', class: 'form-control' }),
          ]),
        ]),
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '初始登记类别 (模型参考)'),
          el('select', { id: 'f-origcat', class: 'form-control' }, [ el('option', { value: '' }, '未分类'), ...opts(meta.categories) ]),
        ]),
      ]),
    ]),
  ]);
}

async function runInference(dry) {
  const content = document.getElementById('f-content').value.trim();
  if (!content || content.length < 5) { toast('请填写诉求内容（至少5字）', 'warning'); return; }
  $('#btn-run').disabled = $('#btn-dry').disabled = true;
  $('#step-1').classList.remove('current'); $('#step-1').classList.add('done');
  $('#step-2').classList.add('current');
  try {
    const body = {
      ticket_no: document.getElementById('f-ticketno').value || undefined,
      caller_name: document.getElementById('f-name').value || undefined,
      caller_phone: document.getElementById('f-phone').value || undefined,
      district: document.getElementById('f-district').value || undefined,
      block: document.getElementById('f-block').value || undefined,
      community: document.getElementById('f-community').value || undefined,
      content,
      original_category: document.getElementById('f-origcat').value || undefined,
    };
    const r = await API.post(`/tickets/infer${dry ? '?dry=1' : ''}`, body);
    if (r.code !== 0) throw new Error(r.message);
    $('#step-2').classList.remove('current'); $('#step-2').classList.add('done');
    $('#step-3').classList.add('current');
    showInferenceResult(r.data, dry);
    toast(dry ? '推理预览完成' : '工单已入库分拨', 'success');
  } catch (e) {
    $('#step-1').classList.add('current');
    $('#step-2').classList.remove('current', 'done');
    toast('推理失败：' + e.message, 'error');
  } finally {
    $('#btn-run').disabled = $('#btn-dry').disabled = false;
  }
}

function showInferenceResult(d, dry) {
  const d2 = d.inference || d;
  const minConf = Math.min(d2.category_confidence, d2.urgency_confidence, d2.department_confidence);
  const box = $('#inf-result');
  box.style.display = 'block';
  box.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">分拨推理结果 ${dry ? '<span class="tag tag-info">预览</span>' : '<span class="tag tag-success">已入库</span>'}</div>
          <div class="card-subtitle">${d.ticket_no ? '工单号：' + d.ticket_no + ' · ' : ''}耗时 ${d2.latency_ms || '-'}ms · Tokens ${d2.tokens_used || '-'} · 模型 ${d2.model_version || 'v1'}</div>
        </div>
        <div class="flex gap-8">
          ${d2.needs_review ? '<span class="tag tag-warning">⚠️ 进入复核队列</span>' : '<span class="tag tag-success">✅ 自动分拨</span>'}
          ${d2.is_high_risk ? '<span class="tag tag-danger">🚨 高风险诉求</span>' : ''}
        </div>
      </div>
      ${d2.is_high_risk || d2.needs_review ? `
        <div class="alert ${d2.is_high_risk ? 'alert-danger' : 'alert-warning'}">
          <span class="alert-icon">${d2.is_high_risk ? '🚨' : '⚠️'}</span>
          <div>
            <div><b>${d2.is_high_risk ? '高风险民生诉求拦截：' : '触发人工复核：'}</b>${d2.review_reason || d2.reason}</div>
            ${d2.is_high_risk ? '<div style="margin-top:4px;font-size:12px;">该类诉求<b>禁止自动关闭</b>，必须人工确认后才能进入分拨流程</div>' : ''}
          </div>
        </div>` : ''}
      <div class="inference-result">
        <div class="result-section">
          <h4>🏷️ 诉求分类</h4>
          <div class="result-value">${d2.category}</div>
          <div class="confidence-bar"><div class="confidence-fill ${confClass(d2.category_confidence)}" style="width:${(d2.category_confidence*100).toFixed(0)}%"></div></div>
          <div class="result-meta">置信度 ${(d2.category_confidence*100).toFixed(1)}%</div>
        </div>
        <div class="result-section">
          <h4>⏱️ 紧急程度 <span class="tag ${tagClassForUrgency(d2.urgency)}" style="margin-left:auto;">${d2.urgency}</span></h4>
          <div class="confidence-bar"><div class="confidence-fill ${confClass(d2.urgency_confidence)}" style="width:${(d2.urgency_confidence*100).toFixed(0)}%"></div></div>
          <div class="result-meta">置信度 ${(d2.urgency_confidence*100).toFixed(1)}%</div>
        </div>
        <div class="result-section">
          <h4>🏢 承办科室</h4>
          <div class="result-value">${d2.department_name} <span class="tag tag-gray" style="font-size:11px;">${d2.department_code}</span></div>
          <div class="confidence-bar"><div class="confidence-fill ${confClass(d2.department_confidence)}" style="width:${(d2.department_confidence*100).toFixed(0)}%"></div></div>
          <div class="result-meta">置信度 ${(d2.department_confidence*100).toFixed(1)}% · 综合置信度 <b style="color:${minConf < 0.7 ? 'var(--danger)' : minConf < 0.85 ? 'var(--warning)' : 'var(--success)'}">${(minConf*100).toFixed(1)}%</b></div>
        </div>
        <div class="result-section">
          <h4>💡 判断依据</h4>
          <div style="font-size:12.5px;line-height:1.7;">${d2.reasoning || '基于语义相似度、规则关键词与历史相似工单综合判断'}</div>
        </div>
      </div>
      ${d2.similar_tickets && d2.similar_tickets.length ? `
        <div style="margin-top:16px;">
          <div class="detail-section-title">📚 相似历史工单 (Top ${d2.similar_tickets.length})</div>
          <table>
            <thead><tr><th>相似度</th><th>工单编号</th><th>类别</th><th>承办科室</th><th>紧急度</th><th>处理天数</th><th>回访分</th></tr></thead>
            <tbody>${d2.similar_tickets.map(t => `
              <tr>
                <td><span class="tag ${t.score >= 0.8 ? 'tag-success' : t.score >= 0.65 ? 'tag-warning' : 'tag-gray'}">${(t.score*100).toFixed(1)}%</span></td>
                <td class="nowrap">${t.ticket_no}</td>
                <td>${t.category || '-'}</td>
                <td>${t.department_name || t.department_code || '-'}</td>
                <td>${t.urgency ? '<span class="tag ' + tagClassForUrgency(t.urgency) + '">' + t.urgency + '</span>' : '-'}</td>
                <td>${t.resolution_days != null ? t.resolution_days + '天' : '-'}</td>
                <td>${t.followup_score != null ? t.followup_score + '分' : '-'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div class="form-help" style="margin-top:14px;">暂无匹配的相似历史工单（索引中无数据或匹配度过低）</div>'}
    </div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const ticketState = { page: 1, pageSize: 20, total: 0 };

async function renderTickets() {
  const c = $('#content');
  c.innerHTML = '';
  const meta = await getMeta();
  c.appendChild(el('div', { class: 'filter-row' }, [
    el('input', { id: 'tf-kw', class: 'form-control', placeholder: '🔍 搜索工单号/内容/来电人', style: 'min-width:280px;' }),
    el('select', { id: 'tf-status', class: 'form-control' }, [
      el('option', { value: '' }, '全部状态'),
      el('option', { value: 'auto_assigned' }, '自动分拨'),
      el('option', { value: 'reviewing' }, '复核中'),
      el('option', { value: 'reassigned' }, '人工改标'),
      el('option', { value: 'escalated' }, '已升级'),
      el('option', { value: 'closed' }, '已关闭'),
    ]),
    el('select', { id: 'tf-cat', class: 'form-control' }, [el('option', { value: '' }, '全部类别'), ...meta.categories.map(x => el('option', { value: x }, x))]),
    el('select', { id: 'tf-urg', class: 'form-control' }, [
      el('option', { value: '' }, '全部紧急度'),
      ['特急','紧急','一般','缓办'].map(x => el('option', { value: x }, x)),
    ]),
    el('select', { id: 'tf-risk', class: 'form-control' }, [
      el('option', { value: '' }, '风险全部'),
      el('option', { value: '1' }, '🚨 仅高风险'),
      el('option', { value: '0' }, '非高风险'),
    ]),
    el('button', { class: 'btn btn-primary btn-sm', onclick: () => { ticketState.page = 1; loadTickets(); } }, '查询'),
    el('button', { class: 'btn btn-outline btn-sm', onclick: () => {
      ['tf-kw','tf-status','tf-cat','tf-urg','tf-risk'].forEach(id => document.getElementById(id).value = '');
      ticketState.page = 1; loadTickets();
    } }, '重置'),
  ]));
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, '工单列表'),
        el('div', { class: 'card-subtitle', id: 'ticket-count' }, '加载中...'),
      ]),
    ]),
    el('div', { id: 'ticket-table', style: 'min-height:300px;' }),
    el('div', { id: 'ticket-pagination' }),
  ]));
  loadTickets();
}

async function loadTickets() {
  const q = {
    page: ticketState.page, pageSize: ticketState.pageSize,
    keyword: document.getElementById('tf-kw').value.trim() || undefined,
    status: document.getElementById('tf-status').value || undefined,
    category: document.getElementById('tf-cat').value || undefined,
    urgency: document.getElementById('tf-urg').value || undefined,
    is_high_risk: document.getElementById('tf-risk').value === '' ? undefined : (document.getElementById('tf-risk').value === '1'),
  };
  try {
    const r = await API.get('/tickets', q);
    ticketState.total = r.data.total;
    renderTicketTable(r.data.list, r.data);
  } catch (e) {
    $('#ticket-table').innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div>加载失败: ${e.message}</div>`;
  }
}

function renderPager(page, totalPages, onChange) {
  const wrap = el('div', { class: 'pagination' });
  wrap.appendChild(el('div', { class: 'page-info' }, `第 ${page} / ${totalPages || 1} 页`));
  const btns = el('div', { class: 'page-buttons' });
  const addBtn = (label, p, dis) => btns.appendChild(el('button', {
    class: 'page-btn' + (p === page && !label.match(/[‹»]/) ? ' active' : ''),
    onclick: () => !dis && onChange(p), disabled: dis ? 'disabled' : null,
  }, label));
  addBtn('«', 1, page <= 1);
  addBtn('‹', page - 1, page <= 1);
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) addBtn(String(i), i);
  addBtn('›', page + 1, page >= totalPages);
  addBtn('»', totalPages, page >= totalPages);
  wrap.appendChild(btns);
  return wrap;
}

function renderTicketTable(list, data) {
  const box = $('#ticket-table');
  $('#ticket-count').textContent = `共 ${data.total} 条 · 第 ${data.page}/${data.totalPages || 1} 页`;
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div>暂无工单数据<br/><span style="font-size:12px;">前往"工单分拨推理"可新建工单</span></div>`;
    $('#ticket-pagination').innerHTML = '';
    return;
  }
  const t = el('table');
  t.innerHTML = `
    <thead><tr>
      <th>工单号</th><th>内容摘要</th><th>区域</th><th>分类</th>
      <th>紧急度</th><th>承办科室</th><th>最低置信度</th><th>状态</th><th>创建时间</th><th>操作</th>
    </tr></thead>
    <tbody>${list.map(t => {
      const minConf = Math.min(t.category_confidence, t.urgency_confidence, t.department_confidence);
      return `<tr>
        <td class="nowrap">${t.is_high_risk ? '🚨 ' : ''}${t.ticket_no}</td>
        <td style="max-width:300px;" title="${t.content.replace(/"/g,'&quot;')}">${t.content.length > 50 ? t.content.slice(0, 50) + '…' : t.content}</td>
        <td>${[t.district, t.block, t.community].filter(Boolean).join('/') || '-'}</td>
        <td>${t.category || '-'}<br/><span style="font-size:11px;color:var(--text-muted);">${(t.category_confidence*100).toFixed(0)}%</span></td>
        <td><span class="tag ${tagClassForUrgency(t.urgency)}">${t.urgency || '-'}</span></td>
        <td>${t.department_name || '-'}<br/><span style="font-size:11px;color:var(--text-muted);">${(t.department_confidence*100).toFixed(0)}%</span></td>
        <td><span class="tag tag-${confClass(minConf)}">${(minConf*100).toFixed(1)}%</span></td>
        <td><span class="tag ${tagClassForStatus(t.status)}">${statusText(t.status)}</span></td>
        <td class="nowrap" style="font-size:12px;">${fmtDate(t.created_at, false)}</td>
        <td class="nowrap">
          <button class="btn btn-outline btn-xs" onclick="openTicketDetail('${t.id}')">详情</button>
          ${t.status !== 'closed' ? `<button class="btn btn-outline btn-xs" onclick="closeTicketAction('${t.id}')">关闭</button>` : ''}
        </td>
      </tr>`;
    }).join('')}</tbody>`;
  box.innerHTML = '';
  box.appendChild(t);
  $('#ticket-pagination').innerHTML = '';
  $('#ticket-pagination').appendChild(renderPager(data.page, data.totalPages, p => { ticketState.page = p; loadTickets(); }));
}

function closeModal() { $('#modal-root').innerHTML = ''; }

async function openTicketDetail(id) {
  try {
    const r = await API.get(`/tickets/${id}`);
    if (r.code !== 0) throw new Error(r.message);
    showTicketDetailModal(r.data);
  } catch (e) { toast(e.message, 'error'); }
}

function showTicketDetailModal(t) {
  const minConf = Math.min(t.category_confidence, t.urgency_confidence, t.department_confidence);
  const d = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === e.currentTarget) closeModal(); } }, [
    el('div', { class: 'modal', style: 'width:820px;' }, [
      el('div', { class: 'modal-header' }, [
        el('div', { class: 'modal-title' }, `工单详情 · ${t.ticket_no}${t.is_high_risk ? ' 🚨' : ''}`),
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
      ]),
      el('div', { class: 'modal-body', html: `
        <div class="flex-between mb-16">
          <div class="flex gap-8 flex-wrap">
            <span class="tag ${tagClassForStatus(t.status)}">${statusText(t.status)}</span>
            <span class="tag ${tagClassForUrgency(t.urgency)}">${t.urgency}</span>
            ${t.is_high_risk ? '<span class="tag tag-danger">🚨 高风险</span>' : ''}
            ${t.needs_review ? '<span class="tag tag-warning">待复核</span>' : ''}
            <span class="tag tag-gray">综合置信 ${(minConf*100).toFixed(1)}%</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">${fmtDate(t.created_at)}</div>
        </div>
        <div class="ticket-detail-grid">
          <div>
            <div class="detail-section-title">来电人信息</div>
            <div class="detail-item"><span class="detail-label">姓名</span><span class="detail-value">${t.caller_name || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">电话</span><span class="detail-value">${t.caller_phone || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">地址</span><span class="detail-value">${t.caller_address || '-'}</span></div>
            <div class="detail-section-title">区域信息</div>
            <div class="detail-item"><span class="detail-label">区/县</span><span class="detail-value">${t.district || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">街道</span><span class="detail-value">${t.block || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">社区</span><span class="detail-value">${t.community || '-'}</span></div>
            <div class="detail-section-title">处理时间</div>
            <div class="detail-item"><span class="detail-label">创建</span><span class="detail-value">${fmtDate(t.created_at, false)}</span></div>
            <div class="detail-item"><span class="detail-label">分拨</span><span class="detail-value">${fmtDate(t.assigned_at, false)}</span></div>
            <div class="detail-item"><span class="detail-label">关闭</span><span class="detail-value">${fmtDate(t.closed_at, false)}</span></div>
            ${t.followup_score ? `<div class="detail-item"><span class="detail-label">回访分</span><span class="detail-value">${t.followup_score}/5</span></div>` : ''}
          </div>
          <div>
            <div class="detail-section-title">诉求内容</div>
            <div style="background:#f8fafc;padding:12px;border-radius:8px;font-size:13.5px;line-height:1.7;margin-bottom:16px;">${t.content}</div>
            <div class="detail-section-title">AI 分拨结果</div>
            <div style="background:#f8fafc;border-radius:8px;padding:14px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:3px;">诉求分类</div>
                  <div style="font-weight:600;">${t.category}</div>
                  <div class="confidence-bar"><div class="confidence-fill ${confClass(t.category_confidence)}" style="width:${(t.category_confidence*100).toFixed(0)}%"></div></div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${(t.category_confidence*100).toFixed(1)}% ${t.original_category ? ` · 原: ${t.original_category}` : ''}</div>
                </div>
                <div>
                  <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:3px;">承办科室</div>
                  <div style="font-weight:600;">${t.department_name} <span class="tag tag-gray" style="font-size:10px;">${t.department_code}</span></div>
                  <div class="confidence-bar"><div class="confidence-fill ${confClass(t.department_confidence)}" style="width:${(t.department_confidence*100).toFixed(0)}%"></div></div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${(t.department_confidence*100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
            ${t.review_reason ? `<div class="alert alert-warning" style="margin-top:14px;"><span class="alert-icon">⚠️</span><div><b>复核原因：</b>${t.review_reason}</div></div>` : ''}
          </div>
        </div>
        ${t.reviews && t.reviews.length ? `
        <div class="detail-section-title" style="margin-top:20px;">复核记录 (${t.reviews.length})</div>
        ${t.reviews.map(r => {
          const st = r.review_status === 'approved' ? 'success' : r.review_status === 'modified' ? 'warning' : r.review_status === 'rejected' ? 'danger' : 'info';
          return `<div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid var(--${st});">
            <div class="flex-between mb-8">
              <div><b>${r.reviewer_name || '系统'}</b> · <span class="tag tag-${st}">${r.review_status}</span> · <span class="tag tag-purple">${r.review_type}</span></div>
              <div style="font-size:12px;color:var(--text-muted);">${fmtDate(r.created_at)}</div>
            </div>
            <div style="font-size:12.5px;line-height:1.8;">
              ${r.corrected_category && r.original_category !== r.corrected_category ? `分类: ${r.original_category} → <b>${r.corrected_category}</b> · ` : ''}
              ${r.corrected_urgency && r.original_urgency !== r.corrected_urgency ? `紧急: ${r.original_urgency} → <b>${r.corrected_urgency}</b> · ` : ''}
              ${r.corrected_department && r.original_department !== r.corrected_department ? `科室: ${r.original_department} → <b>${r.corrected_department}</b>` : ''}
              ${r.review_comment ? `<div style="margin-top:6px;"><b>备注：</b>${r.review_comment}</div>` : ''}
            </div>
          </div>`;
        }).join('')}` : ''}
      ` }),
      el('div', { class: 'modal-footer' }, [
        t.status !== 'closed' ? el('button', { class: 'btn btn-outline', onclick: () => { closeModal(); closeTicketAction(t.id); } }, '关闭工单') : null,
        hasPerm('ticket:review') && t.needs_review ? el('button', { class: 'btn btn-primary', onclick: () => { closeModal(); goTo('review'); } }, '前往复核') : null,
        el('button', { class: 'btn btn-outline', onclick: closeModal }, '关闭'),
      ].filter(Boolean)),
    ]),
  ]);
  $('#modal-root').appendChild(d);
}

async function closeTicketAction(id) {
  if (!confirm('确认关闭该工单？高风险工单将无法自动关闭')) return;
  try {
    const r = await API.post(`/tickets/${id}/close`, {});
    if (r.code !== 0) throw new Error(r.message);
    toast('工单已关闭', 'success');
    if (currentPage === 'tickets') loadTickets();
    if (currentPage === 'review') loadReviewQueue();
    if (currentPage === 'dashboard') renderDashboard();
  } catch (e) { toast(e.message, 'error'); }
}

const reviewState = { page: 1, pageSize: 15, total: 0 };

async function renderReview() {
  const c = $('#content');
  c.innerHTML = '';
  c.appendChild(el('div', { class: 'stats-grid', style: 'grid-template-columns:repeat(4,1fr);' }, [
    statCard('待复核总数', 0, 'warning', '包含所有需人工介入的工单'),
    statCard('🚨 高风险拦截', 0, 'danger', '必须人工确认，禁止自动关闭'),
    statCard('📉 低置信度', 0, 'info', '任一维度置信度低于阈值'),
    statCard('👤 人工建议', 0, 'purple', '模型主动建议人工复核'),
  ]));
  setTimeout(updateReviewStatsTop, 200);
  c.appendChild(el('div', { class: 'filter-row' }, [
    el('select', { id: 'rf-type', class: 'form-control' }, [
      el('option', { value: '' }, '全部复核类型'),
      el('option', { value: 'high_risk' }, '🚨 高风险拦截'),
      el('option', { value: 'confidence_low' }, '📉 低置信度'),
      el('option', { value: 'manual' }, '👤 人工建议'),
    ]),
    el('select', { id: 'rf-status', class: 'form-control' }, [
      el('option', { value: 'pending' }, '待处理'),
      el('option', { value: 'approved' }, '已通过'),
      el('option', { value: 'modified' }, '已改标'),
      el('option', { value: 'rejected' }, '已拒绝'),
    ]),
    el('button', { class: 'btn btn-primary btn-sm', onclick: () => { reviewState.page = 1; loadReviewQueue(); } }, '查询'),
  ]));
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, '复核队列列表'),
        el('div', { class: 'card-subtitle', id: 'review-count' }, '加载中...'),
      ]),
    ]),
    el('div', { id: 'review-list', style: 'min-height:300px;' }),
    el('div', { id: 'review-pagination' }),
  ]));
  loadReviewQueue();
}

async function updateReviewStatsTop() {
  try {
    const r = await API.get('/dashboard/stats');
    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards.length >= 4) {
      cards[0].textContent = r.data.today.reviewing;
      cards[1].textContent = r.data.today.high_risk;
    }
  } catch (e) {}
}

async function loadReviewQueue() {
  const q = {
    page: reviewState.page, pageSize: reviewState.pageSize,
    review_type: document.getElementById('rf-type')?.value || undefined,
    review_status: document.getElementById('rf-status')?.value || 'pending',
  };
  try {
    const r = await API.get('/review-queue', q);
    reviewState.total = r.data.total;
    renderReviewList(r.data.list, r.data);
  } catch (e) {
    $('#review-list').innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div>加载失败: ${e.message}</div>`;
  }
}

function renderReviewList(list, data) {
  const box = $('#review-list');
  $('#review-count').textContent = `共 ${data.total} 条 · 第 ${data.page}/${data.totalPages || 1} 页`;
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✅</div>该查询条件下暂无待处理工单</div>`;
    $('#review-pagination').innerHTML = '';
    return;
  }
  box.innerHTML = '';
  list.forEach(item => {
    const typeMap = { high_risk: ['🚨 高风险拦截', 'danger'], confidence_low: ['📉 低置信度', 'info'], manual: ['👤 人工建议', 'purple'] };
    const [typeText, typeColor] = typeMap[item.review_type] || ['其他', 'gray'];
    const leftBorder = item.is_high_risk ? 'var(--danger)' : item.review_type === 'confidence_low' ? 'var(--info)' : 'var(--warning)';
    const card = el('div', {
      style: `border:1px solid var(--border);border-left:4px solid ${leftBorder};border-radius:10px;padding:15px;margin-bottom:12px;transition:box-shadow .2s;`,
      onmouseenter: (e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)',
      onmouseleave: (e) => e.currentTarget.style.boxShadow = '',
    }, [
      el('div', { class: 'flex-between', style: 'margin-bottom:10px;' }, [
        el('div', { class: 'flex gap-8', style: 'align-items:center;flex-wrap:wrap;' }, [
          el('b', { style: 'font-size:14px;' }, item.ticket_no),
          item.is_high_risk ? el('span', { class: 'tag tag-danger' }, '🚨 高风险') : null,
          el('span', { class: 'tag tag-' + typeColor }, typeText),
          el('span', { class: 'tag ' + tagClassForUrgency(item.urgency) }, item.urgency || ''),
        ]),
        el('div', { style: 'font-size:12px;color:var(--text-muted);' }, fmtDate(item.created_at)),
      ]),
      el('div', { style: 'background:#f8fafc;padding:10px 12px;border-radius:6px;margin-bottom:10px;font-size:13.5px;line-height:1.7;max-height:90px;overflow:auto;' }, item.content),
      el('div', { class: 'form-row', style: 'margin-bottom:10px;' }, [
        el('div', {}, [
          el('div', { style: 'font-size:12px;color:var(--text-muted);margin-bottom:4px;' }, '🏷️ AI建议分类'),
          el('div', {}, el('span', { style: 'font-weight:500;margin-right:8px;' }, item.category),
            el('span', { class: 'tag ' + confClass(item.category_confidence), style: 'font-size:11px;' }, (item.category_confidence * 100).toFixed(0) + '%')),
        ]),
        el('div', {}, [
          el('div', { style: 'font-size:12px;color:var(--text-muted);margin-bottom:4px;' }, '🏢 建议科室'),
          el('div', { style: 'font-weight:500;' }, (item.department_name || '') + ' ' + ((item.department_confidence * 100).toFixed(0) + '%')),
        ]),
        el('div', {}, [
          el('div', { style: 'font-size:12px;color:var(--text-muted);margin-bottom:4px;' }, '📍 区域'),
          el('div', {}, [item.district, item.block].filter(Boolean).join(' / ') || '-'),
        ]),
      ]),
      item.review_reason ? el('div', { class: 'alert alert-warning', style: 'padding:8px 12px;margin-bottom:10px;' }, [
        el('span', { class: 'alert-icon' }, '⚠️'),
        el('span', { style: 'font-size:12.5px;' }, item.review_reason),
      ]) : null,
      el('div', { class: 'flex-between' }, [
        el('div', { class: 'flex gap-8', style: 'flex-wrap:wrap;' }, [
          el('button', { class: 'btn btn-success btn-sm', onclick: () => openReviewModal(item, 'approved') }, '✓ 通过'),
          el('button', { class: 'btn btn-warning btn-sm', onclick: () => openReviewModal(item, 'modified') }, '✏️ 改标'),
          el('button', { class: 'btn btn-outline btn-sm', onclick: () => openReviewModal(item, 'rejected') }, '✕ 退回'),
          el('button', { class: 'btn btn-danger btn-sm', onclick: () => escalateReview(item.ticket_id) }, '⬆ 升级'),
        ]),
        el('a', { href: '#', style: 'font-size:12px;color:var(--primary);', onclick: (e) => { e.preventDefault(); openTicketDetail(item.ticket_id); } }, '查看详情 →'),
      ]),
    ]);
    box.appendChild(card);
  });
  $('#review-pagination').innerHTML = '';
  $('#review-pagination').appendChild(renderPager(data.page, data.totalPages, p => { reviewState.page = p; loadReviewQueue(); }));
}

function openReviewModal(item, action) {
  getMeta().then(meta => {
    const titleMap = { approved: '复核通过 - 确认原建议', modified: '人工改标 - 调整分拨结果', rejected: '退回重审 - 填写原因' };
    const deptOpts = meta.departments.map(d => {
      const sel = d.code === item.original_department ? 'selected' : '';
      return `<option value="${d.code}|${d.name}" ${sel}>${d.code} ${d.name}</option>`;
    }).join('');
    const d = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === e.currentTarget) closeModal(); } }, [
      el('div', { class: 'modal' }, [
        el('div', { class: 'modal-header' }, [
          el('div', { class: 'modal-title' }, titleMap[action] + ' · ' + item.ticket_no),
          el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        ]),
        el('div', { class: 'modal-body', html: `
          <div style="background:#f8fafc;padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:12.5px;line-height:1.7;max-height:110px;overflow:auto;">
            <b>诉求内容：</b>${item.content.length > 300 ? item.content.slice(0, 300) + '…' : item.content}
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">诉求分类</label>
              <select class="form-control" id="rv-category" ${action !== 'modified' ? 'disabled' : ''}>
                ${meta.categories.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">紧急程度</label>
              <select class="form-control" id="rv-urgency" ${action !== 'modified' ? 'disabled' : ''}>
                ${meta.urgency_levels.map(u => `<option value="${u.level}" ${u.level === item.urgency ? 'selected' : ''}>${u.level} - ${u.description}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">承办科室</label>
            <select class="form-control" id="rv-dept" ${action !== 'modified' ? 'disabled' : ''}>${deptOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">复核说明 ${action !== 'approved' ? '<span class="required">*</span>' : ''}</label>
            <textarea class="form-control" id="rv-comment" rows="3" placeholder="${action === 'approved' ? '（可选）通过说明' : action === 'rejected' ? '请说明退回原因' : '请说明改标原因'}"></textarea>
          </div>
        ` }),
        el('div', { class: 'modal-footer' }, [
          el('button', { class: 'btn btn-outline', onclick: closeModal }, '取消'),
          el('button', { class: 'btn btn-primary', onclick: () => submitReview(item.ticket_id, action) }, '确认提交'),
        ]),
      ]),
    ]);
    $('#modal-root').appendChild(d);
  });
}

async function submitReview(ticketId, action) {
  const category = document.getElementById('rv-category')?.value;
  const urgency = document.getElementById('rv-urgency')?.value;
  const deptVal = document.getElementById('rv-dept')?.value || '';
  const [deptCode, deptName] = deptVal.split('|');
  const comment = document.getElementById('rv-comment')?.value.trim();
  if (action !== 'approved' && !comment) { toast('请填写复核说明', 'warning'); return; }
  try {
    const r = await API.post(`/tickets/${ticketId}/review`, {
      action,
      category: action === 'modified' ? category : undefined,
      urgency: action === 'modified' ? urgency : undefined,
      department_code: action === 'modified' ? deptCode : undefined,
      department_name: action === 'modified' ? deptName : undefined,
      comment,
    });
    if (r.code !== 0) throw new Error(r.message);
    const txt = { approved: '复核通过', modified: '改标成功', rejected: '已退回重审' }[action] || '完成';
    toast(txt, 'success');
    closeModal();
    await refreshReviewBadge();
    renderSidebar();
    loadReviewQueue();
  } catch (e) { toast(e.message, 'error'); }
}

async function escalateReview(ticketId) {
  const reason = prompt('请输入升级原因：');
  if (reason === null || !reason.trim()) return;
  try {
    const r = await API.post(`/tickets/${ticketId}/escalate`, { reason: reason.trim() });
    if (r.code !== 0) throw new Error(r.message);
    toast('工单已升级处理', 'success');
    loadReviewQueue();
  } catch (e) { toast(e.message, 'error'); }
}

const histState = { page: 1, pageSize: 20, total: 0 };

async function renderHistorical() {
  const c = $('#content');
  c.innerHTML = '';
  const meta = await getMeta();
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, '历史工单库'),
        el('div', { class: 'card-subtitle' }, '历史工单用于构建向量索引，辅助相似工单检索与模型参考'),
      ]),
      el('div', { class: 'flex gap-8' }, [
        hasPerm('data:import') ? el('button', { class: 'btn btn-primary btn-sm', onclick: showImportDialog }, '📥 批量导入') : null,
        hasPerm('data:import') ? el('button', { class: 'btn btn-success btn-sm', onclick: importDemoHistorical }, '🧪 导入演示数据') : null,
        hasPerm('model:configure') ? el('button', { class: 'btn btn-info btn-sm', onclick: rebuildVectorIndex }, '🔄 重建向量索引') : null,
      ].filter(Boolean)),
    ]),
    el('div', { class: 'filter-row' }, [
      el('input', { id: 'hf-kw', class: 'form-control', placeholder: '🔍 搜索内容', style: 'min-width:240px;' }),
      el('select', { id: 'hf-cat', class: 'form-control' }, [el('option', { value: '' }, '全部类别'), ...meta.categories.map(x => el('option', { value: x }, x))]),
      el('button', { class: 'btn btn-primary btn-sm', onclick: () => { histState.page = 1; loadHistorical(); } }, '查询'),
    ]),
    el('div', { class: 'card-header', style: 'margin-bottom:0;' }, [
      el('div', { style: 'margin-bottom:10px;' }, [
        el('div', { class: 'card-title' }, '历史工单列表'),
        el('div', { class: 'card-subtitle', id: 'hist-count' }, '加载中...'),
      ]),
    ]),
    el('div', { id: 'hist-table' }, ''),
    el('div', { id: 'hist-pagination' }),
  ]));
  loadHistorical();
}

async function loadHistorical() {
  const q = { page: histState.page, pageSize: histState.pageSize,
    keyword: document.getElementById('hf-kw')?.value?.trim() || undefined,
    category: document.getElementById('hf-cat')?.value || undefined,
  };
  try {
    const r = await API.get('/data/historical', q);
    histState.total = r.data.total;
    const box = $('#hist-table');
    $('#hist-count').textContent = `共 ${r.data.total} 条`;
    if (!r.data.list.length) {
      box.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div>暂无历史工单<br/><span style="font-size:12px;">点击"导入演示数据"可快速体验</span></div>`;
      $('#hist-pagination').innerHTML = ''; return;
    }
    const t = el('table');
    t.innerHTML = `<thead><tr><th>工单编号</th><th>内容</th><th>类别</th><th>承办</th><th>紧急度</th><th>回访</th><th>处理</th></tr></thead>
      <tbody>${r.data.list.map(x => `<tr>
        <td class="nowrap">${x.ticket_no}</td>
        <td style="max-width:360px;" title="${(x.content || '').replace(/"/g,'&quot;')}">${(x.content || '').length > 80 ? (x.content || '').slice(0,80) + '…' : (x.content || '-')}</td>
        <td>${x.category || '-'}</td>
        <td>${x.department_name || x.department_code || '-'}</td>
        <td>${x.urgency ? '<span class="tag ' + tagClassForUrgency(x.urgency) + '">' + x.urgency + '</span>' : '-'}</td>
        <td>${x.followup_score != null ? x.followup_score + '分' : '-'}</td>
        <td>${x.resolution_days != null ? x.resolution_days + '天' : '-'}</td>
      </tr>`).join('')}</tbody>`;
    box.innerHTML = ''; box.appendChild(t);
    $('#hist-pagination').innerHTML = '';
    $('#hist-pagination').appendChild(renderPager(r.data.page, r.data.totalPages, p => { histState.page = p; loadHistorical(); }));
  } catch (e) {
    $('#hist-table').innerHTML = `<div class="empty-state">❌ 加载失败</div>`;
  }
}

function showImportDialog() {
  const d = el('div', { class: 'modal-backdrop', onclick: e => e.target === e.currentTarget && closeModal() }, [
    el('div', { class: 'modal' }, [
      el('div', { class: 'modal-header' }, [
        el('div', { class: 'modal-title' }, '批量导入历史工单'),
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
      ]),
      el('div', { class: 'modal-body' }, [
        el('div', { style: 'margin-bottom:12px;' }, [
          el('label', { class: 'form-label' }, '上传 JSON 文件'),
          el('input', { type: 'file', id: 'import-file', accept: '.json', class: 'form-control' }),
          el('div', { class: 'form-help' }, '支持JSON数组格式，字段示例：[{"content":"...","category":"环境卫生","urgency":"一般","resolution":"..."'),
        ]),
        el('div', { class: 'alert', style: 'background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;margin-bottom:12px;' }, [
          el('b', {}, '字段说明'),
          el('div', { html: '<b>必填</b>：content(内容)<br/>可选字段：category类别、urgency紧急度、department承办、district区、block街道、community社区、resolution处理结果、resolution_days处理天数、followup_score回访评分(1-5)' }),
        ]),
        el('label', { class: 'form-label' }, '导入后自动构建向量索引'),
        el('div', { style: 'display:flex;gap:6px;margin-top:4px;' }, [
          el('input', { type: 'checkbox', id: 'import-build', checked: '' }),
          el('span', { style: 'font-size:13px;', onclick: () => { const cb = document.getElementById('import-build'); cb.checked = !cb.checked; } }, '导入完成后构建向量索引（耗时较长）'),
        ]),
      ]),
      el('div', { class: 'modal-footer' }, [
        el('button', { class: 'btn btn-outline', onclick: closeModal }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: submitImport }, '开始导入'),
      ]),
    ]),
  ]);
  $('#modal-root').appendChild(d);
}

async function submitImport() {
  const file = document.getElementById('import-file').files[0];
  const buildAfter = document.getElementById('import-build').checked;
  if (!file) { toast('请选择文件', 'warning'); return; }
  try {
    const fd = new FormData();
    fd.append('file', file);
    if (buildAfter) fd.append('build_index', 'true');
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/api/data/import', { method: 'POST', headers, body: fd });
    const r = await res.json();
    if (r.code !== 0) throw new Error(r.message);
    toast(`导入成功 ${r.data.imported} 条`, 'success');
    closeModal();
    loadHistorical();
  } catch (e) { toast('导入失败：' + e.message, 'error'); }
}

async function importDemoHistorical() {
  if (!confirm('确认导入50条演示历史工单数据？')) return;
  try {
    toast('正在导入中...', 'info');
    const records = generateDemoHistorical();
    const r = await API.post('/data/import', { records, build_index: false });
    if (r.code !== 0) throw new Error(r.message);
    toast(`成功导入 ${r.data.imported} 条演示数据`, 'success');
    loadHistorical();
  } catch (e) { toast(e.message, 'error'); }
}

function generateDemoHistorical() {
  const cats = ['环境卫生','市政设施','城市管理','住房建设','劳动保障','医疗卫生','民政救助','市场监管','环境保护','教育文化','治安消防','交通出行'];
  const urgs = ['特急','紧急','一般','一般','一般','缓办'];
  const depts = { '环境卫生':'CSB 城市管理局', '市政设施':'CSB 城市管理局', '城市管理':'CSB 城市管理局', '住房建设':'ZJJ 住建局', '劳动保障':'RSJ 人社局', '医疗卫生':'WJW 卫健委', '民政救助':'MZJ 民政局', '市场监管':'SCJGJ 市监局', '环境保护':'STHJJ 生态环境局', '教育文化':'JYJ 教育局', '治安消防':'GAJ 公安局', '交通出行':'GAJ 公安局' };
  const blocks = ['望京街道','建外街道','中关村街道','三里屯街道','亚运村街道','西长安街街道','东华门街道','东升地区','回龙观街道','天通苑北街道'];
  const districts = ['朝阳区','海淀区','西城区','东城区','丰台区','石景山区','通州区','昌平区'];
  const contents = [
    '小区垃圾桶满溢多日未清运，蚊虫滋生严重',
    '路面井盖破损，存在安全隐患',
    '楼下底商夜间施工噪音扰民',
    '老旧小区电梯频繁故障，老人出行不便',
    '反映物业公司服务态度差，报修一周未处理',
    '社区公园健身器材损坏无人维护',
    '商户占道经营堵塞消防通道',
    '工地凌晨施工严重扰民',
    '餐饮油烟直排居民楼',
    '小区消防通道被私家车长期占用',
    '社区卫生服务中心排队太长，老人不便',
    '路口红绿灯故障数天未修复',
    '流浪狗聚集，存在安全隐患',
    '道路两侧树木遮挡路灯，夜间照明差',
    '社区公告栏长期不更新，信息滞后',
    '共享单车乱停放影响通行',
    '居民楼下餐饮店无证经营',
    '公厕卫生差，无人打扫',
    '小区停车收费不合理，业主投诉',
    '社区活动室开放时间太短不方便居民',
  ];
  const arr = [];
  for (let i = 0; i < 50; i++) {
    const c = cats[i % cats.length];
    const deptStr = depts[c] || 'JDB 街道办事处';
    const [dc, dn] = deptStr.split(' ');
    arr.push({
      ticket_no: 'HIS2024' + String(10000 + i),
      content: contents[i % contents.length] + (i % 3 === 0 ? '，多次反映仍未解决，请相关部门尽快处理' : ''),
      category: c,
      urgency: urgs[i % urgs.length],
      department_code: dc, department_name: dn,
      district: districts[i % districts.length],
      block: blocks[i % blocks.length],
      resolution: i % 4 === 0 ? '已协调物业处理完毕，居民表示满意' : i % 3 === 0 ? '已派执法人员现场查处' : '已转承办部门处理完成',
      resolution_days: 0.5 + (i % 7),
      followup_score: 3 + (i % 3),
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  return arr;
}

async function rebuildVectorIndex() {
  if (!confirm('确认重建向量索引？这将使用所有历史工单重新生成向量，会消耗大量API额度')) return;
  toast('已提交后台处理，请稍候...', 'info');
  try {
    const r = await API.post('/data/build-index', {});
    if (r.code !== 0) throw new Error(r.message);
    toast(`索引构建完成，共 ${r.data.indexed} 条`, 'success');
  } catch (e) { toast(e.message, 'error'); }
}

async function renderEvaluation() {
  const c = $('#content');
  c.innerHTML = '';
  const typeCards = [
    { label: '✅ 正确判断', sub: '模型判断正确', color: '#10b981', key: 'correct' },
    { label: '⚠️ 低置信度', sub: '低于阈值需人工复核', color: '#f59e0b', key: 'low_confidence' },
    { label: '✏️ 人工改标', sub: '模型易误分的边界案例', color: '#8b5cf6', key: 'manual_correction' },
    { label: '🚫 模型无法回答', sub: '高风险必须人工介入', color: '#ef4444', key: 'unanswerable' },
  ];
  const cardsGrid = el('div', { class: 'stats-grid', style: 'grid-template-columns:repeat(4,1fr);' },
    typeCards.map(tc => el('div', { class: 'eval-type-card stat-card stat-card-green', style: `border-left:4px solid ${tc.color};` }, [
      el('div', { class: 'stat-label' }, tc.label),
      el('div', { class: 'stat-value', style: `color:${tc.color};` }, '0 / 0'),
      el('div', { class: 'stat-pct', style: 'font-size:22px;font-weight:700;margin-top:2px;' }, '未测'),
      el('div', { class: 'stat-sub', style: 'margin-top:4px;' }, tc.sub),
    ]))
  );
  c.appendChild(cardsGrid);
  setTimeout(loadEvalSummary, 100);
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', {}, [
        el('div', { class: 'card-title' }, '验收样本管理'),
        el('div', { class: 'card-subtitle' }, '样本类型：correct(正确判断) · low_confidence(低置信度) · manual_correction(人工改标) · unanswerable(无法回答)'),
      ]),
      el('div', { class: 'flex gap-8' }, [
        el('button', { class: 'btn btn-primary btn-sm', onclick: seedEvalSamples }, '🧪 初始化验收样本'),
        el('button', { class: 'btn btn-success btn-sm', onclick: runEvalTests }, '▶️ 运行验收测试'),
        el('button', { class: 'btn btn-outline btn-sm', onclick: showAddSampleForm }, '+ 新增样本'),
      ]),
    ]),
    el('div', { class: 'filter-row' }, [
      el('select', { id: 'ef-type', class: 'form-control' }, [
        el('option', { value: '' }, '全部类型'),
        el('option', { value: 'correct' }, 'correct 正确判断'),
        el('option', { value: 'low_confidence' }, 'low_confidence 低置信度'),
        el('option', { value: 'manual_correction' }, 'manual_correction 人工改标'),
        el('option', { value: 'unanswerable' }, 'unanswerable 无法回答'),
      ]),
      el('button', { class: 'btn btn-primary btn-sm', onclick: loadEvalSamples }, '查询'),
    ]),
    el('div', { id: 'eval-summary', style: 'margin-bottom:14px;' }),
    el('div', { id: 'eval-samples' }),
  ]));
  loadEvalSamples();
}

async function loadEvalSummary() {
  try {
    const r = await API.get('/data/evaluation/summary');
    const by = r.data.by_type || [];
    const cards = document.querySelectorAll('.eval-type-card .stat-value');
    const pctEls = document.querySelectorAll('.eval-type-card .stat-pct');
    const typeNames = ['correct', 'low_confidence', 'manual_correction', 'unanswerable'];
    typeNames.forEach((tn, idx) => {
      const row = by.find(b => b.sample_type === tn) || { total: 0, passed: 0, tested: 0 };
      if (cards[idx]) cards[idx].textContent = `${row.passed || 0} / ${row.total}`;
      if (pctEls[idx]) {
        const pct = row.tested ? ((row.passed || 0) / row.tested * 100).toFixed(0) + '%' : '未测';
        const color = !row.tested ? '#94a3b8' : (row.passed === row.tested ? '#10b981' : parseFloat(pct) >= 70 ? '#f59e0b' : '#ef4444');
        pctEls[idx].textContent = pct;
        pctEls[idx].style.color = color;
        pctEls[idx].dataset.color = color;
      }
    });
    const sumEl = $('#eval-summary');
    if (!sumEl) return;
    const o = r.data.overall;
    const overallBar = o && o.tested ? `
      <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div><b>总体通过率</b> · 已测 ${o.tested}/${o.total} · 通过 ${o.passed}</div>
          <div style="font-size:18px;font-weight:700;color:${o.pass_rate>=0.9?'#10b981':o.pass_rate>=0.7?'#f59e0b':'#ef4444'}">${(o.pass_rate*100).toFixed(1)}%</div>
        </div>
        <div style="height:8px;background:#e5e7eb;border-radius:6px;overflow:hidden;">
          <div style="height:100%;width:${(o.pass_rate*100).toFixed(1)}%;background:linear-gradient(90deg,#10b981,#22c55e);"></div>
        </div>
      </div>` : `<div style="padding:8px 4px;color:var(--text-muted);font-size:12px;">尚未运行验收测试，请点击「运行验收测试」开始</div>`;
    const failedRows = r.data.failed && r.data.failed.length ? `
      <div class="card" style="box-shadow:none;margin-top:0;padding:0;background:#fff5f5;border:1px solid #fecaca;">
        <div class="card-title" style="padding:10px 14px;color:#b91c1c;font-size:13px;">❌ 失败明细（${r.data.failed.length} 条）</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#fee2e2;">
            <th style="text-align:left;padding:6px 10px;">类型</th>
            <th style="text-align:left;padding:6px 10px;">内容</th>
            <th style="text-align:left;padding:6px 10px;">失败原因</th>
          </tr></thead>
          <tbody>${r.data.failed.map(f => {
            const fr = f.test_result ? (typeof f.test_result === 'string' ? JSON.parse(f.test_result).fail_reasons : f.test_result.fail_reasons) : [];
            const tc = { correct: '#10b981', low_confidence: '#f59e0b', manual_correction: '#8b5cf6', unanswerable: '#ef4444' }[f.sample_type] || '#94a3b8';
            return `<tr style="border-top:1px solid #fecaca;">
              <td style="padding:6px 10px;"><span class="tag" style="background:${tc};color:#fff;">${f.sample_type}</span></td>
              <td style="padding:6px 10px;max-width:260px;" class="wrap">${f.content.slice(0, 60)}${f.content.length>60?'…':''}</td>
              <td style="padding:6px 10px;color:#991b1b;">${fr.length ? fr.join('；') : '-'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>` : '';
    sumEl.innerHTML = overallBar + failedRows;
  } catch (e) { console.error(e); }
}

async function loadEvalSamples() {
  const q = { sample_type: document.getElementById('ef-type')?.value || undefined };
  try {
    const r = await API.get('/data/evaluation/samples', q);
    const list = r.data;
    renderEvalSamplesList(list);
  } catch (e) {
    $('#eval-samples').innerHTML = `<div class="empty-state">❌ ${e.message}</div>`;
  }
}

function renderEvalSamplesList(list) {
  const box = $('#eval-samples');
  if (!list.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div>暂无验收样本<br/><span style="font-size:12px;">点击"初始化验收样本"创建4类典型场景</span></div>`;
    return;
  }
  const typeMap = { correct: ['✅ 正确判断', 'success'], low_confidence: ['⚠️ 低置信度', 'warning'], manual_correction: ['✏️ 人工改标', 'purple'], unanswerable: ['🚫 无法回答', 'danger'] };
  const rows = list.map(s => {
    const [tt, tc] = typeMap[s.sample_type] || ['其他', 'gray'];
    const rr = s.test_passed === 1 ? '<span class="tag tag-success" style="padding:2px 8px;">✅ PASS</span>' : s.test_passed === 0 ? '<span class="tag tag-danger" style="padding:2px 8px;">❌ FAIL</span>' : '<span class="tag tag-gray" style="padding:2px 8px;">未测</span>';
    let tr = typeof s.test_result === 'string' ? s.test_result : (s.test_result ? JSON.stringify(s.test_result) : null);
    let parsed = null;
    try { if (tr) parsed = JSON.parse(tr); } catch (e) {}
    const failReasons = parsed?.fail_reasons || [];
    const latency = parsed?.latency_ms;
    const conf = parsed?.min_confidence;
    const expRow = `期望: ${[
      s.expected_category ? `分类=${s.expected_category}` : '',
      s.expected_urgency ? `紧急=${s.expected_urgency}` : '',
      s.expected_department ? `科室=${s.expected_department}` : '',
      s.expected_high_risk ? '高风险=1' : '',
      s.expected_needs_review ? '需复核=1' : '',
    ].filter(Boolean).join(' / ')}`;
    const infRow = parsed?.inference ? `实际: 分类=${parsed.inference.category || '-'} / 紧急=${parsed.inference.urgency || '-'} / 科室=${parsed.inference.department_code || '-'} / 风险=${parsed.inference.is_high_risk ? 1 : 0} / 复核=${parsed.inference.needs_review ? 1 : 0}` : '';
    return `<tr>
      <td><span class="tag tag-${tc}">${s.sample_type}</span><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${tt}</div></td>
      <td style="max-width:300px;" class="wrap" title="${s.content.replace(/"/g,'&quot;')}">${s.content.length > 60 ? s.content.slice(0,60)+'…' : s.content}</td>
      <td style="font-size:11px;max-width:160px;" class="wrap">
        ${s.expected_category || '-'}<br/>
        ${s.expected_urgency ? `<span class="tag tag-gray tag-sm">${s.expected_urgency}</span>` : ''}
        ${s.expected_high_risk ? '<span class="tag tag-danger tag-sm">高风险</span>' : ''}
        ${s.expected_needs_review ? '<span class="tag tag-warning tag-sm">需复核</span>' : ''}
      </td>
      <td style="font-size:11px;">
        <div>${rr}</div>
        <div style="margin-top:4px;color:var(--text-muted);">${s.tested_at ? fmtDate(s.tested_at, false) : '未测试'}${latency ? ` · ${latency}ms` : ''}${conf!=null ? ` · 置信${(conf*100).toFixed(0)}%` : ''}</div>
        ${failReasons.length ? `<div style="margin-top:4px;color:#b91c1c;max-width:180px;white-space:normal;line-height:1.5;">${failReasons.join('；').slice(0, 80)}</div>` : ''}
      </td>
      <td style="white-space:nowrap;">
        <button class="btn btn-outline btn-xs" onclick="runOneEvalSample('${s.id}')">测试</button>
        <button class="btn btn-outline btn-xs" onclick="showEvalSampleDetail(${JSON.stringify(s.id).replace(/"/g,'&quot;')})" ${parsed ? '' : 'disabled'}>详情</button>
        <button class="btn btn-outline btn-xs" onclick="editEvalSample('${s.id}')">编辑</button>
        <button class="btn btn-outline btn-xs btn-danger" onclick="deleteEvalSample('${s.id}')">删除</button>
      </td>
    </tr>
    <tr id="detail-${s.id}" style="display:none;background:#fafbff;">
      <td colspan="5" style="padding:0 10px 10px;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;font-size:12px;line-height:1.7;">
          <div style="color:#475569;"><b>【样本设计说明】</b>${s.remarks || '(无)'}</div>
          <div style="color:#475569;margin-top:4px;"><b>【期望值】</b>${expRow}</div>
          ${infRow ? `<div style="color:#0f766e;margin-top:4px;"><b>【模型输出】</b>${infRow}</div>` : ''}
          ${failReasons.length ? `<div style="color:#b91c1c;margin-top:4px;"><b>【失败原因】</b>${failReasons.join('；')}</div>` : ''}
          ${parsed?.inference?.reasoning ? `<div style="color:#64748b;margin-top:4px;"><b>【推理依据】</b>${parsed.inference.reasoning}</div>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
  box.innerHTML = `<div style="overflow:auto;"><table style="width:100%;">
    <thead style="background:#f1f5f9;position:sticky;top:0;">
      <tr>
        <th style="text-align:left;padding:8px 10px;">类型</th>
        <th style="text-align:left;padding:8px 10px;">内容</th>
        <th style="text-align:left;padding:8px 10px;">期望输出</th>
        <th style="text-align:left;padding:8px 10px;">测试结果</th>
        <th style="text-align:left;padding:8px 10px;width:200px;">操作</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function showEvalSampleDetail(id) {
  const tr = document.getElementById('detail-' + id);
  if (tr) tr.style.display = (tr.style.display === 'none' || !tr.style.display) ? 'table-row' : 'none';
}

async function seedEvalSamples() {
  if (!confirm('确认创建20个验收样本（覆盖4类场景）？')) return;
  try {
    toast('创建中...', 'info');
    const samples = [
      { sample_type: 'correct', content: '望京西园三区12号楼前垃圾桶已经3天没人清运，垃圾堆成山了臭气熏天苍蝇蚊子特别多，路过都捂着鼻子走，请城管来管管物业吧', expected_category: '环境卫生', expected_urgency: '一般', expected_department: 'CSB', expected_high_risk: 0, expected_needs_review: 0, remarks: '典型环境卫生类，分类明确置信度高' },
      { sample_type: 'correct', content: '青年路和朝阳北路交叉口西北角，有一根路灯坏了快一周没人修，晚上漆黑一片，昨天晚上有人骑车摔倒受伤了，请市政赶紧修一下', expected_category: '市政设施', expected_urgency: '紧急', expected_department: 'CSB', expected_high_risk: 0, expected_needs_review: 0, remarks: '市政设施-路灯损坏，明确' },
      { sample_type: 'correct', content: '小区2号楼18层电梯停运已经4天，物业说配件坏了一直不修，楼里全是老人上下楼不方便，昨天一位80岁老人心脏病发作救护车都上不去，万一着火更麻烦', expected_category: '市政设施', expected_urgency: '紧急', expected_department: 'ZJJ', expected_high_risk: 0, expected_needs_review: 0, remarks: '电梯故障，紧急度高' },
      { sample_type: 'correct', content: '楼下新开的那家饭馆，油烟直接排到小区里，我们住户天天闻油烟，家里窗户都不敢开，闻了都恶心', expected_category: '环境保护', expected_urgency: '一般', expected_department: 'STHJJ', expected_high_risk: 0, expected_needs_review: 0, remarks: '餐饮油烟扰民' },
      { sample_type: 'correct', content: '60岁以上老年公交卡怎么办理？需要什么证件和去哪里办理地点和时间？', expected_category: '民政救助', expected_urgency: '缓办', expected_department: 'MZJ', expected_high_risk: 0, expected_needs_review: 0, remarks: '咨询类，缓办' },

      { sample_type: 'low_confidence', content: '嗯...那个...就是...小区那啥...你懂吧', expected_category: '其他民生诉求', expected_urgency: '一般', expected_department: 'JDB', expected_high_risk: 0, expected_needs_review: 1, remarks: '语义模糊不清置信度低' },
      { sample_type: 'low_confidence', content: '我也不知道算啥问题吧反正就是心里不舒服，你们看着办吧感觉都有点问题又说不上来', expected_category: '其他民生诉求', expected_urgency: '一般', expected_department: 'JDB', expected_high_risk: 0, expected_needs_review: 1, remarks: '内容模糊需人工判断' },
      { sample_type: 'low_confidence', content: '某某部门说不归他们管，某某又说找那个，我也不知道找哪个部门，几个部门推来推去', expected_category: '其他民生诉求', expected_urgency: '一般', expected_department: 'JDB', expected_high_risk: 0, expected_needs_review: 1, remarks: '部门职责交叉需人工分拨' },
      { sample_type: 'low_confidence', content: '街道居委会说不是他们的事情，让找物业物业又说开发商开发商又说住建局，到底谁管这事', expected_category: '住房建设', expected_urgency: '一般', expected_department: 'ZJJ', expected_high_risk: 0, expected_needs_review: 1, remarks: '多方推诿需人工协调' },

      { sample_type: 'manual_correction', content: 'XX路XX小区停车收费一个月收了我们两次物业费又收了还收了两次停车费，这不是双重收费吗？', expected_category: '市场监管', expected_urgency: '一般', expected_department: 'SCJGJ', expected_high_risk: 0, expected_needs_review: 1, remarks: '模型可能误分为住房建设，实际应为市场监管（价格监管）' },
      { sample_type: 'manual_correction', content: '工地早上5点就开始施工，挖掘机噪音让人睡不着，打了110不管，110说环保局环保局说城管', expected_category: '环境保护', expected_urgency: '一般', expected_department: 'STHJJ', expected_high_risk: 0, expected_needs_review: 1, remarks: '模型可能误分为城市管理，实际是噪声污染（环保）' },
      { sample_type: 'manual_correction', content: '我们学校老师在外面私下开补习班收费两小时500块，不去给孩子穿小鞋', expected_category: '教育文化', expected_urgency: '一般', expected_department: 'JYJ', expected_high_risk: 0, expected_needs_review: 1, remarks: '涉及师德师风，教育主管部门处理' },
      { sample_type: 'manual_correction', content: '买到过期食品吃了拉肚子，超市还在卖过期牛奶保质期都过了一星期还摆货架上卖', expected_category: '市场监管', expected_urgency: '紧急', expected_department: 'SCJGJ', expected_high_risk: 0, expected_needs_review: 1, remarks: '食品安全，市场监管部门负责' },

      { sample_type: 'unanswerable', content: '反映居委会张主任今天下午三点在办公室收了我两条烟和5000块钱好处费，他说能给我办低保我要举报他贪污受贿，你们管不管？不管我去区纪委', expected_category: '信访维稳', expected_urgency: '紧急', expected_department: 'XFJ', expected_high_risk: 1, expected_needs_review: 1, remarks: '举报类涉廉政问题，必须人工介入处理纪委渠道' },
      { sample_type: 'unanswerable', content: '我们村300多户拆迁补偿不合理，准备明天集体到市政府门口上访静坐，横幅都做好了', expected_category: '信访维稳', expected_urgency: '特急', expected_department: 'XFJ', expected_high_risk: 1, expected_needs_review: 1, remarks: '群体性上访事件，高风险群体事件' },
      { sample_type: 'unanswerable', content: 'XX工地脚手架塌了压了三个人听说有一个没呼吸了，120刚拉走，工地还在瞒报不让说', expected_category: '安全生产', expected_urgency: '特急', expected_department: 'AQSCJ', expected_high_risk: 1, expected_needs_review: 1, remarks: '安全生产死亡事故，高风险必须人工' },
      { sample_type: 'unanswerable', content: 'XX小区有人从10楼往下跳，现在还站窗边喊要跳，消防来了也不敢上去劝，楼下聚集了好多人围观', expected_category: '治安消防', expected_urgency: '特急', expected_department: 'GAJ', expected_high_risk: 1, expected_needs_review: 1, remarks: '治安事件人命关天，高风险110处置' },
      { sample_type: 'unanswerable', content: '我们200多工人工资一年没发，老板跑了找不到人，我们准备去堵马路，区政府大门堵路去', expected_category: '劳动保障', expected_urgency: '特急', expected_department: 'RSJ', expected_high_risk: 1, expected_needs_review: 1, remarks: '欠薪引发群体性堵路事件' },
      { sample_type: 'unanswerable', content: '今天上午小区5户人家都发烧39度以上，还有小孩也烧，卫生院说是可能传染', expected_category: '重大疫情', expected_urgency: '特急', expected_department: 'WJW', expected_high_risk: 1, expected_needs_review: 1, remarks: '疑似传染病聚集性发病' },
    ];
    for (const s of samples) {
      await API.post('/data/evaluation/samples', s);
    }
    toast(`成功创建 ${samples.length} 个验收样本`, 'success');
    loadEvalSamples();
    loadEvalSummary();
  } catch (e) { toast(e.message, 'error'); }
}

async function runEvalTests() {
  const msg = `确认运行验收测试？

选项：
  · 仅测试「未通过 + 未测」的样本（推荐，省API额度）
  · 全部重新测试

会调用LLM推理（消耗API额度），测试结果自动写回样本表。`;
  if (!confirm(msg)) return;
  const mode = confirm('点击【确定】= 仅测未通过+未测\n点击【取消】= 全部重测');
  try {
    const box = $('#eval-summary');
    const loading = setInterval(() => { if (box) box.style.opacity = box.style.opacity === '0.5' ? '1' : '0.5'; }, 400);
    toast('运行中...（批量推理，完成后自动刷新）', 'info');
    const r = await API.post('/data/evaluation/run-tests', { only_failed: mode, only_untested: false });
    clearInterval(loading);
    if (box) box.style.opacity = '1';
    if (r.code !== 0) throw new Error(r.message);
    const d = r.data;
    if (!d.total) { toast('没有符合条件的待测试样本', 'warning'); return; }
    toast(`✅ 测试完成：${d.passed}/${d.total} 通过，通过率 ${(d.pass_rate*100).toFixed(1)}%`, d.pass_rate >= 0.7 ? 'success' : 'error');
    loadEvalSamples();
    loadEvalSummary();
  } catch (e) { toast('测试失败：' + e.message, 'error'); }
}

async function runOneEvalSample(id) {
  try {
    toast('单个样本推理中...', 'info');
    const r = await API.post(`/data/evaluation/samples/${id}/test`);
    if (r.code !== 0) throw new Error(r.message);
    toast(r.data.passed ? '✅ 测试通过' : '❌ 测试未通过', r.data.passed ? 'success' : 'warning');
    loadEvalSamples();
    loadEvalSummary();
    setTimeout(() => showEvalSampleDetail(id), 150);
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteEvalSample(id) {
  if (!confirm('确认删除该验收样本？此操作不可撤销。')) return;
  try {
    const r = await API._delete(`/data/evaluation/samples/${id}`);
    if (r.code !== 0) throw new Error(r.message);
    toast('已删除', 'success');
    loadEvalSamples();
    loadEvalSummary();
  } catch (e) { toast(e.message, 'error'); }
}

async function editEvalSample(id) {
  const meta = window.__metaCache || (await (await fetch('/api/data/meta', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json()).data;
  window.__metaCache = meta;
  const r = await API.get('/data/evaluation/samples');
  const s = (r.data || []).find(x => x.id === id);
  if (!s) { toast('样本未找到', 'error'); return; }
  const d = el('div', { class: 'modal-backdrop', onclick: e => e.target === e.currentTarget && closeModal() }, [
    el('div', { class: 'modal' }, [
      el('div', { class: 'modal-header' }, [
        el('div', { class: 'modal-title' }, '编辑验收样本'),
        el('button', { class: 'modal-close', onclick: closeModal }, '×'),
      ]),
      el('div', { class: 'modal-body' }, [
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '样本类型'),
          el('select', { id: 'es-type', class: 'form-control' }, [
            el('option', { value: 'correct' }, 'correct - 正确判断'),
            el('option', { value: 'low_confidence' }, 'low_confidence - 低置信度'),
            el('option', { value: 'manual_correction' }, 'manual_correction - 人工改标'),
            el('option', { value: 'unanswerable' }, 'unanswerable - 无法回答/高风险'),
          ]),
        ]),
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '样本内容'),
          el('textarea', { id: 'es-content', class: 'form-control', rows: 4 }),
        ]),
        el('div', { class: 'form-row' }, [
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '期望类别'),
            el('select', { id: 'es-cat', class: 'form-control' }, [el('option', { value: '' }, '不校验'), ...meta.categories.map(x => el('option', { value: x }, x))]),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '期望紧急度'),
            el('select', { id: 'es-urg', class: 'form-control' }, [el('option', { value: '' }, '不校验'), ...meta.urgency_levels.map(x => el('option', { value: x.level }, `${x.level} - ${x.description}`))]),
          ]),
        ]),
        el('div', { class: 'form-row' }, [
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '期望高风险'),
            el('select', { id: 'es-risk', class: 'form-control' }, [el('option', { value: '0' }, '否'), el('option', { value: '1' }, '是')]),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '期望需复核'),
            el('select', { id: 'es-review', class: 'form-control' }, [el('option', { value: '0' }, '否'), el('option', { value: '1' }, '是')]),
          ]),
        ]),
        el('div', { class: 'form-group' }, [
          el('label', { class: 'form-label' }, '备注说明'),
          el('input', { id: 'es-remark', class: 'form-control', placeholder: '样本设计说明...' }),
        ]),
      ]),
      el('div', { class: 'modal-footer' }, [
        el('button', { class: 'btn btn-outline', onclick: closeModal }, '取消'),
        el('button', { class: 'btn btn-primary', onclick: () => submitEditSample(id) }, '保存（会重置测试结果）'),
      ]),
    ]),
  ]);
  document.getElementById('es-type').value = s.sample_type;
  document.getElementById('es-content').value = s.content || '';
  document.getElementById('es-cat').value = s.expected_category || '';
  document.getElementById('es-urg').value = s.expected_urgency || '';
  document.getElementById('es-risk').value = String(s.expected_high_risk || 0);
  document.getElementById('es-review').value = String(s.expected_needs_review || 0);
  document.getElementById('es-remark').value = s.remarks || '';
  document.body.appendChild(d);
}

async function submitEditSample(id) {
  const body = {
    sample_type: document.getElementById('es-type').value,
    content: document.getElementById('es-content').value.trim(),
    expected_category: document.getElementById('es-cat').value || undefined,
    expected_urgency: document.getElementById('es-urg').value || undefined,
    expected_high_risk: parseInt(document.getElementById('es-risk').value),
    expected_needs_review: parseInt(document.getElementById('es-review').value),
    remarks: document.getElementById('es-remark').value || undefined,
  };
  if (!body.content) { toast('请输入内容', 'warning'); return; }
  try {
    const r = await API.put(`/data/evaluation/samples/${id}`, body);
    if (r.code !== 0) throw new Error(r.message);
    toast('已更新（测试结果已重置）', 'success');
    closeModal();
    loadEvalSamples();
    loadEvalSummary();
  } catch (e) { toast(e.message, 'error'); }
}

function showAddSampleForm() {
  getMeta().then(meta => {
    const d = el('div', { class: 'modal-backdrop', onclick: e => e.target === e.currentTarget && closeModal() }, [
      el('div', { class: 'modal' }, [
        el('div', { class: 'modal-header' }, [
          el('div', { class: 'modal-title' }, '新增验收样本'),
          el('button', { class: 'modal-close', onclick: closeModal }, '×'),
        ]),
        el('div', { class: 'modal-body' }, [
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '样本类型'),
            el('select', { id: 'as-type', class: 'form-control' }, [
              el('option', { value: 'correct' }, 'correct - 正确判断'),
              el('option', { value: 'low_confidence' }, 'low_confidence - 低置信度'),
              el('option', { value: 'manual_correction' }, 'manual_correction - 人工改标'),
              el('option', { value: 'unanswerable' }, 'unanswerable - 无法回答/高风险'),
            ]),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '样本内容'),
            el('textarea', { id: 'as-content', class: 'form-control', rows: 4 }),
          ]),
          el('div', { class: 'form-row' }, [
            el('div', { class: 'form-group' }, [
              el('label', { class: 'form-label' }, '期望类别'),
              el('select', { id: 'as-cat', class: 'form-control' }, [el('option', { value: '' }, '不校验'), ...meta.categories.map(x => el('option', { value: x }, x))]),
            ]),
            el('div', { class: 'form-group' }, [
              el('label', { class: 'form-label' }, '期望紧急度'),
              el('select', { id: 'as-urg', class: 'form-control' }, [el('option', { value: '' }, '不校验'), ...meta.urgency_levels.map(x => el('option', { value: x.level }, `${x.level} - ${x.description}`))]),
            ]),
          ]),
          el('div', { class: 'form-row' }, [
            el('div', { class: 'form-group' }, [
              el('label', { class: 'form-label' }, '期望高风险'),
              el('select', { id: 'as-risk', class: 'form-control' }, [el('option', { value: '0' }, '否'), el('option', { value: '1' }, '是')]),
            ]),
            el('div', { class: 'form-group' }, [
              el('label', { class: 'form-label' }, '期望需复核'),
              el('select', { id: 'as-review', class: 'form-control' }, [el('option', { value: '0' }, '否'), el('option', { value: '1' }, '是')]),
            ]),
          ]),
          el('div', { class: 'form-group' }, [
            el('label', { class: 'form-label' }, '备注说明'),
            el('input', { id: 'as-remark', class: 'form-control', placeholder: '样本设计说明...' }),
          ]),
        ]),
        el('div', { class: 'modal-footer' }, [
          el('button', { class: 'btn btn-outline', onclick: closeModal }, '取消'),
          el('button', { class: 'btn btn-primary', onclick: submitAddSample }, '保存'),
        ]),
      ]),
    ]);
    $('#modal-root').appendChild(d);
  });
}

async function submitAddSample() {
  const body = {
    sample_type: document.getElementById('as-type').value,
    content: document.getElementById('as-content').value.trim(),
    expected_category: document.getElementById('as-cat').value || undefined,
    expected_urgency: document.getElementById('as-urg').value || undefined,
    expected_high_risk: parseInt(document.getElementById('as-risk').value),
    expected_needs_review: parseInt(document.getElementById('as-review').value),
    remarks: document.getElementById('as-remark').value || undefined,
  };
  if (!body.content) { toast('请输入内容', 'warning'); return; }
  try {
    const r = await API.post('/data/evaluation/samples', body);
    if (r.code !== 0) { toast(r.message, 'error'); return; }
    toast('已保存', 'success');
    closeModal();
    loadEvalSamples();
    loadEvalSummary();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteEvalSample(id) {
  if (!confirm('确认删除该样本？')) return;
  try { toast('样本管理接口暂未开放，可直接操作数据库', 'warning'); } catch(e) {}
}

async function renderVector() {
  const c = $('#content'); c.innerHTML = '';
  c.appendChild(el('div', { class: 'stats-grid', style: 'grid-template-columns:repeat(3,1fr);' }, [
    statCard('索引总数', 0, 'blue', '已向量化的历史工单条数'),
    statCard('索引构建时间', '-', 'green', '最后构建时间'),
    statCard('向量维度', 1536, 'purple', 'text-embedding-3-small维度'),
  ]));
  setTimeout(loadVecStats, 200);
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, '向量索引检索测试'),
    el('div', { class: 'card-subtitle' }, '输入任意文本，实时检索Top5相似历史工单'),
    el('div', { class: 'form-row', style: 'margin-top:12px;' }, [
      el('div', { class: 'form-group' }, [
        el('textarea', { id: 'vs-text', class: 'form-control', rows: 3, placeholder: '输入测试文本，例如：电梯坏了没人修' }),
      ]),
      el('div', { class: 'flex', style: 'align-items:flex-end;padding-bottom:16px;' }, [
        el('button', { class: 'btn btn-primary', onclick: testVectorSearch }, '🔍 检索'),
      ]),
    ]),
    el('div', { id: 'vs-result' }),
  ]));
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-header' }, [
      el('div', { class: 'card-title' }, '类别分布'),
      hasPerm('model:configure') ? el('button', { class: 'btn btn-outline btn-sm', onclick: rebuildVectorIndex }, '🔄 重建索引') : null,
    ].filter(Boolean)),
    el('div', { id: 'vec-cat-dist' }),
  ]));
}

async function loadVecStats() {
  try {
    const r = await API.get('/data/index-stats');
    const d = r.data;
    const cards = document.querySelectorAll('.stat-card .stat-value');
    if (cards.length >= 3) {
      cards[0].textContent = d.total || 0;
      cards[1].textContent = d.builtAt ? fmtDate(d.builtAt, false) : '尚未构建';
    }
    const distEl = $('#vec-cat-dist');
    if (d.categoryDistribution && Object.keys(d.categoryDistribution).length) {
      const max = Math.max(...Object.values(d.categoryDistribution));
      const entries = Object.entries(d.categoryDistribution).sort((a, b) => b[1] - a[1]);
      distEl.innerHTML = entries.map(([cat, cnt]) => `<div class="chart-item"><span class="chart-label">${cat.length > 6 ? cat.slice(0,5)+'…' : cat}</span><div class="chart-bar"><div class="chart-bar-fill" style="width:${cnt/max*100}%;"></div></div><span class="chart-value">${cnt}</span></div>`).join('');
    } else {
      distEl.innerHTML = '<div class="empty-state">暂无分布数据</div>';
    }
  } catch (e) {}
}

async function testVectorSearch() {
  const text = document.getElementById('vs-text').value.trim();
  if (!text) { toast('输入文本', 'warning'); return; }
  try {
    const r = await API.post('/tickets/similar', { content: text, top_k: 5, min_score: 0.3 });
    if (r.code !== 0) throw new Error(r.message);
    const box = $('#vs-result');
    if (!r.data.results.length) {
      box.innerHTML = '<div class="empty-state" style="padding:20px">无匹配结果</div>';
      return;
    }
    box.innerHTML = `<table><thead><tr><th>相似度</th><th>工单编号</th><th>类别</th><th>承办科室</th><th>紧急度</th><th>处理结果</th></tr></thead><tbody>
    ${r.data.results.map(t => `<tr>
      <td><span class="tag ${t.score >= 0.8 ? 'tag-success' : t.score >= 0.65 ? 'tag-warning' : 'tag-gray'}">${(t.score*100).toFixed(1)}%</span></td>
      <td class="nowrap">${t.ticket_no}</td>
      <td>${t.category || '-'}</td>
      <td>${t.department_name || '-'}</td>
      <td>${t.urgency || '-'}</td>
      <td style="max-width:400px" class="wrap">${t.resolution || '-'}</td>
    </tr>`).join('')}
    </tbody></table>`;
  } catch (e) { toast(e.message, 'error'); }
}

async function renderMeta() {
  const c = $('#content'); c.innerHTML = '';
  const meta = await getMeta();
  c.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, '系统配置元数据'),
    el('div', { class: 'card-subtitle' }, '系统可配置的基础参数'),
    el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;' }, [
      el('div', { style: 'background:#f8fafc;border-radius:8px;padding:14px;' }, [
        el('h4', { style: 'font-size:13px;margin-bottom:10px;' }, `诉求类别 (${meta.categories?.length || 0} 项)`),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;' }, (meta.categories || []).map(x => el('span', { class: 'tag tag-primary' }, x))),
      ]),
      el('div', { style: 'background:#f8fafc;border-radius:8px;padding:14px;' }, [
        el('h4', { style: 'font-size:13px;margin-bottom:10px;' }, '高风险类别'),
        el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;' }, (meta.high_risk_categories || []).map(x => el('span', { class: 'tag tag-danger' }, x))),
      ]),
      el('div', { style: 'background:#f8fafc;border-radius:8px;padding:14px;grid-column: span 2;' }, [
        el('h4', { style: 'font-size:13px;margin-bottom:10px;' }, '阈值配置'),
        el('div', { html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:12.5px;">
          <div><b>低置信度阈值：</b>${meta.thresholds?.low_confidence || '-'} (低于此值进入复核队列)</div>
          <div><b>高置信阈值：</b>${(meta.thresholds?.confidence_high || '-')}</div>
          <div><b>中置信阈值：</b>${(meta.thresholds?.confidence_medium || '-')}</div>
        </div>` }),
      ]),
      el('div', { style: 'background:#f8fafc;border-radius:8px;padding:14px;grid-column: span 2;' }, [
        el('h4', { style: 'font-size:13px;margin-bottom:10px;' }, `承办科室 (${meta.departments?.length || 0} 个)`),
        el('table', {}, [
          el('thead', {}, [el('tr', {}, [el('th', {}, '编码'),el('th', {}, '名称'),el('th', {}, '负责类别')])]),
          el('tbody', {}, (meta.departments || []).map(d => el('tr', {}, [
            el('td', {}, d.code), el('td', {}, d.name),
            el('td', {}, (d.categories || []).map(c => el('span', { class: 'tag tag-gray tag-sm', style: 'margin-right:4px;display:inline-block;margin:4px 2px;' }, c))),
          ]))),
        ]),
      ]),
    ]),
  ]));
}

async function renderUsers() {
  const c = $('#content'); c.innerHTML = '';
  try {
    const r = await API.get('/auth/users');
    c.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-title' }, '系统用户列表'),
      el('div', { class: 'card-subtitle' }, '基于角色的权限控制 (RBAC)'),
      el('table', { style: 'margin-top:12px;' }, [
        el('thead', {}, [el('tr', {}, [el('th', {}, '姓名'),el('th', {}, '邮箱'),el('th', {}, '角色'),el('th', {}, '部门'),el('th', {}, '最后登录'),el('th', {}, '状态')])]),
        el('tbody', {}, (r.data || []).map(u => el('tr', {}, [
          el('td', {}, u.name),
          el('td', {}, u.email),
          el('td', {}, el('span', { class: 'tag ' + (u.role === 'admin' ? 'tag-purple' : u.role === 'supervisor' ? 'tag-primary' : 'tag-info') }, { admin: '管理员', supervisor: '主管', operator: '接线员'}[u.role] || u.role)),
          el('td', {}, u.department || '-'),
          el('td', {}, fmtDate(u.last_login_at, false) || '未登录'),
          el('td', {}, u.is_active ? el('span', { class: 'tag tag-success' }, '启用') : el('span', { class: 'tag tag-gray' }, '禁用')),
        ]))),
      ]),
    ]));
  } catch (e) { c.innerHTML = `<div class="empty-state">❌ ${e.message}</div>`; }
}

document.addEventListener('DOMContentLoaded', init);
