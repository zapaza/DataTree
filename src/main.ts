import 'virtual:uno.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import App from './App.vue'
import router from './router'
import vTooltip from './directives/tooltip'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueVirtualScroller)
app.directive('tooltip', vTooltip)

app.mount('#app')
