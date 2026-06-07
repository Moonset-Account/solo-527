<script>
  import { filters, updateFilters, resetFilters } from '$lib/stores/filters';
  import { DIMENSIONS } from '$lib/metrics/definitions';

  export let dimensions = { anchors: [], products: [], activities: [] };

  function toggleFilter(type, value) {
    filters.update(f => {
      const key = `${type}Ids`;
      const current = f[key] || [];
      const exists = current.includes(value);
      return {
        ...f,
        [key]: exists ? current.filter(v => v !== value) : [...current, value]
      };
    });
  }

  function toggleSource(source) {
    filters.update(f => {
      const current = f.sources || [];
      const exists = current.includes(source);
      return {
        ...f,
        sources: exists ? current.filter(v => v !== source) : [...current, source]
      };
    });
  }

  function setProductType(type) {
    filters.update(f => ({
      ...f,
      productType: f.productType === type ? null : type
    }));
  }

  function toggleTimeSlot(slot) {
    filters.update(f => {
      const current = f.timeSlots || [];
      const exists = current.includes(slot);
      return {
        ...f,
        timeSlots: exists ? current.filter(v => v !== slot) : [...current, slot]
      };
    });
  }
</script>

<div class="filter-bar">
  <div class="filter-section">
    <label>商品类型</label>
    <div class="filter-tags">
      <button 
        class="filter-tag {$filters.productType === 'spot' ? 'active' : ''}"
        on:click={() => setProductType('spot')}
      >
        现货
      </button>
      <button 
        class="filter-tag {$filters.productType === 'preorder' ? 'active' : ''}"
        on:click={() => setProductType('preorder')}
      >
        预售
      </button>
    </div>
  </div>

  <div class="filter-section">
    <label>主播</label>
    <div class="filter-tags">
      {#each dimensions.anchors as anchor}
        <button 
          class="filter-tag {$filters.anchorIds.includes(anchor.ANCHOR_ID || anchor.anchor_id) ? 'active' : ''}"
          on:click={() => toggleFilter('anchor', anchor.ANCHOR_ID || anchor.anchor_id)}
        >
          {anchor.ANCHOR_NAME || anchor.anchor_name}
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-section">
    <label>商品</label>
    <div class="filter-tags">
      {#each dimensions.products as product}
        <button 
          class="filter-tag small {$filters.productIds.includes(product.PRODUCT_ID || product.product_id) ? 'active' : ''}"
          on:click={() => toggleFilter('product', product.PRODUCT_ID || product.product_id)}
        >
          {product.PRODUCT_NAME || product.product_name}
          <span class="product-type-tag {(product.PRODUCT_TYPE || product.product_type) === 'preorder' ? 'preorder' : 'spot'}">
            {(product.PRODUCT_TYPE || product.product_type) === 'preorder' ? '预售' : '现货'}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-section">
    <label>时段</label>
    <div class="filter-tags">
      {#each DIMENSIONS.time_slot.values as slot}
        <button 
          class="filter-tag small {$filters.timeSlots.includes(slot) ? 'active' : ''}"
          on:click={() => toggleTimeSlot(slot)}
        >
          {slot}
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-section">
    <label>活动</label>
    <div class="filter-tags">
      {#each dimensions.activities as activity}
        <button 
          class="filter-tag {$filters.activityIds.includes(activity.ACTIVITY_ID || activity.activity_id) ? 'active' : ''}"
          on:click={() => toggleFilter('activity', activity.ACTIVITY_ID || activity.activity_id)}
        >
          {activity.ACTIVITY_NAME || activity.activity_name}
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-section">
    <label>观众来源</label>
    <div class="filter-tags">
      {#each DIMENSIONS.source.values as source}
        <button 
          class="filter-tag {$filters.sources.includes(source) ? 'active' : ''}"
          on:click={() => toggleSource(source)}
        >
          {source}
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-actions">
    <button class="reset-btn" on:click={resetFilters}>重置筛选</button>
  </div>
</div>

<style>
  .filter-bar {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .filter-section {
    margin-bottom: 16px;
  }

  .filter-section:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tag {
    padding: 6px 14px;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    background: #f8f9fa;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    color: #555;
  }

  .filter-tag:hover {
    border-color: #4a90d9;
    background: #e8f0fe;
  }

  .filter-tag.active {
    background: #4a90d9;
    border-color: #4a90d9;
    color: white;
  }

  .filter-tag.small {
    padding: 4px 10px;
    font-size: 12px;
  }

  .product-type-tag {
    display: inline-block;
    padding: 1px 6px;
    margin-left: 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
  }

  .product-type-tag.spot {
    background: rgba(46, 125, 50, 0.15);
    color: #2e7d32;
  }

  .product-type-tag.preorder {
    background: rgba(21, 101, 192, 0.15);
    color: #1565c0;
  }

  .filter-tag.active .product-type-tag.spot {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .filter-tag.active .product-type-tag.preorder {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .filter-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }

  .reset-btn {
    padding: 8px 20px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #666;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: #eee;
  }
</style>
