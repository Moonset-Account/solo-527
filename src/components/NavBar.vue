<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink as Link, useRouter, useRoute } from 'vue-router'
import {
  Map,
  BarChart3,
  Image,
  Eye,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

function handleLogout() {
  userStore.logout()
  router.push('/')
  showUserMenu.value = false
}

const navItems = [
  { name: '桶点地图', path: '/', icon: Map, public: true },
  { name: '工作台', path: '/manager', icon: BarChart3, role: 'manager' },
  { name: '照片审核', path: '/audit', icon: Image, roles: ['manager', 'auditor'] },
  { name: '公开看板', path: '/public', icon: Eye, public: true },
  { name: '系统设置', path: '/settings', icon: Settings, role: 'manager' }
]

function isVisible(item: any) {
  if (item.public) return true
  if (!userStore.isLoggedIn) return false
  if (item.role) return userStore.role === item.role
  if (item.roles) return item.roles.includes(userStore.role)
  return false
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Map class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-base font-bold text-gray-900 leading-tight">垃圾分类投放分析</h1>
            <p class="text-xs text-gray-500 leading-tight">城市智慧环卫平台</p>
          </div>
        </div>

        <nav class="hidden md:flex items-center gap-1">
          <template v-for="item in navItems" :key="item.path">
            <Link
              v-if="isVisible(item)"
              :to="item.path"
              :class="[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4" />
              {{ item.name }}
            </Link>
          </template>
        </nav>

        <div class="flex items-center gap-3">
          <div v-if="userStore.isLoggedIn" class="relative hidden sm:block">
            <button
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              @click="showUserMenu = !showUserMenu"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                {{ userStore.currentUser?.name.charAt(0) }}
              </div>
              <div class="text-left">
                <p class="text-sm font-medium text-gray-900">{{ userStore.currentUser?.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ userStore.role === 'manager' ? '项目经理' : userStore.role === 'auditor' ? '审核员' : '' }}
                </p>
              </div>
              <ChevronDown class="w-4 h-4 text-gray-400" />
            </button>

            <Transition name="slide-up">
              <div
                v-if="showUserMenu"
                class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2"
              >
                <div class="px-4 py-2 border-b border-gray-50">
                  <p class="text-sm font-medium text-gray-900">{{ userStore.currentUser?.name }}</p>
                  <p class="text-xs text-gray-500">{{ userStore.currentUser?.role }}</p>
                </div>
                <button
                  class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  @click="handleLogout"
                >
                  <LogOut class="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </Transition>
          </div>

          <Link
            v-else
            to="/login"
            class="btn-primary text-sm hidden sm:flex"
          >
            <User class="w-4 h-4 mr-1" />
            登录
          </Link>

          <button
            class="md:hidden p-2 rounded-lg hover:bg-gray-100"
            @click="showMobileMenu = !showMobileMenu"
          >
            <Menu v-if="!showMobileMenu" class="w-5 h-5 text-gray-600" />
            <X v-else class="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <Transition name="slide-up">
        <div v-if="showMobileMenu" class="md:hidden py-3 border-t border-gray-100">
          <nav class="flex flex-col gap-1">
            <template v-for="item in navItems" :key="item.path">
              <Link
                v-if="isVisible(item)"
                :to="item.path"
                :class="[
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-50'
                ]"
                @click="showMobileMenu = false"
              >
                <component :is="item.icon" class="w-4 h-4" />
                {{ item.name }}
              </Link>
            </template>
            <div v-if="userStore.isLoggedIn" class="pt-2 mt-2 border-t border-gray-100">
              <div class="flex items-center gap-2 px-3 py-2">
                <div class="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                  {{ userStore.currentUser?.name.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ userStore.currentUser?.name }}</p>
                  <p class="text-xs text-gray-500">{{ userStore.role === 'manager' ? '项目经理' : '审核员' }}</p>
                </div>
              </div>
              <button
                class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
                @click="handleLogout"
              >
                <LogOut class="w-4 h-4" />
                退出登录
              </button>
            </div>
          </nav>
        </div>
      </Transition>
    </div>
  </header>
</template>
