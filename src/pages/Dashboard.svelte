<script>
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from 'svelte-routing';
  import * as echarts from 'echarts';
  import { api } from '../api.js';

  let batchData = [];
  let resampleData = [];
  let backlogData = { total_pending: 0, pending_over_24h: 0, pending_over_72h: 0 };
  let includeDirty = false;
  let loading = true;
  let filterParams = {
    include_dirty: false,
    min_sample_threshold: 30,
  };
  let showExportModal = false;
  let showDirtyModal = false;
  let dirtySampleId = '';
  let dirtyReason = '';

  let batchChartEl;
  let resampleChartEl;
  let batchChart;
  let resampleChart;

  async function loadData() {
    loading = true;
    try {
      [batchData, resampleData, backlogData] = await Promise.all([
        api.getBatchPassRates(includeDirty),
        api.getResampleReasonStats(),
        api.getBacklogStats(),
      ]);
      renderCharts();
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      loading = false;
    }
  }

  function renderCharts() {
    if (batchChartEl) {
      if (!batchChart) {
        batchChart = echarts.init(batchChartEl);
      }
      const normalBatches = batchData.filter(b => !b.is_pending);
      const pendingBatches = batchData.filter(b => b.is_pending);
      
      const allBatches = [...normalBatches, ...pendingBatches];
      
      batchChart.setOption({
        title: { text: '各批次通过率趋势', left: 'center', textStyle: { fontSize: 16 } },
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0];
            const batch = allBatches.find(b => b.batch_code === p.name);
            if (batch) {
              const status = batch.is_pending ? '<span style="color:#f59e0b">待观察</span>' : '<span style="color:#10b981">正常</span>';
              return `${p.name}<br/>通过率: ${(batch.pass_rate * 100).toFixed(2)}%<br/>样本量: ${batch.total_count}<br/>状态: ${status}`;
            }
            return p.name;
          }
        },
        legend: { top: 30, data: ['通过率'] },
        grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
        xAxis: {
          type: 'category',
          data: allBatches.map(b => b.batch_code),
          axisLabel: { rotate: 30 }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          axisLabel: { formatter: (val) => (val * 100) + '%' }
        },
        series: [{
          name: '通过率',
          type: 'bar',
          data: allBatches.map(b => ({
            value: b.pass_rate,
            itemStyle: { color: b.is_pending ? '#fbbf24' : '#3b82f6' }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (p) => (p.value * 100).toFixed(1) + '%'
          },
          markLine: {
            data: [{ yAxis: 0.85, label: { formatter: '目标线 85%' }, lineStyle: { color: '#ef4444', type: 'dashed' } }]
          }
        }]
      });
    }

    if (resampleChartEl) {
      if (!resampleChart) {
        resampleChart = echarts.init(resampleChartEl);
      }
      resampleChart.setOption({
        title: { text: '补样原因分布', left: 'center', textStyle: { fontSize: 16 } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', top: 40 },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: resampleData.map(r => ({ name: r.reason_category, value: r.count })),
          color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']
        }]
      });
    }
  }

  function viewSample(sampleId) {
    navigate(`/sample/${sampleId}`);
  }

  function openMarkDirty(sampleId) {
    dirtySampleId = sampleId;
    dirtyReason = '';
    showDirtyModal = true;
  }

  async function submitDirtyMark() {
    if (!dirtyReason.trim()) {
      alert('请填写脏数据原因');
      return;
    }
    await api.markSampleDirty(dirtySampleId, dirtyReason);
    showDirtyModal = false;
    loadData();
  }

  async function handleExport() {
    showExportModal = true;
  }

  async function doExport() {
    const fileName = `样本复核报告_${new Date().toISOString().slice(0, 10)}.csv`;
    const filterParams = {
      include_dirty: includeDirty,
      min_sample_threshold: 30,
    };
    try {
      const { save } = await import('@tauri-apps/api/dialog');
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'CSV文件', extensions: ['csv'] }]
      });
      if (filePath) {
        const count = await api.exportCsvReport(filterParams, filePath);
        alert(`导出成功，共 ${count} 条记录`);
        showExportModal = false;
      }
    } catch (e) {
      console.warn('Tauri dialog not available, simulated export');
      alert(`模拟导出成功，筛选参数已保留: ${JSON.stringify(filterParams)}`);
      showExportModal = false;
    }
  }

  function handleResize() {
    batchChart?.resize();
    resampleChart?.resize();
  }

  onMount(() => {
    loadData();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    batchChart?.dispose();
    resampleChart?.dispose();
  });

  $: if (includeDirty !== undefined) {
    loadData();
  }
</script>

