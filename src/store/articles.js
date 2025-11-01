import { defineStore } from 'pinia';
import { ref } from 'vue';
// (PERBAIKAN) Import API yang sudah di-update
import { apiGetMyArticles, apiCreateArticle, apiUpdateArticle, apiDeleteArticle, apiGetArticleForEdit } from '@/api';
import { useUiStore } from './ui';
import router from '@/router';

export const useArticlesStore = defineStore('articles', () => { // English Hardcode
    const myArticles = ref([]);
    const currentArticle = ref(null);
    const isLoading = ref(false);
    const uiStore = useUiStore();
    async function fetchMyArticles() {
        isLoading.value = true;
        const result = await apiGetMyArticles();
        if (result.error) {
            uiStore.showNotification({ text: result.error, color: 'error' }); // English Hardcode
        } else {
            myArticles.value = result;
        }
        isLoading.value = false;
    }

    // --- (PERBAIKAN KODE: BUG EDIT/DELETE) ---
    // Sekarang menggunakan articleId
    async function loadArticleForEdit(articleId) {
        isLoading.value = true;
        currentArticle.value = null;
        const result = await apiGetArticleForEdit(articleId); // Panggil API dengan ID
        if (result.error) {
            uiStore.showNotification({ text: result.error, color: 'error' }); // English Hardcode
            router.push('/my-articles'); // English Hardcode
            isLoading.value = false;
            return { success: false, error: result.error }; // Kembalikan error
        } else {
            currentArticle.value = result;
            isLoading.value = false;
            return { success: true, data: result }; // Kembalikan data
        }
    }

    // (PERBAIKAN) Signature diubah, tidak perlu originalSlug
    async function saveArticle(articleData, mode) {
        isLoading.value = true;
        const uiStore = useUiStore();
        const payload = { ...articleData }; // articleData contains the new data

        try {
            let result;
            if (mode === 'edit') { // English Hardcode
                // (PERBAIKAN) Gunakan articleData.id untuk URL API
                if (!articleData.id) {
                    throw new Error("Article ID is missing for update operation."); // English Hardcode
                }
                result = await apiUpdateArticle(articleData.id, payload); // Panggil API dengan ID
            } else { // Mode 'create'
                result = await apiCreateArticle(payload);
            }

            if (result.error) throw new Error(result.error);

            uiStore.showNotification({ text: 'Article saved successfully!', color: 'success' }); // English Hardcode

            // (PERBAIKAN BUG HAPUS) Refresh daftar artikel
            await fetchMyArticles();

            // (PERBAIKAN) Redirect ke halaman daftar
            router.push('/my-articles'); // English Hardcode

            return { success: true, data: result };
        } catch (e) {
            uiStore.showNotification({ text: e.message || 'Failed to save article.', color: 'error' }); // English Hardcode
            return { success: false, error: e.message };
        } finally {
            isLoading.value = false;
        }
    }

    // (PERBAIKAN) Sekarang menggunakan articleId
    async function deleteArticle(articleId) {
        isLoading.value = true;
        const uiStore = useUiStore();
        try {
            const result = await apiDeleteArticle(articleId); // Panggil API dengan ID
            if (result.error) throw new Error(result.error);

            // (PERBAIKAN BUG HAPUS) Cek status sukses dari response
            if (result.message) { // api/index.js mengembalikan { message: ... }
                uiStore.showNotification({ text: 'Article deleted successfully.', color: 'info' }); // English Hardcode
                // (PERBAIKAN BUG HAPUS) Panggil fetchMyArticles() HANYA setelah sukses
                await fetchMyArticles();
            } else {
                throw new Error('Delete API did not confirm success.'); // English Hardcode
            }
        } catch (e) {
            uiStore.showNotification({ text: e.message || 'Failed to delete article.', color: 'error' }); // English Hardcode
        } finally {
            isLoading.value = false;
        }
    }
    // --- (AKHIR PERBAIKAN KODE) ---

    return {
        myArticles,
        currentArticle,
        isLoading,
        fetchMyArticles,
        loadArticleForEdit,
        saveArticle,
        deleteArticle
    };
});