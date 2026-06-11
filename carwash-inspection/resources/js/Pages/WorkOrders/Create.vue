<script setup>
import { Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { ref, watch } from 'vue'

const props = defineProps({
    vehicles: Array,
    technicians: Array,
    stations: Array,
    services: Array,
    inspection_templates: Array,
})

const form = useForm({
    vehicle_id: '',
    service_item_id: '',
    technician_id: '',
    station_id: '',
    inspection_template_id: '',
    scheduled_time: '',
    notes: '',
})

const plateSearch = ref('')
const vehicleFound = ref(null)
const showNewVehicle = ref(false)

const searchVehicle = () => {
    const found = props.vehicles.find(v => v.plate_number === plateSearch.value.trim())
    if (found) {
        vehicleFound.value = found
        form.vehicle_id = found.id
        showNewVehicle.value = false
    } else {
        vehicleFound.value = null
        form.vehicle_id = ''
        showNewVehicle.value = plateSearch.value.trim().length > 0
    }
}

watch(plateSearch, () => {
    if (!plateSearch.value.trim()) {
        vehicleFound.value = null
        form.vehicle_id = ''
        showNewVehicle.value = false
    }
})

const submit = () => {
    form.post('/work-orders')
}
</script>

<template>
    <AppLayout title="创建工单">
        <div class="max-w-3xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">创建工单</h2>
                <Link href="/work-orders" class="text-gray-500 hover:text-gray-700 text-sm">返回列表</Link>
            </div>

            <form @submit.prevent="submit" class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">车辆信息</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
                            <div class="flex gap-2">
                                <input
                                    v-model="plateSearch"
                                    type="text"
                                    placeholder="输入车牌号搜索"
                                    class="flex-1 rounded-lg border-gray-300 text-sm shadow-sm"
                                    @blur="searchVehicle"
                                />
                                <button type="button" @click="searchVehicle" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">搜索</button>
                            </div>
                        </div>
                        <div v-if="vehicleFound" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                            <p>已找到车辆: <strong>{{ vehicleFound.plate_number }}</strong> - {{ vehicleFound.make }} {{ vehicleFound.model }} (车主: {{ vehicleFound.owner_name }})</p>
                        </div>
                        <div v-if="showNewVehicle" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                            <p>未找到该车牌号的车辆，请先在车辆管理中创建车辆信息</p>
                        </div>
                        <div v-if="form.vehicle_id">
                            <input type="hidden" v-model="form.vehicle_id" />
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">服务信息</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">服务项目 <span class="text-red-500">*</span></label>
                            <select v-model="form.service_item_id" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                                <option value="">请选择</option>
                                <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }} (¥{{ s.price }})</option>
                            </select>
                            <p v-if="form.errors.service_item_id" class="mt-1 text-sm text-red-600">{{ form.errors.service_item_id }}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">技师</label>
                            <select v-model="form.technician_id" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                                <option value="">请选择</option>
                                <option v-for="t in technicians" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">工位</label>
                            <select v-model="form.station_id" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                                <option value="">请选择</option>
                                <option v-for="st in stations" :key="st.id" :value="st.id">{{ st.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">检测模板</label>
                            <select v-model="form.inspection_template_id" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                                <option value="">请选择</option>
                                <option v-for="tpl in inspection_templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
                            <input v-model="form.scheduled_time" type="datetime-local" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea v-model="form.notes" rows="3" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" placeholder="输入备注信息"></textarea>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <Link href="/work-orders" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</Link>
                    <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">创建工单</button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>
