<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { mockDevices, mockTenants, mockFloors, mockBuildings } from '@/mock'
import { useEnergyStore } from '@/stores/energy'
import { useAllocationStore } from '@/stores/allocation'
import { Upload, Calendar, Building2, Users, Zap, Droplets, Wind, Settings as SettingsIcon, CheckCircle } from 'lucide-vue-next'
import { formatDateTime, getTenantUsage } from '@/utils'
import type { EnergyReading, Device, Tenant, Floor, HolidayMode } from '@/types'
import { ElMessage } from 'element-plus'

const energyStore = useEnergyStore()
const allocationStore = useAllocationStore()

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
const importResult = ref<{ readings: number; devices: number; tenants: number; floors: number; holiday: boolean } | null>(null)

const holidayMode = ref<HolidayMode>({
  workdayStart: energyStore.holidayMode.workdayStart,
  workdayEnd: energyStore.holidayMode.workdayEnd,
  weekendReduction: energyStore.holidayMode.weekendReduction,
  holidayReduction: energyStore.holidayMode.holidayReduction
})

function saveHolidayMode() {
  energyStore.updateHolidayMode(holidayMode.value)
  ElMessage.success('节假日模式配置已保存')
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0]
    importResult.value = null
  }
}

function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const data: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]
    })
    data.push(row)
  }
  
  return data
}

async function parseEnergyReadings(data: any[]): Promise<EnergyReading[]> {
  const readings: EnergyReading[] = []
  const now = new Date()
  
  data.forEach((row, idx) => {
    const deviceId = row['设备编号'] || row['device_id'] || row['deviceid'] || `dev-import-${idx}`
    const timestamp = row['时间'] || row['timestamp'] || row['time'] || new Date(now.getTime() - idx * 3600000).toISOString()
    const value = parseFloat(row['读数'] || row['value'] || row['reading'] || '0')
    const isOffline = (row['是否离线'] || row['is_offline'] || row['offline'] || 'false') === 'true' ||
                      (row['质量'] || row['quality'] || '') === 'bad'
    
    readings.push({
      id: `import-${Date.now()}-${idx}`,
      deviceId,
      timestamp: new Date(timestamp).toISOString(),
      value: isNaN(value) ? 0 : value,
      quality: isOffline ? 'bad' : 'good',
      isOffline
    })
  })
  
  return readings
}

async function parseDevices(data: any[]): Promise<Device[]> {
  const devices: Device[] = []
  
  data.forEach((row, idx) => {
    const type = (row['类型'] || row['type'] || 'electricity').toLowerCase() as Device['type']
    devices.push({
      id: row['编号'] || row['id'] || `dev-new-${idx}`,
      floorId: row['楼层'] || row['floor_id'] || 'flr-001',
      type: ['electricity', 'water', 'hvac'].includes(type) ? type : 'electricity',
      name: row['名称'] || row['name'] || `导入设备${idx + 1}`,
      status: (row['状态'] || row['status'] || 'online') as Device['status'],
      lastOnline: row['最后在线'] || row['last_online'] || new Date().toISOString(),
      location: row['位置'] || row['location'] || '已导入'
    })
  })
  
  return devices
}

async function parseTenants(data: any[]): Promise<Tenant[]> {
  const tenants: Tenant[] = []
  
  data.forEach((row, idx) => {
    tenants.push({
      id: row['编号'] || row['id'] || `ten-new-${idx}`,
      floorId: row['楼层编号'] || row['楼层'] || row['floor_id'] || 'flr-001',
      name: row['名称'] || row['name'] || `导入租户${idx + 1}`,
      area: parseFloat(row['面积'] || row['area'] || '100'),
      peopleCount: parseInt(row['人数'] || row['people_count'] || '10'),
      contact: row['联系人'] || row['contact'] || ''
    })
  })
  
  return tenants
}

async function parseFloors(data: any[]): Promise<Floor[]> {
  const floors: Floor[] = []
  
  data.forEach((row, idx) => {
    floors.push({
      id: row['编号'] || row['id'] || `flr-new-${idx}`,
      buildingId: row['楼栋'] || row['building_id'] || 'bld-001',
      floorNumber: parseInt(row['楼层号'] || row['floor_number'] || row['楼层'] || (idx + 1).toString()),
      name: row['名称'] || row['name'] || `${idx + 1}F`,
      area: parseFloat(row['面积'] || row['area'] || '1000')
    })
  })
  
  return floors
}

async function parseHolidayMode(data: any[]): Promise<HolidayMode | null> {
  if (data.length === 0) return null
  
  const row = data[0]
  return {
    workdayStart: row['工作日开始'] || row['workday_start'] || '08:00',
    workdayEnd: row['工作日结束'] || row['workday_end'] || '18:00',
    weekendReduction: parseInt(row['周末降低比例'] || row['weekend_reduction'] || '30'),
    holidayReduction: parseInt(row['节假日降低比例'] || row['holiday_reduction'] || '50')
  }
}

