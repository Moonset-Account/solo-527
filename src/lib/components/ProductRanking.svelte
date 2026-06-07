<script>
  export let data = [];
  export let title = '商品排行榜';

  function formatNumber(num) {
    if (!num) return 0;
    num = Number(num);
    if (num > 10000) {
      return (num / 10000).toFixed(2) + '万';
    }
    return num.toLocaleString();
  }

  function getTypeLabel(type) {
    return type === 'preorder' ? '预售' : '现货';
  }

  function getTypeClass(type) {
    return type === 'preorder' ? 'preorder' : 'spot';
  }

  function getRefundRate(item) {
    const orders = item.ORDER_COUNT || item.order_count || 0;
    const refunds = item.REFUND_COUNT || item.refund_count || 0;
    if (orders === 0) return 0;
    return ((refunds / orders) * 100).toFixed(1);
  }
</script>

<div class="ranking-container">
  <h3 class="section-title">
    <span class="icon">🏆</span>
    {title}
  </h3>

  <div class="ranking-table">
    <div class="table-header">
      <div class="col rank">排名</div>
      <div class="col name">商品名称</div>
      <div class="col type">类型</div>
      <div class="col metric">GMV</div>
      <div class="col metric">订单</div>
      <div class="col metric">退款率</div>
    </div>

    <div class="table-body">
      {#each data as item, index}
        <div class="table-row">
          <div class="col rank">
            <span class="rank-badge {index < 3 ? 'top' : ''}">
              {index + 1}
            </span>
          </div>
          <div class="col name">
            <span class="product-name">
              {item.PRODUCT_NAME || item.product_name}
            </span>
            <span class="product-category">
              {item.PRODUCT_CATEGORY || item.product_category}
            </span>
          </div>
          <div class="col type">
            <span class="type-tag {getTypeClass(item.PRODUCT_TYPE || item.product_type)}">
              {getTypeLabel(item.PRODUCT_TYPE || item.product_type)}
            </span>
          </div>
          <div class="col metric highlight">
            ¥{formatNumber(item.GMV || item.gmv)}
          </div>
          <div class="col metric">
            {formatNumber(item.ORDER_COUNT || item.order_count)}
          </div>
          <div class="col metric">
            <span class="refund-rate {Number(getRefundRate(item)) > 10 ? 'high' : ''}">
              {getRefundRate(item)}%
            </span>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          暂无数据
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .ranking-container {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    height: 420px;
    display: flex;
    flex-direction: column;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .icon {
    font-size: 18px;
  }

  .ranking-table {
    flex: 1;
    overflow: auto;
  }

  .table-header {
    display: grid;
    grid-template-columns: 60px 1fr 80px 100px 80px 80px;
    gap: 12px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .table-body {
    margin-top: 8px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 60px 1fr 80px 100px 80px 80px;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    align-items: center;
    transition: background 0.2s;
  }

  .table-row:hover {
    background: #f8f9fa;
  }

  .col {
    font-size: 13px;
  }

  .rank {
    text-align: center;
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e9ecef;
    font-weight: 600;
    font-size: 12px;
    color: #666;
  }

  .rank-badge.top {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .product-name {
    display: block;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 2px;
  }

  .product-category {
    font-size: 11px;
    color: #999;
  }

  .type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .type-tag.spot {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .type-tag.preorder {
    background: #e3f2fd;
    color: #1565c0;
  }

  .metric {
    text-align: right;
    color: #555;
  }

  .metric.highlight {
    font-weight: 600;
    color: #1a1a1a;
  }

  .refund-rate {
    color: #52c41a;
    font-weight: 500;
  }

  .refund-rate.high {
    color: #f5222d;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #999;
    font-size: 14px;
  }
</style>
