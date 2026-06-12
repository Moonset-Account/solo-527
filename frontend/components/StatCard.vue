<template>
  <div class="stat-card" :style="{ borderLeftColor: data.color }">
    <div class="stat-left">
      <div class="stat-label">{{ data.label }}</div>
      <div class="stat-value" :style="{ color: data.color }">{{ data.value }}</div>
      <div class="stat-tip" :title="data.tip">{{ data.tip }}</div>
    </div>
    <div class="stat-icon" :style="{ background: data.color + '15', color: data.color }">
      {{ data.icon }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ data: { label: string; value: any; icon: string; color: string; tip: string } }>()
</script>

<style scoped>
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  border-left: 4px solid #2d8a5e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform .2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-label { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-tip { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}
</style>
