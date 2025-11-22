//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\settings.js total lines 84 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient, apiSetUserUiPreferences } from '@/api';
import { useLocaleStore } from './locale'; // [FIX] Import Locale Store

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref({
        language: 'en',
        theme: 'dark',
        ai_model_for_text: 'openai',
        ai_gpu_layers: 0,
        webhook_enabled: false,
        global_error_handler_enabled: false,
        global_error_workflow_preset: null
    });

    const isLoading = ref(false);
    const activeSection = ref('general'); // Default section

    async function fetchSettings() {
        isLoading.value = true;
        try {
            const response = await apiClient.get('/user/preferences');
            if (response.data && !response.data.error) {
                settings.value = { ...settings.value, ...response.data };

                const localeStore = useLocaleStore();
                if (settings.value.language && settings.value.language !== localeStore.currentLang) {
                    localeStore.setLanguage(settings.value.language);
                }
            }
        } catch (e) {
            console.warn("[Settings] Failed to fetch cloud settings, using local:", e);
            const local = localStorage.getItem('flowork_settings');
            if (local) {
                try {
                    settings.value = { ...settings.value, ...JSON.parse(local) };
                } catch(e){}
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function saveSettingsAction() {
        isLoading.value = true;
        try {
            localStorage.setItem('flowork_settings', JSON.stringify(settings.value));

            await apiSetUserUiPreferences(settings.value);

            const localeStore = useLocaleStore();
            if (settings.value.language) {
                localeStore.setLanguage(settings.value.language);
            }

            return true;
        } catch (e) {
            console.error("[Settings] Save failed:", e);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    function setActiveSection(section) {
        activeSection.value = section;
    }

    return {
        settings,
        isLoading,
        activeSection,
        fetchSettings,
        saveSettingsAction,
        setActiveSection
    };
});
