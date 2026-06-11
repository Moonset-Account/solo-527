<script setup>
import { router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    technicians: Object,
})

const showModal = ref(false)
const editingTechnician = ref(null)
const deletingTechnician = ref(null)

const specialtyOptions = ['洗车', '打蜡', '抛光', '镀膜', '内饰清洁', '发动机清洗', '检测', '美容']

const form = useForm({
    name: '',
    phone: '',
    specialties: [],
    is_active: true,
})

const openCreate = () => {
    editingTechnician.value = null
    form.reset()
    form.specialties = []
    form.is_active = true
    form.clearErrors()
    showModal.value = true
}

const openEdit = (tech) => {
    editingTechnician.value = tech
    form.name = tech.name
    form.phone = tech.phone || ''
    form.specialties = tech.specialties || []
    form.is_active = tech.is_active
    form.clearErrors()
    showModal.value = true
}

const toggleSpecialty = (specialty) => {
    const index = form.specialties.indexOf(specialty)
    if (index > -1) {
        form.specialties.splice(index, 1)
    } else {
        form.specialties.push(specialty)
    }
}

const submit = () => {
    if (editingTechnician.value) {
        form.put(`/technicians/${editingTechnician.value.id}`, {
            onSuccess: () => { showModal.value = false },
        })
    } else {
        form.post('/technicians', {
            onSuccess: () => { showModal.value = false },
        })
    }
}

const confirmDelete = (tech) => {
    deletingTechnician.value = tech
}

const deleteTechnician = () => {
    router.delete(`/technicians/${deletingTechnician.value.id}`, {
        onSuccess: () => { deletingTechnician.value = null },
    })
}
</script>

<template>
    <AppLayout title="技师管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">技师管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增技师
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">姓名</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">电话</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">专长</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="tech in technicians.data" :key="tech.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-gray-900">{{ tech.name }}</td>
                                <td class="px-4 py-3">{{ tech.phone || '-' }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-wrap gap-1">
                                        <span v-for="spec in (tech.specialties || [])" :key="spec" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {{ spec }}
                                        </span>
                                        <span v-if="!tech.specialties || tech.specialties.length === 0" class="text-gray-400">-</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="tech.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                        {{ tech.is_active ? '在职' : '离职' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <button @click="openEdit(tech)" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button @click="confirmDelete(tech)" class="text-red-600 hover:text-red-800">删除</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="technicians.data.length === 0">
                                <td colspan="5" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="technicians.links && technicians.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ technicians.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in technicians.links"
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
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingTechnician ? '编辑技师' : '新增技师' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">姓名 <span class="text-red-500">*</span></label>
                    <input v-model="form.name" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    <p v-if="form.errors.name" class="mt-1 text-sm text-red-600">{{ form.errors.name }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
                    <input v-model="form.phone" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">专长</label>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="spec in specialtyOptions"
                            :key="spec"
                            type="button"
                            @click="toggleSpecialty(spec)"
                            class="px-3 py-1 text-sm rounded-full border transition-colors"
                            :class="form.specialties.includes(spec) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                        >
                            {{ spec }}
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="form.is_active" type="checkbox" id="tech_active" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                    <label for="tech_active" class="text-sm font-medium text-gray-700">在职</label>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">保存</button>
                </div>
            </form>
        </Modal>

        <Modal :show="!!deletingTechnician" @close="deletingTechnician = null">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p class="text-sm text-gray-600 mb-4">确定要删除技师「{{ deletingTechnician?.name }}」吗？</p>
            <div class="flex items-center justify-end gap-3">
                <button @click="deletingTechnician = null" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                <button @click="deleteTechnician" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">确认删除</button>
            </div>
        </Modal>
    </AppLayout>
</template>
