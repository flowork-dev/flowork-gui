//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Settings.vue total lines 290 
//#######################################################################

<template>
  <div class="settings-layout">
    <NeuralCanvasBackground />
    <v-navigation-drawer permanent class="settings-sidebar" width="250">
      <v-list nav density="compact">
        <v-list-item-title class="pa-4 orbitron-font text-white">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="cyan"></v-icon>
          {{ loc('settings_title') || 'Settings' }}
        </v-list-item-title>
        <v-divider class="border-cyan"></v-divider>

        <v-list-item
          v-for="item in navItems"
          :key="item.value"
          :prepend-icon="item.icon"
          :title="loc(item.titleKey) || item.fallbackTitle"
          :value="item.value"
          @click="settingsStore.setActiveSection(item.value)"
          :active="activeSection === item.value"
          class="settings-nav-item"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div class="settings-content">
      <v-container fluid>
        <div v-if="activeSection === 'profile'">
             <ProfileSettings />
        </div>

        <div v-else-if="activeSection === 'variables'">
            <h2 class="section-title">Global Variables</h2>
            <SettingsField label="Environment Manager" hint="Simpan API Key dan Secret di sini. Aman terkendali.">
                <div class="d-flex flex-column align-start">
                    <p class="text-caption text-grey-lighten-1 mb-4" style="max-width: 600px;">
                        Akses variabel di workflow pake syntax <code>$env.NAMA_VARIABLE</code>.
                    </p>
                    <v-btn
                        color="cyan"
                        variant="outlined"
                        @click="isVariableManagerOpen = true"
                        prepend-icon="mdi-safe-square-outline"
                        size="large"
                        class="hacker-button"
                    >
                        Open Variable Manager
                    </v-btn>
                </div>
            </SettingsField>
        </div>

        <div v-else>
            <div v-if="isLoading" class="d-flex justify-center pa-8">
                <v-progress-circular indeterminate color="cyan"></v-progress-circular>
            </div>

            <v-form v-else>
                <div v-if="activeSection === 'general'">
                     <h2 class="section-title">{{ loc('settings_section_general') }}</h2>
                     <SettingsField :label="loc('settings_general_language_label')" hint="Interface Language">
                        <v-select v-model="localSettings.language" :items="['en', 'id']" variant="outlined" density="compact" class="hacker-input"></v-select>
                     </SettingsField>
                </div>

                <div v-if="activeSection === 'ai_models'">
                     <div class="d-flex align-center mb-4 justify-space-between">
                        <h2 class="section-title mb-0 mr-4">{{ loc('settings_section_ai') }}</h2>
                        <v-btn
                            prepend-icon="mdi-refresh"
                            variant="outlined"
                            color="cyan"
                            size="small"
                            @click="refreshAiData"
                            :loading="isAiStatusLoading"
                            class="hacker-button"
                        >
                            SCAN MODELS
                        </v-btn>
                     </div>

                     <SettingsField :label="loc('settings_ai_text_model_label')" hint="Default Otak Text (Cek C:\FLOWORK\ai_models\text)">
                        <v-select
                            v-model="localSettings.ai_model_for_text"
                            :items="aiProviderItems"
                            item-title="title"
                            item-value="value"
                            variant="outlined"
                            density="compact"
                            class="hacker-input"
                            :loading="isAiStatusLoading"
                            no-data-text="Zonk! Gak ada model. Cek folder C:\FLOWORK"
                        >
                             <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props" :subtitle="item.raw.tier ? 'Tier: ' + item.raw.tier : ''">
                                    <template v-slot:prepend>
                                        <v-icon :color="item.raw.type === 'local_model' ? 'green' : 'blue'"
                                                :icon="item.raw.type === 'local_model' ? 'mdi-harddisk' : 'mdi-cloud'"></v-icon>
                                    </template>
                                </v-list-item>
                             </template>
                        </v-select>
                     </SettingsField>
                     <SettingsField :label="loc('settings_ai_gpu_layers_label')" hint="GPU Layers Offload (Khusus Local Model biar ngebut)">
                        <v-text-field v-model.number="localSettings.ai_gpu_layers" type="number" variant="outlined" density="compact" class="hacker-input"></v-text-field>
                     </SettingsField>
                </div>

                <div v-if="activeSection === 'advanced'">
                     <div class="d-flex align-center mb-4 justify-space-between">
                        <h2 class="section-title mb-0">{{ loc('settings_section_advanced') }}</h2>
                         <v-btn
                            icon="mdi-refresh"
                            variant="text"
                            color="cyan"
                            size="small"
                            @click="refreshPresets"
                            :loading="arePresetsLoading"
                        ></v-btn>
                     </div>

                     <SettingsField :label="loc('settings_advanced_enable_error_handler_label')" hint="Global Error Workflow">
                        <v-switch v-model="localSettings.global_error_handler_enabled" color="cyan" inset class="hacker-switch"></v-switch>
                     </SettingsField>

                     <SettingsField v-if="localSettings.global_error_handler_enabled" :label="loc('settings_advanced_error_preset_label')" hint="Pilih Workflow penyelamat saat error">
                        <v-select
                            v-model="localSettings.global_error_workflow_preset"
                            :items="presetItems"
                            variant="outlined"
                            density="compact"
                            class="hacker-input"
                            placeholder="Pilih preset..."
                            :loading="arePresetsLoading"
                            @click="refreshPresets"
                            no-data-text="Belum ada Preset tersimpan."
                        ></v-select>
                     </SettingsField>
                </div>

                <v-btn color="cyan" @click="handleSave" :loading="isLoading" class="mt-8 save-button" block size="large">
                    {{ loc('settings_save_button') }}
                </v-btn>
            </v-form>
        </div>

      </v-container>
    </div>
    <VariableManagerDialog v-model="isVariableManagerOpen" />
  </div>
