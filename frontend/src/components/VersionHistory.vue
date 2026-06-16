<template>
  <div class="version-history">
    <div class="version-header">
      <span class="header-title">版本历史</span>
      <el-tag size="small" type="info">{{ versions.length }} 个版本</el-tag>
    </div>
    <el-scrollbar class="version-list">
      <div
        v-for="(version, index) in versions"
        :key="version.id || index"
        class="version-item"
        :class="{ active: activeId === version.id }"
        @click="handleSelect(version)"
      >
        <div class="version-meta">
          <el-tag :type="index === 0 ? 'success' : 'info'" size="small" effect="plain">
            {{ index === 0 ? '当前版本' : `V${versions.length - index}` }}
          </el-tag>
          <span class="version-time">{{ formatRelativeTime(version.createdAt || version.created_at) }}</span>
        </div>
        <div class="version-note" v-if="version.note || version.versionNote">
          {{ version.note || version.versionNote }}
        </div>
        <div class="version-user" v-if="version.createdBy || version.user">
          <el-icon><User /></el-icon>
          {{ version.createdBy || version.user?.name || '未知用户' }}
        </div>
        <div class="version-actions" v-if="index !== 0">
          <el-button size="small" type="primary" link @click.stop="handleRestore(version)">
            <el-icon><RefreshLeft /></el-icon>
            恢复此版本
          </el-button>
          <el-button size="small" type="primary" link @click.stop="handleView(version)">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
        </div>
      </div>
      <el-empty v-if="!versions.length" description="暂无版本记录" />
    </el-scrollbar>
  </div>
</template>

<script setup>
import { formatRelativeTime } from '@/utils/format'

const props = defineProps({
  versions: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['select', 'restore', 'view'])

function handleSelect(version) {
  emit('select', version)
}

function handleRestore(version) {
  emit('restore', version)
}

function handleView(version) {
  emit('view', version)
}
</script>

<style lang="scss" scoped>
.version-history {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  height: 100%;
  display: flex;
  flex-direction: column;

  .version-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-title {
      font-weight: 600;
      font-size: 14px;
    }
  }

  .version-list {
    flex: 1;
    padding: 8px;
  }

  .version-item {
    padding: 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
    border: 1px solid transparent;

    &:hover {
      background-color: #f5f7fa;
    }

    &.active {
      background-color: #ecf5ff;
      border-color: #409eff;
    }

    .version-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .version-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .version-note {
      font-size: 13px;
      color: #606266;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .version-user {
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .version-actions {
      display: flex;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }
  }
}
</style>
