import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import Layout from './Layouts/AppLayout.vue'
import { ZiggyVue } from '../../vendor/tightenco/ziggy/dist/vue.m'

createInertiaApp({
    resolve: (name) => {
        const page = resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue')
        )
        page.then((module) => {
            module.default.layout = module.default.layout || ((page) => h(Layout, null, () => page))
        })
        return page
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(ZiggyVue)
            .mount(el)
    },
    title: (title) => `${title} - 数据合规节点提醒器`,
})
