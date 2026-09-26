import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { tilt } from './directives/tilt'
import './assets/tokens.css'

createApp(App).use(createPinia()).use(router).directive('tilt', tilt).mount('#app')
