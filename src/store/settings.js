import { defineStore } from 'pinia';
import { ref } from 'vue';
// (PERBAIKAN) Hapus 'getSettings' dan 'saveSettings' dari api/index.js
// (PENAMBAHAN KODE) Import store yang diperlukan
import { useUiStore } from './ui';
import { useSocketStore } from './socket'; // Import socket store
// (KOMENTAR) getSettings tidak lagi dipakai
// import { getSettings } from '@/api';

export const useSettingsStore = defineStore('settings', () => {
    // --- STATE ---
    const settings = ref({});
    const isLoading = ref(false);
    const error = ref(null);
    const activeSection = ref('general');

    // --- ACTIONS ---

    /**
     * Fetches the latest settings from the backend and populates the store.
     */
    async function fetchSettings() {
        isLoading.value = true;
        error.value = null;
        console.log('[STORE] Syncing settings state...'); // English Log
        try {
            // (PERBAIKAN KUNCI)
            // Jika settings sudah di-load (oleh socket.js saat startup),
            // kita hanya perlu mengaplikasikan preferensi UI.
            if (Object.keys(settings.value).length > 0) {
                 const uiStore = useUiStore();
                 uiStore.loadUiPreferences(settings.value);
                 console.log('[STORE] Settings already loaded, applied UI preferences.'); // English Log
            } else {
                 // Jika settings kosong (misal, user refresh halaman Settings),
                 // kita minta manual. Socket listener akan tetap menanganinya.
                 console.log('[STORE] Settings empty. Requesting via WebSocket...'); // English Log
                 const socketStore = useSocketStore();
                 // Panggilan ini aman karena diasumsikan socket sudah terhubung
                 // jika user bisa bernavigasi ke halaman Settings.
                 await socketStore.sendMessage({ type: 'request_settings' }); // English Hardcode
            }
        } catch (e) {
            // Error ini sekarang akan muncul jika socket.sendMessage gagal (misal, tidak konek)
            error.value = e.message || 'Failed to request settings. Is engine connected?'; // English Hardcode
            console.error('[STORE] Failed to request settings:', e); // English Log
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Saves the current settings state to the backend via WebSocket.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async function saveSettingsAction() {
        const uiStore = useUiStore();
        // (PENAMBAHAN KODE) Panggil socketStore
        const socketStore = useSocketStore();
        isLoading.value = true;
        error.value = null;
        console.log('[STORE] Saving user-specific settings via WebSocket...'); // English Log
        try {
            // (PERBAIKAN) Ganti `saveSettings(settings.value)` dengan `socketStore.sendMessage`
            await socketStore.sendMessage({
                type: 'save_settings', // English Hardcode
                settings: settings.value
            });

            console.log('[STORE] Settings saved successfully.'); // English Log
            uiStore.showNotification({ text: 'Settings saved successfully!', color: 'success' }); // English Hardcode
            return true;
        } catch (e) {
            error.value = e.message || e.error || 'Failed to save settings.'; // English Hardcode
            console.error('[STORE] Failed to save settings:', e); // English Log
            uiStore.showNotification({ text: error.value, color: 'error' }); // English Hardcode
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    // (PENAMBAHAN KODE) Aksi baru untuk menyimpan satu setting
    /**
     * Saves a single setting key-value pair and persists it.
     * @param {string} key - The setting key (e.g., 'ui_footer_pinned')
     * @param {*} value - The value to save.
     */
    async function saveSetting(key, value) {
        if (settings.value[key] === value) return; // Tidak ada perubahan
        console.log(`[STORE] Saving setting: ${key} = ${value}`); // English Log
        settings.value[key] = value;
        // Panggil saveSettingsAction yang sudah diperbaiki
        await saveSettingsAction();
    }


    function setActiveSection(section) {
        activeSection.value = section;
    }

    // --- RETURN ---
    return {
        settings,
        isLoading,
        error,
        activeSection,
        fetchSettings,
        saveSettingsAction,
        saveSetting, // (PENAMBAHAN KODE)
        setActiveSection,
    };
});