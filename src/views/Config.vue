<script setup lang="ts">
import { ref } from 'vue'
import { mockDevices, mockTenants, mockFloors, mockBuildings } from '@/mock'
import { Upload, Calendar, Building2, Users, Zap, Droplets, Wind, Settings as SettingsIcon } from 'lucide-vue-next'
import { formatDateTime } from '@/utils'

const activeTab = ref('devices')

const tabs = [
  { value: 'devices', label: '设备管理', icon: Zap },
  { value: 'tenants', label: '租户管理', icon: Users },
  { value: 'floors', label: '楼栋楼层', icon: Building2 },
  { value: 'holidays', label: '节假日模式', icon: Calendar },
  { value: 'import', label: '数据导入', icon: Upload }
]

const uploadFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isUploading = ref(false)

const holidayMode = ref({
  workdayStart: '08:00',
  workdayEnd: '18:00',
  weekendReduction: 30,
  holidayReduction: 50
})

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0]
  }
}

function startUpload() {
  if (!uploadFile.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  
  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      isUploading.value = false
    }
  }, 300)
}
</script>

<template>
  <div class="space-y-6">
    <div class="card p-1">
      <div class="flex flex-wrap gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm"
          :class="activeTab === tab.value
            ? 'bg-brand-600 text-white'
            : 'text-slate-400 hover:text-slate-200 hover:bg-bg-tertiary/50'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'devices'" class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-white">设备列表</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-400">共 {{ mockDevices.length }} 台设备</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>设备名称</th>
              <th>设备类型</th>
              <th>安装位置</th>
              <th>状态</th>
              <th>最后在线时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in mockDevices" :key="device.id">
              <td class="font-medium">{{ device.name }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <component
                    :is="device.type === 'electricity' ? Zap : device.type === 'water' ? Droplets : Wind"
                    class="w-4 h-4"
                    :class="{
                      'text-chart-electricity': device.type === 'electricity',
                      'text-chart-water': device.type === 'water',
                      'text-chart-hvac': device.type === 'hvac'
                    }"
                  />
                  <span class="text-sm">
                    {{ device.type === 'electricity' ? '电表' : device.type === 'water' ? '水表' : '空调' }}
                  </span>
                </div>
              </td>
              <td class="text-slate-300">{{ device.location }}</td>
              <td>
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-status-success/20 text-status-success': device.status === 'online',
                    'bg-status-warning/20 text-status-warning': device.status === 'warning',
                    'bg-status-danger/20 text-status-danger': device.status === 'offline'
                  }"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="{
                      'bg-status-success animate-pulse': device.status === 'online',
                      'bg-status-warning': device.status === 'warning',
                      'bg-status-danger': device.status === 'offline'
                    }"
                  ></span>
                  {{ device.status === 'online' ? '在线' : device.status === 'warning' ? '异常' : '离线' }}
                </span>
              </td>
              <td class="font-mono text-sm text-slate-400">{{ formatDateTime(device.lastOnline) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'tenants'" class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-white">租户列表</h3>
        <span class="text-sm text-slate-400">共 {{ mockTenants.length }} 家租户</span>
      </div>

      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>租户名称</th>
              <th>所在楼层</th>
              <th>租赁面积</th>
              <th>员工人数</th>
              <th>联系方式</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in mockTenants" :key="tenant.id">
              <td class="font-medium">{{ tenant.name }}</td>
              <td>{{ tenant.floorId.replace('flr-00', '') }}F</td>
              <td class="font-mono">{{ tenant.area }} ㎡</td>
              <td class="font-mono">{{ tenant.peopleCount }} 人</td>
              <td class="text-slate-300">{{ tenant.contact }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'floors'" class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-white">楼栋楼层信息</h3>
      </div>

      <div class="mb-6">
        <h4 class="text-sm font-medium text-slate-300 mb-3">楼栋信息</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="building in mockBuildings" :key="building.id" class="p-4 bg-bg-tertiary/30 rounded-lg">
            <div class="flex items-center gap-3 mb-2">
              <Building2 class="w-5 h-5 text-brand-400" />
              <span class="font-medium text-white">{{ building.name }}</span>
            </div>
            <p class="text-sm text-slate-400">总建筑面积: {{ building.totalArea.toLocaleString() }} ㎡</p>
            <p class="text-sm text-slate-400">楼层数: {{ mockFloors.length }} 层</p>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-slate-300 mb-3">楼层列表</h4>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>楼层</th>
                <th>楼层名称</th>
                <th>建筑面积</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="floor in mockFloors" :key="floor.id">
                <td class="font-mono font-medium">{{ floor.floorNumber }}F</td>
                <td class="font-medium">{{ floor.name }}</td>
                <td class="font-mono">{{ floor.area }} ㎡</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'holidays'" class="card p-5">
      <h3 class="font-medium text-white mb-4">节假日模式配置</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">工作日开始时间</label>
            <input
              v-model="holidayMode.workdayStart"
              type="time"
              class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">工作日结束时间</label>
            <input
              v-model="holidayMode.workdayEnd"
              type="time"
              class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">周末能耗降低比例</label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="holidayMode.weekendReduction"
                type="range"
                min="0"
                max="80"
                class="flex-1"
              />
              <span class="font-mono text-brand-400 w-12 text-right">{{ holidayMode.weekendReduction }}%</span>
            </div>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">节假日能耗降低比例</label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="holidayMode.holidayReduction"
                type="range"
                min="0"
                max="100"
                class="flex-1"
              />
              <span class="font-mono text-brand-400 w-12 text-right">{{ holidayMode.holidayReduction }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 p-4 bg-brand-600/10 border border-brand-500/20 rounded-lg">
        <p class="text-sm text-brand-300">
          <strong>配置说明：</strong>节假日模式下，系统将根据配置自动调整公共区域空调、照明等设备的运行策略，
          实现节能降耗。工作日时段按正常模式运行，非工作日时段按设定比例降低能耗。
        </p>
      </div>
    </div>

    <div v-if="activeTab === 'import'" class="card p-5">
      <h3 class="font-medium text-white mb-4">数据导入</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-brand-500 transition-colors">
          <Upload class="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p class="text-slate-300 mb-2">拖拽文件到此处或点击上传</p>
          <p class="text-xs text-slate-500 mb-4">支持 Excel、CSV 格式，单次最多导入 10000 条</p>
          <label class="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleFileUpload"
            />
            <span class="btn-primary cursor-pointer">选择文件</span>
          </label>
        </div>

        <div class="space-y-4">
          <div v-if="uploadFile" class="p-4 bg-bg-tertiary/30 rounded-lg">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-slate-300">{{ uploadFile.name }}</span>
              <span class="text-xs text-slate-500">{{ (uploadFile.size / 1024).toFixed(1) }} KB</span>
            </div>
            <div v-if="isUploading" class="space-y-2">
              <div class="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  class="h-full bg-brand-500 rounded-full transition-all duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
              <p class="text-xs text-slate-400">导入中... {{ uploadProgress }}%</p>
            </div>
            <button
              v-else
              @click="startUpload"
              class="btn-primary w-full"
            >
              开始导入
            </button>
          </div>

          <div class="p-4 bg-bg-tertiary/30 rounded-lg">
            <h4 class="text-sm font-medium text-slate-300 mb-2">导入说明</h4>
            <ul class="text-xs text-slate-500 space-y-1">
              <li>• 电表、水表数据需包含：设备编号、时间戳、读数</li>
              <li>• 设备离线数据需标记质量字段，系统会自动排除</li>
              <li>• 导入数据将自动进行数据质量校验</li>
              <li>• 重复数据将自动去重</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
