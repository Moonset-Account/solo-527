<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { computed, ref } from 'vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const flows = computed(() => page.props.flows?.data || []);
const pagination = computed(() => page.props.flows || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingFlow = ref(null);

const columns = [
    { key: 'name', label: '流程名称' },
    { key: 'type', label: '流程类型', slot: 'type' },
    { key: 'levels', label: '审批层级', slot: 'levels' },
    { key: 'is_active', label: '状态', slot: 'is_active' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const typeOptions = [
    { value: 'purchase', label: '采购申请' },
    { value: 'quotation', label: '报价审批' },
    { value: 'payment', label: '付款审批' },
    { value: 'delivery', label: '到货确认' },
];

const newFlow = ref({
    name: '',
    type: '',
    levels: [
        { level: 1, role: '', approver_name: '', required: true },
    ],
});

const addLevel = () => {
    const nextLevel = newFlow.value.levels.length + 1;
    newFlow.value.levels.push({
        level: nextLevel,
        role: '',
        approver_name: '',
        required: true,
    });
};

const removeLevel = (index) => {
    if (newFlow.value.levels.length > 1) {
        newFlow.value.levels.splice(index, 1);
        newFlow.value.levels.forEach((l, i) => {
            l.level = i + 1;
        });
    }
};

const openEditModal = (flow) => {
    editingFlow.value = flow;
    showEditModal.value = true;
};

const saveFlow = () => {
    router.post(route('approval-flows.store'), newFlow.value, {
        onSuccess: () => {
            toast.success('审批流程创建成功');
            showCreateModal.value = false;
            newFlow.value = {
                name: '',
                type: '',
                levels: [{ level: 1, role: '', approver_name: '', required: true }],
            };
        },
        onError: () => {
            toast.error('创建失败，请检查表单');
        },
    });
};

const updateFlow = () => {
    router.put(route('approval-flows.update', editingFlow.value.id), editingFlow.value, {
        onSuccess: () => {
            toast.success('审批流程更新成功');
            showEditModal.value = false;
        },
        onError: () => {
            toast.error('更新失败，请检查表单');
        },
    });
};

const toggleActive = (flow) => {
    router.put(route('approval-flows.toggle', flow.id), {}, {
        onSuccess: () => {
            toast.success('状态更新成功');
        },
    });
};
</script>

<template>
    <Head title="审批流程配置" />

    <AdminLayout>
        <div class="py-6">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">审批流程配置</h1>
                    <Button variant="primary" @click="showCreateModal = true">
                        新增审批流程
                    </Button>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="flows">
                            <template #type="{ row }">
                                <Badge type="primary">{{ row.type }}</Badge>
                            </template>
                            <template #levels="{ row }">
                                <div class="flex items-center space-x-1">
                                    <template v-for="(level, index) in row.levels || []" :key="index">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                            L{{ level.level }}: {{ level.role }}
                                        </span>
                                        <span v-if="index < row.levels.length - 1" class="text-gray-400">→</span>
                                    </template>
                                </div>
                            </template>
                            <template #is_active="{ row }">
                                <Badge :type="row.is_active ? 'success' : 'default'">
                                    {{ row.is_active ? '启用' : '停用' }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <button
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="openEditModal(row)"
                                    >
                                        编辑
                                    </button>
                                    <button
                                        :class="row.is_active ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'"
                                        @click="toggleActive(row)"
                                    >
                                        {{ row.is_active ? '停用' : '启用' }}
                                    </button>
                                </div>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                    />
                </div>

                <Modal
                    v-model:show="showCreateModal"
                    title="新增审批流程"
                    size="lg"
                >
                    <div class="space-y-4">
                        <Input
                            v-model="newFlow.name"
                            label="流程名称"
                            placeholder="请输入流程名称"
                            required
                        />
                        <Select
                            v-model="newFlow.type"
                            label="流程类型"
                            :options="typeOptions"
                            required
                        />

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                审批层级
                            </label>
                            <div class="space-y-3">
                                <div v-for="(level, index) in newFlow.levels" :key="index" class="flex items-end gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="w-16">
                                        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">层级</label>
                                        <div class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm">
                                            L{{ level.level }}
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <Input
                                            v-model="level.role"
                                            label="角色"
                                            placeholder="如：部门经理"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <Input
                                            v-model="level.approver_name"
                                            label="审批人"
                                            placeholder="审批人姓名"
                                        />
                                    </div>
                                    <div class="flex items-center gap-2 pb-2">
                                        <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                v-model="level.required"
                                                type="checkbox"
                                                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span class="ml-1">必须</span>
                                        </label>
                                        <button
                                            v-if="newFlow.levels.length > 1"
                                            type="button"
                                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                                            @click="removeLevel(index)"
                                        >
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="mt-3 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                                @click="addLevel"
                            >
                                + 添加审批层级
                            </button>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex space-x-3">
                            <Button variant="secondary" @click="showCreateModal = false">取消</Button>
                            <Button variant="primary" @click="saveFlow">保存</Button>
                        </div>
                    </template>
                </Modal>

                <Modal
                    v-if="editingFlow"
                    v-model:show="showEditModal"
                    title="编辑审批流程"
                    size="lg"
                >
                    <div class="space-y-4">
                        <Input
                            v-model="editingFlow.name"
                            label="流程名称"
                            required
                        />
                        <Select
                            v-model="editingFlow.type"
                            label="流程类型"
                            :options="typeOptions"
                            required
                        />
                    </div>

                    <template #footer>
                        <div class="flex space-x-3">
                            <Button variant="secondary" @click="showEditModal = false">取消</Button>
                            <Button variant="primary" @click="updateFlow">保存</Button>
                        </div>
                    </template>
                </Modal>
            </div>
        </div>
    </AdminLayout>
</template>
