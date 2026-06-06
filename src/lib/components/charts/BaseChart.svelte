<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import * as echarts from 'echarts';
  import type { ECharts } from 'echarts';

  export let option: any;
  export let theme: string | null = 'dark';
  export let height: string = '100%';
  export let width: string = '100%';

  let chartContainer: HTMLDivElement;
  let chart: ECharts | null = null;

  function initChart() {
    if (!browser || !chartContainer || chart) return;
    
    chart = echarts.init(chartContainer, theme);
    chart.setOption(option);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
  }

  function handleResize() {
    if (chart) {
      chart.resize();
    }
  }

  onMount(() => {
    if (browser) {
      initChart();
    }
  });

  beforeUpdate(() => {
    if (chart && browser) {
      chart.setOption(option, { notMerge: true });
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
    if (chart) {
      chart.dispose();
      chart = null;
    }
  });

  export function getChartInstance() {
    return chart;
  }
</script>

<div bind:this={chartContainer} style="width: {width}; height: {height};"></div>
