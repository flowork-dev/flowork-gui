//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\AppBar.vue total lines 352 
//#######################################################################

<template>
  <v-app-bar flat class="app-bar" app>
    <template v-if="isDesignerPage">
      <v-btn icon @click="uiStore.toggleToolbox" class="ml-2">
        <v-icon>{{ uiStore.isToolboxOpen ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
      </v-btn>
    </template>

    <v-toolbar-title class="logo-title" @click="goToDesigner" :class="{ 'ml-4': !isDesignerPage }">
      FLOWORK
    </v-toolbar-title>

    <div v-if="isDesignerPage" class="mode-selector-container d-none d-md-flex">
        <v-btn-toggle
            v-model="uiStore.designerMode"
            mandatory
            variant="outlined"
            density="compact"
            class="mode-selector"
            @update:model-value="onModeChange"
        >
            <v-btn value="logic" :disabled="isReadOnly" class="mode-btn">
                <v-icon start>mdi-sitemap-outline</v-icon>
                Logic
            </v-btn>
            <v-btn value="data" :disabled="isReadOnly" class="mode-btn">
                <v-icon start>mdi-database-eye-outline</v-icon>
                Dataflow
            </v-btn>
            <v-btn value="debugger" :disabled="isReadOnly" class="mode-btn">
                <v-icon start>mdi-bug-check-outline</v-icon>
                Debugger
            </v-btn>
            <v-btn value="logs" :disabled="isReadOnly" class="mode-btn">
                <v-icon start>mdi-math-log</v-icon>
                Logs
            </v-btn>
        </v-btn-toggle>
    </div>

    <v-spacer></v-spacer>

    <v-btn
      v-if="authStore.isAuthenticated"
      icon="mdi-magnify"
      class="header-btn"
      title="Command Palette (Ctrl+K)"
      @click="uiStore.showCommandPalette()"
    ></v-btn>
    <v-menu
      v-if="authStore.isAuthenticated"
      @update:modelValue="isMenuOpen = $event"
      :close-on-content-click="false"
      content-class="app-grid-menu"
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-apps" class="header-btn" title="Flowork Menu"></v-btn>
      </template>

      <v-card class="app-grid-menu-card" color="#161625">
        <v-container fluid>
          <v-row>
            <v-col v-for="group in mainNavGroups" :key="group.title" class="menu-group-col">
              <div class="menu-group-title">{{ group.title }}</div>
              <v-list density="compact" bg-color="transparent">
                <template v-for="item in group.items" :key="item.title">
                  <v-list-item
                    v-if="!(item.devOnly && !socketStore.isDevEngine)"
                    :to="item.to"
                    :href="item.href"
                    :target="item.target"
                    :disabled="item.disabled"
                    :title="item.title"
                    class="menu-grid-item"
                    @click="isMenuOpen = false"
                  >
                    <template v-slot:prepend>
                      <v-icon :icon="item.icon" :color="item.color || 'grey-lighten-1'" size="small"></v-icon>
                    </template>
                    </v-list-item>
                </template>
              </v-list>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-menu>

    <template v-if="authStore.isAuthenticated">
    <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="mr-2" title="My Account">
            <v-avatar size="32">
              <v-icon icon="mdi-account-circle-outline" size="large"></v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact" class="avatar-menu" bg-color="#161625">
          <v-list-item :title="displayName" :subtitle="formattedPublicAddress">
          <template v-slot:prepend>
                <v-avatar size="32" class="mr-2">
                  <v-icon icon="mdi-account-circle-outline" size="large"></v-icon>
                </v-avatar>
             </template>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item :to="{ name: 'Settings' }" prepend-icon="mdi-cog-outline" title="Settings"></v-list-item>
          <v-list-item @click="logout" prepend-icon="mdi-logout-variant" title="Logout"></v-list-item>
        </v-list>
      </v-menu>
    </template>
    <template v-if="!authStore.isAuthenticated">
        <v-btn
            :to="{ name: 'Marketplace' }"
            variant="text"
            class="mx-2 orbitron-font"
            color="grey-lighten-1"
        >
            Marketplace
        </v-btn>
        <v-btn
            :to="{ name: 'News' }"
            variant="text"
            class="mx-2 orbitron-font"
            color="grey-lighten-1"
        >
            News
        </v-btn>
    </template>
    <v-btn
      v-if="!authStore.isAuthenticated"
      to="/login"
      variant="tonal"
      class="mx-2 orbitron-font"
      color="cyan"
      prepend-icon="mdi-login-variant"
    >
      Login
    </v-btn>

    <v-progress-linear
      :active="authStore.isLoading"
      indeterminate
      color="cyan"
      absolute
      location="bottom"
    ></v-progress-linear>

  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUiStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { useWorkflowStore } from '@/store/workflow';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/store/profile';

const uiStore = useUiStore();
const authStore = useAuthStore();
const socketStore = useSocketStore();
const workflowStore = useWorkflowStore();
const router = useRouter();
const route = useRoute();
const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);

const { isReadOnly } = storeToRefs(workflowStore);

const isDesignerPage = computed(() => route.name === 'Designer');
const isMenuOpen = ref(false);

const mainNavGroups = ref([
  {
    title: 'CORE',
    items: [
      { title: 'Designer', icon: 'mdi-sitemap-outline', to: { name: 'Designer' } },
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: { name: 'Dashboard' } },
      { title: 'Quick Tools', icon: 'mdi-flash-outline', to: { name: 'QuickTools' } },
      { title: 'My Content', icon: 'mdi-file-document-multiple-outline', to: { name: 'MyArticles' } },
      { title: 'Marketplace', icon: 'mdi-store-outline', to: { name: 'Marketplace' } },
    ]
  },
  {
    title: 'AI SUITE',
    items: [
      { title: 'AI Center', icon: 'mdi-brain', to: { name: 'AiCenter' } },
      { title: 'AI Trainer', icon: 'mdi-school-outline', to: { name: 'AiTrainer' } },
      { title: 'Prompt Manager', icon: 'mdi-text-box-multiple-outline', to: { name: 'PromptManager' } },
      { title: 'AI Architect', icon: 'mdi-sitemap-outline', to: { name: 'AiArchitect' } },
      { title: 'Model Factory', icon: 'mdi-factory', to: { name: 'ModelFactory' } },
    ]
  },
  {
    title: 'SYSTEM & HELP',
    items: [
      { title: 'My Engines', icon: 'mdi-key-chain', to: { name: 'MyEngines' } },
      { title: 'Settings', icon: 'mdi-cog-outline', to: { name: 'Settings' } },
      { title: 'Diagnostics', icon: 'mdi-hospital-box-outline', to: { name: 'Diagnostics' } },
      { title: 'News & Updates', icon: 'mdi-newspaper-variant-outline', to: { name: 'News' } },
      { title: 'Documentation', icon: 'mdi-book-open-page-variant-outline', href: 'https://docs.flowork.cloud', target: '_blank' },
      { title: 'Gateway API Docs (Local)', icon: 'mdi-api', href: 'http://localhost:8000/docs', target: '_blank', devOnly: true },
    ]
  }
]);

