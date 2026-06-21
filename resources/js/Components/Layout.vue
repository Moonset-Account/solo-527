<script setup>
import { usePage, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import MainNav from './MainNav.vue'
import AppHeader from './AppHeader.vue'

const page = usePage()
const user = computed(() => page.props.auth?.user)
const appName = computed(() => page.props.appName || '行业峰会复盘看板')
const flash = computed(() => page.props.flash || {})
const flashMessage = ref('')
const flashType = ref('success')

if (flash.value.success) {
    flashMessage.value = flash.value.success
    flashType.value = 'success'
    setTimeout(() => flashMessage.value = '', 5000)
}
if (flash.value.error) {
    flashMessage.value = flash.value.error
    flashType.value = 'error'
    setTimeout(() => flashMessage.value = '', 5000)
}
if (flash.value.message) {
    flashMessage.value = flash.value.message
    flashType.value = 'info'
    setTimeout(() => flashMessage.value = '', 5000)
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex">
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
            <div class="h-16 flex items-center px-6 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <i class="fas fa-chart-line text-white text-sm"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-900 text-sm leading-tight">{{ appName }}</div>
                        <div class="text-xs text-gray-500 leading-tight">Summit Review Board</div>
                    </div>
                </div>
            </div>

            <MainNav :user="user" />

            <div class="mt-auto border-t border-gray-200 p-4">
                <div v-if="user" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <i class="fas fa-user text-indigo-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</div>
                        <div class="text-xs text-gray-500 truncate">
                            <template v-for="(role, idx) in (user.roles || [])" :key="role">
                                <span>{{ role }}</span>
                                <span v-if="idx < (user.roles?.length || 0) - 1">, </span>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <div class="flex-1 ml-64 flex flex-col min-h-screen">
            <AppHeader :user="user" />

            <main class="flex-1 p-6">
                <div v-if="flashMessage" class="mb-6">
                    <div
                        :class="[
                            'px-4 py-3 rounded-md flex items-center gap-3 border',
                            flashType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : '',
                            flashType === 'error' ? 'bg-red-50 border-red-200 text-red-700' : '',
                            flashType === 'info' ? 'bg-sky-50 border-sky-200 text-sky-700' : '',
                        ]"
                    >
                        <i :class="['fas', flashType === 'success' ? 'fa-check-circle' : flashType === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle']"></i>
                        <span class="text-sm">{{ flashMessage }}</span>
                    </div>
                </div>

                <slot />
            </main>
        </div>
    </div>
</template>
