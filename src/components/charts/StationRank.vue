<template>
  <ChartContainer 
    :sample-size="sampleSize" 
    :update-time="lastUpdate"
    :filters="filtersDesc"
  >
    <div class="station-rank">
      <div class="rank-header">
        <span class="rank-col rank-num">#</span>
        <span class="rank-col rank-name">站点</span>
        <span class="rank-col rank-fault">故障</span>
        <span class="rank-col rank-avail">可用率</span>
      </div>
      <div class="rank-body">
        <div 
          v-for="(station, index) in topStations" 
          :key="station.id"
          class="rank-row"
          :class="{ 'rank-top': index < 3 }"
          @click="handleClick(station)"
        >
          <span class="rank-col rank-num">
            <span v-if="index === 0" class="medal gold">🥇</span>
            <span v-else-if="index === 1" class="medal silver">🥈</span>
            <span v-else-if="index === 2" class="medal bronze">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="rank-col rank-name" :title="station.name">{{ station.name }}</span>
          <span class="rank-col rank-fault">
            <span class="fault-count">{{ station.fault_count }}</span>
          </span>
          <span class="rank-col rank-avail">
            <div class="avail-bar">
              <div 
                class="avail-fill"
                :class="getAvailClass(station.availability)"
                :style="{ width: (station.availability * 100) + '%' }"
              ></div>
            </div>
            <span class="avail-text" :class="getAvailClass(station.availability)">
              {{ (station.availability * 100).toFixed(1) }}%
            </span>
          </span>
        </div>
      </div>
    </div>
  </ChartContainer>
</template>

<script setup>
import { computed } from 'vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { useDataStore } from '@/stores/dataStore.js'

const store = useDataStore()

const topStations = computed(() => store.faultsByStation.slice(0, 10))
const sampleSize = computed(() => store.sampleSizes.stationRank)
const lastUpdate = computed(() => store.lastUpdateTime)
const filtersDesc = computed(() => store.activeFiltersDesc)

function getAvailClass(rate) {
  if (rate >= 0.9) return 'good'
  if (rate >= 0.75) return 'warning'
  return 'danger'
}

function handleClick(station) {
  store.drillToStation(station.id)
}
</script>

<style lang="scss" scoped>
.station-rank {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rank-header {
  display: flex;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid $border-color;
  font-size: 11px;
  color: $text-muted;
  font-weight: 500;
  flex-shrink: 0;
}

.rank-col {
  flex-shrink: 0;
}

.rank-num {
  width: 40px;
  text-align: center;
}

.rank-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-fault {
  width: 60px;
  text-align: center;
}

.rank-avail {
  width: 140px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rank-body {
  flex: 1;
  overflow-y: auto;
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all $transition-fast;
  font-size: 13px;
  
  &:hover {
    background: rgba(22, 93, 255, 0.08);
  }
  
  &.rank-top {
    background: rgba(250, 173, 20, 0.05);
  }
}

.medal {
  font-size: 16px;
}

.fault-count {
  font-family: $font-mono;
  font-weight: 600;
  color: $danger;
}

.avail-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.avail-fill {
  height: 100%;
  border-radius: 3px;
  transition: width $transition-normal;
  
  &.good { background: $success; }
  &.warning { background: $warning; }
  &.danger { background: $danger; }
}

.avail-text {
  font-family: $font-mono;
  font-size: 12px;
  width: 50px;
  text-align: right;
  
  &.good { color: $success; }
  &.warning { color: $warning; }
  &.danger { color: $danger; }
}
</style>
