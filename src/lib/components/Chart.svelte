<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let labels: string[] = [];
  export let datasets: { label: string; data: number[]; color: string }[] = [];
  export let type: 'line' | 'bar' = 'line';
  export let height: number = 300;

  let chartContainer: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  const dispatch = createEventDispatcher();

  function createChart() {
    if (!chartContainer) return;
    
    if (chart) {
      chart.destroy();
    }

    const ctx = chartContainer.getContext('2d');
    if (!ctx) return;

    const colors = datasets.map((d) => d.color);

    chart = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          borderColor: colors[i],
          backgroundColor: type === 'line' 
            ? colors[i] + '20' 
            : colors[i] + '40',
          borderWidth: 2,
          fill: type === 'line',
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: colors[i],
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 12 },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 6,
            displayColors: true,
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 11 }
            }
          },
          y: {
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              color: '#64748b',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  onMount(() => {
    createChart();
  });

  $: {
    if (chart && chartContainer) {
      createChart();
    }
  }
</script>

<div class="w-full" style="height: {height}px">
  <canvas bind:this={chartContainer}></canvas>
</div>
