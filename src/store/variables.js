// C:\FLOWORK\flowork-gui\template\web\src\store\variables.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
// (COMMENT) Deprecated API calls are commented out, per Golden Rule #3
// import { getVariables, updateVariable, deleteVariable } from '@/api';
// (ADDED) Import the socket store
import { useSocketStore } from './socket';

export const useVariablesStore = defineStore('variables', () => {
    // --- STATE ---
    const variables = ref([]);
    const isLoading = ref(false);

    // --- ACTIONS ---

    /**
     * Fetches all global variables from the local engine.
     */
    async function fetchVariables() {
        isLoading.value = true;
        // (ADDED) Get socket store
        const socketStore = useSocketStore();
        try {
            console.log("[VariablesStore] Requesting variables via WebSocket..."); // English Hardcode
            // (REPLACED) await getVariables();
            await socketStore.sendMessage({ type: 'request_variables' }); // English Hardcode
            // (COMMENT) isLoading will be set to false by the socket 'onmessage' handler in socket.js
            // (COMMENT) variables.value will also be set by the socket handler
        } catch (e) {
            console.error("[VariablesStore] Error requesting variables:", e); // English Hardcode
            isLoading.value = false; // Set false on send error
        }
    }

    /**
     * Saves (creates or updates) a variable on the local engine.
     * @param {string} name - The unique name of the variable.
     * @param {object} data - The variable data (value, is_secret, etc.)
     */
    async function saveVariable(name, data) {
        isLoading.value = true;
        // (ADDED) Get socket store
        const socketStore = useSocketStore();
        try {
            console.log(`[VariablesStore] Saving variable '${name}' via WebSocket...`); // English Hardcode
            // (REPLACED) await updateVariable(name, data);
            await socketStore.sendMessage({
                type: 'update_variable', // English Hardcode
                name: name,
                data: data
            });
            // (COMMENT) isLoading and variable list will be updated by socket handler on success
        } catch (e) {
            console.error(`[VariablesStore] Error saving variable '${name}':`, e); // English Hardcode
            isLoading.value = false;
        }
    }

    /**
     * Deletes a variable from the local engine.
     * @param {string} name - The name of the variable to delete.
     */
    async function removeVariable(name) {
        isLoading.value = true;
        // (ADDED) Get socket store
        const socketStore = useSocketStore();
        try {
            console.log(`[VariablesStore] Deleting variable '${name}' via WebSocket...`); // English Hardcode
            // (REPLACED) await deleteVariable(name);
            await socketStore.sendMessage({
                type: 'delete_variable', // English Hardcode
                name: name
            });
            // (COMMENT) isLoading and variable list will be updated by socket handler on success
        } catch (e) {
            console.error(`[VariablesStore] Error deleting variable '${name}':`, e); // English Hardcode
            isLoading.value = false;
        }
    }

    // --- RETURN ---
    return {
        variables,
        isLoading,
        fetchVariables,
        saveVariable,
        removeVariable,
    };
});