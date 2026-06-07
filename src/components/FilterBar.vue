<template>
  <div class="filter-bar card-shadow">
    <div class="filter-title">
      <el-icon><Filter /></el-icon>
      <span>筛选条件</span>
    </div>
    
    <div class="filter-items">
      <div class="filter-item">
        <label>营期</label>
        <el-select
          v-model="localFilters.sessionId"
          placeholder="选择营期"
          clearable
          @change="handleFilterChange('sessionId', localFilters.sessionId)"
          style="width: 200px"
        >
          <el-option label="全部营期" value="all" />
          <el-option
            v-for="session in CAMP_SESSIONS"
            :key="session.id"
            :label="session.name"
            :value="session.id"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label>项目</label>
        <el-select
          v-model="localFilters.projectId"
          placeholder="选择项目"
          clearable
          @change="handleFilterChange('projectId', localFilters.projectId)"
          style="width: 150px"
        >
          <el-option label="全部项目" value="all" />
          <el-option
            v-for="project in SPORTS_PROJECTS"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label>年龄段</label>
        <el-select
          v-model="localFilters.ageGroupId"
          placeholder="选择年龄段"
          clearable
          @change="handleFilterChange('ageGroupId', localFilters.ageGroupId)"
          style="width: 150px"
        >
          <el-option label="全部年龄段" value="all" />
          <el-option
            v-for="age in AGE_GROUPS"
            :key="age.id"
            :label="age.name"
            :value="age.id"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <label>教练</label>
        <el-select
          v-model="localFilters.coachId"
          placeholder="选择教练"
          clearable
          @change="handleFilterChange('coachId', localFilters.coachId)"
          style="width: 150px"
        >
          <el-option label="全部教练" value="all" />
          <el-option
            v-for="coach in COACHES"
            :key="coach.id"
            :label="`${coach.name} (${coach.specialty})`"
            :value="coach.id"
          />
        </el-select>
      </div>
    </div>

    <div class="filter-actions">
      <el-button size="small" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CAMP_SESSIONS, SPORTS_PROJECTS, AGE_GROUPS, COACHES } from '@/data/constants'
import { useDashboardStore } from '@/store/useDashboardStore'

const { filters, setFilter, resetFilters } = useDashboardStore()

const localFilters = ref({
  sessionId: 'all',
  projectId: 'all',
  ageGroupId: 'all',
  coachId: 'all'
})

const emit = defineEmits(['filter-change'])

onMounted(() => {
  Object.assign(localFilters.value, filters)
})

watch(
  () => ({ ...filters }),
  (newFilters) => {
    Object.assign(localFilters.value, newFilters)
  },
  { deep: true }
)

const handleFilterChange = (key, value) => {
  const finalValue = value || 'all'
  localFilters.value[key] = finalValue
  setFilter(key, finalValue)
  emit('filter-change', { ...localFilters.value })
}

const handleReset = () => {
  resetFilters()
  emit('filter-change', { ...localFilters.value })
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.filter-items {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 13px;
    color: #606266;
    white-space: nowrap;
  }
}

.filter-actions {
  margin-left: auto;
}
</style>
