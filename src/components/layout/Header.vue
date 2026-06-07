<script setup lang="ts">
import { ref } from 'vue'
import { User, LogOut, Download, Shield } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { ElDropdown, ElMessage } from 'element-plus'
import PermissionGuard from '@/components/common/PermissionGuard.vue'

const authStore = useAuthStore()
const showExportConfirm = ref(false)

function handleExport() {
  showExportConfirm.value = true
}

function confirmExport() {
  ElMessage.success('数据导出申请已提交，请等待审核')
  showExportConfirm.value = false
}

function handleLogout() {
  authStore.logout()
  window.location.href = '/login'
}
</script>

<template>
  <header class="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold text-gray-800">{{ $route.meta.title || '药店会员复购分析系统' }}</h1>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
        <Shield class="w-4 h-4 text-blue-600" />
        <span class="text-xs font-medium text-blue-700">{{ authStore.roleName }}</span>
      </div>

      <PermissionGuard permission="canExport" fallback="">
        <button
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          @click="handleExport"
        >
          <Download class="w-4 h-4" />
          <span>导出数据</span>
        </button>
      </PermissionGuard>

      <ElDropdown>
        <button class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <User class="w-4 h-4 text-white" />
          </div>
          <span>{{ authStore.user?.name || '用户' }}</span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">
              <div class="flex items-center gap-2 text-gray-600">
                <LogOut class="w-4 h-4" />
                <span>退出登录</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </ElDropdown>
    </div>
  </header>

  <el-dialog v-model="showExportConfirm" title="数据导出确认" width="400px">
    <p class="text-gray-600">您即将导出包含会员聚合数据的报表。请注意：</p>
    <ul class="mt-3 space-y-2 text-sm text-gray-500">
      <li>• 导出数据仅包含聚合统计信息</li>
      <li>• 个人敏感信息已自动脱敏</li>
      <li>• 低样本数据将被模糊处理</li>
      <li>• 导出操作将被记录审计日志</li>
    </ul>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showExportConfirm = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </span>
    </template>
  </el-dialog>
</template>
