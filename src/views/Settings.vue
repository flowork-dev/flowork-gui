#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Settings.vue
# REVISI 2:
# 1. Membuat computed property 'aiProviderItems' lebih robust dengan
#    mengecek apakah 'aiProviders.value' adalah array sebelum map.
# 2. Membersihkan kode dari komentar tidak perlu.
#######################################################################
<template>
  <div class="settings-layout">
    <NeuralCanvasBackground />
    <v-navigation-drawer permanent class="settings-sidebar" width="250">
      <v-list nav density="compact">
        <v-list-item-title class="pa-4 orbitron-font">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="cyan"></v-icon>
          {{ loc('settings_title') }}
        </v-list-item-title>
        <v-divider></v-divider>
        <v-list-item
          v-for="item in navItems"
          :key="item.value"
          :prepend-icon="item.icon"
          :title="loc(item.titleKey)"
          :value="item.value"
          @click="settingsStore.setActiveSection(item.value)"
          :active="activeSection === item.value"
          color="cyan"
          class="settings-nav-item"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div class="settings-content">
      <v-container fluid>
        <div v-if="isLoading" class="d-flex justify-center align-center fill-height">
          <v-progress-circular indeterminate color="cyan" size="64"></v-progress-circular>
        </div>
        <div v-else-if="error" class="text-center">
          <p class="text-error">{{ error || loc('settings_load_error') }}</p>
          <v-btn @click="settingsStore.fetchSettings()" color="primary" class="mt-4">{{ loc('common.tryAgain') }}</v-btn>
        </div>

        <div v-else-if="localSettings && Object.keys(localSettings).length > 0">
            <div v-if="activeSection === 'general'">
                <h2 class="section-title">{{ loc('settings_section_general') }}</h2>
                <SettingsField :label="loc('settings_general_language_label')" :hint="loc('settings_general_language_hint')">
                    <v-select v-model="localSettings.language" :items="['en', 'id']" variant="outlined" density="compact" hide-details></v-select>
                </SettingsField>
            </div>

            <div v-if="activeSection === 'ai_models'">
                <h2 class="section-title">{{ loc('settings_section_ai') }}</h2>
                <SettingsField :label="loc('settings_ai_text_model_label')" :hint="loc('settings_ai_text_model_hint')">
                    <v-select
                        v-model="localSettings.ai_model_for_text"
                        :items="aiProviderItems"
                        :loading="isAiStatusLoading"
                        item-title="title"
                        item-value="value"
                        variant="outlined"
                        density="compact"
                        hide-details
                        :no-data-text="isAiStatusLoading ? 'Loading models...' : 'No models available'"
                    ></v-select>
                </SettingsField>
                <SettingsField :label="loc('settings_ai_gpu_layers_label')" :hint="loc('settings_ai_gpu_layers_hint')">
                    <v-text-field v-model.number="localSettings.ai_gpu_layers" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                </SettingsField>
                <SettingsField :label="loc('settings_ai_worker_timeout_label')" :hint="loc('settings_ai_worker_timeout_hint')">
                    <v-text-field v-model.number="localSettings.ai_worker_timeout_seconds" type="number" variant="outlined" density="compact" hide-details suffix="seconds"></v-text-field>
                </SettingsField>
            </div>

            <div v-if="activeSection === 'server_api'">
                 <h2 class="section-title">{{ loc('settings_section_server') }}</h2>
                 <SettingsField :label="loc('settings_server_enable_webhook_label')" :hint="loc('settings_server_enable_webhook_hint')">
                    <v-switch v-model="localSettings.webhook_enabled" color="cyan" inset hide-details></v-switch>
                </SettingsField>
                <SettingsField v-if="localSettings.webhook_enabled" :label="loc('settings_server_webhook_port_label')" :hint="loc('settings_server_webhook_port_hint')">
                    <v-text-field v-model.number="localSettings.webhook_port" type="number" variant="outlined" density="compact" hide-details></v-text-field>
                </SettingsField>
                <v-divider class="my-6"></v-divider>
                 <SettingsField :label="loc('settings_server_manage_variables_button')" :hint="loc('settings_server_manage_variables_hint')">
                    <v-btn block size="large" variant="outlined" @click="isVariableManagerOpen = true" prepend-icon="mdi-key-variant">
                        {{ loc('settings_server_manage_variables_button') }}
                    </v-btn>
                </SettingsField>
            </div>

            <div v-if="activeSection === 'advanced'">
                 <h2 class="section-title">{{ loc('settings_section_advanced') }}</h2>
                 <SettingsField :label="loc('settings_advanced_enable_error_handler_label')" :hint="loc('settings_advanced_enable_error_handler_hint')">
                     <v-switch v-model="localSettings.global_error_handler_enabled" color="cyan" inset hide-details></v-switch>
                 </SettingsField>
                 <SettingsField v-if="localSettings.global_error_handler_enabled" :label="loc('settings_advanced_error_preset_label')" :hint="loc('settings_advanced_error_preset_hint')">
                     <v-select v-model="localSettings.global_error_workflow_preset" :items="['error-notifier-to-telegram', 'log-error-to-database']" variant="outlined" density="compact" hide-details></v-select>
                 </SettingsField>
            </div>

            <div v-if="activeSection === 'cloud_sync'">
                <CloudSyncSettings />
            </div>

            <v-btn color="cyan" @click="handleSave" :loading="isLoading" class="mt-8 save-button">
                {{ loc('settings_save_button') }}
            </v-btn>
        </div>

      </v-container>
    </div>
    <VariableManagerDialog v-model="isVariableManagerOpen" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/store/settings';
