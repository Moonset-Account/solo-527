<script>
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';

  export let data = [];
  export let title = '转化漏斗';

  let chartEl;
  let chart;

  function formatValue(value) {
    if (value > 10000) {
      return (value / 10000).toFixed(1) + '万';
    }
    return value.toLocaleString();
  }

  function initChart() {
    chart = echarts.init(chartEl);
    
    const funnelData = data.map((item, index) => {
      const rate = index === 0 ? 100 : ((item.value / data[0].value) * 100).toFixed(1);
      return {
        ...item,
        rate: rate + '%'
      };
    });

    const option = {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1a1a1a'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      series: [
        {
          name: '转化漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 20,
          width: '80%',
          min: 0,
          max: data[0]?.value || 100,
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => {
              return `${params.name}\n${formatValue(params.value)} (${params.data.rate})`;
            },
            color: '#fff',
            fontSize: 12
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 14
            }
          },
          data: funnelData
        }
      ]
    };

    chart.setOption(option);
  }

  function handleResize() {
    chart?.resize();
  }

  $: if (chart && data.length > 0) {
    initChart();
  }

  onMount(() => {
    initChart();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    chart?.dispose();
  });
</script>

<div class="chart-container">
  <div class="chart-wrapper" bind:this={chartEl}></div>
</div>

<style>
  .chart-container {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    height: 420px;
  }

  .chart-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
