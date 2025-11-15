//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\aiCenter.js total lines 96 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUiStore } from './ui';
import { useSocketStore } from './socket';

export const useAiCenterStore = defineStore('aiCenter', () => {
    const aiProviders = ref([]);
    const playgroundResult = ref(null);
    const isLoadingStatus = ref(false);
    const isPlaygroundLoading = ref(false);
    const error = ref(null);
    /**
     * Fetches the status of all available AI providers (local and remote).
     */
    async function fetchAiStatus() {
        isLoadingStatus.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            console.log("[AI Center Store] Requesting AI provider statuses via WebSocket...");
            await socketStore.sendMessage({ type: 'request_ai_status' });
        } catch (e) {
            error.value = e.error || e.message || 'Failed to request AI provider statuses.';
            console.error('[AI Center Store] Error requesting statuses:', e);
            isLoadingStatus.value = false;
        }
    }

    /**
     * (ADDED) Action to be called by socket listener when data arrives
     */
    function setAiStatus(providers) {
        aiProviders.value = providers;
        isLoadingStatus.value = false;
        console.log("[AI Center Store] AI provider statuses updated from WebSocket.", providers);
    }

    /**
     * Runs a query in the AI Playground.
     * @param {string} prompt - The user's prompt.
     * @param {string} endpoint_id - The ID of the provider to use.
     */
    async function runPlaygroundQuery(prompt, endpoint_id) {
        isPlaygroundLoading.value = true;
        playgroundResult.value = null;
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        try {
            console.log(`[AI Center Store] Running playground query on endpoint: ${endpoint_id} via WebSocket...`);
            await socketStore.sendMessage({
                type: 'request_ai_playground',
                prompt: prompt,
                endpoint_id: endpoint_id
            });
        } catch (e) {
            const errorMessage = e.message || 'An error occurred while sending playground request.';
            playgroundResult.value = { error: errorMessage };
            uiStore.showNotification({ text: errorMessage, color: 'error' });
            console.error('[AI Center Store] Playground request error:', e);
            isPlaygroundLoading.value = false;
        }
    }

    /**
     * (ADDED) Action to be called by socket listener when data arrives
     */
    function setPlaygroundResult(result) {
        const uiStore = useUiStore();
        playgroundResult.value = result;
        if (result.error) {
             uiStore.showNotification({ text: result.error, color: 'error' });
        } else {
             uiStore.showNotification({ text: 'AI response received.', color: 'success' });
        }
        isPlaygroundLoading.value = false;
    }


    return {
        aiProviders,
        playgroundResult,
        isLoadingStatus,
        isPlaygroundLoading,
        error,
        fetchAiStatus,
        runPlaygroundQuery,
        setAiStatus,
        setPlaygroundResult,
    };
});
