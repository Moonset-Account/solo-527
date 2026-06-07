<script lang="ts">
  import type { CarModel, Store, Salesperson } from '$lib/types';

  interface Props {
    models: CarModel[];
    stores: Store[];
    salespeople: Salesperson[];
    sources: string[];
    filters: Record<string, string>;
    onfilterchange: (key: string, value: string) => void;
  }

  let { models, stores, salespeople, sources, filters, onfilterchange }: Props = $props();
</script>

<div class="filter-bar">
  <div class="filter-group">
    <label>车型</label>
    <select value={filters.model_id} onchange={(e) => onfilterchange('model_id', (e.target as HTMLSelectElement).value)}>
      <option value="">全部车型</option>
      {#each models as m}
        <option value={m.id}>{m.name} ({m.brand})</option>
      {/each}
    </select>
  </div>

  <div class="filter-group">
    <label>销售顾问</label>
    <select value={filters.sales_id} onchange={(e) => onfilterchange('sales_id', (e.target as HTMLSelectElement).value)}>
      <option value="">全部销售</option>
      {#each salespeople as s}
        <option value={s.id}>{s.name}</option>
      {/each}
    </select>
  </div>

  <div class="filter-group">
    <label>预约来源</label>
    <select value={filters.source} onchange={(e) => onfilterchange('source', (e.target as HTMLSelectElement).value)}>
      <option value="">全部来源</option>
      {#each sources as s}
        <option value={s}>{s}</option>
      {/each}
    </select>
  </div>

  <div class="filter-group">
    <label>开始日期</label>
    <input type="date" value={filters.period_start} onchange={(e) => onfilterchange('period_start', (e.target as HTMLInputElement).value)} />
  </div>

  <div class="filter-group">
    <label>结束日期</label>
    <input type="date" value={filters.period_end} onchange={(e) => onfilterchange('period_end', (e.target as HTMLInputElement).value)} />
  </div>

  <div class="filter-group">
    <label>门店</label>
    <select value={filters.store_id} onchange={(e) => onfilterchange('store_id', (e.target as HTMLSelectElement).value)}>
      <option value="">全部门店</option>
      {#each stores as s}
        <option value={s.id}>{s.name}</option>
      {/each}
    </select>
  </div>

  <div class="filter-group">
    <label>是否到店</label>
    <select value={filters.is_visited} onchange={(e) => onfilterchange('is_visited', (e.target as HTMLSelectElement).value)}>
      <option value="">不限</option>
      <option value="true">已到店</option>
      <option value="false">未到店</option>
    </select>
  </div>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
  }

  .filter-group label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .filter-group select,
  .filter-group input {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    color: #374151;
    background: #fff;
    outline: none;
    transition: border-color 0.2s;
  }

  .filter-group select:focus,
  .filter-group input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
</style>
