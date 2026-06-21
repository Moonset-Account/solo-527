<script setup>
import { usePage, Link } from '@inertiajs/vue3'
import { computed } from 'vue'

const props = defineProps({
    user: Object,
})

const page = usePage()
const currentRoute = computed(() => page.url)

const isActive = (routeName) => {
    if (!currentRoute.value) return false
    if (routeName === 'dashboard') return currentRoute.value === '/' || currentRoute.value.includes('/dashboard')
    return currentRoute.value.includes(routeName)
}

const hasRole = (roles) => {
    if (!props.user?.roles) return false
    if (Array.isArray(roles)) {
        return roles.some(r => props.user.roles.includes(r))
    }
    return props.user.roles.includes(roles)
}

const canAccessAdmin = computed(() => hasRole(['admin', 'manager']))
const canAccessTicket = computed(() => hasRole(['admin', 'manager', 'ticket_operator']))
</script>

<template>
    <nav class="flex-1 overflow-y-auto py-4">
        <div class="px-3 space-y-1">
            <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">概览</div>
            <Link
                :href="route('dashboard')"
                :class="['nav-link', isActive('dashboard') ? 'nav-link-active' : 'nav-link-inactive']"
            >
                <i class="fas fa-gauge-high w-5 text-center"></i>
                <span>复盘看板</span>
            </Link>
        </div>

        <div class="px-3 space-y-1 mt-6">
            <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">票务运营</div>
            <template v-if="canAccessTicket">
                <Link
                    :href="route('ticket.registrations.index')"
                    :class="['nav-link', isActive('ticket/registrations') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-clipboard-list w-5 text-center"></i>
                    <span>报名管理</span>
                </Link>
                <Link
                    :href="route('ticket.registrations.create')"
                    :class="['nav-link', isActive('ticket/registrations/create') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-plus-circle w-5 text-center"></i>
                    <span>录入报名</span>
                </Link>
            </template>
        </div>

        <template v-if="canAccessAdmin">
            <div class="px-3 space-y-1 mt-6">
                <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">后台管理</div>
                <Link
                    :href="route('admin.summary.index')"
                    :class="['nav-link', isActive('admin/summary') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-chart-column w-5 text-center"></i>
                    <span>转化&到场汇总</span>
                </Link>
                <Link
                    :href="route('admin.quality.index')"
                    :class="['nav-link', isActive('admin/quality') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-ranking-star w-5 text-center"></i>
                    <span>报名质量统计</span>
                </Link>
                <Link
                    :href="route('admin.duplicate-seats.index')"
                    :class="['nav-link', isActive('admin/duplicate-seats') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-triangle-exclamation w-5 text-center"></i>
                    <span>重复占座待办</span>
                </Link>
                <Link
                    :href="route('admin.attendance-rate.index')"
                    :class="['nav-link', isActive('attendance-rate') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-chair w-5 text-center"></i>
                    <span>上座率统计</span>
                </Link>
                <Link
                    :href="route('admin.config.index')"
                    :class="['nav-link', isActive('admin/config') && !isActive('refunds') && !isActive('feedbacks') && !isActive('logs') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-sliders w-5 text-center"></i>
                    <span>配置管理</span>
                </Link>
                <Link
                    :href="route('admin.config.refunds')"
                    :class="['nav-link', isActive('refunds') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-money-bill-transfer w-5 text-center"></i>
                    <span>退款申请</span>
                </Link>
                <Link
                    :href="route('admin.config.feedbacks')"
                    :class="['nav-link', isActive('feedbacks') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-comments w-5 text-center"></i>
                    <span>到场反馈</span>
                </Link>
                <Link
                    :href="route('admin.config.logs')"
                    :class="['nav-link', isActive('logs') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-file-lines w-5 text-center"></i>
                    <span>操作日志</span>
                </Link>
            </div>

            <div class="px-3 space-y-1 mt-6">
                <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">报表导出</div>
                <Link
                    :href="route('admin.export.index')"
                    :class="['nav-link', isActive('admin/export') && !isActive('history') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-file-export w-5 text-center"></i>
                    <span>数据导出</span>
                </Link>
                <Link
                    :href="route('admin.export.history')"
                    :class="['nav-link', isActive('export/history') ? 'nav-link-active' : 'nav-link-inactive']"
                >
                    <i class="fas fa-folder-open w-5 text-center"></i>
                    <span>导出历史</span>
                </Link>
            </div>
        </template>
    </nav>
</template>
