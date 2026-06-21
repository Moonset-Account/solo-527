<script setup>
import { useForm, router } from '@inertiajs/vue3'
import { ref } from 'vue'

defineProps({
    user: Object,
})

const searchQuery = ref('')
const showSearch = ref(false)

const form = useForm({})

const logout = () => {
    form.post(route('logout'))
}

const doSearch = () => {
    if (searchQuery.value) {
        router.get(route('ticket.registrations.index'), { keyword: searchQuery.value })
    }
}
</script>

<template>
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div class="flex items-center gap-4">
            <div class="relative" :class="{ 'w-96': showSearch, 'w-10': !showSearch }">
                <div v-if="showSearch" class="flex items-center">
                    <i class="fas fa-search text-gray-400 absolute left-3 z-10"></i>
                    <input
                        v-model="searchQuery"
                        @keyup.enter="doSearch"
                        placeholder="搜索姓名/手机号/公司/报名号..."
                        class="input-field pl-10 pr-4 py-2"
                    />
                    <button
                        @click="searchQuery = ''; showSearch = false"
                        class="ml-2 p-2 text-gray-400 hover:text-gray-600"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <button
                    v-else
                    @click="showSearch = true"
                    class="w-10 h-10 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"
                    title="搜索 (Ctrl+K)"
                >
                    <i class="fas fa-search"></i>
                </button>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <button class="w-10 h-10 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 relative">
                <i class="fas fa-bell"></i>
                <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div class="w-px h-8 bg-gray-200"></div>

            <button
                class="w-10 h-10 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500"
                title="帮助"
            >
                <i class="fas fa-circle-question"></i>
            </button>

            <button
                @click="logout"
                class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-600 text-sm"
                title="退出登录"
            >
                <i class="fas fa-right-from-bracket"></i>
                <span>退出</span>
            </button>
        </div>
    </header>
</template>
