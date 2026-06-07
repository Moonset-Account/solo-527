<script lang="ts">
  import { onMount } from 'svelte';
  import type { CarModel, Store, Salesperson, FunnelData, CancellationDetail, SalesLoad, ConversionData } from '$lib/types';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import FunnelChart from '$lib/components/FunnelChart.svelte';
  import CancellationPanel from '$lib/components/CancellationPanel.svelte';
  import SalesLoadPanel from '$lib/components/SalesLoadPanel.svelte';
  import ConversionPanel from '$lib/components/ConversionPanel.svelte';

  interface Props {
    data: {
      filterOptions: {
        models: CarModel[];
        stores: Store[];
        salespeople: Salesperson[];
        sources: string[];
      };
      initialData: {
        funnel: FunnelData;
        cancellation: CancellationDetail[];
        salesLoad: SalesLoad[];
        conversion: ConversionData[];
      };
    };
  }

  let { data }: Props = $props();

  let filters: Record<string, string> = $state({
    model_id: '',
    sales_id: '',
    source: '',
    period_start: '',
    period_end: '',
    store_id: '',
    is_visited: ''
  });

  let funnelData: FunnelData | null = $state(data.initialData.funnel);
  let cancellationData: CancellationDetail[] = $state(data.initialData.cancellation);
  let salesLoadData: SalesLoad[] = $state(data.initialData.salesLoad);
  let conversionData: ConversionData[] = $state(data.initialData.conversion);
  let loading: boolean = $state(false);
  let exporting: boolean = $state(false);

  function buildQueryString(): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v);
    }
    return params.toString();
  }

  async function fetchData() {
    loading = true;
    const qs = buildQueryString();
    try {
      const [funnelRes, cancelRes, salesRes, convRes] = await Promise.all([
        fetch(`/api/funnel?${qs}`),
        fetch(`/api/cancellation?${qs}`),
        fetch(`/api/sales-load?${qs}`),
        fetch(`/api/conversion?${qs}`)
      ]);

      funnelData = await funnelRes.json();
      cancellationData = await cancelRes.json();
      salesLoadData = await salesRes.json();
      conversionData = await convRes.json();
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      loading = false;
    }
  }

  async function handleExport() {
    exporting = true;
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/export?${qs}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-drive-report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      exporting = false;
    }
  }

  function handleFilterChange(key: string, value: string) {
    filters[key] = value;
    fetchData();
  }
</script>

<svelte:head>
  <title>新能源车试驾预约看板</title>
</svelte:head>

<div class="dashboard">
  <div class="header">
    <div class="header-left">
      <h1>新能源车试驾预约看板</h1>
      <p class="subtitle">车型转化 · 取消原因 · 销售负载 · 成交分析</p>
    </div>
    <div class="header-right">
      <button class="export-btn" onclick={handleExport} disabled={exporting}>
        {exporting ? '导出中...' : '导出报表'}
      </button>
    </div>
  </div>

  <FilterBar
    models={data.filterOptions.models}
    stores={data.filterOptions.stores}
    salespeople={data.filterOptions.salespeople}
    sources={data.filterOptions.sources}
    {filters}
    onfilterchange={handleFilterChange}
  />

  {#if loading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <span>加载数据中...</span>
    </div>
  {/if}

  <div class="grid-main">
    <div class="col-left">
      <FunnelChart data={funnelData} />
    </div>
    <div class="col-right">
      <CancellationPanel data={cancellationData} />
    </div>
  </div>

  <div class="grid-bottom">
    <SalesLoadPanel data={salesLoadData} />
  </div>

  <div class="grid-bottom">
    <ConversionPanel data={conversionData} />
  </div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f3f4f6;
    color: #1f2937;
  }

  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .subtitle {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }

  .export-btn {
    padding: 8px 20px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .export-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 30px;
    color: #6b7280;
    font-size: 14px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .grid-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .grid-bottom {
    margin-bottom: 20px;
  }

  @media (max-width: 900px) {
    .grid-main {
      grid-template-columns: 1fr;
    }
  }
</style>
