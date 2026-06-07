<template>
  <div class="filter-bar">
    <div class="filter-section">
      <label class="filter-label">站点</label>
      <select class="filter-select" v-model="localStationId" @change="onStationChange">
        <option value="">全部站点</option>
        <option v-for="s in stations" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>
    
    <div class="filter-section">
      <label class="filter-label">故障码</label>
      <select class="filter-select" v-model="localFaultCode" @change="onFaultCodeChange">
        <option value="">全部故障码</option>
        <option v-for="f in faultCodes" :key="f.code" :value="f.code">
          {{ f.code }} - {{ f.desc }}
        </option>
      </select>
    </div>
    
    <div class="filter-section">
      <label class="filter-label">维修人</label>
      <select class="filter-select" v-model="localPersonId" @change="onPersonChange">
        <option value="">全部人员</option>
        <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.name }} ({{ p.team }})</option>
      </select>
    </div>
    
    <div class="filter-section">
      <label class="filter-label">时间范围</label>
      <select class="filter-select" v-model="timeRangePreset" @change="onTimeRangeChange">
        <option value="today">今日</option>
        <option value="3days">近3天</option>
        <option value="7days">近7天</option>
        <option value="30days">近30天</option>
      </select>
    </div>
    
    <div class="filter-actions">
      <button class="btn-reset" @click="handleReset">重置</button>
    </div>
    
    <div class="active-filters" v-if="hasActiveFilters">
      <span class="active-label">已选:</span>
      <span v-if="localStationId" class="active-tag" @click="localStationId = ''; onStationChange()">
        {{ stationName }} ×
      </span>
      <span v-if="localFaultCode" class="active-tag" @click="localFaultCode = ''; onFaultCodeChange()">
        {{ localFaultCode }} ×
      </span>
      <span v-if="localPersonId" class="active-tag" @click="localPersonId = ''; onPersonChange()">
        {{ personName }} ×
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'

const store = useDataStore()

const stations = computed(() => store.stations)
const faultCodes = computed(() => store.faultCodeMeta)
const persons = computed(() => store.repairPersons)

const localStationId = ref('')
const localFaultCode = ref('')
const localPersonId = ref('')
const timeRangePreset = ref('7days')

const hasActiveFilters = computed(() => {
  return localStationId.value || localFaultCode.value || localPersonId.value
})

const stationName = computed(() => {
  const s = stations.value.find(x => x.id === localStationId.value)
  return s ? s.name : ''
})

const personName = computed(() => {
  const p = persons.value.find(x => x.id === localPersonId.value)
  return p ? p.name : ''
})

watch(() => store.filters.stationIds, (val) => {
  localStationId.value = val.length > 0 ? val[0] : ''
}, { immediate: true })

watch(() => store.filters.faultCodes, (val) => {
  localFaultCode.value = val.length > 0 ? val[0] : ''
}, { immediate: true })

watch(() => store.filters.repairPersonIds, (val) => {
  localPersonId.value = val.length > 0 ? val[0] : ''
}, { immediate: true })

function onStationChange() {
  store.setFilter('stationIds', localStationId.value ? [localStationId.value] : [])
}

function onFaultCodeChange() {
  store.setFilter('faultCodes', localFaultCode.value ? [localFaultCode.value] : [])
}

function onPersonChange() {
  store.setFilter('repairPersonIds', localPersonId.value ? [localPersonId.value] : [])
}

function onTimeRangeChange() {
  const now = new Date()
  let start
  
  switch (timeRangePreset.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case '3days':
      start = new Date(now.getTime() - 3 * 86400000)
      break
    case '7days':
      start = new Date(now.getTime() - 7 * 86400000)
      break
    case '30days':
      start = new Date(now.getTime() - 30 * 86400000)
      break
  }
  
  store.setFilter('timeRange', [start.toISOString(), now.toISOString()])
}

function handleReset() {
  localStationId.value = ''
  localFaultCode.value = ''
  localPersonId.value = ''
  timeRangePreset.value = '7days'
  store.resetFilters()
}
</script>

<style lang="scss" scoped>
.filter-bar {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
}

.filter-select {
  background: $bg-dark;
  border: 1px solid $border-color;
  color: $text-primary;
  padding: 8px 12px;
  border-radius: $radius-md;
  font-size: 13px;
  min-width: 160px;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    border-color: $primary;
  }
  
  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.2);
  }
}

.filter-actions {
  margin-left: auto;
}

.btn-reset {
  background: transparent;
  border: 1px solid $border-color;
  color: $text-secondary;
  padding: 8px 16px;
  border-radius: $radius-md;
  font-size: 13px;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    border-color: $primary;
    color: $primary;
    background: rgba(22, 93, 255, 0.1);
  }
}

.active-filters {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 4px;
}

.active-label {
  font-size: 12px;
  color: $text-muted;
}

.active-tag {
  font-size: 12px;
  color: $primary;
  background: rgba(22, 93, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    background: rgba(22, 93, 255, 0.2);
  }
}
</style>