async function startUpload() {
  if (!uploadFile.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  importResult.value = null
  
  try {
    const text = await uploadFile.value.text()
    uploadProgress.value = 30
    await nextTick()
    
    const parsedData = parseCSV(text)
    uploadProgress.value = 50
    await nextTick()
    
    if (parsedData.length === 0) {
      throw new Error('文件内容为空或格式不正确')
    }
    
    const headerKeys = Object.keys(parsedData[0]).map(k => k.toLowerCase())
    let readingsCount = 0
    let devicesCount = 0
    let tenantsCount = 0
    let floorsCount = 0
    let holidayImported = false
    
    if (headerKeys.some(k => k.includes('读数') || k.includes('value') || k.includes('reading'))) {
      const readings = await parseEnergyReadings(parsedData)
      energyStore.importReadings(readings)
      readingsCount = readings.length
    }
    uploadProgress.value = 55
    await nextTick()
    
    if (headerKeys.some(k => k.includes('楼层号') || k.includes('floor_number')) &&
        headerKeys.some(k => k.includes('面积') || k.includes('area')) &&
        !headerKeys.some(k => k.includes('工作日') || k.includes('workday'))) {
      const floors = await parseFloors(parsedData)
      energyStore.importFloors(floors)
      floorsCount = floors.length
    }
    uploadProgress.value = 65
    await nextTick()
    
    if (headerKeys.some(k => k.includes('名称') || k.includes('name')) && 
        headerKeys.some(k => k.includes('类型') || k.includes('type')) &&
        !headerKeys.some(k => k.includes('面积') || k.includes('area')) &&
        !headerKeys.some(k => k.includes('人数') || k.includes('people')) &&
        !headerKeys.some(k => k.includes('工作日') || k.includes('workday'))) {
      const devices = await parseDevices(parsedData)
      energyStore.importDevices(devices)
      devicesCount = devices.length
    }
    uploadProgress.value = 75
    await nextTick()
    
    if (headerKeys.some(k => k.includes('面积') || k.includes('area')) && 
        (headerKeys.some(k => k.includes('人数') || k.includes('people')) ||
         headerKeys.some(k => k.includes('联系人') || k.includes('contact'))) &&
        !headerKeys.some(k => k.includes('工作日') || k.includes('workday'))) {
      const tenants = await parseTenants(parsedData)
      energyStore.importTenants(tenants)
      tenantsCount = tenants.length
    }
    uploadProgress.value = 85
    await nextTick()
    
    if (headerKeys.some(k => k.includes('工作日') || k.includes('workday')) ||
        headerKeys.some(k => k.includes('周末') || k.includes('weekend')) ||
        headerKeys.some(k => k.includes('节假日') || k.includes('holiday'))) {
      const holiday = await parseHolidayMode(parsedData)
      if (holiday) {
        energyStore.updateHolidayMode(holiday)
        holidayMode.value = { ...holiday }
        holidayImported = true
      }
    }
    uploadProgress.value = 100
    await nextTick()
    
    importResult.value = { readings: readingsCount, devices: devicesCount, tenants: tenantsCount, floors: floorsCount, holiday: holidayImported }
    
    const totalImported = readingsCount + devicesCount + tenantsCount + floorsCount + (holidayImported ? 1 : 0)
    if (totalImported > 0) {
      ElMessage.success(`成功导入 ${totalImported} 项数据`)
    } else {
      ElMessage.warning('未识别到可导入的数据，请检查文件格式')
    }
    
  } catch (error) {
    console.error('Import error:', error)
    ElMessage.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    setTimeout(() => {
      isUploading.value = false
    }, 500)
  }
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
          <span class="text-sm text-slate-400">共 {{ energyStore.devices.length }} 台设备</span>
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
            <tr v-for="device in energyStore.devices" :key="device.id">
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
        <span class="text-sm text-slate-400">共 {{ energyStore.tenants.length }} 家租户</span>
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
            <tr v-for="tenant in energyStore.tenants" :key="tenant.id">
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
          <div v-for="building in energyStore.buildings" :key="building.id" class="p-4 bg-bg-tertiary/30 rounded-lg">
            <div class="flex items-center gap-3 mb-2">
              <Building2 class="w-5 h-5 text-brand-400" />
              <span class="font-medium text-white">{{ building.name }}</span>
            </div>
            <p class="text-sm text-slate-400">总建筑面积: {{ building.totalArea.toLocaleString() }} ㎡</p>
            <p class="text-sm text-slate-400">楼层数: {{ energyStore.floors.length }} 层</p>
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
              <tr v-for="floor in energyStore.floors" :key="floor.id">
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

      <div class="mt-6">
        <button @click="saveHolidayMode" class="btn-primary">
          保存节假日配置
        </button>
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
            <div v-else-if="importResult" class="space-y-2">
              <div class="flex items-center gap-2 text-status-success">
                <CheckCircle class="w-5 h-5" />
                <span class="text-sm font-medium">导入完成</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                <div v-if="importResult.readings > 0" class="text-center p-2 bg-brand-500/10 rounded">
                  <div class="text-lg font-mono font-bold text-brand-400">{{ importResult.readings }}</div>
                  <div class="text-xs text-slate-400">条读数</div>
                </div>
                <div v-if="importResult.devices > 0" class="text-center p-2 bg-status-success/10 rounded">
                  <div class="text-lg font-mono font-bold text-status-success">{{ importResult.devices }}</div>
                  <div class="text-xs text-slate-400">台设备</div>
                </div>
                <div v-if="importResult.floors > 0" class="text-center p-2 bg-status-warning/10 rounded">
                  <div class="text-lg font-mono font-bold text-status-warning">{{ importResult.floors }}</div>
                  <div class="text-xs text-slate-400">层楼</div>
                </div>
                <div v-if="importResult.tenants > 0" class="text-center p-2 bg-status-info/10 rounded">
                  <div class="text-lg font-mono font-bold text-status-info">{{ importResult.tenants }}</div>
                  <div class="text-xs text-slate-400">个租户</div>
                </div>
                <div v-if="importResult.holiday" class="text-center p-2 bg-status-danger/10 rounded">
                  <div class="text-lg font-mono font-bold text-status-danger">✓</div>
                  <div class="text-xs text-slate-400">节假日</div>
                </div>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                数据已同步至看板，可返回首页查看效果
              </p>
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
