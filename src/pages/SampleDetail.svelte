<script>
  import { onMount } from 'svelte';
  import { navigate, useParams } from 'svelte-routing';
  import { api } from '../api.js';

  const params = useParams();
  let sampleId = $params.id;
  let evidence = null;
  let loading = true;
  let activeTab = 'overview';

  async function loadEvidence() {
    loading = true;
    try {
      evidence = await api.getSampleEvidence(sampleId);
    } catch (e) {
      console.error('加载证据链失败:', e);
    } finally {
      loading = false;
    }
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('zh-CN');
  }

  function getStatusBadge(status) {
    const map = {
      pass: { text: '通过', class: 'badge-success' },
      fail: { text: '不通过', class: 'badge-danger' },
      pending: { text: '待处理', class: 'badge-warning' },
      completed: { text: '已完成', class: 'badge-info' },
    };
    return map[status] || { text: status, class: 'badge-secondary' };
  }

  onMount(() => {
    loadEvidence();
  });
</script>

<div class="sample-detail">
  <div class="page-header">
    <button class="btn-back" on:click={() => navigate('/')}>
      ← 返回看板
    </button>
    <h2>样本证据链</h2>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if evidence}
    <div class="tabs">
      <button class:tab-active={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>
        概览
      </button>
      <button class:tab-active={activeTab === 'resample'} on:click={() => activeTab = 'resample'}>
        补样记录 ({evidence.resamples.length})
      </button>
      <button class:tab-active={activeTab === 'screenshots'} on:click={() => activeTab = 'screenshots'}>
        异常截图 ({evidence.screenshots.length})
      </button>
      <button class:tab-active={activeTab === 'review'} on:click={() => activeTab = 'review'}>
        二审记录 ({evidence.review_history.length})
      </button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'overview'}
        <div class="overview-grid">
          <div class="info-card">
            <h3>📋 样本基本信息</h3>
            <div class="info-row">
              <span class="label">样本编号:</span>
              <span class="value">{evidence.sample.sample_code}</span>
              {#if evidence.sample.is_dirty}
                <span class="badge badge-danger">脏数据</span>
              {/if}
            </div>
            <div class="info-row">
              <span class="label">所属批次:</span>
              <span class="value">{evidence.sample.batch_code}</span>
            </div>
            <div class="info-row">
              <span class="label">样本类型:</span>
              <span class="value">{evidence.sample.sample_type}</span>
            </div>
            <div class="info-row">
              <span class="label">采集时间:</span>
              <span class="value">{formatDate(evidence.sample.collection_time)}</span>
            </div>
            <div class="info-row">
              <span class="label">初检结果:</span>
              <span class="value">{evidence.sample.initial_result || '-'}</span>
            </div>
            <div class="info-row">
              <span class="label">初检状态:</span>
              <span class="value">
                <span class="badge {getStatusBadge(evidence.sample.initial_status).class}">
                  {getStatusBadge(evidence.sample.initial_status).text}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">初检人:</span>
              <span class="value">{evidence.sample.reviewer_id || '-'}</span>
            </div>
            {#if evidence.sample.dirty_reason}
              <div class="info-row dirty-reason">
                <span class="label">脏数据原因:</span>
                <span class="value">{evidence.sample.dirty_reason}</span>
              </div>
            {/if}
          </div>

          <div class="info-card">
            <h3>👤 志愿者信息</h3>
            <div class="info-row">
              <span class="label">志愿者编号:</span>
              <span class="value">{evidence.volunteer.volunteer_code}</span>
              {#if evidence.volunteer.is_dirty}
                <span class="badge badge-danger">脏数据</span>
              {/if}
            </div>
            <div class="info-row">
              <span class="label">姓名:</span>
              <span class="value">{evidence.volunteer.name}</span>
            </div>
            <div class="info-row">
              <span class="label">性别:</span>
              <span class="value">{evidence.volunteer.gender || '-'}</span>
            </div>
            <div class="info-row">
              <span class="label">年龄:</span>
              <span class="value">{evidence.volunteer.age || '-'}</span>
            </div>
            <div class="info-row">
              <span class="label">联系电话:</span>
              <span class="value">{evidence.volunteer.phone || '-'}</span>
            </div>
          </div>

          <div class="info-card timeline-card">
            <h3>📅 证据时间线</h3>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-time">{formatDate(evidence.sample.collection_time)}</div>
                  <div class="timeline-title">样本采集</div>
                  <div class="timeline-desc">{evidence.sample.sample_type}样本采集完成</div>
                </div>
              </div>
              {#if evidence.sample.review_time}
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-time">{formatDate(evidence.sample.review_time)}</div>
                    <div class="timeline-title">初审完成</div>
                    <div class="timeline-desc">
                      审核人: {evidence.sample.reviewer_id}, 结果: {evidence.sample.initial_result || evidence.sample.initial_status}
                    </div>
                  </div>
                </div>
              {/if}
              {#each evidence.resamples as r}
                <div class="timeline-item">
                  <div class="timeline-dot dot-warning"></div>
                  <div class="timeline-content">
                    <div class="timeline-time">{formatDate(r.resample_time)}</div>
                    <div class="timeline-title">补样记录</div>
                    <div class="timeline-desc">{r.reason}</div>
                  </div>
                </div>
              {/each}
              {#each evidence.review_history as rv}
                <div class="timeline-item">
                  <div class="timeline-dot dot-info"></div>
                  <div class="timeline-content">
                    <div class="timeline-time">{formatDate(rv.first_review_time)}</div>
                    <div class="timeline-title">二审流程</div>
                    <div class="timeline-desc">
                      一审: {rv.first_reviewer} - {rv.first_review_result}
                      {#if rv.second_review_result}
                        <br/>二审: {rv.second_reviewer} - {rv.second_review_result}
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'resample'}
        <div class="info-card">
          <h3>🔄 补样记录</h3>
          {#if evidence.resamples.length === 0}
            <div class="empty-state">无补样记录</div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>补样时间</th>
                  <th>原因分类</th>
                  <th>详细原因</th>
                  <th>操作人</th>
                </tr>
              </thead>
              <tbody>
                {#each evidence.resamples as r}
                  <tr>
                    <td>{formatDate(r.resample_time)}</td>
                    <td>{r.reason_category}</td>
                    <td>{r.reason}</td>
                    <td>{r.operator}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'screenshots'}
        <div class="info-card">
          <h3>🖼️ 异常截图</h3>
          {#if evidence.screenshots.length === 0}
            <div class="empty-state">无异常截图</div>
          {:else}
            <div class="screenshot-grid">
              {#each evidence.screenshots as s}
                <div class="screenshot-item">
                  <div class="screenshot-placeholder">
                    <span class="screenshot-icon">📷</span>
                    <span class="screenshot-path">{s.screenshot_path}</span>
                  </div>
                  <div class="screenshot-info">
                    <p class="screenshot-desc">{s.description || '无描述'}</p>
                    <p class="screenshot-meta">上传人: {s.uploaded_by} | {formatDate(s.uploaded_at)}</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'review'}
        <div class="info-card">
          <h3>📝 二审记录</h3>
          {#if evidence.review_history.length === 0}
            <div class="empty-state">无二审记录</div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>一审人</th>
                  <th>一审结果</th>
                  <th>一审时间</th>
                  <th>二审人</th>
                  <th>二审结果</th>
                  <th>当前状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {#each evidence.review_history as rv}
                  <tr>
                    <td>{rv.first_reviewer}</td>
                    <td>
                      <span class="badge {getStatusBadge(rv.first_review_result).class}">
                        {getStatusBadge(rv.first_review_result).text}
                      </span>
                    </td>
                    <td>{formatDate(rv.first_review_time)}</td>
                    <td>{rv.second_reviewer || '-'}</td>
                    <td>
                      {#if rv.second_review_result}
                        <span class="badge {getStatusBadge(rv.second_review_result).class}">
                          {getStatusBadge(rv.second_review_result).text}
                        </span>
                      {:else}-{/if}
                    </td>
                    <td>
                      <span class="badge {getStatusBadge(rv.status).class}">
                        {getStatusBadge(rv.status).text}
                      </span>
                    </td>
                    <td>{rv.comment || '-'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sample-detail { padding: 0; }
  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .page-header h2 { margin: 0; color: #1f2937; }
  .btn-back {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    color: #374151;
    font-size: 14px;
  }
  .btn-back:hover { background: #f9fafb; }
  .loading { text-align: center; padding: 60px; color: #6b7280; }
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    background: white;
    padding: 4px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .tabs button {
    padding: 10px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    color: #6b7280;
  }
  .tab-active {
    background: #2563eb !important;
    color: white !important;
    font-weight: 500;
  }
  .tab-content { min-height: 400px; }
  .overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .timeline-card { grid-column: 1 / -1; }
  .info-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .info-card h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #1f2937;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }
  .info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 8px;
  }
  .info-row:last-child { border-bottom: none; }
  .label {
    width: 100px;
    color: #6b7280;
    font-size: 14px;
    flex-shrink: 0;
  }
  .value { flex: 1; font-size: 14px; color: #1f2937; }
  .dirty-reason { background: #fef2f2; margin: 8px -8px; padding: 8px; border-radius: 4px; }
  .badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    display: inline-block;
  }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .badge-secondary { background: #e5e7eb; color: #374151; }
  .timeline { position: relative; padding-left: 24px; }
  .timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: #e5e7eb;
  }
  .timeline-item { position: relative; padding-bottom: 20px; }
  .timeline-item:last-child { padding-bottom: 0; }
  .timeline-dot {
    position: absolute;
    left: -20px;
    top: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #3b82f6;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #3b82f6;
  }
  .dot-warning { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
  .dot-info { background: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6; }
  .timeline-time { font-size: 12px; color: #6b7280; }
  .timeline-title { font-weight: 600; color: #1f2937; margin: 4px 0; }
  .timeline-desc { font-size: 14px; color: #4b5563; }
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #9ca3af;
    font-size: 14px;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .data-table th, .data-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  .data-table th { background: #f9fafb; font-weight: 600; color: #374151; }
  .screenshot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .screenshot-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .screenshot-placeholder {
    height: 160px;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .screenshot-icon { font-size: 48px; }
  .screenshot-path { font-size: 11px; color: #6b7280; word-break: break-all; padding: 0 10px; text-align: center; }
  .screenshot-info { padding: 12px; }
  .screenshot-desc { margin: 0 0 8px 0; font-size: 14px; color: #1f2937; }
  .screenshot-meta { margin: 0; font-size: 12px; color: #6b7280; }
</style>
