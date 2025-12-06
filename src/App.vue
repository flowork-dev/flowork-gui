//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\App.vue total lines 277 
//#######################################################################

<template>
  <v-app>
    <AppBar v-if="isMemberAreaPage" />

    <v-main v-if="isMemberAreaPage" class="main-content" :class="{ 'no-padding-main': isDesignerPage }">
      <NeuralCanvasBackground />

      <WidgetDashboard v-show="isWidgetPage" class="persistent-widget-layer" />

      <router-view v-slot="{ Component }">
        <transition name="luxury-zoom" mode="out-in">
          <component :is="Component" v-if="!isWidgetPage" />
        </transition>
      </router-view>
    </v-main>

    <div v-else class="public-layout">
      <DigitalFingerprintBackground />
      <LanderHeader v-if="isPublicPageWithLanderHeader" />
      <router-view v-slot="{ Component }">
        <transition name="luxury-zoom" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <div class="notification-container">
      <TransitionGroup name="slide-x-reverse" tag="div">
        <v-alert
          v-for="notification in uiStore.notifications"
          :key="notification.id"
          v-model="notification.model"
          :color="notification.color"
          variant="tonal"
          closable
          @click:close="uiStore.removeNotification(notification.id)"
          class="notification-alert"
          :icon="`mdi-${notification.color === 'success' ? 'check-circle' : notification.color === 'error' ? 'alert-circle' : 'information'}-outline`"
          prominent
          border="start"
        >
          {{ notification.text }}
        </v-alert>
      </TransitionGroup>
    </div>
    <CommandPalette />
    <CookieConsentBanner />
    <GlobalConfirmationDialog />
    <GlobalTokenDialog />
  </v-app>
</template>

<script setup>

import { onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { useWorkflowStore } from '@/store/workflow';
import { useWidgetStore } from '@/store/widgets'; // [ADDED]

import AppBar from '@/components/AppBar.vue';
import LanderHeader from '@/components/LanderHeader.vue';
import CommandPalette from '@/components/CommandPalette.vue';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';
import CookieConsentBanner from '@/components/CookieConsentBanner.vue';
import DigitalFingerprintBackground from '@/components/DigitalFingerprintBackground.vue';
import GlobalConfirmationDialog from '@/components/GlobalConfirmationDialog.vue';
import GlobalTokenDialog from '@/components/GlobalTokenDialog.vue';
import WidgetDashboard from '@/views/WidgetDashboard.vue'; // [ADDED] Import langsung

const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUiStore();
const workflowStore = useWorkflowStore();
const widgetStore = useWidgetStore(); // [ADDED]

const isDesignerPage = computed(() => route.name === 'Designer');
const isWidgetPage = computed(() => route.name === 'Widgets'); // [ADDED] Helper buat deteksi halaman widgets

const memberAreaPages = [
  'Designer', 'Dashboard', 'MyEngines', 'Settings', 'Profile',
  'AiCenter', 'AiTrainer',
  'QuickTools',
  'Widgets',
  'MyArticles', 'ArticleEditorNew', 'ArticleEditorEdit',
  'ModelFactory', 'ModuleFactory', 'PromptManager', 'CoreEditor', 'Diagnostics',
  'AuthorizeEngine'
];

const hybridPages = ['News', 'Marketplace', 'MarketplaceItem'];

const publicPagesWithLanderHeader = [
  'Lander', 'PrivacyPolicy', 'TermsOfService', 'DMCA', 'ContactUs',
  'Login', 'Register', 'ArticleView', 'AuthorView', 'CategoryView', 'TagView', 'ArticleListEnglish', 'ArticleListIndonesian',
  'AboutUs'
];

const isMemberAreaPage = computed(() => {
  return memberAreaPages.includes(route.name) ||
        (hybridPages.includes(route.name) && authStore.isAuthenticated);
});

const isPublicPageWithLanderHeader = computed(() => {
  return publicPagesWithLanderHeader.includes(route.name) ||
        (hybridPages.includes(route.name) && !authStore.isAuthenticated);
});

const isPublicPage = computed(() => !isMemberAreaPage.value || publicPagesWithLanderHeader.includes(route.name));

const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    uiStore.isCommandPaletteVisible ? uiStore.hideCommandPalette() : uiStore.showCommandPalette();
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    authStore.setToken(token);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (authStore.isAuthenticated) {
      widgetStore.restoreRemoteState();
  }

  window.addEventListener('beforeunload', (event) => {
      if (workflowStore.isModified) {
        event.preventDefault();
        event.returnValue = '';
      }
  });
});

watch(() => authStore.isAuthenticated, (newVal) => {
    if (newVal) {
        widgetStore.restoreRemoteState();
    }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.main-content {
  position: relative;
  height: 100vh;
  overflow-y: auto;
  background-color: var(--bg-dark);
}

.main-content.no-padding-main {
  padding-top: 0 !important;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-dark);
}

/* [ADDED] Ensure widget layer takes full space when visible */
.persistent-widget-layer {
  width: 100%;
  height: 100%;
}

.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--bg-dark);
}

:deep(.v-fade-transition-leave-active),
:deep(.v-slide-x-transition-leave-active) {
  position: absolute;
  width: 100%;
}

.loading-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 15, 30, 0.8); backdrop-filter: blur(5px);
  z-index: 9999;
}
.notification-container {
  position: fixed; bottom: 16px; right: 16px; z-index: 10000;
  width: 100%; max-width: 350px;
}
.notification-alert {
  margin-top: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  border-width: 2px !important;
}

.slide-x-reverse-enter-active,
.slide-x-reverse-leave-active {
  transition: all 0.3s ease;
}
.slide-x-reverse-enter-from,
.slide-x-reverse-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<style>
/* Global overrides for Vuetify default faint text in dark theme */
.v-application {
  --v-theme-on-surface-variant: var(--text-secondary) !important;
  color: var(--text-primary) !important;
}

.v-list-item-subtitle {
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}

.v-label {
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}

.v-field__hint, .v-messages__message {
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}

.text-grey,
.text-grey-lighten-1,
.text-grey-lighten-2,
.text-grey-darken-1,
.text-grey-darken-2,
.text-grey-darken-3,
.text-grey-darken-4 {
  color: var(--text-secondary) !important;
}

.empty-state, .placeholder-view {
  color: var(--text-secondary) !important;
}

.v-toolbar-title {
  color: var(--text-primary) !important;
}

.orbitron-font {
  color: var(--text-primary) !important;
}

h1.orbitron-font,
h2.orbitron-font,
h3.orbitron-font,
.v-toolbar-title.orbitron-font,
.v-card-title.orbitron-font {
  color: var(--neon-cyan) !important;
}

.app-bar .logo-title.orbitron-font {
  color: var(--neon-cyan) !important;
}

.lander-header .header-logo.orbitron-font {
  color: var(--text-primary) !important;
  text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan) !important;
}
</style>
