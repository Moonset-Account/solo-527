<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    vehicles: Object,
    filters: Object,
})

const searchForm = useForm({
    search: props.filters.search || '',
})

const showModal = ref(false)
const editingVehicle = ref(null)

const form = useForm({
    plate_number: '',
    make: '',
    model: '',
    year: '',
    color: '',
    owner_name: '',
    owner_phone: '',
    notes: '',
})

const search = () => {
    searchForm.get('/vehicles', { preserveState: true, preserveScroll: true })
}

const openCreate = () => {
    editingVehicle.value = null
    form.reset()
    form.clearErrors()
    showModal.value = true
}

const openEdit = (vehicle) => {
    editingVehicle.value = vehicle
    form.plate_number = vehicle.plate_number
    form.make = vehicle.make || ''
    form.model = vehicle.model || ''
    form.year = vehicle.year || ''
    form.color = vehicle.color || ''
    form.owner_name = vehicle.owner_name || ''
    form.owner_phone = vehicle.owner_phone || ''
    form.notes = vehicle.notes || ''
    form.clearErrors()
    showModal.value = true
}

const submit = () => {
    if (editingVehicle.value) {
        form.put(`/vehicles/${editingVehicle.value.id}`, {
            onSuccess: () => { showModal.value = false },
        })
    } else {
        form.post('/vehicles', {
            onSuccess: () => { showModal.value = false },
        })
    }
}
</script>

<template>
    <AppLayout title="车辆管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">车辆管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增车辆
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="flex gap-3">
                    <input v-model="searchForm.search" type="text" placeholder="搜索车牌号或联系电话" class="flex-1 rounded-lg border-gray-300 text-sm shadow-sm" @keyup.enter="search" />
                    <button @click="search" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">搜索</button>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车牌号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">品牌</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">型号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">颜色</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车主</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">联系电话</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">工单数</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="vehicle in vehicles.data" :key="vehicle.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-blue-600">
                                    <Link :href="`/vehicles/${vehicle.id}`">{{ vehicle.plate_number }}</Link>
                                </td>
                                <td class="px-4 py-3">{{ vehicle.make || '-' }}</td>
                                <td class="px-4 py-3">{{ vehicle.model || '-' }}</td>
                                <td class="px-4 py-3">{{ vehicle.color || '-' }}</td>
                                <td class="px-4 py-3">{{ vehicle.owner_name || '-' }}</td>
                                <td class="px-4 py-3">{{ vehicle.owner_phone || '-' }}</td>
                                <td class="px-4 py-3">{{ vehicle.work_orders_count ?? (vehicle.workOrders || []).length }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <Link :href="`/vehicles/${vehicle.id}`" class="text-blue-600 hover:text-blue-800">查看</Link>
                                        <button @click="openEdit(vehicle)" class="text-indigo-600 hover:text-indigo-800">编辑</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="vehicles.data.length === 0">
                                <td colspan="8" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="vehicles.links && vehicles.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ vehicles.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in vehicles.links"
                            :key="link.label"
                            :href="link.url || '#'"
                            :class="[link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', !link.url ? 'pointer-events-none opacity-50' : '', 'px-3 py-1 text-sm rounded border border-gray-300']"
                            v-html="link.label"
                            @click.prevent="link.url && router.visit(link.url)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <Modal :show="showModal" @close="showModal = false" max-width="2xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingVehicle ? '编辑车辆' : '新增车辆' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">车牌号 <span class="text-red-500">*</span></label>
                        <input v-model="form.plate_number" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        <p v-if="form.errors.plate_number" class="mt-1 text-sm text-red-600">{{ form.errors.plate_number }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                        <input v-model="form.color" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                        <input v-model="form.make" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">型号</label>
                        <input v-model="form.model" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">年份</label>
                        <input v-model="form.year" type="number" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">车主 <span class="text-red-500">*</span></label>
                        <input v-model="form.owner_name" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        <p v-if="form.errors.owner_name" class="mt-1 text-sm text-red-600">{{ form.errors.owner_name }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 <span class="text-red-500">*</span></label>
                        <input v-model="form.owner_phone" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        <p v-if="form.errors.owner_phone" class="mt-1 text-sm text-red-600">{{ form.errors.owner_phone }}</p>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border-gray-300 text-sm shadow-sm"></textarea>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">保存</button>
                </div>
            </form>
        </Modal>
    </AppLayout>
</template>
