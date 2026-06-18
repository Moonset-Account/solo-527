<script setup>
import { computed, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    applications: Object,
    filters: Object,
})

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const filters = ref({
    keyword: props.filters.keyword || '',
    status: props.filters.status || '',
    type: props.filters.type || '',
    start_date: props.filters.start_date || '',
    end_date: props.filters.end_date || '',
    per_page: props.filters.per_page || 20,
})

const getStatusBadgeClass = (status) => {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const getTypeText = (type) => {
    const texts = {
        account_create: '账号创建',
        account_delete: '账号注销',
        permission_change: '权限变更',
        role_change: '角色变更',
        other: '其他',
    }
    return texts[type] || type
}

const applyFilters = () => {
    router.get(route('account-applications.index'), filters.value, { preserveState: true })
}

const resetFilters = () => {
    filters.value = {
        keyword: '',
        status: '',
        type: '',
        start_date: '',
        end_date: '',
        per_page: 20,
    }
    router.get(route('account-applications.index'), {}, { preserveState: true })
}

const exportData = () => {
    window.open(route('account-applications.export', filters.value), '_blank')
}
</script>

<template>
    <Layout title="账号申请">
        <div class="mb-4 flex justify-between items-center">
            <div>
                <Link
                    :href="route('account-applications.create')"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    提交申请
                </Link>
            </div>
            <div class="flex space-x-2">
                <button
                    v-if="isAdmin"
                    @click="exportData"
                    class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                    导出CSV
                </button>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow mb-4">
            <div class="p-4 border-b border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">关键词</label>
                        <input
                            v-model="filters.keyword"
                            type="text"
                            @keyup.enter="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="搜索申请人、内容..."
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select
                            v-model="filters.status"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全部</option>
                            <option value="pending">待审批</option>
                            <option value="approved">已批准</option>
                            <option value="rejected">已拒绝</option>
                            <option value="cancelled">已取消</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">申请类型</label>
                        <select
                            v-model="filters.type"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全部</option>
                            <option value="account_create">账号创建</option>
                            <option value="account_delete">账号注销</option>
                            <option value="permission_change">权限变更</option>
                            <option value="role_change">角色变更</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input
                            v-model="filters.start_date"
                            type="date"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input
                            v-model="filters.end_date"
                            type="date"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div class="mt-4 flex justify-end space-x-2">
                    <button
                        @click="resetFilters"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        重置
                    </button>
                    <button
                        @click="applyFilters"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        查询
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请类型</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请内容</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">审批人</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="applications.data?.length === 0">
                        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                            暂无申请数据
                        </td>
                    </tr>
                    <tr v-for="app in applications.data" :key="app.id" class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">{{ getTypeText(app.application_type) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{{ app.applicant?.name }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{{ app.description }}</td>
                        <td class="px-4 py-3">
                            <span :class="getStatusBadgeClass(app.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                                {{ getStatusText(app.status) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ app.approver?.name || '-' }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ app.created_at }}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex space-x-2">
                                <Link
                                    :href="route('account-applications.show', app.id)"
                                    class="text-blue-600 hover:text-blue-900"
                                >
                                    详情
                                </Link>
                                <Link
                                    v-if="isAdmin && app.status === 'pending'"
                                    :href="route('account-applications.approve', app.id)"
                                    as="button"
                                    method="post"
                                    class="text-green-600 hover:text-green-900"
                                >
                                    批准
                                </Link>
                                <Link
                                    v-if="isAdmin && app.status === 'pending'"
                                    :href="route('account-applications.reject', app.id)"
                                    as="button"
                                    method="post"
                                    class="text-red-600 hover:text-red-900"
                                >
                                    拒绝
                                </Link>
                                <Link
                                    v-if="app.status === 'pending' && app.applicant_id === window.page?.props?.auth?.user?.id"
                                    :href="route('account-applications.cancel', app.id)"
                                    as="button"
                                    method="post"
                                    class="text-gray-600 hover:text-gray-900"
                                >
                                    取消
                                </Link>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
                共 {{ applications.total }} 条
            </div>
            <div v-if="applications.links" class="flex space-x-1">
                <Link
                    v-for="(link, index) in applications.links"
                    :key="index"
                    :href="link.url || '#'"
                    v-html="link.label"
                    class="px-3 py-1 text-sm rounded-md border"
                    :class="link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                />
            </div>
        </div>
    </Layout>
</template>
