import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const token = ref(localStorage.getItem('token') || '');
    const permissions = ref([]);

    const isLoggedIn = ref(!!token.value);

    const setUser = (userData) => {
        user.value = userData;
        isLoggedIn.value = true;
    };

    const setToken = (tokenValue) => {
        token.value = tokenValue;
        localStorage.setItem('token', tokenValue);
        isLoggedIn.value = !!tokenValue;
    };

    const setPermissions = (perms) => {
        permissions.value = perms;
    };

    const hasPermission = (permission) => {
        if (permissions.value.includes('*')) return true;
        return permissions.value.includes(permission);
    };

    const logout = () => {
        user.value = null;
        token.value = '';
        permissions.value = [];
        isLoggedIn.value = false;
        localStorage.removeItem('token');
    };

    return {
        user,
        token,
        permissions,
        isLoggedIn,
        setUser,
        setToken,
        setPermissions,
        hasPermission,
        logout,
    };
});
