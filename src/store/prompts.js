//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\prompts.js total lines 83 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSocketStore } from './socket';
import { useUiStore } from './ui'; // (ADDED) For notifications

export const usePromptStore = defineStore('prompts', () => {
    const prompts = ref([]);
    const isLoading = ref(false);
    const error = ref(null);


    async function fetchPrompts() {
        isLoading.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            console.log("[PromptStore] Requesting prompts via WebSocket...");
            await socketStore.sendMessage({ type: 'request_prompts_list' });
        } catch (e) {
            error.value = e.message || 'Failed to request prompts.';
            isLoading.value = false;
        }
    }

    function setPromptsList(promptList) {
        prompts.value = promptList;
        isLoading.value = false;
    }

    async function savePrompt(promptData) {
        isLoading.value = true;
        error.value = null;
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        const isUpdate = !!promptData.id; // Check if it's an update (has ID)
        try {
            console.log(`[PromptStore] ${isUpdate ? 'Updating' : 'Creating'} prompt via WebSocket...`, promptData);
            await socketStore.sendMessage({
                type: 'update_prompt', // Use a single type for create/update
                prompt_data: promptData
            });
            uiStore.showNotification({ text: `Prompt ${isUpdate ? 'updated' : 'created'} successfully.`, color: 'success' });
            return true; // Indicate success
        } catch (e) {
            error.value = e.message || `Failed to ${isUpdate ? 'update' : 'create'} prompt.`;
            uiStore.showNotification({ text: error.value, color: 'error' });
            isLoading.value = false; // Set loading false only on error here
            return false; // Indicate failure
        }
    }

    async function removePrompt(promptId) {
        isLoading.value = true;
        error.value = null;
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        try {
            console.log(`[PromptStore] Deleting prompt ${promptId} via WebSocket...`);
            await socketStore.sendMessage({ type: 'delete_prompt', prompt_id: promptId });
            uiStore.showNotification({ text: 'Prompt deleted successfully.', color: 'success' });
        } catch (e) {
            error.value = e.message || 'Failed to delete prompt.';
            uiStore.showNotification({ text: error.value, color: 'error' });
            isLoading.value = false; // Set loading false only on error here
        }
    }

    return {
        prompts,
        isLoading,
        error,
        fetchPrompts,
        savePrompt,
        removePrompt,
        setPromptsList
    };
});
