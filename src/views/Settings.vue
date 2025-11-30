//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Settings.vue
//#######################################################################

<template>
  <div class="settings-layout">
    <div class="luxury-bg"></div>
    <NeuralCanvasBackground class="subtle-neural" />

    <v-navigation-drawer
        permanent
        class="settings-sidebar"
        width="280"
        floating
        color="transparent"
    >
      <div class="pa-6 pb-2 header-animate">
        <div class="text-h6 font-weight-bold text-white tracking-wide d-flex align-center">
          <v-icon icon="mdi-cog" size="small" color="#FFD700" class="mr-3 opacity-80 spin-on-hover"></v-icon>
          <span style="letter-spacing: 2px;">SETTINGS</span>
        </div>
        <div class="text-caption text-grey-darken-1 mt-1 font-weight-medium text-uppercase tracking-widest">
          Control Panel
        </div>
      </div>

      <v-list nav class="px-4 mt-6">
        <v-list-item
          v-for="(item, index) in navItems"
          :key="item.value"
          :value="item.value"
          @click="settingsStore.setActiveSection(item.value)"
          rounded="lg"
          class="mb-2 nav-item animated-item"
          :class="{ 'active-item': activeSection === item.value }"
          :style="{ animationDelay: `${index * 100}ms` }"
          :ripple="false"
        >
          <template v-slot:prepend>
            <v-icon
                :icon="item.icon"
                size="small"
                class="nav-icon"
                :class="{ 'active-icon': activeSection === item.value }"
            ></v-icon>
          </template>

          <v-list-item-title
            class="font-weight-bold text-caption text-uppercase"
            :class="activeSection === item.value ? 'text-white' : 'text-grey'"
          >
            {{ loc(item.titleKey) || item.fallbackTitle }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-6 text-center fade-in-delayed">
            <span class="text-caption text-grey-darken-3 font-mono">FLOWORK OS v2.1</span>
        </div>
      </template>
    </v-navigation-drawer>

    <div class="settings-content custom-scrollbar">

      <div class="settings-cinematic-header mb-8">
        <div class="header-split">
            <div class="header-left">
                <div class="vault-visual">
                    <div class="lock-ring"></div>
                    <v-icon :icon="getHeaderIcon()" size="64" color="#FFD700" class="pulsing-icon"></v-icon>
                </div>
            </div>
            <div class="header-right">
                <div>
                    <div class="d-flex align-center mb-2">
                        <div class="status-dot blink mr-2"></div>
                        <span class="text-overline text-gold font-weight-black tracking-widest">SYSTEM ONLINE</span>
                    </div>
                    <h1 class="text-h3 font-weight-light text-white mb-2" style="text-transform: uppercase;">{{ getActiveTitle() }}</h1>
                    <p class="text-grey-lighten-1" style="max-width: 500px; line-height: 1.6;">
                       Configure system parameters, manage neural engines, and secure your credentials.
                    </p>
                </div>
            </div>
        </div>
      </div>

      <v-container class="content-container pt-0">
        <transition name="slide-fade" mode="out-in">
            <div :key="activeSection" class="section-wrapper">

                <div v-if="activeSection === 'profile'">
                     <ProfileSettings />
                </div>

                <div v-else-if="activeSection === 'variables'">
                    <div class="gold-panel pa-8 rounded-xl card-entrance">
                        <div class="d-flex align-start mb-6">
                            <div class="icon-glow mr-4">
                                <v-icon icon="mdi-safe-square-outline" size="large" color="#FFD700"></v-icon>
                            </div>
                            <div>
                                <h3 class="text-h6 text-white font-weight-medium">Secure Vault Access</h3>
                                <p class="text-body-2 text-grey mt-2" style="max-width: 600px; line-height: 1.6;">
                                    Access the encrypted global variable storage. Variables stored here are protected and can be used across all workflows.
                                </p>
                            </div>
                        </div>

                        <v-btn
                            color="#FFD700"
                            variant="outlined"
                            class="text-white font-weight-bold px-6 mt-2 border-gold pulse-button hover-fill-gold"
                            @click="isVariableManagerOpen = true"
                            height="48"
                            prepend-icon="mdi-key-variant"
                            rounded="lg"
                        >
                            Open Vault Manager
                        </v-btn>
                    </div>
                </div>

                <div v-else-if="isLoading" class="d-flex justify-center align-center py-16">
                    <v-progress-circular indeterminate color="#FFD700" width="2" size="48"></v-progress-circular>
                </div>

                <v-form v-else class="settings-form">

                    <div v-if="activeSection === 'general'">
                         <div class="gold-panel pa-8 rounded-xl card-entrance">
                            <SettingsField :label="loc('settings_general_language_label')" hint="Interface Language">
                                <v-select
                                    v-model="localSettings.language"
                                    :items="['en', 'id']"
                                    variant="outlined"
                                    density="comfortable"
                                    class="gold-input"
                                    bg-color="#0a0a0a"
                                    menu-icon="mdi-chevron-down"
                                ></v-select>
                            </SettingsField>
                         </div>
                    </div>

                    <div v-if="activeSection === 'ai_models'">
                         <div class="gold-panel pa-8 rounded-xl card-entrance">
                             <div class="d-flex align-center justify-space-between mb-8">
                                <div class="text-overline text-gold font-weight-bold">INFERENCE ENGINE</div>
                                <v-btn
                                    variant="text"
                                    color="grey"
                                    size="small"
                                    @click="refreshAiData"
                                    :loading="isAiStatusLoading"
                                    prepend-icon="mdi-refresh"
                                    class="text-none hover-white"
                                >
                                    Refresh List
                                </v-btn>
                             </div>

                             <SettingsField :label="loc('settings_ai_text_model_label')" hint="Primary LLM Backend (Path: C:\\FLOWORK\\ai_models\\text)">
                                <v-select
                                    v-model="localSettings.ai_model_for_text"
                                    :items="aiProviderItems"
                                    item-title="title"
                                    item-value="value"
                                    variant="outlined"
                                    density="comfortable"
                                    class="gold-input"
                                    :loading="isAiStatusLoading"
                                    bg-color="#0a0a0a"
                                    menu-icon="mdi-chevron-down"
                                >
                                     <template v-slot:item="{ props, item }">
                                        <v-list-item v-bind="props" class="model-list-item my-1 mx-2 rounded">
                                            <template v-slot:prepend>
                                                <v-icon :color="item.raw.type === 'local_model' ? '#00ff00' : '#00bfff'"
                                                        size="small"
                                                        class="mr-3"
                                                        :icon="item.raw.type === 'local_model' ? 'mdi-server' : 'mdi-cloud-outline'"></v-icon>
                                            </template>
                                            <template v-slot:append>
                                                <span v-if="item.raw.tier" class="text-caption text-grey text-uppercase font-weight-bold">{{ item.raw.tier }}</span>
                                            </template>
                                        </v-list-item>
                                     </template>
                                </v-select>
                             </SettingsField>

                             <v-divider class="my-6 border-gold-subtle"></v-divider>

                             <SettingsField :label="loc('settings_ai_gpu_layers_label')" hint="GPU Offload Layers (Local Models)">
                                <v-text-field
                                    v-model.number="localSettings.ai_gpu_layers"
                                    type="number"
                                    variant="outlined"
                                    density="comfortable"
                                    class="gold-input"
                                    bg-color="#0a0a0a"
                                    single-line
                                ></v-text-field>
                             </SettingsField>
                         </div>
                    </div>

                    <div v-if="activeSection === 'advanced'">
                         <div class="gold-panel pa-8 rounded-xl card-entrance">
                             <div class="d-flex align-center justify-space-between mb-8">
                                <div class="text-overline text-gold font-weight-bold">FAIL-SAFE PROTOCOLS</div>
                                 <v-btn
                                    icon="mdi-refresh"
                                    variant="plain"
                                    color="grey"
                                    size="x-small"
                                    @click="refreshPresets"
                                    :loading="arePresetsLoading"
                                    class="spin-on-click"
                                ></v-btn>
                             </div>

                             <div class="d-flex align-center justify-space-between mb-6 py-2">
                                 <div>
                                     <div class="text-body-1 text-white font-weight-medium">Global Error Handler</div>
                                     <div class="text-caption text-grey mt-1">Automatically execute a recovery workflow upon system failure.</div>
                                 </div>
                                 <v-switch
                                    v-model="localSettings.global_error_handler_enabled"
                                    color="#FFD700"
                                    inset
                                    hide-details
                                    class="gold-switch"
                                ></v-switch>
                             </div>

                             <v-expand-transition>
                                 <div v-if="localSettings.global_error_handler_enabled" class="pl-4 mt-6 border-l-gold">
                                     <SettingsField :label="loc('settings_advanced_error_preset_label')" hint="Select Recovery Workflow">
                                        <v-select
                                            v-model="localSettings.global_error_workflow_preset"
                                            :items="presetItems"
                                            variant="outlined"
                                            density="comfortable"
                                            class="gold-input"
                                            placeholder="Select preset..."
                                            :loading="arePresetsLoading"
                                            @click="refreshPresets"
                                            bg-color="#0a0a0a"
                                            menu-icon="mdi-chevron-down"
                                        ></v-select>
                                     </SettingsField>
                                 </div>
                             </v-expand-transition>
                         </div>
                    </div>

                    <div class="d-flex justify-end mt-10 button-entrance">
                        <v-btn
                            color="#FFD700"
                            variant="flat"
                            @click="handleSave"
                            :loading="isLoading"
                            class="text-black font-weight-black px-10 text-none save-btn-glow"
                            size="large"
                            rounded="lg"
                            elevation="0"
                            height="50"
                        >
                            {{ loc('settings_save_button') }}
                        </v-btn>
                    </div>
                </v-form>
            </div>
        </transition>

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
import { ref, onMounted, watch, computed } from 'vue';
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
  { titleKey: 'settings_server_manage_variables_button', fallbackTitle: 'Variables', value: 'variables', icon: 'mdi-shield-key-outline' },
  { titleKey: 'settings_section_general', fallbackTitle: 'General', value: 'general', icon: 'mdi-tune' },
  { titleKey: 'settings_section_ai', fallbackTitle: 'AI Core', value: 'ai_models', icon: 'mdi-brain' },
  { titleKey: 'settings_section_advanced', fallbackTitle: 'Advanced', value: 'advanced', icon: 'mdi-console-line' },
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

function getActiveTitle() {
    const activeItem = navItems.find(i => i.value === activeSection.value);
    return activeItem ? (loc.value(activeItem.titleKey) || activeItem.fallbackTitle) : 'Settings';
}

function getHeaderIcon() {
    const activeItem = navItems.find(i => i.value === activeSection.value);
    return activeItem ? activeItem.icon : 'mdi-cog';
}

watch(settings, (newVal) => {
    if (newVal && Object.keys(newVal).length) localSettings.value = JSON.parse(JSON.stringify(newVal));
}, { deep: true, immediate: true });

async function handleSave() {
    Object.assign(settings.value, localSettings.value);
    await settingsStore.saveSettingsAction();
    uiStore.showNotification({ text: 'Configuration saved successfully.', color: 'white', textColor: 'black' });
}

function refreshAiData() {
    aiCenterStore.fetchAiStatus();
}

async function refreshPresets() {
    arePresetsLoading.value = true;
    try {
        const response = await apiClient.get('/presets');
        if (response.data && Array.isArray(response.data)) {
            availablePresets.value = response.data;
        } else {
            availablePresets.value = [];
        }
    } catch (error) {
        console.error("Failed to load presets:", error);
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
/* --- BASE LAYOUT --- */
.settings-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #000;
    color: #e0e0e0;
    font-family: 'Inter', sans-serif;
}

/* Background Luxury Layers */
.luxury-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 0% 0%, #151515 0%, #000 60%);
    z-index: 0;
}
.subtle-neural {
    opacity: 0.05;
    filter: grayscale(100%) contrast(150%);
    pointer-events: none;
}

/* --- SIDEBAR --- */
.settings-sidebar {
    background: linear-gradient(180deg, rgba(15,15,15,0.8) 0%, #000 100%);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(255, 255, 255, 0.03);
    z-index: 2;
}

/* --- CINEMATIC HEADER --- */
.settings-cinematic-header {
    height: 250px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);
    position: relative;
    z-index: 2;
    background: linear-gradient(180deg, rgba(20,20,20,0.5) 0%, rgba(0,0,0,0) 100%);
}
.header-split { display: flex; height: 100%; }

.header-left {
    width: 30%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(255, 255, 255, 0.03);
}
.vault-visual { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; }
.lock-ring {
    position: absolute; width: 120px; height: 120px;
    border: 1px dashed rgba(255, 215, 0, 0.2); border-radius: 50%;
    animation: spin 20s linear infinite;
}
.pulsing-icon { animation: pulse-gold 3s infinite; filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.2)); }

