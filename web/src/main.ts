import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(TDesign)
app.use(router)
app.mount('#app')
