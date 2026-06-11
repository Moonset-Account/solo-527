<script setup>
import { router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    templates: Object,
})

const showModal = ref(false)
const editingTemplate = ref(null)
const deletingTemplate = ref(null)

const defaultItem = { item_name: '', category: '', required: true }

const form = useForm({
    name: '',
    category: '',
    items: [{ ...defaultItem }],
    is_active: true,
})

const openCreate = () => {
    editingTemplate.value = null
    form.reset()
    form.items = [{ ...defaultItem }]
    form.is_active = true
    form.clearErrors()
    showModal.value = true
}

const openEdit = (tpl) => {
    editingTemplate.value = tpl
    form.name = tpl.name
    form.category = tpl.category
    form.items = (tpl.items && tpl.items.length > 0) ? tpl.items.map(i => ({ ...i })) : [{ ...defaultItem }]
    form.is_active = tpl.is_active
    form.clearErrors()
    showModal.value = true
}

const addItem = () => {
    form.items.push({ ...defaultItem })
}

const removeItem = (index) => {
    form.items.splice(index, 1)
}

const submit = () => {
    if (editingTemplate.value) {
        form.put(`/inspection-templates/${editingTemplate.value.id}`, {
            onSuccess: () => { showModal.value = false },
        })
    } else {
        form.post('/inspection-templates', {
            onSuccess: () => { showModal.value = false },
        })
    }
}

const confirmDelete = (tpl) => {
    deletingTemplate.value = tpl
}

const deleteTemplate = () => {
    router.delete(`/inspection-templates/${deletingTemplate.value.id}`, {
        onSuccess: () => { deletingTemplate.value = null },
    })
}
</script>

<template>
    <AppLayout title="检测模板管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">检测模板管理</h2>
                <button @click="openCreate" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    新增模板
                </button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">名称</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">类别</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">检测项数量</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">版本</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="tpl in templates.data" :key="tpl.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-gray-900">{{ tpl.name }}</td>
                                <td class="px-4 py-3">{{ tpl.category }}</td>
                                <td class="px-4 py-3">{{ (tpl.items || []).length }}</td>
                                <td class="px-4 py-3">v{{ tpl.version }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="tpl.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                        {{ tpl.is_active ? '启用' : '停用' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <button @click="openEdit(tpl)" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button @click="confirmDelete(tpl)" class="text-red-600 hover:text-red-800">删除</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="templates.data.length === 0">
                                <td colspan="6" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="templates.links && templates.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ templates.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in templates.links"
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

        <Modal :show="showModal" @close="showModal = false" max-width="3xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingTemplate ? '编辑检测模板' : '新增检测模板' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
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
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="form.is_active" type="checkbox" id="tpl_active" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                    <label for="tpl_active" class="text-sm font-medium text-gray-700">启用</label>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-gray-700">检测项目</label>
                        <button type="button" @click="addItem" class="text-sm text-blue-600 hover:text-blue-800">+ 添加项目</button>
                    </div>
                    <div class="space-y-2">
                        <div v-for="(item, index) in form.items" :key="index" class="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <div class="flex-1 grid grid-cols-3 gap-2">
                                <input v-model="item.item_name" type="text" placeholder="项目名称" class="rounded-lg border-gray-300 text-sm shadow-sm" />
                                <input v-model="item.category" type="text" placeholder="类别" class="rounded-lg border-gray-300 text-sm shadow-sm" />
                                <div class="flex items-center gap-2">
                                    <input v-model="item.required" type="checkbox" :id="`required_${index}`" class="rounded border-gray-300 text-blue-600 shadow-sm" />
                                    <label :for="`required_${index}`" class="text-xs text-gray-600">必检</label>
                                </div>
                            </div>
                            <button type="button" @click="removeItem(index)" class="p-1 text-red-500 hover:text-red-700">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <p v-if="form.errors.items" class="mt-1 text-sm text-red-600">{{ form.errors.items }}</p>
                </div>

                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" @click="showModal = false" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                    <button type="submit" :disabled="form.processing" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">保存</button>
                </div>
            </form>
        </Modal>

        <Modal :show="!!deletingTemplate" @close="deletingTemplate = null">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p class="text-sm text-gray-600 mb-4">确定要删除模板「{{ deletingTemplate?.name }}」吗？此操作不可恢复。</p>
            <div class="flex items-center justify-end gap-3">
                <button @click="deletingTemplate = null" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">取消</button>
                <button @click="deleteTemplate" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">确认删除</button>
            </div>
        </Modal>
    </AppLayout>
</template>
