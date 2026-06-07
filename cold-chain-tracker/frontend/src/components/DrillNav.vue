<template>
  <div class="drill-nav" v-if="drillPath.length > 0">
    <span
      v-for="(item, index) in drillPath"
      :key="index"
      class="drill-crumb"
      :class="{ active: index === drillPath.length - 1 }"
      @click="index < drillPath.length - 1 && goBack(index)"
    >
      <span v-if="index > 0" class="drill-sep">›</span>
      {{ item.label }}
    </span>
  </div>
</template>

<script setup>
import { useDrilldown } from '../composables/useDrilldown'

const { drillPath, goBack } = useDrilldown()
</script>
