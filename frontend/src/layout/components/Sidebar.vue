<template>
  <el-aside :width="collapse ? '64px' : '220px'" class="sidebar">
    <div class="logo-container">
      <h1 v-if="!collapse" class="logo">家装协同</h1>
      <h1 v-else class="logo-mini">装</h1>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapse"
        :unique-opened="true"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="item in menuList" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import {
  DataAnalysis,
  User,
  Files,
  EditPen,
  List,
  Timer,
  Document
} from '@element-plus/icons-vue'

defineProps({
  collapse: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const allMenus = [
  {
    path: '/dashboard',
    title: '数据看板',
    icon: DataAnalysis,
    permission: null
  },
  {
    path: '/leads',
    title: '线索管理',
    icon: User,
    permission: 'lead:list',
    children: [
      { path: '/leads', title: '线索列表', permission: 'lead:list' },
      { path: '/leads/create', title: '新建线索', permission: 'lead:create' }
    ]
  },
  {
    path: '/contracts',
    title: '合同管理',
    icon: Files,
    permission: 'contract:list'
  },
  {
    path: '/approvals',
    title: '审批管理',
    icon: EditPen,
    permission: 'approval:list'
  },
  {
    path: '/todos',
    title: '待办事项',
    icon: List,
    permission: null
  },
  {
    path: '/reports',
    title: '报表中心',
    icon: Document,
    permission: 'report:view',
    children: [
      { path: '/reports/payment', title: '回款进度', permission: 'report:view' },
      { path: '/reports/prediction', title: '成单预测', permission: 'report:view' }
    ]
  }
]

const hasPermission = (permission) => {
  if (!permission) return true
  return userStore.permissions?.includes(permission)
}

const filterMenus = (menus) => {
  return menus
    .filter(item => hasPermission(item.permission))
    .map(item => {
      if (item.children) {
        const children = filterMenus(item.children)
        return children.length ? { ...item, children } : null
      }
      return item
    })
    .filter(Boolean)
}

const menuList = computed(() => filterMenus(allMenus))
</script>

<style lang="scss" scoped>
.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .logo-container {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;

    .logo {
      font-size: 18px;
      color: #fff;
      margin: 0;
    }

    .logo-mini {
      font-size: 24px;
      color: #fff;
      margin: 0;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}
</style>
