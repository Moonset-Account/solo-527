import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { createPinia } from 'pinia'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import Layout from './Components/Layout.vue'
import '../css/app.css'

createInertiaApp({
    title: (title) => `${title} - ${window.appName || '行业峰会复盘看板'}`,
    resolve: (name) => {
        const page = resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue')
        )
        page.then((module) => {
            module.default.layout = module.default.layout || Layout
        })
        return page
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(createPinia())
            .mixin({ methods: { route: window.route } })
            .mount(el)
    },
    progress: {
        color: '#4f46e5',
        showSpinner: true,
    },
})
