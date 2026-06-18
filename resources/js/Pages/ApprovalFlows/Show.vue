<script setup>
import { Head, usePage, Link, router, ref } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const flow = computed(() => page.props.flow || {});
const steps = computed(() => page.props.flow?.steps || []);

const showDeleteModal = ref(false);
const deletingStep = ref(null);
const showDeleteFlowModal = ref(false);

const entityTypeMap = {
    purchase_request: '采购申请',
    quotation: '报价单',
    payment: '付款申请',
    delivery: '到货确认',
};

const getStepApproverLabel = (step) => {
    if (step.type === 'role') {
        return step.role_name || '角色未设置';
    }
    return step.user_name || '审批人未设置';
};

const openDeleteStepModal = (step) => {
    deletingStep.value = step;
    showDeleteModal.value = true;
};

const deleteStep = () => {
    router.delete(route('approval-flows.steps.destroy', [flow.value.id, deletingStep.value.id]), {
        onSuccess: () => {
            toast.success('步骤删除成功');
            showDeleteModal.value = false;
            deletingStep.value = null;
        },
        onError: () => {
            toast.error('删除失败');
        },
    });
};

const toggleActive = () => {
    router.put(route('approval-flows.toggle', flow.value.id), {}, {
        onSuccess: () => {
            toast.success(flow.value.is_active ? '已停用' : '已启用');
        },
    });
};

const deleteFlow = () => {
    router.delete(route('approval-flows.destroy', flow.value.id), {
        onSuccess: () => {
            toast.success('审批流程已删除');
            router.visit(route('approval-flows.index'));
        },
        onError: () => {
            toast.error('删除失败');
        },
    });
};
</script>

<template>
    <Head :title="flow.name || '审批流程详情'" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('approval-flows.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回列表
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ flow.name }}</h1>
                            <Badge :type="flow.is_active ? 'success' : 'default'">
                                {{ flow.is_active ? '已启用' : '已停用' }}
                            </Badge>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Button variant="danger" @click="showDeleteFlowModal = true">
                            删除
                        </Button>
                        <Button variant="secondary" @click="toggleActive">
                            {{ flow.is_active ? '停用' : '启用' }}
                        </Button>
                        <Link :href="route('approval-flows.edit', flow.id)">
                            <Button variant="primary">
                                编辑
                            </Button>
                        </Link>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">基本信息</h3>
                            </div>
                            <div class="p-6">
                                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">流程名称</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ flow.name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">适用类型</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                                            <Badge type="primary">{{ entityTypeMap[flow.entity_type] || flow.entity_type }}</Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">适用部门</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ flow.department_name || '全部部门' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">金额范围</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                                            {{ flow.min_amount ? `¥${Number(flow.min_amount).toLocaleString()}` : '¥0' }}
                                            ~
                                            {{ flow.max_amount ? `¥${Number(flow.max_amount).toLocaleString()}` : '不限' }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建时间</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ flow.created_at }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">审批步骤数</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ steps.length }} 步</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">审批步骤</h3>
                                    <Link :href="route('approval-flows.edit', flow.id)">
                                        <Button variant="outline" size="sm">管理步骤</Button>
                                    </Link>
                                </div>
                            </div>
                            <div class="p-6">
                                <div v-if="steps.length > 0" class="space-y-4">
                                    <div v-for="(step, index) in steps" :key="step.id" class="relative">
                                        <div v-if="index < steps.length - 1" class="absolute left-5 top-12 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                        <div class="flex items-start">
                                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex-shrink-0">
                                                {{ step.order }}
                                            </div>
                                            <div class="ml-4 flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <h4 class="font-medium text-gray-900 dark:text-white">{{ step.name }}</h4>
                                                        <div class="mt-2 space-y-1">
                                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                <span class="inline-block w-20">审批人:</span>
                                                                <span class="text-gray-900 dark:text-white">{{ getStepApproverLabel(step) }}</span>
                                                            </p>
                                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                <span class="inline-block w-20">超时时间:</span>
                                                                <span class="text-gray-900 dark:text-white">{{ step.timeout_hours }} 小时</span>
                                                            </p>
                                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                <span class="inline-block w-20">可委派:</span>
                                                                <Badge :type="step.can_delegate ? 'success' : 'default'">
                                                                    {{ step.can_delegate ? '允许' : '不允许' }}
                                                                </Badge>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div class="flex space-x-2">
                                                        <Link
                                                            :href="route('approval-flows.edit', flow.id)"
                                                            class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                                                        >
                                                            编辑
                                                        </Link>
                                                        <button
                                                            @click="openDeleteStepModal(step)"
                                                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                                        >
                                                            删除
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无审批步骤，请前往编辑页面添加
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">流程说明</h3>
                            </div>
                            <div class="p-6">
                                <div class="space-y-3">
                                    <div class="flex items-start">
                                        <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">审批将按照步骤顺序依次进行</p>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">超时后系统将自动提醒审批人</p>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">允许委派的步骤可转由他人审批</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal
            v-model:show="showDeleteModal"
            title="删除审批步骤"
            size="sm"
        >
            <p class="text-gray-600 dark:text-gray-300">
                确定要删除步骤「{{ deletingStep?.name }}」吗？此操作不可恢复。
            </p>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showDeleteModal = false">取消</Button>
                    <Button variant="danger" @click="deleteStep">确认删除</Button>
                </div>
            </template>
        </Modal>

        <Modal
            v-model:show="showDeleteFlowModal"
            title="删除审批流程"
            size="sm"
        >
            <p class="text-gray-600 dark:text-gray-300">
                确定要删除审批流程「{{ flow.name }}」吗？此操作不可恢复。
            </p>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showDeleteFlowModal = false">取消</Button>
                    <Button variant="danger" @click="deleteFlow">确认删除</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
