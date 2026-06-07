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

  let viewMode = 'all';

  async function fetchData() {
    loading = true;
    const query = $filterQueryString;
    
    try {
      const [summaryRes, funnelRes, heatmapRes, refundRes, productsRes] = await Promise.all([
        fetch(`/api/summary?${query}`).then(r => r.json()),
        fetch(`/api/funnel?${query}`).then(r => r.json()),
        fetch(`/api/heatmap?${query}`).then(r => r.json()),
        fetch(`/api/refund?${query}`).then(r => r.json()),
        fetch(`/api/products?${query}`).then(r => r.json())
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
    } finally {
      loading = false;
    }
  }

  $: if ($filterQueryString !== undefined) {
    fetchData();
  }

  function generateMockData() {
    summaryData = {
      metrics: {
        watch_uv: 125680,
        interaction_rate: 28.5,
        cart_add_rate: 12.3,
        conversion_rate: 4.2,
        gmv: 2589600,
        refund_rate: 8.7
      },
      anomalies: [
        {
          type: 'warning',
          metric: '转化率',
          value: '4.2%',
          message: '转化率低于行业平均水平5%',
          suggestion: '建议优化商品讲解话术，增加限时优惠'
        },
        {
          type: 'danger',
          metric: '退款率',
          value: '8.7%',
          message: '退款率接近预警阈值10%',
          suggestion: '建议检查商品质量问题，优化详情页描述'
        }
      ]
    };

    fulfillmentData = [
      { product_type: 'spot', fulfillment_rate: 94.5, total_orders: 3256 },
      { product_type: 'preorder', fulfillment_rate: 82.3, total_orders: 1892 }
    ];

    dimensions = {
      anchors: [
        { anchor_id: 'a001', anchor_name: '小美' },
        { anchor_id: 'a002', anchor_name: '阿杰' },
        { anchor_id: 'a003', anchor_name: '薇薇' },
        { anchor_id: 'a004', anchor_name: '大壮' },
        { anchor_id: 'a005', anchor_name: '晓晓' }
      ],
      products: [
        { product_id: 'p001', product_name: '保湿精华液', product_type: 'spot' },
        { product_id: 'p002', product_name: '限定口红礼盒', product_type: 'preorder' },
        { product_id: 'p003', product_name: '运动T恤', product_type: 'spot' },
        { product_id: 'p004', product_name: '设计师联名卫衣', product_type: 'preorder' },
        { product_id: 'p005', product_name: '零食大礼包', product_type: 'spot' },
        { product_id: 'p006', product_name: '进口坚果礼盒', product_type: 'preorder' },
        { product_id: 'p007', product_name: '无线蓝牙耳机', product_type: 'spot' },
        { product_id: 'p008', product_name: '智能手环Pro', product_type: 'preorder' },
        { product_id: 'p009', product_name: '家用扫地机器人', product_type: 'spot' },
        { product_id: 'p010', product_name: '空气净化器', product_type: 'preorder' }
      ],
      activities: [
        { activity_id: 'act001', activity_name: '618大促' },
        { activity_id: 'act002', activity_name: '品牌日' },
        { activity_id: 'act003', activity_name: '新品首发' },
        { activity_id: 'act004', activity_name: '日常直播' }
      ]
    };

    funnelData = [
      { name: '观看', value: 125680 },
      { name: '互动', value: 35820 },
      { name: '加购', value: 15460 },
      { name: '下单', value: 5280 },
      { name: '成交', value: 4820 }
    ];

    heatmapData = [];
    const timeSlots = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', 
                       '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = 0; j < 24; j++) {
        const base = i >= 9 ? 80 : i >= 6 ? 50 : 20;
        heatmapData.push({
          time_slot: timeSlots[i],
          time_bucket: j * 30,
          total_orders: Math.floor(base * (0.5 + Math.random()))
        });
      }
    }

    refundData = [
      { refund_reason: 'quality', count: 156, amount: 45800 },
      { refund_reason: 'description', count: 124, amount: 36200 },
      { refund_reason: 'size', count: 98, amount: 28500 },
      { refund_reason: 'price', count: 87, amount: 25400 },
      { refund_reason: 'delivery', count: 76, amount: 22100 },
      { refund_reason: 'damage', count: 45, amount: 13200 },
      { refund_reason: 'regret', count: 112, amount: 32800 },
      { refund_reason: 'other', count: 58, amount: 16900 }
    ];

    productData = [
      { product_id: 'p009', product_name: '家用扫地机器人', product_type: 'spot', product_category: '家电', gmv: 589600, order_count: 656, refund_count: 42 },
      { product_id: 'p010', product_name: '空气净化器', product_type: 'preorder', product_category: '家电', gmv: 423500, order_count: 326, refund_count: 38 },
      { product_id: 'p008', product_name: '智能手环Pro', product_type: 'preorder', product_category: '数码', gmv: 358200, order_count: 718, refund_count: 52 },
      { product_id: 'p007', product_name: '无线蓝牙耳机', product_type: 'spot', product_category: '数码', gmv: 298500, order_count: 1498, refund_count: 124 },
      { product_id: 'p002', product_name: '限定口红礼盒', product_type: 'preorder', product_category: '美妆', gmv: 245600, order_count: 821, refund_count: 76 },
      { product_id: 'p004', product_name: '设计师联名卫衣', product_type: 'preorder', product_category: '服饰', gmv: 218900, order_count: 610, refund_count: 58 },
      { product_id: 'p001', product_name: '保湿精华液', product_type: 'spot', product_category: '美妆', gmv: 186400, order_count: 1456, refund_count: 98 },
      { product_id: 'p006', product_name: '进口坚果礼盒', product_type: 'preorder', product_category: '食品', gmv: 125800, order_count: 749, refund_count: 45 },
      { product_id: 'p003', product_name: '运动T恤', product_type: 'spot', product_category: '服饰', gmv: 98600, order_count: 1108, refund_count: 72 },
      { product_id: 'p005', product_name: '零食大礼包', product_type: 'spot', product_category: '食品', gmv: 64500, order_count: 948, refund_count: 36 }
    ];

    loading = false;
  }

  onMount(() => {
    generateMockData();
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