import { useLocaleStore } from '@/store/locale';
import { useAuthStore } from '@/store/auth';
import { useAiCenterStore } from '@/store/aiCenter';
import VariableManagerDialog from '@/components/VariableManagerDialog.vue';
import SettingsField from '@/components/settings/SettingsField.vue';
import CloudSyncSettings from '@/components/settings/CloudSyncSettings.vue';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const settingsStore = useSettingsStore();
const localeStore = useLocaleStore();
const authStore = useAuthStore();
const aiCenterStore = useAiCenterStore();

const { settings, isLoading, error, activeSection } = storeToRefs(settingsStore);
const { loc } = storeToRefs(localeStore);
const { aiProviders, isLoadingStatus: isAiStatusLoading } = storeToRefs(aiCenterStore);

const isVariableManagerOpen = ref(false);
const localSettings = ref({});

const navItems = ref([
    { titleKey: 'settings_section_general', value: 'general', icon: 'mdi-tune' }, // English Hardcode
    { titleKey: 'settings_section_cloud_sync', value: 'cloud_sync', icon: 'mdi-cloud-sync-outline' }, // English Hardcode
    { titleKey: 'settings_section_ai', value: 'ai_models', icon: 'mdi-brain' }, // English Hardcode
    { titleKey: 'settings_section_server', value: 'server_api', icon: 'mdi-server-network' }, // English Hardcode
    { titleKey: 'settings_section_advanced', value: 'advanced', icon: 'mdi-cog-box' }, // English Hardcode
]);

const aiProviderItems = computed(() => {
  // Pastikan aiProviders.value adalah array sebelum map
  if (!Array.isArray(aiProviders.value) || aiProviders.value.length === 0) {
      return [{ title: 'No models available', value: null, disabled: true }]; // English Hardcode
  }
  return aiProviders.value.map(p => ({ title: p.name, value: p.id }));
});

watch(settings, (newSettings) => {
  if (newSettings && !newSettings.error) {
      localSettings.value = JSON.parse(JSON.stringify(newSettings));
  }
}, { deep: true, immediate: true });

watch(() => localSettings.value.language, (newLang) => {
  if (newLang && newLang !== localeStore.currentLang) {
    localeStore.setLanguage(newLang);
  }
});

async function handleSave() {
    settingsStore.settings = JSON.parse(JSON.stringify(localSettings.value));
    await settingsStore.saveSettingsAction();
}

onMounted(() => {
  settingsStore.fetchSettings();
  aiCenterStore.fetchAiStatus();
});
</script>

<style scoped>
.settings-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.settings-content {
  flex-grow: 1;
  position: relative;
  overflow-y: auto;
  padding: 24px 48px;
  background-color: transparent;
  padding-bottom: 100px;
  z-index: 1;
}
.settings-sidebar {
  background-color: #161625;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 2;
  flex-shrink: 0;
}
.settings-sidebar :deep(.v-list-item-title) {
  color: var(--text-secondary);
}
.settings-sidebar :deep(.v-list-item__prepend .v-icon) {
  color: var(--text-secondary);
}
.settings-sidebar :deep(.v-list-item--active .v-list-item-title) {
  color: var(--neon-cyan);
}
.settings-sidebar :deep(.v-list-item--active .v-list-item__prepend .v-icon) {
  color: var(--neon-cyan);
}
.settings-sidebar :deep(.v-list-item:hover .v-list-item-title),
.settings-sidebar :deep(.v-list-item:hover .v-list-item__prepend .v-icon) {
  color: var(--text-primary);
}
.settings-sidebar :deep(.orbitron-font) {
  color: var(--text-primary);
}
.settings-sidebar :deep(.orbitron-font .v-icon) {
  color: var(--neon-cyan);
}

.orbitron-font { font-family: 'Orbitron', monospace; }
.section-title { font-family: 'Orbitron', monospace; font-size: 1.5rem; margin-bottom: 32px; color: #f0f0f0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 16px; }
.save-button { font-weight: bold; color: #000 !important; }

.settings-content :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
    color: var(--text-primary) !important;
}
.settings-content :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}
.settings-content :deep(.v-field--active .v-field__outline) {
    border-color: var(--neon-cyan) !important;
    border-width: 1px !important;
}
.settings-content :deep(input),
.settings-content :deep(textarea),
.settings-content :deep(.v-select__selection-text) {
    color: var(--text-primary) !important;
}
.settings-content :deep(.v-label) {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
}
.settings-content :deep(.v-field--active .v-label) {
    color: var(--neon-cyan) !important;
}
.settings-content :deep(.v-switch .v-selection-control__input::before) {
    background-color: rgba(255, 255, 255, 0.2) !important;
}
.settings-content :deep(.v-switch .v-selection-control__input > .v-icon) {
    color: #bdbdbd !important;
}
.settings-content :deep(.v-switch .v-selection-control--dirty .v-selection-control__input > .v-icon) {
    color: #111 !important;
}
</style>