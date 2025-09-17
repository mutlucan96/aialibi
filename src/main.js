import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './firebase.js'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  },
})

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  vuetify.theme.global.name.value = e.matches ? 'dark' : 'light'
})

const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount('#app')
