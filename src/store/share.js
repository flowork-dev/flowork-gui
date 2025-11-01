import { defineStore } from 'pinia';
import { ref } from 'vue';
// (PERUBAHAN) Kita import semua fungsi API baru
import { apiGetWorkflowShares, apiCreateShareLink, apiUpdateSharePermission, apiDeleteShare } from '@/api';
import { useUiStore } from './ui';

export const useShareStore = defineStore('share', () => {
    // --- STATE ---
    const isModalOpen = ref(false);
    const workflowToShare = ref(null); // Objek workflow yang di-share ({ name: 'preset-name' })
    const shares = ref([]); // Daftar link share yang sudah ada untuk workflow ini
    const isLoading = ref(false); // Loading untuk create/update/delete
    const isLoadingShares = ref(false); // Loading untuk fetch daftar link

    // --- ACTIONS ---

    /**
     * Membuka modal sharing untuk workflow tertentu.
     * @param {object} workflow - Objek workflow yang akan di-share, minimal punya 'name'.
     */
    async function openShareModal(workflow) {
        if (!workflow || !workflow.name) {
            console.error('[ShareStore] Failed to open share modal: workflow data incomplete.'); // English Log
            return;
        }
        workflowToShare.value = workflow;
        isModalOpen.value = true;
        shares.value = []; // Kosongkan dulu
        await fetchShares(); // Langsung fetch daftar link yang sudah ada
    }

    function closeShareModal() {
        isModalOpen.value = false;
        workflowToShare.value = null;
        shares.value = [];
    }

    // Aksi baru untuk mengambil daftar link share dari API
    async function fetchShares() {
        if (!workflowToShare.value) return;
        isLoadingShares.value = true;
        const uiStore = useUiStore();
        try {
            console.log(`[ShareStore] Fetching shares for workflow: ${workflowToShare.value.name}`); // English Log
            // PERBAIKAN: Pastikan API dipanggil dengan benar
            const result = await apiGetWorkflowShares(workflowToShare.value.name);
            if (result.error) throw new Error(result.error);
            shares.value = result; // Simpan daftar link
        } catch (error) {
            console.error('[ShareStore] Failed to fetch shares:', error); // English Log
            uiStore.showNotification({ text: error.message || 'Failed to fetch share links.', color: 'error' }); // English Hardcode
            shares.value = [];
        } finally {
            isLoadingShares.value = false;
        }
    }

    // Aksi untuk membuat link share baru
    async function createShareLink(permissionLevel, linkName) {
        if (!workflowToShare.value) return;

        const uiStore = useUiStore();
        isLoading.value = true;
        try {
            console.log(`[ShareStore] Creating share link for ${workflowToShare.value.name} with permission ${permissionLevel}`); // English Log
            // PERBAIKAN: Panggil API yang benar
            const newShare = await apiCreateShareLink(workflowToShare.value.name, permissionLevel, linkName);
            if (newShare.error) throw new Error(newShare.error); // Handle error dari API
            shares.value.push(newShare); // Tambahkan link baru ke list
            uiStore.showNotification({ text: 'Share link created successfully!', color: 'success' }); // English Hardcode
        } catch (error) {
             // PERBAIKAN: Tampilkan error yang lebih spesifik jika ada
            console.error('[ShareStore] Failed to create share link:', error); // English Log
            uiStore.showNotification({ text: error.message || 'Failed to create share link.', color: 'error' }); // English Hardcode
        } finally {
            isLoading.value = false;
        }
    }

    // Aksi baru untuk update permission link
    async function updateShare(shareId, newPermission) {
        const uiStore = useUiStore();
        isLoading.value = true; // Bisa gunakan isLoading atau state terpisah
        try {
            console.log(`[ShareStore] Updating permission for share ${shareId} to ${newPermission}`); // English Log
            // PERBAIKAN: Panggil API yang benar
            const updatedShare = await apiUpdateSharePermission(shareId, newPermission);
            if (updatedShare.error) throw new Error(updatedShare.error);
            // Update data lokal di UI
            const shareIndex = shares.value.findIndex(s => s.share_id === shareId); // PERBAIKAN: Gunakan share_id
            if (shareIndex > -1) {
                shares.value[shareIndex].permission_level = newPermission;
            }
            uiStore.showNotification({ text: 'Permission updated.', color: 'info' }); // English Hardcode
        } catch (error) {
            console.error('[ShareStore] Failed to update permission:', error); // English Log
            uiStore.showNotification({ text: error.message || 'Failed to update permission.', color: 'error' }); // English Hardcode
        } finally {
            isLoading.value = false;
        }
    }

    // Aksi baru untuk menghapus link share
    async function deleteShare(shareId) {
        const uiStore = useUiStore();
        isLoading.value = true;
        try {
            console.log(`[ShareStore] Deleting share link ${shareId}`); // English Log
            // PERBAIKAN: Panggil API yang benar
            const result = await apiDeleteShare(shareId);
            if (result.error) throw new Error(result.error);
            shares.value = shares.value.filter(s => s.share_id !== shareId); // PERBAIKAN: Gunakan share_id
            uiStore.showNotification({ text: 'Share link deleted.', color: 'info' }); // English Hardcode
        } catch (error) {
            console.error('[ShareStore] Failed to delete share link:', error); // English Log
            uiStore.showNotification({ text: error.message || 'Failed to delete share link.', color: 'error' }); // English Hardcode
        } finally {
            isLoading.value = false;
        }
    }

    // --- RETURN ---
    return {
        isModalOpen,
        workflowToShare,
        shares,
        isLoading,
        isLoadingShares,
        openShareModal,
        closeShareModal,
        fetchShares,
        createShareLink,
        updateShare,
        deleteShare
    };
});