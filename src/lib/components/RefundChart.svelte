<script>
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import { REFUND_REASONS } from '$lib/metrics/definitions';

  export let data = [];
  export let title = '退款原因分析';

  let chartEl;
  let chart;

  function getReasonName(id) {
    const reason = REFUND_REASONS.find(r => r.id === id);
    return reason ? reason.name : id;
  }

  function initChart() {
    chart = echarts.init(chartEl);
    
    const chartData = data.map(item => ({
      name: getReasonName(item.REFUND_REASON || item.refund_reason),
      value: item.COUNT || item.count || 0,
      amount: item.AMOUNT || item.amount || 0
    }));

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
        formatter: (params) => {
          const d = params.data;
          return `${d.name}<br/>
                  退款订单: ${d.value} 单<br/>
                  退款金额: ¥${Number(d.amount).toLocaleString()}`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', 
              '#3ba272', '#fc8452', '#9a60b4'],
      series: [
        {
          name: '退款原因',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: chartData
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
