<template>
  <div class="funnel-chart card-shadow">
    <div class="chart-header">
      <h3>报名转化漏斗</h3>
      <div class="cancel-summary">
        <span class="cancel-label">取消率：</span>
        <span class="cancel-value">{{ cancelRate }}%</span>
        <span class="cancel-count">（共 {{ totalCancelled }} 人取消）</span>
      </div>
    </div>

    <div class="chart-content">
      <div ref="funnelRef" class="funnel-container"></div>
      
      <div class="cancel-reasons">
        <h4>取消原因分布</h4>
        <div class="reason-list">
          <div
            v-for="reason in cancelByReason"
            :key="reason.reasonId"
            class="reason-item"
          >
            <span class="reason-name">{{ reason.reason }}</span>
            <div class="reason-bar">
              <div
                class="reason-fill"
                :style="{ width: getReasonBarWidth(reason.count) + '%' }"
              ></div>
            </div>
            <span class="reason-count">{{ reason.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  funnelData: {
    type: Array,
    default: () => []
  },
  cancelByReason: {
    type: Array,
    default: () => []
  },
  totalCancelled: {
    type: Number,
    default: 0
  },
  cancelRate: {
    type: String,
    default: '0'
  }
})

const funnelRef = ref(null)
const maxCancelCount = computed(() => {
  if (props.cancelByReason.length === 0) return 1
  return Math.max(...props.cancelByReason.map(r => r.count))
})

const getReasonBarWidth = (count) => {
  return (count / maxCancelCount.value) * 100
}

const drawFunnel = () => {
  if (!funnelRef.value || !props.funnelData || props.funnelData.length === 0) return

  const container = funnelRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 40, bottom: 20, left: 40 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const maxCount = d3.max(props.funnelData, d => d.count)
  const stageHeight = innerHeight / props.funnelData.length

  const colorScale = d3.scaleLinear()
    .domain([0, props.funnelData.length - 1])
    .range(['#1890ff', '#69c0ff'])

  props.funnelData.forEach((d, i) => {
    const nextCount = i < props.funnelData.length - 1 ? props.funnelData[i + 1].count : 0
    const topWidth = (d.count / maxCount) * innerWidth
    const bottomWidth = (nextCount / maxCount) * innerWidth
    const y = i * stageHeight

    const pathData = [
      [innerWidth / 2 - topWidth / 2, y],
      [innerWidth / 2 + topWidth / 2, y],
      [innerWidth / 2 + bottomWidth / 2, y + stageHeight],
      [innerWidth / 2 - bottomWidth / 2, y + stageHeight]
    ]

    g.append('path')
      .attr('d', `M${pathData.map(p => p.join(',')).join('L')}Z`)
      .attr('fill', colorScale(i))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        d3.select(this).attr('fill', d3.color(colorScale(i)).brighter(0.2))
      })
      .on('mouseleave', function() {
        d3.select(this).attr('fill', colorScale(i))
      })

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', y + stageHeight / 2 - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(d.stage)

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', y + stageHeight / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(d.count.toLocaleString())

    if (i < props.funnelData.length - 1) {
      const rate = ((nextCount / d.count) * 100).toFixed(1)
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', y + stageHeight + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#52c41a')
        .attr('font-size', '12px')
        .text(`转化率 ${rate}%`)
    }
  })
}

onMounted(() => {
  nextTick(() => {
    drawFunnel()
  })
})

watch(
  () => props.funnelData,
  () => {
    nextTick(() => {
      drawFunnel()
    })
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.funnel-chart {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }
}

.cancel-summary {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;

  .cancel-label {
    color: #606266;
  }

  .cancel-value {
    color: #f5222d;
    font-weight: 600;
    font-size: 16px;
  }

  .cancel-count {
    color: #909399;
  }
}

.chart-content {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.funnel-container {
  flex: 2;
  min-height: 300px;
}

.cancel-reasons {
  flex: 1;
  display: flex;
  flex-direction: column;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #303133;
  }
}

.reason-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .reason-name {
    width: 70px;
    font-size: 12px;
    color: #606266;
    flex-shrink: 0;
  }

  .reason-bar {
    flex: 1;
    height: 16px;
    background: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .reason-fill {
    height: 100%;
    background: linear-gradient(90deg, #faad14, #f5222d);
    border-radius: 8px;
    transition: width 0.3s ease;
  }

  .reason-count {
    width: 30px;
    text-align: right;
    font-size: 12px;
    color: #303133;
    font-weight: 500;
    flex-shrink: 0;
  }
}
</style>