.header-right {
    width: 70%;
    padding: 48px 60px;
    display: flex;
    align-items: center;
}

/* --- CONTENT AREA --- */
.settings-content { flex: 1; overflow-y: auto; z-index: 1; position: relative; }
.content-container { max-width: 900px; margin: 0 auto; padding-bottom: 100px; }

/* --- GOLD THEME COMPONENTS --- */
.text-gold { color: #FFD700 !important; }
.border-gold { border-color: #FFD700 !important; }
.border-gold-subtle { border-color: rgba(255, 215, 0, 0.1) !important; }
.border-l-gold { border-left: 2px solid rgba(255, 215, 0, 0.3); }

.gold-panel {
    background: #080808;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}
.gold-panel:hover {
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.05);
}

.gold-input :deep(.v-field) {
    border-radius: 8px;
    border-color: rgba(255, 255, 255, 0.1) !important;
    background: #0a0a0a !important;
    transition: all 0.3s ease;
}
.gold-input :deep(.v-field:hover) {
    border-color: rgba(255, 215, 0, 0.3) !important;
}
.gold-input :deep(.v-field--focused) {
    border-color: #FFD700 !important;
    box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.3);
}
.gold-input :deep(input), .gold-input :deep(.v-select__selection-text) {
    color: #e0e0e0 !important;
}
.gold-input :deep(.v-label) { color: rgba(255, 255, 255, 0.4) !important; }

.gold-switch :deep(.v-switch__track) { background-color: rgba(255, 255, 255, 0.2) !important; opacity: 1 !important; }
.gold-switch :deep(.v-selection-control--dirty .v-switch__track) { background-color: #FFD700 !important; }
.gold-switch :deep(.v-switch__thumb) { background-color: #000 !important; color: #FFD700 !important; }

.hover-fill-gold:hover { background-color: #FFD700 !important; color: #000 !important; }
.hover-white:hover { color: white !important; }

/* ANIMATIONS */
.animated-item { opacity: 0; transform: translateX(-20px); animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideInLeft { to { opacity: 1; transform: translateX(0); } }
.header-animate { animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.fade-in-delayed { opacity: 0; animation: fadeIn 1s ease forwards 0.8s; }
.card-entrance { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.1s; }
.button-entrance { opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.3s; }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { to { opacity: 1; } }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease-out; }
.slide-fade-enter-from { opacity: 0; transform: translateY(10px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* NAV UI */
.nav-item { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; }
.nav-item:hover { background: rgba(255, 255, 255, 0.03); transform: translateX(5px); }
.active-item { background: rgba(255, 215, 0, 0.05) !important; border: 1px solid rgba(255, 215, 0, 0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
.nav-icon { opacity: 0.5; transition: opacity 0.3s, color 0.3s; }
.active-icon { opacity: 1; color: #FFD700 !important; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #FFD700; box-shadow: 0 0 8px #FFD700; }
.blink { animation: blink-gold 2s infinite; }
@keyframes blink-gold { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.pulse-button { animation: pulse-gold 3s infinite; }
@keyframes pulse-gold {
    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
}

.spin-on-hover:hover, .spin-on-click:active { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* SCROLLBAR */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

/* UTILS */
.tracking-wide { letter-spacing: 0.05em; }
.tracking-widest { letter-spacing: 0.15em; }
</style>