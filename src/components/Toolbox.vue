<template>
  <div class="toolbox-container">
    <div class="pa-2 search-bar-container">
      <v-text-field
        v-model="searchTerm"
        :label="loc('toolbox_search_placeholder')"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        density="compact"
        hide-details
        clearable
        class="search-field"
      ></v-text-field>
    </div>

    <v-tabs v-model="activeTab" grow background-color="transparent" class="tabs-header">
      <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="tab-title">
        <v-icon :icon="tab.icon" size="small" start></v-icon>
        {{ loc(tab.titleKey) }}
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="toolbox-window">
      <v-window-item
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="fill-height"
      >
        <ComponentList
          :type="tab.value"
          :search-term="searchTerm"
          @item-click="handleItemClick"
        />
      </v-window-item>
    </v-window>

    <div v-if="isLoading && !hasAnyItems" class="loading-overlay">
      <v-progress-circular indeterminate color="cyan"></v-progress-circular>
      <p class="mt-2 text-caption text-grey">{{ loc('toolbox_loading') }}</p>
    </div>
    <div v-else-if="error" class="loading-overlay error-state">
      <v-icon icon="mdi-wifi-off" color="error" size="x-large"></v-icon>
      <p class="mt-2 text-error">{{ loc('toolbox_error_load') }}</p>
      <p class="text-caption text-grey">{{ loc('toolbox_error_check_connection') }}</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useComponentStore } from '@/store/components';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';
import ComponentList from './ComponentList.vue';
import { useUiStore } from '@/store/ui';
import { useSocketStore } from '@/store/socket';
import { useEngineStore } from '@/store/engines';

const componentStore = useComponentStore();
const localeStore = useLocaleStore();
const uiStore = useUiStore();
const socketStore = useSocketStore();
const engineStore = useEngineStore();

const { loc } = storeToRefs(localeStore);
const isLoading = computed(() => componentStore[activeTab.value]?.isLoading ?? false);
const hasAnyItems = computed(() => {
    return componentStore.modules.items.length > 0 ||
           componentStore.plugins.items.length > 0 ||
           componentStore.tools.items.length > 0 ||
           componentStore.triggers.items.length > 0;
});
const error = computed(() => componentStore.error);

const activeTab = ref('modules'); // English Hardcode
const searchTerm = ref('');

const tabs = ref([
    { titleKey: 'toolbox_tab_modules', value: 'modules', icon: 'mdi-cog-outline' }, // English Hardcode
    { titleKey: 'toolbox_tab_plugins', value: 'plugins', icon: 'mdi-power-plug-outline' }, // English Hardcode
    { titleKey: 'toolbox_tab_tools', value: 'tools', icon: 'mdi-hammer-wrench' }, // English Hardcode
    { titleKey: 'toolbox_tab_triggers', value: 'triggers', icon: 'mdi-timer-sand-outline' } // English Hardcode
]);

function handleItemClick(item) {
    if (!socketStore.isConnected) {
        if (engineStore.selectedEngineId) {
             socketStore.switchEngine(engineStore.selectedEngineId);
             uiStore.showNotification({ text: "Connecting to engine...", color: 'info' }); // English Hardcode
        } else {
             uiStore.showConnectEngineDialog();
        }
        return;
    }
    console.log(`[Toolbox] Opening Quick Runner for ${item.id}`); // English Log
    uiStore.showStandaloneRunner(item);
}
</script>

<style scoped>
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.toolbox-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent; /* Updated from #1a1a2e */
  color: var(--text-primary); /* Use theme variable */
}

.search-bar-container, .tabs-header {
  flex-shrink: 0;
}

.search-bar-container {
  padding: 12px !important;
}

.search-field :deep(.v-field) {
  background-color: var(--surface) !important; /* Use theme variable */
  border-radius: 8px !important;
  box-shadow: none !important;
}

.search-field :deep(.v-field__outline) {
  border: none !important;
}

.tabs-header {
  border-bottom: 1px solid var(--border-glow-soft); /* Use theme variable */
}

.tab-title {
  font-size: 0.75rem !important;
}

.v-tab {
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--text-secondary) !important; /* Explicitly set inactive color */
  transition: color 0.3s ease;
}

.v-tab--selected {
  color: var(--neon-cyan) !important; /* Use theme variable */
}

.toolbox-window {
  flex-grow: 1;
  overflow-y: hidden;
  min-height: 0;
  position: relative;
  padding: 8px 0;
  height: 100%;
}

.toolbox-window .v-window-item {
    height: 100%;
    overflow-y: auto;
}

.toolbox-window .v-window-item {
  scrollbar-width: thin;
  scrollbar-color: #4F4F4F var(--bg-dark); /* Use theme variable */
}
.toolbox-window .v-window-item::-webkit-scrollbar {
  width: 8px;
}
.toolbox-window .v-window-item::-webkit-scrollbar-track {
  background: var(--bg-dark); /* Use theme variable */
}
.toolbox-window .v-window-item::-webkit-scrollbar-thumb {
  background-color: #4F4F4F;
  border-radius: 10px;
  border: 2px solid var(--bg-dark); /* Use theme variable */
}

.loading-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    background-color: rgba(26, 26, 46, 0.8);
    z-index: 10;
}
.error-state {
    text-align: center;
    padding: 16px;
}
</style>