<div class="dashboard">
  <div class="toolbar">
    <div class="filters">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={includeDirty} />
        包含脏数据
      </label>
      <span class="threshold-note">※ 样本量低于 30 的批次标记为"待观察"</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" on:click={loadData} disabled={loading}>
        🔄 刷新
      </button>
      <button class="btn btn-primary" on:click={handleExport}>
        📊 导出报告
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else}
    <div class="stats-cards">
      <div class="stat-card card-blue">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-label">待二审总数</div>
          <div class="stat-value">{backlogData.total_pending}</div>
        </div>
      </div>
      <div class="stat-card card-yellow">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-label">超24小时未处理</div>
          <div class="stat-value">{backlogData.pending_over_24h}</div>
        </div>
      </div>
      <div class="stat-card card-red">
        <div class="stat-icon">🚨</div>
        <div class="stat-content">
          <div class="stat-label">超72小时未处理</div>
          <div class="stat-value">{backlogData.pending_over_72h}</div>
        </div>
      </div>
      <div class="stat-card card-green">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-label">纳入统计批次</div>
          <div class="stat-value">{batchData.filter(b => !b.is_pending).length}</div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card chart-large">
        <div class="chart-container" bind:this={batchChartEl}></div>
      </div>
      <div class="chart-card chart-small">
        <div class="chart-container" bind:this={resampleChartEl}></div>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-card">
        <h3>批次详情</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>批次号</th>
              <th>样本量</th>
              <th>通过数</th>
              <th>通过率</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {#each batchData as batch}
              <tr class:row-pending={batch.is_pending}>
                <td>{batch.batch_code}</td>
                <td>{batch.total_count}</td>
                <td>{batch.pass_count}</td>
                <td>{(batch.pass_rate * 100).toFixed(2)}%</td>
                <td>
                  {#if batch.is_pending}
                    <span class="badge badge-warning">待观察</span>
                  {:else}
                    <span class="badge badge-success">正常</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="table-card">
        <h3>补样原因排行</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>原因分类</th>
              <th>数量</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {#each resampleData as item, index}
              <tr>
                <td><span class="rank rank-{index + 1}">{index + 1}</span></td>
                <td>{item.reason_category}</td>
                <td>{item.count}</td>
                <td>{item.percentage.toFixed(2)}%</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  {#if showExportModal}
    <div class="modal-overlay" on:click|self={() => showExportModal = false}>
      <div class="modal">
        <h3>导出报告</h3>
        <div class="modal-content">
          <p>导出将保留以下筛选口径：</p>
          <ul class="filter-list">
            <li>包含脏数据: <strong>{includeDirty ? '是' : '否'}</strong></li>
            <li>最小样本阈值: <strong>30</strong></li>
            <li>报告时间: <strong>{new Date().toLocaleString()}</strong></li>
          </ul>
          <p class="note">导出的 CSV 文件首行会记录筛选参数，便于追溯。</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showExportModal = false}>取消</button>
          <button class="btn btn-primary" on:click={doExport}>确认导出</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showDirtyModal}
    <div class="modal-overlay" on:click|self={() => showDirtyModal = false}>
      <div class="modal">
        <h3>标记脏数据</h3>
        <div class="modal-content">
          <label>
            脏数据原因:
            <textarea bind:value={dirtyReason} placeholder="请输入标记原因..." rows="3"></textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showDirtyModal = false}>取消</button>
          <button class="btn btn-danger" on:click={submitDirtyMark}>确认标记</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard { padding: 0; }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .filters { display: flex; align-items: center; gap: 20px; }
  .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  .threshold-note { font-size: 12px; color: #6b7280; }
  .actions { display: flex; gap: 10px; }
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .btn-danger { background: #dc2626; color: white; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .loading { text-align: center; padding: 60px; color: #6b7280; }
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }
  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    color: white;
  }
  .card-blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .card-yellow { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .card-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .card-green { background: linear-gradient(135deg, #10b981, #059669); }
  .stat-icon { font-size: 32px; }
  .stat-label { font-size: 13px; opacity: 0.9; }
  .stat-value { font-size: 28px; font-weight: 700; }
  .charts-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .chart-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .chart-container { height: 320px; width: 100%; }
  .tables-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .table-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .table-card h3 { margin: 0 0 12px 0; font-size: 16px; color: #1f2937; }
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
  .data-table tr:hover { background: #f9fafb; }
  .row-pending { background: #fffbeb !important; }
  .badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .rank {
    display: inline-flex;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    color: white;
  }
  .rank-1 { background: #fbbf24; }
  .rank-2 { background: #9ca3af; }
  .rank-3 { background: #cd7c32; }
  .rank-4, .rank-5 { background: #d1d5db; color: #4b5563; }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    min-width: 400px;
    max-width: 500px;
  }
  .modal h3 { margin: 0 0 16px 0; }
  .modal-content { margin-bottom: 20px; }
  .modal-content label { display: block; font-size: 14px; margin-bottom: 8px; }
  .modal-content textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    resize: vertical;
  }
  .filter-list {
    list-style: none;
    padding: 0;
    margin: 12px 0;
  }
  .filter-list li {
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
  }
  .note { font-size: 12px; color: #6b7280; margin-top: 12px; }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
