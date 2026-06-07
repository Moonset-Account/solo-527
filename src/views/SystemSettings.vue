<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { Shield, Database, Download, UserCog, Info, RefreshCw, Trash2 } from 'lucide-vue-next'
import { ElSwitch, ElMessage, ElMessageBox } from 'element-plus'

const dataStore = useDataStore()
const authStore = useAuthStore()

const minSampleSize = ref(10)
const autoMaskSensitive = ref(true)
const allowExportPersonal = ref(false)
const cacheExpiryMinutes = ref(30)

function handleClearCache() {
  ElMessageBox.confirm(
    '确定要清除本地数据缓存吗？清除后需要重新加载数据。',
    '清除缓存确认',
    {
      confirmButtonText: '确定清除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    dataStore.clearCache()
    ElMessage.success('缓存已清除')
  }).catch(() => {
    // 用户取消
  })
}

function handleRefreshData() {
  dataStore.loadAllData(true)
  ElMessage.success('数据已刷新')
}

function saveSettings() {
  localStorage.setItem('privacy_settings', JSON.stringify({
    minSampleSize: minSampleSize.value,
    autoMaskSensitive: autoMaskSensitive.value,
    allowExportPersonal: allowExportPersonal.value,
    cacheExpiryMinutes: cacheExpiryMinutes.value
  }))
  ElMessage.success('设置已保存')
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h2 class="text-xl font-bold text-gray-900">系统设置</h2>
      <p class="mt-1 text-sm text-gray-500">
        隐私规则、权限控制和数据缓存配置
      </p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Shield class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">隐私规则配置</h3>
            <p class="text-xs text-gray-500">数据隐私保护相关设置</p>
          </div>
        </div>
      </div>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">低样本阈值</p>
            <p class="text-xs text-gray-500">样本量低于该值时将显示模糊提示，防止个体识别</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="minSampleSize"
              type="number"
              min="1"
              max="100"
              class="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <span class="text-sm text-gray-500">条</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">自动脱敏敏感字段</p>
            <p class="text-xs text-gray-500">姓名、手机号、身份证号等个人信息自动遮蔽</p>
          </div>
          <ElSwitch v-model="autoMaskSensitive" />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">处方数据区间化</p>
            <p class="text-xs text-gray-500">处方相关字段仅展示区间统计，不暴露具体数值</p>
          </div>
          <ElSwitch :model-value="true" disabled />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <UserCog class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">角色权限说明</h3>
            <p class="text-xs text-gray-500">不同角色的数据访问范围</p>
          </div>
        </div>
      </div>
      <div class="p-5">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2 px-3 font-medium text-gray-600">权限项</th>
              <th class="text-center py-2 px-3 font-medium text-gray-600">门店经理</th>
              <th class="text-center py-2 px-3 font-medium text-gray-600">大区运营</th>
              <th class="text-center py-2 px-3 font-medium text-gray-600">总部运营</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-50">
              <td class="py-3 px-3 text-gray-700">查看本店数据</td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="py-3 px-3 text-gray-700">查看全区域数据对比</td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="py-3 px-3 text-gray-700">导出聚合数据</td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="py-3 px-3 text-gray-700">查看个人敏感信息</td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
            </tr>
            <tr>
              <td class="py-3 px-3 text-gray-700">维护药品分类映射表</td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-gray-300">—</span></td>
              <td class="text-center py-3 px-3"><span class="text-green-600">✓</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Database class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">数据缓存管理</h3>
            <p class="text-xs text-gray-500">门店数据本地缓存设置</p>
          </div>
        </div>
      </div>
      <div class="p-5 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">缓存有效期</p>
            <p class="text-xs text-gray-500">超过该时间后自动重新加载数据</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="cacheExpiryMinutes"
              type="number"
              min="5"
              max="120"
              class="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
            <span class="text-sm text-gray-500">分钟</span>
          </div>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            @click="handleRefreshData"
          >
            <RefreshCw class="w-4 h-4" />
            立即刷新数据
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
            @click="handleClearCache"
          >
            <Trash2 class="w-4 h-4" />
            清除本地缓存
          </button>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        class="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        @click="saveSettings"
      >
        保存设置
      </button>
    </div>

    <div class="bg-amber-50 rounded-xl p-5 border border-amber-100">
      <div class="flex items-start gap-3">
        <Info class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 class="text-sm font-medium text-amber-800">合规性说明</h4>
          <p class="mt-1 text-xs text-amber-700 leading-relaxed">
            本系统严格遵循数据最小化和隐私保护原则。所有个人健康信息均经过脱敏处理，
            低样本数据自动模糊化，处方信息仅支持区间统计。数据导出需经过审批流程，
            并记录完整的审计日志。如需调整隐私策略，请联系数据合规部门。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
