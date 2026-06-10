<script setup>
import { Link, usePage, router } from '@inertiajs/vue3';
import { ref, computed } from 'vue';

const page = usePage();
const sidebarOpen = ref(false);
const userMenuOpen = ref(false);

const user = computed(() => page.props.auth?.user);
const currentRoute = computed(() => page.url);

const roleLabels = {
    admin: '系统管理员',
    sales_director: '销售总监',
    business_analyst: '业务分析师',
};

const primaryRole = computed(() => {
    if (!user.value?.roles?.length) return '';
    const firstRole = user.value.roles[0];
    return roleLabels[firstRole] || firstRole;
});

const navItems = [
    { label: '驾驶舱', icon: '📊', route: '/dashboard', permission: 'dashboard.view' },
    { label: '指标管理', icon: '📈', route: '/indicators', permission: 'indicator.view' },
    { label: '业务工单', icon: '📋', route: '/business-orders', permission: 'business_order.view' },
    { label: '复盘节奏', icon: '🔄', route: '/review-rhythms', permission: 'review_rhythm.view' },
    { label: '操作留痕', icon: '📝', route: '/audit-logs', permission: 'audit_log.view' },
];

function isActive(route) {
    return currentRoute.value.startsWith(route);
}

function hasPermission(perm) {
    return user.value?.permissions?.includes(perm) || false;
}

function visibleNavItems() {
    return navItems.filter(item => hasPermission(item.permission));
}

function logout() {
    router.post('/logout');
}
</script>

<template>
    <div class="app-layout">
        <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
        <aside :class="['sidebar', { open: sidebarOpen }]">
            <div class="sidebar-header">
                <h1 class="sidebar-title">Sales Cockpit</h1>
            </div>
            <nav class="sidebar-nav">
                <Link
                    v-for="item in visibleNavItems()"
                    :key="item.route"
                    :href="item.route"
                    :class="['nav-item', { active: isActive(item.route) }]"
                    @click="sidebarOpen = false"
                >
                    <span class="nav-icon">{{ item.icon }}</span>
                    <span class="nav-label">{{ item.label }}</span>
                </Link>
            </nav>
        </aside>
        <div class="main-area">
            <header class="top-bar">
                <button class="hamburger" @click="sidebarOpen = !sidebarOpen">
                    <span></span><span></span><span></span>
                </button>
                <div class="top-bar-right">
                    <div v-if="user" class="user-menu" @click.self="userMenuOpen = false">
                        <button class="user-trigger" @click="userMenuOpen = !userMenuOpen">
                            <span class="user-avatar">{{ user.name.charAt(0) }}</span>
                            <span class="user-details">
                                <span class="user-name">{{ user.name }}</span>
                                <span class="user-role">{{ primaryRole }}</span>
                            </span>
                            <span class="dropdown-arrow">▾</span>
                        </button>
                        <div v-if="userMenuOpen" class="dropdown-menu">
                            <button class="dropdown-item logout-item" @click="logout">
                                🚪 退出登录
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main class="content">
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped>
.app-layout {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 220px;
    background: #1e293b;
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 40;
    transition: transform 0.2s;
}

.sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid #334155;
}

.sidebar-title {
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
}

.sidebar-nav {
    padding: 8px 0;
    flex: 1;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.15s;
    font-size: 14px;
}

.nav-item:hover {
    background: #334155;
    color: #f1f5f9;
}

.nav-item.active {
    background: #3b82f6;
    color: #ffffff;
}

.nav-icon {
    font-size: 16px;
    width: 24px;
    text-align: center;
}

.nav-label {
    white-space: nowrap;
}

.main-area {
    flex: 1;
    margin-left: 220px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.top-bar {
    height: 52px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    flex-shrink: 0;
}

.hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
}

.hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    background: #475569;
    border-radius: 1px;
}

.top-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-info {
    font-size: 13px;
    color: #64748b;
}

.user-menu {
    position: relative;
}

.user-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;
}

.user-trigger:hover {
    background: #f1f5f9;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #3b82f6;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

.user-name {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    line-height: 1.2;
}

.user-role {
    font-size: 11px;
    color: #64748b;
    line-height: 1.2;
}

.dropdown-arrow {
    font-size: 10px;
    color: #94a3b8;
    margin-left: 2px;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    min-width: 160px;
    z-index: 50;
    padding: 4px;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
    border-radius: 6px;
    text-align: left;
    transition: background 0.15s;
}

.dropdown-item:hover {
    background: #f1f5f9;
}

.logout-item {
    color: #ef4444;
}

.logout-item:hover {
    background: #fef2f2;
}

.content {
    flex: 1;
    padding: 24px;
    background: #f8fafc;
}

.sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 35;
}

@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .main-area {
        margin-left: 0;
    }

    .hamburger {
        display: flex;
    }

    .sidebar-overlay {
        display: block;
    }
}
</style>
