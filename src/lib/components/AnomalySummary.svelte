<script>
  export let data = { metrics: {}, anomalies: [] };
  export let fulfillment = [];

  const metricLabels = {
    watch_uv: { name: '观看人数', unit: '人' },
    interaction_rate: { name: '互动率', unit: '%' },
    cart_add_rate: { name: '加购率', unit: '%' },
    conversion_rate: { name: '转化率', unit: '%' },
    gmv: { name: 'GMV', unit: '元' },
    refund_rate: { name: '退款率', unit: '%' }
  };

  function getMetricValue(key) {
    return data.metrics[key] || data.metrics[key.toUpperCase()] || 0;
  }

  function formatNumber(num, unit) {
    if (unit === '元' && num > 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    if (unit === '人' && num > 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    return Number(num).toLocaleString();
  }

  function getFulfillmentData(type) {
    return fulfillment.find(f => 
      (f.PRODUCT_TYPE || f.product_type) === type
    ) || { fulfillment_rate: 0, total_orders: 0 };
  }
</script>

<div class="anomaly-summary">
  <h3 class="section-title">
    <span class="icon">⚡</span>
    异常摘要
  </h3>
  
  {#if data.anomalies.length > 0}
    <div class="anomaly-list">
      {#each data.anomalies as anomaly}
        <div class="anomaly-item {anomaly.type}">
          <div class="anomaly-header">
            <span class="anomaly-badge">{anomaly.type === 'danger' ? '🚨' : '⚠️'}</span>
            <span class="anomaly-metric">{anomaly.metric}</span>
            <span class="anomaly-value">{anomaly.value}</span>
          </div>
          <p class="anomaly-message">{anomaly.message}</p>
          <p class="anomaly-suggestion">💡 {anomaly.suggestion}</p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="no-anomaly">
      <span class="check-icon">✅</span>
      <p>当前无异常指标，各项数据表现良好</p>
    </div>
  {/if}

  <div class="metrics-grid">
    {#each Object.entries(metricLabels) as [key, label]}
      <div class="metric-card">
        <span class="metric-label">{label.name}</span>
        <span class="metric-value">
          {formatNumber(getMetricValue(key), label.unit)}
          <span class="metric-unit">{label.unit}</span>
        </span>
      </div>
    {/each}
  </div>

  <div class="fulfillment-section">
    <h4 class="subsection-title">履约表现（现货/预售分离）</h4>
    <div class="fulfillment-grid">
      <div class="fulfillment-card">
        <div class="fulfillment-type">
          <span class="type-badge spot">现货</span>
        </div>
        <div class="fulfillment-rate">
          {getFulfillmentData('spot').FULFILLMENT_RATE || getFulfillmentData('spot').fulfillment_rate || 0}%
        </div>
        <div class="fulfillment-detail">
          订单数: {getFulfillmentData('spot').TOTAL_ORDERS || getFulfillmentData('spot').total_orders || 0}
        </div>
      </div>
      <div class="fulfillment-card">
        <div class="fulfillment-type">
          <span class="type-badge preorder">预售</span>
        </div>
        <div class="fulfillment-rate">
          {getFulfillmentData('preorder').FULFILLMENT_RATE || getFulfillmentData('preorder').fulfillment_rate || 0}%
        </div>
        <div class="fulfillment-detail">
          订单数: {getFulfillmentData('preorder').TOTAL_ORDERS || getFulfillmentData('preorder').total_orders || 0}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .anomaly-summary {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    font-size: 20px;
  }

  .anomaly-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .anomaly-item {
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid;
  }

  .anomaly-item.warning {
    background: #fff8e6;
    border-color: #ffc107;
  }

  .anomaly-item.danger {
    background: #ffebee;
    border-color: #f44336;
  }

  .anomaly-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .anomaly-badge {
    font-size: 18px;
  }

  .anomaly-metric {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .anomaly-value {
    margin-left: auto;
    font-weight: 700;
    font-size: 14px;
    color: #f44336;
  }

  .anomaly-message {
    margin: 0 0 6px 0;
    font-size: 13px;
    color: #555;
  }

  .anomaly-suggestion {
    margin: 0;
    font-size: 12px;
    color: #666;
  }

  .no-anomaly {
    padding: 24px;
    text-align: center;
    background: #f0f9eb;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .check-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 8px;
  }

  .no-anomaly p {
    margin: 0;
    color: #67c23a;
    font-weight: 500;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .metric-card {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .metric-label {
    display: block;
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .metric-value {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .metric-unit {
    font-size: 13px;
    font-weight: 400;
    color: #888;
    margin-left: 4px;
  }

  .subsection-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
  }

  .fulfillment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .fulfillment-card {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: center;
  }

  .type-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .type-badge.spot {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .type-badge.preorder {
    background: #e3f2fd;
    color: #1565c0;
  }

  .fulfillment-rate {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4px;
  }

  .fulfillment-detail {
    font-size: 12px;
    color: #888;
  }

  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
