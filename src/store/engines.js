//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\engines.js total lines 352 
//#######################################################################

import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import {
    apiFetchEngines, apiRegisterEngine, apiDeleteEngine,
    apiFetchSharedEngines, apiGrantShare, apiRevokeShare, apiFetchEngineShares
} from '@/api';
import { useUiStore } from './ui';
import { useSocketStore } from './socket';
import { useWorkflowStore } from './workflow';
import { useComponentStore } from './components';
import { useVariablesStore } from './variables';
import { useSettingsStore } from './settings';
import { usePromptStore } from './prompts';
import { useTrainingStore } from './training';

export const useEngineStore = defineStore('engines', () => {
    const engines = ref([]);
    const sharedEngines = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    const selectedEngineId = ref(localStorage.getItem('flowork_selected_engine_id'));

    const allAvailableEngines = computed(() => {
        const owned = engines.value.map(e => ({
            ...e,
            isOwner: true,
            owner: { username: useAuthStore().user?.username || 'You' }
        }));
        const shared = sharedEngines.value.map(e => ({
            ...e,
            isOwner: false
        }));
        return [...owned, ...shared].sort((a, b) => a.name.localeCompare(b.name));
    });

    const selectedEngine = computed(() => {
        return allAvailableEngines.value.find(e => e.id === selectedEngineId.value);
    });

    const hasOnlineEngine = computed(() => {
        return allAvailableEngines.value.some(e => e.status === 'online');
    });

    async function fetchEngines() {
        isLoading.value = true;
        error.value = null;
        console.log("[EngineStore] Fetching user's owned and shared engines...");
        try {
            const ownedResponseData = await apiFetchEngines();
            if (ownedResponseData.error) throw new Error(ownedResponseData.error);
            engines.value = ownedResponseData.map(engine => ({
                ...engine,
                status: engine.status || 'unknown',
                vitals: engine.vitals || null,
                isOwner: true
            }));
            console.log(`[EngineStore] Fetched ${engines.value.length} owned engines.`);

            await fetchSharedEngines();

            const currentSelectionValid = allAvailableEngines.value.some(e => e.id === selectedEngineId.value);

            if (!selectedEngineId.value || !currentSelectionValid) {
                console.log("[EngineStore] No valid engine selected or previous selection invalid. Selecting default...");
                const firstOnline = allAvailableEngines.value.find(e => e.status === 'online');
                const firstEngine = allAvailableEngines.value[0];
                const defaultEngineId = firstOnline ? firstOnline.id : (firstEngine ? firstEngine.id : null);
                console.log(`[EngineStore] Default selected: ${defaultEngineId}`);
                setSelectedEngineId(defaultEngineId, false);
            } else {
                console.log(`[EngineStore] Previous selection ${selectedEngineId.value} is valid.`);
            }

        } catch (e) {
            error.value = e.error || e.message || 'Failed to fetch engines.';
            console.error('[EngineStore] Error fetching engines:', error.value);
            engines.value = [];
            sharedEngines.value = [];
            setSelectedEngineId(null, false);
        } finally {
            isLoading.value = false;
        }
    }
    async function fetchSharedEngines() {
        console.log("[EngineStore] Fetching shared engines...");
        try {
            const sharedData = await apiFetchSharedEngines();
            if (sharedData.error) throw new Error(sharedData.error);

            sharedEngines.value = sharedData.map(engine => ({
                ...engine,
                status: engine.status || 'unknown',
                vitals: engine.vitals || null,
                isOwner: false
            }));
             console.log(`[EngineStore] Fetched ${sharedEngines.value.length} shared engines.`);
        } catch (e) {
            console.error('[EngineStore] Error fetching shared engines:', e.error || e.message);
            sharedEngines.value = []; // Set ke array kosong jika fetch gagal
        }
    }

    /**
     * Mendaftarkan engine baru melalui Gateway. (Tetap Sama)
     * @param {string} name
     */
    async function registerEngine(name) {
        isLoading.value = true;
        error.value = null;
        const uiStore = useUiStore();
        console.log(`[EngineStore] Registering new engine with name: ${name}`);
        try {
            const newEngineData = await apiRegisterEngine({ name });

            if (newEngineData.error) throw new Error(newEngineData.error);

            uiStore.showNotification({
                text: `Engine '${newEngineData.name}' registered! Please copy the token and ID below.`,
                color: 'success',
                timeout: 7000
            });

            uiStore.showTokenDialog({
                title: 'Engine Registered Successfully!',
                text: "Copy these details and add them to your engine's .env file. (The token is only shown once!)",
                items: [
                    { label: 'FLOWORK_ENGINE_ID', value: newEngineData.id },
                    { label: 'FLOWORK_ENGINE_TOKEN', value: newEngineData.raw_token }
                ]
            });


            await fetchEngines(); // Fetch ulang daftar engine (termasuk shared)
            if (engines.value.length === 1 && sharedEngines.value.length === 0) {
                 setSelectedEngineId(newEngineData.id);
            } else if (!selectedEngineId.value && engines.value.length > 0) {
                 setSelectedEngineId(newEngineData.id);
            }
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to register engine.';
            console.error('[EngineStore] Error registering engine:', error.value);
            uiStore.showNotification({ text: error.value, color: 'error' });
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Menghapus engine melalui Gateway. (Tetap Sama)
     * @param {string} engineId - ID engine yang akan dihapus.
     */
    async function deleteEngine(engineId) {
        isLoading.value = true;
        error.value = null;
        const uiStore = useUiStore();
        const engineToDelete = allAvailableEngines.value.find(e => e.id === engineId);
        console.log(`[EngineStore] Deleting engine: ${engineToDelete?.name || engineId}`);
        try {
            const result = await apiDeleteEngine(engineId);

            if (result.error) throw new Error(result.error);

            uiStore.showNotification({ text: `Engine '${engineToDelete?.name || engineId}' deleted.`, color: 'info' });

            engines.value = engines.value.filter(e => e.id !== engineId);
            sharedEngines.value = sharedEngines.value.filter(e => e.id !== engineId);

            if (selectedEngineId.value === engineId) {
                const nextEngine = allAvailableEngines.value[0];
                console.log("[EngineStore] Deleted engine was selected. Selecting new default:", nextEngine?.id);
                setSelectedEngineId(nextEngine ? nextEngine.id : null);
            } else {
                 await fetchEngines();
            }
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to delete engine.';
            console.error('[EngineStore] Error deleting engine:', error.value);
            uiStore.showNotification({ text: error.value, color: 'error' });
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Memperbarui status engine berdasarkan event dari WebSocket Gateway ATAU dari API. (Tetap Sama)
     */
    function updateEngineStatus(statusData) {
        const workflowStore = useWorkflowStore();
        const componentStore = useComponentStore();
        const variableStore = useVariablesStore();
        const settingsStore = useSettingsStore();
        const promptStore = usePromptStore();
        const trainingStore = useTrainingStore();

        const engineRef = engines.value.find(e => e.id === statusData.engine_id) || sharedEngines.value.find(e => e.id === statusData.engine_id);

        if (engineRef) {
            const oldStatus = engineRef.status;

            engineRef.status = statusData.status || engineRef.status;
            engineRef.last_seen = statusData.last_seen || engineRef.last_seen;
            if (statusData.name) engineRef.name = statusData.name; // Update name if provided (e.g., from rename)
            console.log(`[EngineStore] Updated status for engine ${engineRef.name || statusData.engine_id}: ${engineRef.status}`);

            const newStatus = engineRef.status;
            if (engineRef.id === selectedEngineId.value && newStatus === 'online' && oldStatus !== 'online') {
                console.log(`[EngineStore] Selected engine ${engineRef.id} just came ONLINE. Triggering full data re-fetch...`); // English Log

                settingsStore.fetchSettings();
                workflowStore.fetchPresets();
                variableStore.fetchVariables();
                componentStore.forceRefetchAllComponents();
                workflowStore.fetchUserFavorites();
                componentStore.fetchUserFavorites();
                promptStore.fetchPrompts();
                trainingStore.fetchLocalModels();
                trainingStore.fetchTrainingJobStatus(null);
            }

        } else {
             console.warn(`[EngineStore] Received status update for unknown engine: ${statusData.engine_id}`);
        }
    }

    /**
     * Memperbarui data vitals engine berdasarkan event dari WebSocket Gateway. (Tetap Sama)
     */
    function updateEngineVitals(vitalsData) {
        const engineRef = engines.value.find(e => e.id === vitalsData.engine_id) || sharedEngines.value.find(e => e.id === vitalsData.engine_id);
        if (engineRef) {
            engineRef.vitals = vitalsData.vitals;
            if (engineRef.status !== 'online') {
                engineRef.status = 'online';
                console.log(`[EngineStore] Engine ${engineRef.name || vitalsData.engine_id} marked as online due to vitals update.`);
                useComponentStore().forceRefetchAllComponents(); // (English) Ensure components are refreshed on first vitals too.
            }
        }
    }

    /**
     * Menetapkan engine yang dipilih oleh user dan MEMICU koneksi ulang. (Tetap Sama)
     * @param {string | null} engineId - ID engine yang dipilih, atau null.
     * @param {boolean} triggerReconnect - Apakah harus memicu switchEngine di socketStore. Default true.
     */
    function setSelectedEngineId(engineId, triggerReconnect = true) {
        if (selectedEngineId.value !== engineId || engineId === null) {
            console.log(`[EngineStore] Setting selected engine to: ${engineId}. Trigger Reconnect: ${triggerReconnect}`);
            selectedEngineId.value = engineId;
            if (engineId) {
                localStorage.setItem('flowork_selected_engine_id', engineId);
                if (triggerReconnect) {
                    const socketStore = useSocketStore();
                    socketStore.switchEngine(engineId);
                }
            } else {
                localStorage.removeItem('flowork_selected_engine_id');
                if (triggerReconnect) {
                    const socketStore = useSocketStore();
                    socketStore.disconnect();
                }
            }
        } else {
             console.log(`[EngineStore] setSelectedEngineId skipped: ID ${engineId} is already selected.`);
        }
    }

    /**
     * Mengambil daftar user yang sudah di-share engine tertentu. (Untuk dialog Manage Shares)
     * @param {string} engineId - ID engine yang ingin diperiksa shares-nya.
     */
    async function fetchEngineShares(engineId) {
        const uiStore = useUiStore();
        try {
            console.log(`[EngineStore] Fetching shares for engine ${engineId}...`);
            const sharesList = await apiFetchEngineShares(engineId);
            if (sharesList.error) throw new Error(sharesList.error);
            return sharesList; // Kembalikan data untuk dialog
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to fetch engine shares.';
            console.error('[EngineStore] Error fetching engine shares:', errorMsg);
            uiStore.showNotification({ text: errorMsg, color: 'error' });
            return []; // Kembalikan array kosong jika gagal
        }
    }

    /**
     * Memberikan akses share engine ke user lain.
     * @param {string} engineId - ID engine yang akan di-share.
     * @param {string} shareWithIdentifier - Username atau public address user.
     */
    async function grantShare(engineId, shareWithIdentifier) {
        const uiStore = useUiStore();
        isLoading.value = true; // Bisa gunakan loading state spesifik untuk dialog
        try {
            console.log(`[EngineStore] Granting share for engine ${engineId} to ${shareWithIdentifier}...`);
            const result = await apiGrantShare(engineId, shareWithIdentifier);
            if (result.error) throw new Error(result.error);
            uiStore.showNotification({ text: result.message || 'Share granted successfully.', color: 'success' });
            return true; // Berhasil
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to grant share.';
            console.error('[EngineStore] Error granting share:', errorMsg);
            uiStore.showNotification({ text: errorMsg, color: 'error' });
            return false; // Gagal
        } finally {
             isLoading.value = false;
        }
    }

    /**
     * Mencabut akses share engine dari user.
     * @param {string} engineId - ID engine.
     * @param {string} sharedUserId - ID user yang aksesnya akan dicabut.
     */
    async function revokeShare(engineId, sharedUserId) {
         const uiStore = useUiStore();
         isLoading.value = true;
         try {
            console.log(`[EngineStore] Revoking share for engine ${engineId} from user ${sharedUserId}...`);
            const result = await apiRevokeShare(engineId, sharedUserId);
            if (result.error) throw new Error(result.error);
            uiStore.showNotification({ text: result.message || 'Share revoked successfully.', color: 'info' });
            return true; // Berhasil
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to revoke share.';
            console.error('[EngineStore] Error revoking share:', errorMsg);
            uiStore.showNotification({ text: errorMsg, color: 'error' });
            return false; // Gagal
        } finally {
             isLoading.value = false;
        }
    }


    return {
        engines, sharedEngines, isLoading, error, selectedEngineId,
        allAvailableEngines, selectedEngine, hasOnlineEngine,
        fetchEngines, registerEngine, deleteEngine, updateEngineStatus, updateEngineVitals, setSelectedEngineId,
        fetchSharedEngines, fetchEngineShares, grantShare, revokeShare
    };
});
