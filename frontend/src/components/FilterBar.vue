<template>
  <div class="filter-bar">
    <div class="filter-item">
      <span class="filter-label">队员:</span>
      <el-select
        v-model="localFilters.athleteId"
        placeholder="选择队员"
        style="width: 140px"
        clearable
        @change="emitChange"
      >
        <el-option v-for="a in athletes" :key="a.id" :label="a.name" :value="a.id" />
      </el-select>
    </div>
    <div class="filter-item">
      <span class="filter-label">项目:</span>
      <el-select
        v-model="localFilters.sport"
        placeholder="选择项目"
        style="width: 120px"
        clearable
        @change="emitChange"
      >
        <el-option v-for="s in sports" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
    </div>
    <div class="filter-item">
      <span class="filter-label">训练日:</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
        @change="handleDateChange"
      />
    </div>
    <div class="filter-item" v-if="showExercise">
      <span class="filter-label">动作:</span>
      <el-select
        v-model="localFilters.exercise"
        placeholder="选择动作"
        style="width: 120px"
        clearable
        @change="emitChange"
      >
        <el-option v-for="e in exercises" :key="e.id" :label="e.name" :value="e.id" />
      </el-select>
    </div>
    <div class="filter-item" v-if="showMetric">
      <span class="filter-label">指标:</span>
      <el-select
        v-model="localFilters.metric"
        style="width: 120px"
        @change="emitChange"
      >
        <el-option label="训练负荷" value="load" />
        <el-option label="训练强度" value="intensity" />
        <el-option label="完成率" value="completionRate" />
      </el-select>
    </div>
    <div class="filter-actions" style="margin-left: auto">
      <el-button size="small" @click="resetFilters">重置</el-button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { athleteApi } from '@/api'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  showExercise: { type: Boolean, default: true },
  showMetric: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change'])

const athletes = ref([])
const sports = ref([])
const exercises = ref([])
const dateRange = ref([])

const localFilters = ref({
  athleteId: null,
  sport: null,
  exercise: null,
  metric: 'load',
  ...props.modelValue
})

watch(() => props.modelValue, (val) => {
  localFilters.value = { ...localFilters.value, ...val }
}, { deep: true })

onMounted(async () => {
  const [aRes, sRes, eRes] = await Promise.all([
    athleteApi.getList(),
    athleteApi.getSports(),
    athleteApi.getExercises()
  ])
  athletes.value = aRes.data
  sports.value = sRes.data
  exercises.value = eRes.data
})

const handleDateChange = (val) => {
  if (val && val.length === 2) {
    localFilters.value.startDate = val[0]
    localFilters.value.endDate = val[1]
  } else {
    delete localFilters.value.startDate
    delete localFilters.value.endDate
  }
  emitChange()
}

const emitChange = () => {
  emit('update:modelValue', { ...localFilters.value })
  emit('change', { ...localFilters.value })
}

const resetFilters = () => {
  localFilters.value = {
    athleteId: null,
    sport: null,
    exercise: null,
    metric: 'load'
  }
  dateRange.value = []
  emitChange()
}
</script>

<style scoped>
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  gap: 8px;
}
</style>
