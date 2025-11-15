//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\settings.js total lines 103 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUiStore } from './ui';
import { useSocketStore } from './socket'; // Import socket store

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref({});
    const isLoading = ref(false);
    const error = ref(null);
    const activeSection = ref('general');
    async function fetchSettings() {
        isLoading.value = true;
        error.value = null;
        console.log('[STORE] Syncing settings state...');
        try {
            if (Object.keys(settings.value).length > 0) {
                 const uiStore = useUiStore();
                 uiStore.loadUiPreferences(settings.value);
                 console.log('[STORE] Settings already loaded, applied UI preferences.');
            } else {
                 console.log('[STORE] Settings empty. Requesting via WebSocket...');
                 const socketStore = useSocketStore();
                 await socketStore.sendMessage({ type: 'request_settings' });
            }
        } catch (e) {
            error.value = e.message || 'Failed to request settings. Is engine connected?';
            console.error('[STORE] Failed to request settings:', e);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Saves the current settings state to the backend via WebSocket.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async function saveSettingsAction() {
        const uiStore = useUiStore();
        const socketStore = useSocketStore();

        if (!socketStore.isConnected) {
            console.warn("[SettingsStore] Save failed: Socket is not connected.");
            uiStore.showNotification({ text: "Cannot save settings: Engine is not connected.", color: 'error' });
            uiStore.showConnectEngineDialog(); // (English Hardcode) Show the connect dialog
            return false; // (English Hardcode) Abort the save
        }

        isLoading.value = true;
        error.value = null;
        console.log('[STORE] Saving user-specific settings via WebSocket...');
        try {
            await socketStore.sendMessage({
                type: 'save_settings',
                settings: settings.value
            });

            console.log('[STORE] Settings saved successfully.');
            uiStore.showNotification({ text: 'Settings saved successfully!', color: 'success' });
            return true;
        } catch (e) {
            error.value = e.message || e.error || 'Failed to save settings.';
            console.error('[STORE] Failed to save settings:', e);
            uiStore.showNotification({ text: error.value, color: 'error' });
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Saves a single setting key-value pair and persists it.
     * @param {string} key - The setting key (e.g., 'ui_footer_pinned')
     * @param {*} value - The value to save.
     */
    async function saveSetting(key, value) {
        if (settings.value[key] === value) return; // Tidak ada perubahan
        console.log(`[STORE] Saving setting: ${key} = ${value}`);
        settings.value[key] = value;
        await saveSettingsAction();
    }


    function setActiveSection(section) {
        activeSection.value = section;
    }

    return {
        settings,
        isLoading,
        error,
        activeSection,
        fetchSettings,
        saveSettingsAction,
        saveSetting,
        setActiveSection,
    };
});
