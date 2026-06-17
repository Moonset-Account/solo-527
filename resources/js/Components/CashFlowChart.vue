<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const props = defineProps({
    type: {
        type: String,
        default: 'line',
    },
    labels: {
        type: Array,
        required: true,
    },
    datasets: {
        type: Array,
        required: true,
    },
    options: {
        type: Object,
        default: () => ({}),
    },
});

const chartRef = ref(null);
let chartInstance = null;

const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += new Intl.NumberFormat('zh-CN', {
                            style: 'currency',
                            currency: 'CNY',
                        }).format(context.parsed.y);
                    }
                    return label;
                },
            },
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
        },
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value) {
                    if (value >= 10000) {
                        return (value / 10000).toFixed(1) + '万';
                    }
                    return value;
                },
            },
        },
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
    },
};

const createChart = () => {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = chartRef.value.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: props.type,
        data: {
            labels: props.labels,
            datasets: props.datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: dataset.backgroundColor || getDefaultColor(index, 0.2),
                borderColor: dataset.borderColor || getDefaultColor(index, 1),
                borderWidth: dataset.borderWidth || 2,
                tension: dataset.tension || 0.4,
                fill: dataset.fill !== undefined ? dataset.fill : props.type === 'line',
            })),
        },
        options: {
            ...defaultOptions,
            ...props.options,
        },
    });
};

const getDefaultColor = (index, alpha) => {
    const colors = [
        `rgba(59, 130, 246, ${alpha})`,
        `rgba(16, 185, 129, ${alpha})`,
        `rgba(245, 158, 11, ${alpha})`,
        `rgba(239, 68, 68, ${alpha})`,
        `rgba(139, 92, 246, ${alpha})`,
        `rgba(236, 72, 153, ${alpha})`,
    ];
    return colors[index % colors.length];
};

onMounted(() => {
    createChart();
});

watch(
    () => [props.labels, props.datasets, props.type],
    () => {
        createChart();
    },
    { deep: true }
);

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
});
</script>

<template>
    <div class="w-full h-full">
        <canvas ref="chartRef"></canvas>
    </div>
</template>
