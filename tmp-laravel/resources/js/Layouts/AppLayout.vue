<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <Link :href="route('dashboard')" class="text-xl font-bold text-indigo-600">
                                合规提醒
                            </Link>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                :href="route('dashboard')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component === 'Dashboard/Index' }"
                            >
                                工作台
                            </Link>
                            <Link
                                :href="route('checklists.index')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component.startsWith('Checklists/') }"
                            >
                                检查清单
                            </Link>
                            <Link
                                :href="route('checklist-records.index')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component.startsWith('ChecklistRecords/') }"
                            >
                                检查记录
                            </Link>
                            <Link
                                :href="route('compliance-gaps.index')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component.startsWith('ComplianceGaps/') }"
                            >
                                合规缺口
                            </Link>
                            <Link
                                :href="route('reminder-rules.index')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component.startsWith('ReminderRules/') }"
                            >
                                提醒规则
                            </Link>
                            <Link
                                :href="route('download-logs.index')"
                                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                :class="{ 'border-indigo-500 text-gray-900': $page.component.startsWith('DownloadLogs/') }"
                            >
                                下载记录
                            </Link>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="relative p-2 text-gray-400 hover:text-gray-500">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                            <span class="absolute top-0 right-0 block w-2 h-2 bg-red-400 rounded-full"></span>
                        </button>
                        <div class="ml-3 relative">
                            <div class="flex items-center">
                                <span class="text-sm font-medium text-gray-700 mr-2">合规经理</span>
                                <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                                    合
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main class="py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <slot></slot>
            </div>
        </main>

        <div v-if="flashMessage" class="fixed top-4 right-4 z-50">
            <div
                class="px-4 py-3 rounded-lg shadow-lg text-white"
                :class="flashType === 'success' ? 'bg-green-500' : 'bg-red-500'"
            >
                {{ flashMessage }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'

const page = usePage()

const flashMessage = ref('')
const flashType = ref('success')

onMounted(() => {
    if (page.props.flash?.success) {
        showFlash(page.props.flash.success, 'success')
    }
    if (page.props.flash?.error) {
        showFlash(page.props.flash.error, 'error')
    }
})

function showFlash(message, type = 'success') {
    flashMessage.value = message
    flashType.value = type
    setTimeout(() => {
        flashMessage.value = ''
    }, 3000)
}
</script>
