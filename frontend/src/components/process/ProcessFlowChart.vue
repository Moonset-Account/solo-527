<template>
  <div class="process-flow-chart" v-if="nodes.length > 0">
    <el-steps :active="activeIndex" align-center finish-status="success">
      <el-step v-for="node in nodes" :key="node.id" :title="node.name" :description="`顺序 ${node.order}`" />
    </el-steps>
  </div>
  <el-empty v-else description="暂无节点" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  currentNodeId: { type: [String, Number], default: null }
})

const activeIndex = computed(() => {
  if (!props.currentNodeId) return -1
  const idx = props.nodes.findIndex(n => n.id === props.currentNodeId)
  return idx >= 0 ? idx : -1
})
</script>

<style scoped>
.process-flow-chart {
  padding: 20px 0;
}
</style>
