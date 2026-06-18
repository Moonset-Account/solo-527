import axios from 'axios';
import { route } from 'ziggy-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.route = route;
