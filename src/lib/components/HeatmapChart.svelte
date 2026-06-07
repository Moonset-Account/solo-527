<script>
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';

  export let data = [];
  export let title = '讲解时段热力图';

  let chartEl;
  let chart;

  const timeSlots = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', 
                     '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
  const timeBuckets = Array.from({ length: 24 }, (_, i) => i * 30);

  function formatBucket(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function initChart() {
    chart = echarts.init(chartEl);
    
    const heatmapData = [];
    let maxValue = 0;

    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = 0; j < timeBuckets.length; j++) {
        const slot = timeSlots[i];
        const bucket = timeBuckets[j];
        const item = data.find(d => 
          (d.TIME_SLOT || d.time_slot) === slot && 
          (d.TIME_BUCKET || d.time_bucket) === bucket
        );
        const value = item ? (item.TOTAL_ORDERS || item.total_orders || 0) : 0;
        heatmapData.push([j, i, value]);
        if (value > maxValue) maxValue = value;
      }
    }

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
        position: 'top',
        formatter: (params) => {
          return `时段: ${timeSlots[params.value[1]]}<br/>
                  时间: ${formatBucket(timeBuckets[params.value[0]])}<br/>
                  订单量: ${params.value[2]}`;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: 60,
        bottom: '15%'
      },
      xAxis: {
        type: 'category',
        data: timeBuckets.map(formatBucket),
        splitArea: {
          show: true
        },
        axisLabel: {
          interval: 3,
          fontSize: 10,
          rotate: 45
        }
      },
      yAxis: {
        type: 'category',
        data: timeSlots,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 11
        }
      },
      visualMap: {
        min: 0,
        max: maxValue || 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '2%',
        inRange: {
          color: ['#f0f9eb', '#67c23a', '#e6a23c', '#f56c6c']
        }
      },
      series: [
        {
          name: '订单量',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
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
