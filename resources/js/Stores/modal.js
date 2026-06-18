import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modal', () => {
    const modals = ref({});

    const open = (name) => {
        modals.value[name] = true;
    };

    const close = (name) => {
        modals.value[name] = false;
    };

    const toggle = (name) => {
        modals.value[name] = !modals.value[name];
    };

    const isOpen = (name) => {
        return !!modals.value[name];
    };

    const closeAll = () => {
        modals.value = {};
    };

    return {
        modals,
        open,
        close,
        toggle,
        isOpen,
        closeAll,
    };
});
