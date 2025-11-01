import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import './styles/theme.css'
import { createPinia } from 'pinia'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import {
  VApp, VAppBar, VAppBarNavIcon, VBtn, VIcon, VSpacer, VMenu, VList, VListItem, VListItemTitle, VDivider,
  VLayout, VMain, VProgressCircular, VSnackbar, VRow, VCol, VCard, VCardText, VCardActions, VCardTitle,
  VContainer, VForm, VTextField, VCheckbox, VAlert, VImg, VAvatar, VChip, VDialog, VTabs, VTab, VWindow,
  VWindowItem, VNavigationDrawer, VExpansionPanels, VExpansionPanel, VExpansionPanelText, VSelect,
  VTextarea, VFileInput, VRadioGroup, VRadio, VSwitch, VDataTable, VToolbar, VToolbarTitle,
  VSkeletonLoader, VBtnToggle, VTooltip, VListSubheader, VCheckboxBtn
} from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import '@vue-flow/core/dist/style.css'
import router from './router/index.js'
import { useAuthStore } from './store/auth'
import { useLocaleStore } from './store/locale'

import ArticleComments from './components/ArticleComments.vue';
import { useUiStore } from './store/ui';

import VMdEditor from '@kangc/v-md-editor';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import Prism from 'prismjs';

const floworkThemes = {
  themes: {
    flowork_default: {
      dark: true,
      colors: {
        background: '#1a1a2e',
        surface: '#2a2a4a',
        primary: '#64ffda',
        secondary: '#a59dff',
        error: '#ff5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FB8C00',
      }
    },
    cyberpunk: { /* ... */ },
    light: { /* ... */ }
  }
}

const vuetify = createVuetify({
  components: {
    VApp, VAppBar, VAppBarNavIcon, VBtn, VIcon, VSpacer, VMenu, VList, VListItem, VListItemTitle, VDivider,
    VLayout, VMain, VProgressCircular, VSnackbar, VRow, VCol, VCard, VCardText, VCardActions, VCardTitle,
    VContainer, VForm, VTextField, VCheckbox, VAlert, VImg, VAvatar, VChip, VDialog, VTabs, VTab, VWindow,
    VWindowItem, VNavigationDrawer, VExpansionPanels, VExpansionPanel, VExpansionPanelText, VSelect,
    VTextarea, VFileInput, VRadioGroup, VRadio, VSwitch, VDataTable, VToolbar, VToolbarTitle,
    VSkeletonLoader, VBtnToggle, VTooltip, VListSubheader, VCheckboxBtn
  },
  directives,
  theme: floworkThemes
})

async function initializeApp() {
  const appElement = document.getElementById('app'); // English Hardcode
  if (appElement) {
    console.log('[Flowork] Main app element found, mounting GUI...'); // English Log
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);

    VMdEditor.use(vuepressTheme, {
      Prism,
    });
    app.use(VMdEditor);

    const localeStore = useLocaleStore();
    await localeStore.fetchDictionary();

    app.use(router);
    app.use(vuetify);

    const authStore = useAuthStore();
    await authStore.tryAutoLogin();

    app.mount('#app'); // English Hardcode
  }
}

async function initializeCommentsApp() {
    const commentsElement = document.getElementById('comments-app'); // English Hardcode
    if (commentsElement) {
        console.log('[Flowork] Comments app element found, mounting...'); // English Log
        const { articleId, articleSlug } = commentsElement.dataset;

        const pinia = createPinia();
        const commentApp = createApp(ArticleComments, { articleId, articleSlug });

        commentApp.use(pinia);
        commentApp.use(vuetify);

        const localeStore = useLocaleStore(pinia);
        await localeStore.fetchDictionary();

        const authStore = useAuthStore(pinia);
        await authStore.tryAutoLogin();

        useUiStore(pinia);

        commentApp.mount('#comments-app'); // English Hardcode
        console.log('[Flowork] Comments app mounted successfully.'); // English Log
    }
}

initializeApp();
initializeCommentsApp();