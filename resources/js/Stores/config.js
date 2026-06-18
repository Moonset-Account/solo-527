import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useConfigStore = defineStore('config', () => {
    const settings = reactive({
        enableApprovalFlow: true,
        enableDeliveryConfirmation: true,
        enableSpecAttachment: true,
        enableHistoryPrice: true,
        enableOperationLog: true,
        quotationValidDays: 30,
        lowStockThreshold: 10,
        defaultCurrency: 'CNY',
        systemName: '耗材采购管理系统',
    });

    const loading = ref(false);

    const updateSetting = (key, value) => {
        if (settings.hasOwnProperty(key)) {
            settings[key] = value;
        }
    };

    const bulkUpdate = (newSettings) => {
        Object.keys(newSettings).forEach(key => {
            if (settings.hasOwnProperty(key)) {
                settings[key] = newSettings[key];
            }
        });
    };

    const getSetting = (key, defaultValue = null) => {
        return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    };

    const toggleSetting = (key) => {
        if (typeof settings[key] === 'boolean') {
            settings[key] = !settings[key];
        }
    };

    return {
        settings,
        loading,
        updateSetting,
        bulkUpdate,
        getSetting,
        toggleSetting,
    };
});
