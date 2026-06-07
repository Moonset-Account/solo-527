<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { LayoutDashboard, Flame, BarChart3, AlertTriangle, GraduationCap, Settings, ChevronDown, User, Shield, BookOpen, ClipboardList } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showRoleMenu = ref(false);

const adminMenuItems = [
  { path: '/dashboard', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/heatmap', label: '时段热力分析', icon: Flame },
  { path: '/area-utilization', label: '区域利用率', icon: BarChart3 },
  { path: '/violation', label: '爽约与违规', icon: AlertTriangle },
  { path: '/exam-week', label: '考试周分析', icon: GraduationCap },
];

const superAdminMenuItems = [
  ...adminMenuItems,
  { path: '/settings', label: '系统配置', icon: Settings },
];

const studentMenuItems = [
  { path: '/my-records', label: '我的预约', icon: ClipboardList },
];

const menuItems = computed(() => {
  if (authStore.userRole === 'super_admin') {
    return superAdminMenuItems;
  } else if (authStore.userRole === 'librarian') {
    return adminMenuItems;
  } else {
    return studentMenuItems;
  }
});

const roles: { value: UserRole; label: string; icon: any }[] = [
  { value: 'super_admin', label: '超级管理员', icon: Shield },
  { value: 'librarian', label: '普通馆员', icon: User },
  { value: 'student', label: '学生用户', icon: BookOpen },
];

function switchRole(role: UserRole) {
  authStore.setRole(role);
  showRoleMenu.value = false;
  if (role === 'student') {
    router.push('/my-records');
  } else {
    router.push('/dashboard');
  }
}
</script>

<template>
  <aside class="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
    <div class="p-6 border-b border-slate-700">
      <h1 class="text-xl font-bold tracking-wide text-blue-300">📚 图书馆座位分析</h1>
      <p class="text-sm text-slate-400 mt-1">Library Seat Analytics</p>
    </div>
    
    <nav class="flex-1 py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in menuItems" :key="item.path">
          <router-link
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
            :class="route.path === item.path 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="text-sm font-medium">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
    
    <div class="p-4 border-t border-slate-700">
      <div class="relative">
        <button 
          class="w-full flex items-center justify-between px-4 py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          @click="showRoleMenu = !showRoleMenu"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {{ authStore.userName[0] }}
            </div>
            <div class="text-left">
              <p class="text-sm font-medium">{{ authStore.userName }}</p>
              <p class="text-xs text-slate-400">{{ roles.find(r => r.value === authStore.userRole)?.label }}</p>
            </div>
          </div>
          <ChevronDown class="w-4 h-4 text-slate-400" :class="{ 'rotate-180': showRoleMenu }" />
        </button>
        
        <div 
          v-if="showRoleMenu"
          class="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50"
        >
          <button
            v-for="role in roles"
            :key="role.value"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors text-left"
            :class="{ 'bg-blue-600/20 text-blue-300': authStore.userRole === role.value }"
            @click="switchRole(role.value)"
          >
            <component :is="role.icon" class="w-4 h-4" />
            <span>{{ role.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
