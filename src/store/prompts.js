// C:\FLOWORK\flowork-gui\template\web\src\store\prompts.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
// (COMMENT) Deprecated API calls are commented out
// import { getPrompts, createPrompt, updatePrompt, deletePrompt } from '@/api';
// (ADDED) Import the socket store
import { useSocketStore } from './socket';
import { useUiStore } from './ui'; // (ADDED) For notifications

export const usePromptStore = defineStore('prompts', () => {
    // --- STATE ---
    const prompts = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // --- ACTIONS ---

    async function fetchPrompts() {
        isLoading.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            console.log("[PromptStore] Requesting prompts via WebSocket..."); // English Hardcode
            // (REPLACED) getPrompts()
            await socketStore.sendMessage({ type: 'request_prompts_list' }); // English Hardcode
            // (COMMENT) isLoading will be set to false by socket listener
        } catch (e) {
            error.value = e.message || 'Failed to request prompts.'; // English Hardcode
            isLoading.value = false;
        }
    }

    // (ADDED) Action called by socket.js listener
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
            console.log(`[PromptStore] ${isUpdate ? 'Updating' : 'Creating'} prompt via WebSocket...`, promptData); // English Hardcode
            // (REPLACED) createPrompt(promptData) or updatePrompt(promptData.id, promptData)
            await socketStore.sendMessage({
                type: 'update_prompt', // Use a single type for create/update
                prompt_data: promptData
            });
            uiStore.showNotification({ text: `Prompt ${isUpdate ? 'updated' : 'created'} successfully.`, color: 'success' }); // English Hardcode
            // (COMMENT) List will be refreshed by 'prompts_list_response' listener
            return true; // Indicate success
        } catch (e) {
            error.value = e.message || `Failed to ${isUpdate ? 'update' : 'create'} prompt.`; // English Hardcode
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
            console.log(`[PromptStore] Deleting prompt ${promptId} via WebSocket...`); // English Hardcode
            // (REPLACED) deletePrompt(promptId)
            await socketStore.sendMessage({ type: 'delete_prompt', prompt_id: promptId }); // English Hardcode
            uiStore.showNotification({ text: 'Prompt deleted successfully.', color: 'success' }); // English Hardcode
            // (COMMENT) List will be refreshed by 'prompts_list_response' listener
        } catch (e) {
            error.value = e.message || 'Failed to delete prompt.'; // English Hardcode
            uiStore.showNotification({ text: error.value, color: 'error' });
            isLoading.value = false; // Set loading false only on error here
        }
    }

    // --- RETURN ---
    return {
        prompts,
        isLoading,
        error,
        fetchPrompts,
        savePrompt,
        removePrompt,
        // (ADDED) Expose action for socket listener
        setPromptsList
    };
});