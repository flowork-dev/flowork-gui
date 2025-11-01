//#######################################################################
//# WEBSITE https://flowork.cloud
//# File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\engines.js
//# DESKRIPSI : FASE 3 - Menggunakan FULL CODE dari user dan
//#             mengimplementasikan `fetchSharedEngines` (Perbaikan bug N/A).
//#######################################################################
import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth'; // Dibutuhkan untuk mendapatkan user ID saat ini
// --- PENAMBAHAN FASE 3: Import API baru ---
import {
    apiFetchEngines, apiRegisterEngine, apiDeleteEngine,
    apiFetchSharedEngines, apiGrantShare, apiRevokeShare, apiFetchEngineShares
} from '@/api';
import { useUiStore } from './ui'; // Untuk menampilkan notifikasi
import { useSocketStore } from './socket'; // Untuk reaktivitas status & trigger connect

export const useEngineStore = defineStore('engines', () => {
    // --- STATE ---
    const engines = ref([]); // Daftar engine milik user
    // --- PENAMBAHAN FASE 3: State baru ---
    const sharedEngines = ref([]); // Daftar engine yang di-share ke user
    const isLoading = ref(false);
    const error = ref(null);
    const selectedEngineId = ref(localStorage.getItem('flowork_selected_engine_id')); // English Hardcode

    // --- GETTERS ---
    const allAvailableEngines = computed(() => {
        const owned = engines.value.map(e => ({
            ...e,
            isOwner: true,
            // (PENAMBAHAN FASE 3): Tambahkan info pemilik (diri sendiri)
            owner: { username: useAuthStore().user?.username || 'You' } // English Hardcode
        }));
        const shared = sharedEngines.value.map(e => ({
            ...e,
            isOwner: false
            // Owner info sudah ada dari API /shared-engines
        }));
        // Gabungkan dan urutkan berdasarkan nama
        return [...owned, ...shared].sort((a, b) => a.name.localeCompare(b.name));
    });

    const selectedEngine = computed(() => {
        return allAvailableEngines.value.find(e => e.id === selectedEngineId.value);
    });

    const hasOnlineEngine = computed(() => {
        return allAvailableEngines.value.some(e => e.status === 'online'); // English Hardcode
    });

    // --- ACTIONS ---

    /**
     * Mengambil daftar engine milik user DAN yang di-share dari Gateway.
     */
    async function fetchEngines() {
        isLoading.value = true;
        error.value = null;
        console.log("[EngineStore] Fetching user's owned and shared engines..."); // English Log
        try {
            // Fetch owned engines
            const ownedResponseData = await apiFetchEngines();
            if (ownedResponseData.error) throw new Error(ownedResponseData.error);
            engines.value = ownedResponseData.map(engine => ({
                ...engine,
                status: engine.status || 'unknown', // English Hardcode
                vitals: engine.vitals || null,
                isOwner: true
            }));
            console.log(`[EngineStore] Fetched ${engines.value.length} owned engines.`); // English Log

            // Fetch shared engines
            await fetchSharedEngines(); // Panggil fungsi terpisah (yang sekarang sudah diisi)

            // --- Logika Pemilihan Default (Tetap Sama) ---
            const currentSelectionValid = allAvailableEngines.value.some(e => e.id === selectedEngineId.value);

            if (!selectedEngineId.value || !currentSelectionValid) {
                console.log("[EngineStore] No valid engine selected or previous selection invalid. Selecting default..."); // English Log
                const firstOnline = allAvailableEngines.value.find(e => e.status === 'online'); // English Hardcode
                const firstEngine = allAvailableEngines.value[0];
                const defaultEngineId = firstOnline ? firstOnline.id : (firstEngine ? firstEngine.id : null);
                console.log(`[EngineStore] Default selected: ${defaultEngineId}`); // English Log
                setSelectedEngineId(defaultEngineId, false);
            } else {
                console.log(`[EngineStore] Previous selection ${selectedEngineId.value} is valid.`); // English Log
                // Trigger initial connect if needed (handled by auth.js now)
            }
            // --- Akhir Logika Pemilihan Default ---

        } catch (e) {
            error.value = e.error || e.message || 'Failed to fetch engines.'; // English Log
            console.error('[EngineStore] Error fetching engines:', error.value); // English Log
            engines.value = [];
            sharedEngines.value = [];
            setSelectedEngineId(null, false);
        } finally {
            isLoading.value = false;
        }
    }

     /**
     * (PERBAIKAN) Mengambil daftar engine yang di-share ke user dari Gateway.
     */
    async function fetchSharedEngines() {
        console.log("[EngineStore] Fetching shared engines..."); // English Log
        try {
            // --- PERBAIKAN FASE 3: Panggil API sebenarnya ---
            const sharedData = await apiFetchSharedEngines();
            if (sharedData.error) throw new Error(sharedData.error);

            sharedEngines.value = sharedData.map(engine => ({
                ...engine,
                status: engine.status || 'unknown', // English Hardcode
                vitals: engine.vitals || null,
                isOwner: false
                // owner object sudah ada dari API
            }));
             console.log(`[EngineStore] Fetched ${sharedEngines.value.length} shared engines.`); // English Log
        } catch (e) {
            console.error('[EngineStore] Error fetching shared engines:', e.error || e.message); // English Log
            sharedEngines.value = []; // Set ke array kosong jika fetch gagal
        }
    }

    /**
     * Mendaftarkan engine baru melalui Gateway. (Tetap Sama)
     * @param {string} name - Nama untuk engine baru.
     */
    async function registerEngine(name) {
        isLoading.value = true;
        error.value = null;
        const uiStore = useUiStore();
        console.log(`[EngineStore] Registering new engine with name: ${name}`); // English Log
        try {
            const newEngineData = await apiRegisterEngine({ name });

            if (newEngineData.error) throw new Error(newEngineData.error);

            uiStore.showNotification({
                text: `Engine '${newEngineData.name}' registered! Please copy the token and ID below.`, // English Hardcode
                color: 'success', // English Hardcode
                timeout: 20000 // Lebih lama agar bisa disalin
            });

            const message = `IMPORTANT: Copy these details and add them to your engine's C:\\FLOWORK\\.env file:\n\n` + // English Hardcode
                          `FLOWORK_ENGINE_ID=${newEngineData.id}\n` + // English Hardcode
                          `FLOWORK_ENGINE_TOKEN=${newEngineData.raw_token}\n\n` + // English Hardcode
                          `(The token is only shown once!)`; // English Hardcode
            alert(message);

            await fetchEngines(); // Fetch ulang daftar engine (termasuk shared)
            // Otomatis pilih engine baru jika ini yang pertama
            if (engines.value.length === 1 && sharedEngines.value.length === 0) {
                 setSelectedEngineId(newEngineData.id); // Otomatis connect
            } else if (!selectedEngineId.value && engines.value.length > 0) {
                 // Jika belum ada yang terpilih, pilih yang baru ini
                 setSelectedEngineId(newEngineData.id); // Otomatis connect
            }
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to register engine.'; // English Log
            console.error('[EngineStore] Error registering engine:', error.value); // English Log
            uiStore.showNotification({ text: error.value, color: 'error' }); // English Hardcode
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
        console.log(`[EngineStore] Deleting engine: ${engineToDelete?.name || engineId}`); // English Log
        try {
            const result = await apiDeleteEngine(engineId);

            if (result.error) throw new Error(result.error);

            uiStore.showNotification({ text: `Engine '${engineToDelete?.name || engineId}' deleted.`, color: 'info' }); // English Hardcode

            // --- Update Lokal State ---
            engines.value = engines.value.filter(e => e.id !== engineId);
            sharedEngines.value = sharedEngines.value.filter(e => e.id !== engineId);
            // --- Akhir Update ---

            if (selectedEngineId.value === engineId) {
                const nextEngine = allAvailableEngines.value[0];
                console.log("[EngineStore] Deleted engine was selected. Selecting new default:", nextEngine?.id); // English Log
                setSelectedEngineId(nextEngine ? nextEngine.id : null);
            } else {
                // Fetch ulang untuk memastikan data konsisten jika tidak ada perubahan selection
                 await fetchEngines();
            }
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to delete engine.'; // English Log
            console.error('[EngineStore] Error deleting engine:', error.value); // English Log
            uiStore.showNotification({ text: error.value, color: 'error' }); // English Hardcode
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Memperbarui status engine berdasarkan event dari WebSocket Gateway ATAU dari API. (Tetap Sama)
     */
    function updateEngineStatus(statusData) {
        // Find in both owned and shared lists
        const engineRef = engines.value.find(e => e.id === statusData.engine_id) || sharedEngines.value.find(e => e.id === statusData.engine_id);

        if (engineRef) {
            engineRef.status = statusData.status || engineRef.status;
            engineRef.last_seen = statusData.last_seen || engineRef.last_seen;
            if (statusData.name) engineRef.name = statusData.name; // Update name if provided (e.g., from rename)
            console.log(`[EngineStore] Updated status for engine ${engineRef.name || statusData.engine_id}: ${engineRef.status}`); // English Log
        } else {
             console.warn(`[EngineStore] Received status update for unknown engine: ${statusData.engine_id}`); // English Log
        }
    }

    /**
     * Memperbarui data vitals engine berdasarkan event dari WebSocket Gateway. (Tetap Sama)
     */
    function updateEngineVitals(vitalsData) {
        const engineRef = engines.value.find(e => e.id === vitalsData.engine_id) || sharedEngines.value.find(e => e.id === vitalsData.engine_id);
        if (engineRef) {
            engineRef.vitals = vitalsData.vitals;
            // Mark as online if receiving vitals
            if (engineRef.status !== 'online') { // English Hardcode
                engineRef.status = 'online'; // English Hardcode
                console.log(`[EngineStore] Engine ${engineRef.name || vitalsData.engine_id} marked as online due to vitals update.`); // English Log
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
            console.log(`[EngineStore] Setting selected engine to: ${engineId}. Trigger Reconnect: ${triggerReconnect}`); // English Log
            selectedEngineId.value = engineId;
            if (engineId) {
                localStorage.setItem('flowork_selected_engine_id', engineId); // English Hardcode
                if (triggerReconnect) {
                    const socketStore = useSocketStore();
                    socketStore.switchEngine(engineId);
                }
            } else {
                localStorage.removeItem('flowork_selected_engine_id'); // English Hardcode
                if (triggerReconnect) {
                    const socketStore = useSocketStore();
                    socketStore.disconnect();
                }
            }
        } else {
             console.log(`[EngineStore] setSelectedEngineId skipped: ID ${engineId} is already selected.`); // English Log
        }
    }

    // --- PENAMBAHAN FASE 3: Actions untuk Manajemen Share ---
    /**
     * Mengambil daftar user yang sudah di-share engine tertentu. (Untuk dialog Manage Shares)
     * @param {string} engineId - ID engine yang ingin diperiksa shares-nya.
     */
    async function fetchEngineShares(engineId) {
        const uiStore = useUiStore();
        try {
            console.log(`[EngineStore] Fetching shares for engine ${engineId}...`); // English Log
            const sharesList = await apiFetchEngineShares(engineId);
            if (sharesList.error) throw new Error(sharesList.error);
            return sharesList; // Kembalikan data untuk dialog
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to fetch engine shares.'; // English Log
            console.error('[EngineStore] Error fetching engine shares:', errorMsg); // English Log
            uiStore.showNotification({ text: errorMsg, color: 'error' }); // English Hardcode
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
            console.log(`[EngineStore] Granting share for engine ${engineId} to ${shareWithIdentifier}...`); // English Log
            const result = await apiGrantShare(engineId, shareWithIdentifier);
            if (result.error) throw new Error(result.error);
            uiStore.showNotification({ text: result.message || 'Share granted successfully.', color: 'success' }); // English Hardcode
            return true; // Berhasil
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to grant share.'; // English Log
            console.error('[EngineStore] Error granting share:', errorMsg); // English Log
            uiStore.showNotification({ text: errorMsg, color: 'error' }); // English Hardcode
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
            console.log(`[EngineStore] Revoking share for engine ${engineId} from user ${sharedUserId}...`); // English Log
            const result = await apiRevokeShare(engineId, sharedUserId);
            if (result.error) throw new Error(result.error);
            uiStore.showNotification({ text: result.message || 'Share revoked successfully.', color: 'info' }); // English Hardcode
            return true; // Berhasil
        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to revoke share.'; // English Log
            console.error('[EngineStore] Error revoking share:', errorMsg); // English Log
            uiStore.showNotification({ text: errorMsg, color: 'error' }); // English Hardcode
            return false; // Gagal
        } finally {
             isLoading.value = false;
        }
    }
    // --- AKHIR PENAMBAHAN FASE 3 ---


    return {
        // State
        engines, sharedEngines, isLoading, error, selectedEngineId,
        // Getters
        allAvailableEngines, selectedEngine, hasOnlineEngine,
        // Actions
        fetchEngines, registerEngine, deleteEngine, updateEngineStatus, updateEngineVitals, setSelectedEngineId,
        // --- PENAMBAHAN FASE 3: Export actions baru ---
        fetchSharedEngines, fetchEngineShares, grantShare, revokeShare
    };
});