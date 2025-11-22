//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\variables.js total lines 87 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '@/api'; // [WAJIB] Pake ini biar lolos security Gateway

export const useVariablesStore = defineStore('variables', () => {
    const variables = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    async function fetchVariables() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await apiClient.get('/variables');

            const rawData = response.data || [];

            const varList = Array.isArray(rawData) ? rawData : Object.entries(rawData).map(([k, v]) => ({
                name: k,
                value: v, // Bisa object {type:..., value:...} atau string langsung
                is_enabled: true,
                is_secret: false // Default
            }));

            variables.value = varList;
            console.log('[Variables] Loaded:', variables.value.length, 'items');
        } catch (e) {
            console.error('[Variables] Fetch failed:', e);
            error.value = e.response?.data?.error || e.message;
        } finally {
            isLoading.value = false;
        }
    }

    async function saveVariable(name, variableData) {
        isLoading.value = true;
        try {
            const payload = {
                name: name,
                value: variableData.value, // Object {type: 'static', value: '...'}
                is_enabled: variableData.is_enabled,
                is_secret: variableData.is_secret
            };

            await apiClient.post('/variables', payload);

            await fetchVariables();
            return true;
        } catch (e) {
            console.error(`[Variables] Failed to save ${name}:`, e);
            error.value = e.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function removeVariable(name) {
        isLoading.value = true;
        try {
            await apiClient.delete(`/variables/${encodeURIComponent(name)}`);

            variables.value = variables.value.filter(v => v.name !== name);
            return true;
        } catch (e) {
            console.error(`[Variables] Failed to delete ${name}:`, e);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        variables,
        isLoading,
        error,
        fetchVariables,
        saveVariable,
        removeVariable
    };
});
