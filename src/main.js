import { createPinia } from 'pinia'
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './styles.css';

loadFonts();

const app = createApp(App);

app.use(createPinia()); // Pinia first
app.use(router);        // Then router
app.use(vuetify);
app.use(Toast, {
  position: 'top-center',
  timeout: 3000,
  closeOnClick: false,
  pauseOnFocusLoss: false,
  pauseOnHover: false,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: false,
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__fade',
  maxToasts: 5,
  newestOnTop: true,
  toastClassName: 'custom-toast',
  bodyClassName: 'custom-toast-body',
})

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  vuetify.theme.global.name.value = savedTheme;
}

app.mount('#app');