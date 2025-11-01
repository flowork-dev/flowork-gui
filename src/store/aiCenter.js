// C:\FLOWORK\flowork-gui\template\web\src\store\aiCenter.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
// (COMMENT) Deprecated API calls are commented out
// import { apiGetAiStatus, apiRunAiPlayground } from '@/api';
import { useUiStore } from './ui';
// (ADDED) Import the socket store
import { useSocketStore } from './socket';

export const useAiCenterStore = defineStore('aiCenter', () => {
    // --- STATE ---
    const aiProviders = ref([]);
    const playgroundResult = ref(null);
    const isLoadingStatus = ref(false);
    const isPlaygroundLoading = ref(false);
    const error = ref(null);

    // --- ACTIONS ---

    /**
     * Fetches the status of all available AI providers (local and remote).
     */
    async function fetchAiStatus() {
        isLoadingStatus.value = true;
        error.value = null;
        // (ADDED) Get socket store
        const socketStore = useSocketStore();
        try {
            console.log("[AI Center Store] Requesting AI provider statuses via WebSocket..."); // English Hardcode
            // (REPLACED) apiGetAiStatus()
            await socketStore.sendMessage({ type: 'request_ai_status' }); // English Hardcode
            // (COMMENT) isLoadingStatus will be set to false by the socket 'onmessage' handler
        } catch (e) {
            error.value = e.error || e.message || 'Failed to request AI provider statuses.'; // English Hardcode
            console.error('[AI Center Store] Error requesting statuses:', e); // English Hardcode
            isLoadingStatus.value = false;
        }
        // (COMMENT) Finally block removed as loading is handled by response
    }

    /**
     * (ADDED) Action to be called by socket listener when data arrives
     */
    function setAiStatus(providers) {
        aiProviders.value = providers;
        isLoadingStatus.value = false;
        console.log("[AI Center Store] AI provider statuses updated from WebSocket.", providers); // English Hardcode
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
        // (ADDED) Get socket store
        const socketStore = useSocketStore();
        try {
            console.log(`[AI Center Store] Running playground query on endpoint: ${endpoint_id} via WebSocket...`); // English Hardcode
            // (REPLACED) apiRunAiPlayground()
            await socketStore.sendMessage({
                type: 'request_ai_playground', // English Hardcode
                prompt: prompt,
                endpoint_id: endpoint_id
            });
            // (COMMENT) isPlaygroundLoading will be set to false by the socket 'onmessage' handler
        } catch (e) {
            const errorMessage = e.message || 'An error occurred while sending playground request.'; // English Hardcode
            playgroundResult.value = { error: errorMessage };
            uiStore.showNotification({ text: errorMessage, color: 'error' });
            console.error('[AI Center Store] Playground request error:', e); // English Hardcode
            isPlaygroundLoading.value = false;
        }
        // (COMMENT) Finally block removed as loading is handled by response
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
             uiStore.showNotification({ text: 'AI response received.', color: 'success' }); // English Hardcode
        }
        isPlaygroundLoading.value = false;
    }


    // --- RETURN ---
    return {
        aiProviders,
        playgroundResult,
        isLoadingStatus,
        isPlaygroundLoading,
        error,
        fetchAiStatus,
        runPlaygroundQuery,
        // (ADDED) Expose new actions
        setAiStatus,
        setPlaygroundResult,
    };
});