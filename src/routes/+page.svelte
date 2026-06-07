<script>
  import { onMount } from 'svelte';
  import { filters, filterQueryString } from '$lib/stores/filters';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import AnomalySummary from '$lib/components/AnomalySummary.svelte';
  import FunnelChart from '$lib/components/FunnelChart.svelte';
  import HeatmapChart from '$lib/components/HeatmapChart.svelte';
  import RefundChart from '$lib/components/RefundChart.svelte';
  import ProductRanking from '$lib/components/ProductRanking.svelte';

  let loading = true;
  let summaryData = { metrics: {}, anomalies: [] };
  let fulfillmentData = [];
  let dimensions = { anchors: [], products: [], activities: [] };
  let funnelData = [];
  let heatmapData = [];
  let refundData = [];
  let productData = [];

  let loadError = null;

  async function fetchData() {
    loading = true;
    loadError = null;
    const query = $filterQueryString;
    
    try {
      const [summaryRes, funnelRes, heatmapRes, refundRes, productsRes] = await Promise.all([
        fetch('/api/summary?' + query).then(r => {
          if (!r.ok) throw new Error('API错误: ' + r.status);
          return r.json();
        }),
        fetch('/api/funnel?' + query).then(r => {
          if (!r.ok) throw new Error('API错误: ' + r.status);
          return r.json();
        }),
        fetch('/api/heatmap?' + query).then(r => {
          if (!r.ok) throw new Error('API错误: ' + r.status);
          return r.json();
        }),
        fetch('/api/refund?' + query).then(r => {
          if (!r.ok) throw new Error('API错误: ' + r.status);
          return r.json();
        }),
        fetch('/api/products?' + query).then(r => {
          if (!r.ok) throw new Error('API错误: ' + r.status);
          return r.json();
        })
      ]);

      summaryData = summaryRes.summary;
      fulfillmentData = summaryRes.fulfillment;
      dimensions = summaryRes.dimensions;
      funnelData = funnelRes;
      heatmapData = heatmapRes;
      refundData = refundRes;
      productData = productsRes;
    } catch (error) {
      console.error('数据加载失败:', error);
      loadError = error.message;
    } finally {
      loading = false;
    }
  }

  $: if ($filterQueryString !== undefined) {
    fetchData();
  }

  onMount(() => {
    fetchData();
  });
</script>

<div class="dashboard">
  <header class="header">
    <div class="header-content">
      <h1 class="title">
        <span class="title-icon">📊</span>
        电商直播间转化看板
      </h1>
      <div class="header-actions">
        <span class="update-time">数据更新时间: 2024-06-07 14:30</span>
        <button class="refresh-btn" on:click={fetchData} disabled={loading}>
          {loading ? '加载中...' : '🔄 刷新数据'}
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <FilterBar dimensions={dimensions} />

    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>数据加载中...</p>
      </div>
    {:else if loadError}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>数据加载失败</h3>
        <p class="error-message">{loadError}</p>
        <div class="setup-hint">
          <p>请先运行以下命令初始化数据：</p>
          <pre><code>npm run generate:data
npm run clean:data</code></pre>
          <button class="retry-btn" on:click={fetchData}>重试加载</button>
        </div>
      </div>
    {:else}
      <AnomalySummary data={summaryData} fulfillment={fulfillmentData} />

      <div class="charts-grid">
        <div class="chart-row">
          <div class="chart-col">
            <FunnelChart data={funnelData} title="用户转化漏斗" />
          </div>
          <div class="chart-col">
            <HeatmapChart data={heatmapData} title="讲解时段转化热力图" />
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-col">
            <RefundChart data={refundData} title="退款原因分布" />
          </div>
          <div class="chart-col">
            <ProductRanking data={productData} title="商品GMV排行榜" />
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .dashboard {
    min-height: 100vh;
  }

  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 32px;
    color: white;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-icon {
    font-size: 28px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .update-time {
    font-size: 13px;
    opacity: 0.9;
  }

  .refresh-btn {
    padding: 8px 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .main-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e0e0e0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .charts-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .chart-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .chart-col {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    .chart-row {
      grid-template-columns: 1fr;
    }
  }

  .error-state {
    background: #fff;
    border-radius: 12px;
    padding: 48px 32px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-state h3 {
    font-size: 20px;
    color: #d32f2f;
    margin: 0 0 12px 0;
  }

  .error-message {
    color: #666;
    margin: 0 0 24px 0;
    font-size: 14px;
  }

  .setup-hint {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    margin: 0 auto;
  }

  .setup-hint p {
    color: #333;
    margin: 0 0 12px 0;
    font-weight: 500;
  }

  .setup-hint pre {
    background: #1a1a2e;
    color: #4ade80;
    padding: 12px 16px;
    border-radius: 6px;
    text-align: left;
    margin: 0 0 16px 0;
    font-size: 13px;
    overflow-x: auto;
  }

  .setup-hint code {
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  }

  .retry-btn {
    padding: 10px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-btn:hover {
    background: #5a67d8;
  }

  @media (max-width: 768px) {
    .header {
      padding: 16px 20px;
    }

    .title {
      font-size: 20px;
    }

    .main-content {
      padding: 16px 20px;
    }

    .header-content {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
  }
</style>