</template>

<script setup>
import ProfileSettings from '@/components/settings/ProfileSettings.vue';
import VariableManagerDialog from '@/components/VariableManagerDialog.vue';
import SettingsField from '@/components/settings/SettingsField.vue';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/store/settings';
import { useLocaleStore } from '@/store/locale';
import { useAiCenterStore } from '@/store/aiCenter';
import { apiClient } from '@/api';
import { useUiStore } from '@/store/ui';

const settingsStore = useSettingsStore();
const localeStore = useLocaleStore();
const aiCenterStore = useAiCenterStore();
const uiStore = useUiStore();

const { settings, isLoading, activeSection } = storeToRefs(settingsStore);
const { loc } = storeToRefs(localeStore);
const { aiProviders, isLoadingStatus: isAiStatusLoading } = storeToRefs(aiCenterStore);

const isVariableManagerOpen = ref(false);
const arePresetsLoading = ref(false);
const availablePresets = ref([]);
const localSettings = ref({});

const navItems = [
  { titleKey: 'Profile', fallbackTitle: 'Profile', value: 'profile', icon: 'mdi-account-circle-outline' },
  { titleKey: 'settings_server_manage_variables_button', fallbackTitle: 'Global Variables', value: 'variables', icon: 'mdi-key-variant' },
  { titleKey: 'settings_section_general', fallbackTitle: 'General', value: 'general', icon: 'mdi-tune' },
  { titleKey: 'settings_section_ai', fallbackTitle: 'AI Models', value: 'ai_models', icon: 'mdi-brain' },
  { titleKey: 'settings_section_advanced', fallbackTitle: 'Advanced', value: 'advanced', icon: 'mdi-cog-box' },
];

const aiProviderItems = computed(() => {
  if (!Array.isArray(aiProviders.value)) return [];
  return aiProviders.value.map(p => ({
      title: p.name || p.id,
      value: p.id,
      tier: p.tier,
      type: p.type || 'provider'
  }));
});

const presetItems = computed(() => {
    if (!Array.isArray(availablePresets.value)) return [];
    return availablePresets.value.map(p => {
        if (typeof p === 'string') return p;
        return {
            title: p.name || p.id || 'Unknown Preset',
            value: p.id
        };
    });
});

watch(settings, (newVal) => {
    if (newVal && Object.keys(newVal).length) localSettings.value = JSON.parse(JSON.stringify(newVal));
}, { deep: true, immediate: true });

async function handleSave() {
    Object.assign(settings.value, localSettings.value);
    await settingsStore.saveSettingsAction();
}

function refreshAiData() {
    console.log("Scanning Models...");
    aiCenterStore.fetchAiStatus();
}

async function refreshPresets() {
    arePresetsLoading.value = true;
    console.log("Requesting Presets via HTTP...");
    try {
        const response = await apiClient.get('/presets');
        if (response.data && Array.isArray(response.data)) {
            availablePresets.value = response.data;
            console.log("🔥 Presets Loaded:", response.data.length);
        } else {
            availablePresets.value = [];
        }
    } catch (error) {
        console.error("Gagal load presets:", error);
    } finally {
        arePresetsLoading.value = false;
    }
}

onMounted(() => {
    settingsStore.fetchSettings();
    aiCenterStore.fetchAiStatus();

    refreshPresets();
});

</script>

<style scoped>
.settings-layout { display: flex; height: 100%; overflow: hidden; }
.settings-content { flex: 1; overflow-y: auto; padding: 24px 48px; padding-bottom: 100px; z-index: 1; }
.settings-sidebar { background: #161625; border-right: 1px solid rgba(255,255,255,0.1); z-index: 2; }

/* Styling Keren */
.text-white { color: #ffffff !important; }
.settings-nav-item { color: rgba(255,255,255,0.7) !important; transition: all 0.3s ease; }
.settings-nav-item:hover { color: #ffffff !important; background: rgba(0, 255, 255, 0.1); }
.settings-sidebar :deep(.v-list-item--active) { color: var(--neon-cyan) !important; background: rgba(0, 255, 255, 0.15); font-weight: bold; border-left: 3px solid var(--neon-cyan); }
.settings-sidebar :deep(.v-icon) { opacity: 0.9; }

.section-title { font-family: 'Orbitron', monospace; font-size: 1.5rem; margin-bottom: 24px; color: #fff; border-bottom: 1px solid var(--neon-cyan); display: inline-block; padding-bottom: 8px; }
.save-button { font-weight: 900; color: #000 !important; }
.border-cyan { border-color: rgba(0, 255, 255, 0.3) !important; }

/* Hacker Input Style */
.hacker-input :deep(.v-field) { background: rgba(20, 20, 35, 0.9) !important; color: #fff !important; border: 1px solid rgba(100, 255, 218, 0.3); }
.hacker-input :deep(input), .hacker-input :deep(.v-select__selection-text) { color: #fff !important; font-family: 'Consolas', monospace; }
.hacker-input :deep(.v-label) { color: var(--neon-cyan) !important; opacity: 0.8; }
.hacker-switch :deep(.v-selection-control--dirty .v-switch__track) { background-color: var(--neon-cyan) !important; }
.hacker-switch :deep(.v-switch__thumb) { background-color: #fff !important; color: var(--neon-cyan) !important; }

/* Hacker Button Extra */
.hacker-button {
    border: 1px solid var(--neon-cyan);
    color: var(--neon-cyan) !important;
    font-weight: bold;
    letter-spacing: 1px;
    transition: all 0.3s;
}
.hacker-button:hover {
    background: rgba(0, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
}
</style>
