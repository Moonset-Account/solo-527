<script setup>
import { router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    stations: Object,
})

const showModal = ref(false)
const editingStation = ref(null)
const deletingStation = ref(null)

const form = useForm({
    name: '',
    station_type: '',
    is_active: true,
    description: '',
})

const openCreate = () => {
    editingStation.value = null
    form.reset()
    form.is_active = true
    form.clearErrors()
    showModal.value = true
}

const openEdit = (station) => {
    editingStation.value = station
    form.name = station.name
    form.station_type = station.station_type || ''
    form.is_active = station.is_active
    form.description = station.description || ''
    form.clearErrors()
    showModal.value = true
}

const submit = () => {
    if (editingStation.value) {
        form.put(`/work-stations/${editingStation.value.id}`, {
            onSuccess: () => { showModal.value = false },
        })
    } else {
        form.post('/work-stations', {
            onSuccess: () => { showModal.value = false },
        })
    }
}

const confirmDelete = (station) => {
    deletingStation.value = station
}

const deleteStation = () => {
    router.delete(`/work-stations/${deletingStation.value.id}`, {
        onSuccess: () => { deletingStation.value = null },
    })
}
</script>

<template>
    <AppLayout title="工位管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">工位管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增工位
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">名称</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">类型</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">当前工单</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="station in stations.data" :key="station.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-gray-900">{{ station.name }}</td>
                                <td class="px-4 py-3">{{ station.station_type || '-' }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="station.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                        {{ station.is_active ? '可用' : '停用' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <span v-if="station.current_work_order" class="text-blue-600">{{ station.current_work_order }}</span>
                                    <span v-else class="text-gray-400">空闲</span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <button @click="openEdit(station)" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button @click="confirmDelete(station)" class="text-red-600 hover:text-red-800">删除</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="stations.data.length === 0">
                                <td colspan="5" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="stations.links && stations.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ stations.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in stations.links"
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

        <Modal :show="showModal" @close="showModal = false">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingStation ? '编辑工位' : '新增工位' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
                    <input v-model="form.name" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    <p v-if="form.errors.name" class="mt-1 text-sm text-red-600">{{ form.errors.name }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <select v-model="form.station_type" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                        <option value="">请选择</option>
                        <option value="wash">洗车</option>
                        <option value="inspection">检测</option>
                        <option value="detailing">美容</option>
                        <option value="general">综合</option>
                    </select>
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="form.is_active" type="checkbox" id="st_active" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                    <label for="st_active" class="text-sm font-medium text-gray-700">可用</label>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea v-model="form.description" rows="2" class="w-full rounded-lg border-gray-300 text-sm shadow-sm"></textarea>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">保存</button>
                </div>
            </form>
        </Modal>

        <Modal :show="!!deletingStation" @close="deletingStation = null">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p class="text-sm text-gray-600 mb-4">确定要删除工位「{{ deletingStation?.name }}」吗？</p>
            <div class="flex items-center justify-end gap-3">
                <button @click="deletingStation = null" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                <button @click="deleteStation" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">确认删除</button>
            </div>
        </Modal>
    </AppLayout>
</template>
