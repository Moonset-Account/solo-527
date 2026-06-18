<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'
import Select from '../../Components/Select.vue'
import Input from '../../Components/Input.vue'

const page = usePage()

const environmentData = computed(() => page.props.environmentData || [])
const greenhouses = computed(() => page.props.greenhouses || [])

const greenhouseFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const anomalyFilter = ref('')

const greenhouseOptions = computed(() => [
    { value: '', label: '全部大棚' },
    ...greenhouses.value.map((g) => ({ value: g.id, label: g.name })),
])

const anomalyOptions = [
    { value: '', label: '全部数据' },
    { value: '1', label: '仅异常' },
    { value: '0', label: '仅正常' },
]

const filteredData = computed(() => {
    return environmentData.value.filter((item) => {
        if (greenhouseFilter.value && String(item.greenhouse_id) !== String(greenhouseFilter.value)) return false
        if (anomalyFilter.value !== '' && String(item.is_anomaly) !== anomalyFilter.value) return false
        if (dateFrom.value && item.recorded_at < dateFrom.value) return false
        if (dateTo.value && item.recorded_at > dateTo.value) return false
        return true
    })
})

const columns = [
    { key: 'greenhouse_name', label: '大棚' },
    { key: 'temperature', label: '温度(°C)' },
    { key: 'humidity', label: '湿度(%)' },
    { key: 'soil_moisture', label: '土壤水分(%)' },
    { key: 'light', label: '光照(lux)' },
    { key: 'is_anomaly', label: '状态' },
    { key: 'recorded_at', label: '记录时间' },
]

const getValueStatus = (value, min, max) => {
    if (value < min || value > max) return 'danger'
    return 'normal'
}
</script>

<template>
    <AppLayout title="环境数据">
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex flex-wrap gap-3">
                    <Select v-model="greenhouseFilter" :options="greenhouseOptions" class="sm:w-44" />
                    <Input v-model="dateFrom" type="date" class="sm:w-40" placeholder="开始日期" />
                    <Input v-model="dateTo" type="date" class="sm:w-40" placeholder="结束日期" />
                    <Select v-model="anomalyFilter" :options="anomalyOptions" class="sm:w-36" />
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="secondary" @click="router.visit('/environment/dashboard')">
                        <ChartBarIcon class="w-5 h-5 mr-2" />
                        监控看板
                    </Button>
                    <Button variant="outline">
                        <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
                        导出
                    </Button>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="filteredData"
                    searchable
                    search-placeholder="搜索大棚名称..."
                    :per-page="20"
                >
                    <template #cell-temperature="{ value }">
                        <span :class="value > 30 || value < 15 ? 'text-danger font-medium' : ''">
                            {{ value }}°C
                        </span>
                    </template>
                    <template #cell-humidity="{ value }">
                        <span :class="value > 85 || value < 40 ? 'text-danger font-medium' : ''">
                            {{ value }}%
                        </span>
                    </template>
                    <template #cell-soil_moisture="{ value }">
                        <span :class="value > 80 || value < 30 ? 'text-danger font-medium' : ''">
                            {{ value }}%
                        </span>
                    </template>
                    <template #cell-is_anomaly="{ row }">
                        <StatusBadge v-if="row.is_anomaly" color="red" dot>异常</StatusBadge>
                        <StatusBadge v-else color="green" dot>正常</StatusBadge>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
