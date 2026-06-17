import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { InertiaProgress } from '@inertiajs/progress';
import { ZiggyVue } from '../../vendor/tightenco/ziggy/dist/index.esm.js';
import axios from 'axios';
import '../css/app.css';

import StatusBadge from './Components/StatusBadge.vue';
import FilterBar from './Components/FilterBar.vue';
import DataTable from './Components/DataTable.vue';
import Timeline from './Components/Timeline.vue';
import CashFlowChart from './Components/CashFlowChart.vue';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

InertiaProgress.init({
    color: '#3b82f6',
    showSpinner: true,
});

createInertiaApp({
    title: (title) => title ? `${title} - 项目尾款对接中心` : '项目尾款对接中心',
    resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(ZiggyVue);

        app.component('StatusBadge', StatusBadge);
        app.component('FilterBar', FilterBar);
        app.component('DataTable', DataTable);
        app.component('Timeline', Timeline);
        app.component('CashFlowChart', CashFlowChart);

        return app.mount(el);
    },
});