const displayName = computed(() => {
    const fallbackName = authStore.user?.username || '...';
    const profileName = profile.value?.name;
    if (profileName && profileName !== fallbackName) {
        return profileName;
    }
    return fallbackName;
});

const formattedPublicAddress = computed(() => {
    const addr = authStore.user?.id;
    if (!addr) return null;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
});

function logout() {
  authStore.logout();
  router.push('/login');
}

function onModeChange(newMode) {
    uiStore.setDesignerMode(newMode);
    uiStore.closeRightPanel();
}

function goToDesigner() {
    router.push('/');
}
</script>

<style scoped>
.app-bar {
  background-color: rgba(10, 15, 30, 0.7) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-glow-soft) !important;
  color: var(--text-primary);
}

.app-bar :deep(.v-btn .v-icon) {
  color: var(--text-primary) !important;
  opacity: 1;
}
.app-bar :deep(.v-btn:hover .v-icon) {
  color: var(--neon-cyan) !important;
}

.app-bar :deep(.v-btn[href="/marketplace"]:hover),
.app-bar :deep(.v-btn[href="/news"]:hover) {
    color: var(--neon-cyan) !important;
}


.logo-title {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: var(--neon-cyan);
  cursor: pointer;
  letter-spacing: 1px;
}

.mode-selector-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

.mode-selector {
    background-color: rgba(0,0,0,0.2);
    border: 1px solid var(--border-glow-soft);
}

.mode-btn {
    color: var(--text-secondary);
    font-family: 'Orbitron', monospace;
    letter-spacing: 0.5px;
}

.mode-btn.v-btn--active {
    color: var(--neon-cyan);
    background-color: rgba(0, 245, 255, 0.1);
}

.orbitron-font {
  font-family: 'Orbitron', monospace;
}

.avatar-menu {
  background-color: #161625;
  border: 1px solid var(--border-glow-soft);
}
.avatar-menu :deep(.v-list-item-title) {
  color: var(--text-primary);
}
.avatar-menu :deep(.v-list-item-subtitle) {
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 0.8rem;
}

.app-grid-menu-card {
  background-color: #161625;
  border: 1px solid var(--border-glow-soft);
  padding: 8px;
  min-width: 550px;
}
.menu-group-col {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}
.menu-group-col:last-child {
    border-right: none;
}
.menu-group-title {
    font-family: 'Orbitron', monospace;
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--text-secondary);
    letter-spacing: 1px;
    padding: 8px 16px 4px 16px;
    text-transform: uppercase;
}
.menu-grid-item {
    transition: background-color 0.2s ease;
}
.menu-grid-item :deep(.v-list-item-title) {
    font-size: 0.9rem !important;
    color: var(--text-primary) !important;
}
.menu-grid-item:hover {
    background-color: rgba(0, 245, 255, 0.1);
}
.menu-grid-item:hover :deep(.v-list-item-title) {
    color: var(--neon-cyan) !important;
}
.menu-grid-item:hover :deep(.v-icon) {
    color: var(--neon-cyan) !important;
}
</style>
