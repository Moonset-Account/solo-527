import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import './style.css';
import App from './App.vue';
import router from './router';
import { useDataCenterStore } from './stores/dataCenter';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

const dataCenter = useDataCenterStore();
dataCenter.initializeBaseData();

app.mount('#app');
