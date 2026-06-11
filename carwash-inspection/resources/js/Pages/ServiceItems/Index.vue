<script setup>
import { router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    items: Object,
})

const showModal = ref(false)
const editingItem = ref(null)
const deletingItem = ref(null)

const form = useForm({
    name: '',
    category: '',
    price: '',
    duration_minutes: '',
    is_active: true,
    description: '',
})

const openCreate = () => {
    editingItem.value = null
    form.reset()
    form.clearErrors()
    showModal.value = true
}

const openEdit = (item) => {
    editingItem.value = item
    form.name = item.name
    form.category = item.category
    form.price = item.price
    form.duration_minutes = item.duration_minutes
    form.is_active = item.is_active
    form.description = item.description || ''
    form.clearErrors()
    showModal.value = true
}

const submit = () => {
    if (editingItem.value) {
        form.put(`/service-items/${editingItem.value.id}`, {
            onSuccess: () => { showModal.value = false },
        })
    } else {
        form.post('/service-items', {
            onSuccess: () => { showModal.value = false },
        })
    }
}

const confirmDelete = (item) => {
    deletingItem.value = item
}

const deleteItem = () => {
    router.delete(`/service-items/${deletingItem.value.id}`, {
        onSuccess: () => { deletingItem.value = null },
    })
}
</script>

<template>
    <AppLayout title="服务项目管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">服务项目管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增服务项目
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">名称</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">类别</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">价格</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">时长(分钟)</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="item in items.data" :key="item.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-gray-900">{{ item.name }}</td>
                                <td class="px-4 py-3">{{ item.category }}</td>
                                <td class="px-4 py-3">¥{{ item.price }}</td>
                                <td class="px-4 py-3">{{ item.duration_minutes }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                        {{ item.is_active ? '启用' : '停用' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <button @click="openEdit(item)" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button @click="confirmDelete(item)" class="text-red-600 hover:text-red-800">删除</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="items.data.length === 0">
                                <td colspan="6" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="items.links && items.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ items.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in items.links"
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
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingItem ? '编辑服务项目' : '新增服务项目' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
                    <input v-model="form.name" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    <p v-if="form.errors.name" class="mt-1 text-sm text-red-600">{{ form.errors.name }}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">类别 <span class="text-red-500">*</span></label>
                    <input v-model="form.category" type="text" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    <p v-if="form.errors.category" class="mt-1 text-sm text-red-600">{{ form.errors.category }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">价格 <span class="text-red-500">*</span></label>
                        <input v-model="form.price" type="number" step="0.01" min="0" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                        <p v-if="form.errors.price" class="mt-1 text-sm text-red-600">{{ form.errors.price }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">时长(分钟)</label>
                        <input v-model="form.duration_minutes" type="number" min="0" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="form.is_active" type="checkbox" id="si_active" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                    <label for="si_active" class="text-sm font-medium text-gray-700">启用</label>
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

        <Modal :show="!!deletingItem" @close="deletingItem = null">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p class="text-sm text-gray-600 mb-4">确定要删除服务项目「{{ deletingItem?.name }}」吗？此操作不可恢复。</p>
            <div class="flex items-center justify-end gap-3">
                <button @click="deletingItem = null" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                <button @click="deleteItem" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">确认删除</button>
            </div>
        </Modal>
    </AppLayout>
</template>
