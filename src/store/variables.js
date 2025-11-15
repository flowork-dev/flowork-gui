//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\variables.js total lines 97 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSocketStore } from './socket';

export const useVariablesStore = defineStore('variables', () => {
    const variables = ref([]);
    const isLoading = ref(false);


    /**
     * Fetches all global variables from the local engine.
     */
    async function fetchVariables() {
        isLoading.value = true;
        const socketStore = useSocketStore();
        try {
            console.log("[VariablesStore] Requesting variables via WebSocket...");
            await socketStore.sendMessage({ type: 'request_variables' });
        } catch (e) {
            console.error("[VariablesStore] Error requesting variables:", e);
            isLoading.value = false; // Set false on send error
        }
    }

    /**
     * (English Hardcode) Called by socket.js when the real list arrives.
     */
    function updateVariablesList(variableList) {
        variables.value = variableList;
        isLoading.value = false;
        console.log(`[VariablesStore] Updated variables list from engine: ${variableList.length} items.`);
    }

    /**
     * (English Hardcode) Called by socket.js when the fetch fails.
     */
    function handleFetchError(errorMessage) {
        console.warn(`[VariablesStore] Fetch variables failed: ${errorMessage}`);
        isLoading.value = false;
    }

    /**
     * Saves (creates or updates) a variable on the local engine.
     * @param {string} name - The unique name of the variable.
     * @param {object} data - The variable data (value, is_secret, etc.)
     */
    async function saveVariable(name, data) {
        isLoading.value = true;
        const socketStore = useSocketStore();
        try {
            console.log(`[VariablesStore] Saving variable '${name}' via WebSocket...`);
            await socketStore.sendMessage({
                type: 'update_variable',
                name: name,
                data: data
            });
        } catch (e) {
            console.error(`[VariablesStore] Error saving variable '${name}':`, e);
            isLoading.value = false;
        }
    }

    /**
     * Deletes a variable from the local engine.
     * @param {string} name - The name of the variable to delete.
     */
    async function removeVariable(name) {
        isLoading.value = true;
        const socketStore = useSocketStore();
        try {
            console.log(`[VariablesStore] Deleting variable '${name}' via WebSocket...`);
            await socketStore.sendMessage({
                type: 'delete_variable',
                name: name
            });
        } catch (e) {
            console.error(`[VariablesStore] Error deleting variable '${name}':`, e);
            isLoading.value = false;
        }
    }

    return {
        variables,
        isLoading,
        fetchVariables,
        saveVariable,
        removeVariable,
        updateVariablesList,
        handleFetchError
    };
});
