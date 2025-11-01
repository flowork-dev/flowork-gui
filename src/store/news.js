import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // Import 'computed'
import { apiFetchNews } from '@/api';

export const useNewsStore = defineStore('news', () => {
    // --- STATE ---
    const articles = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    // (PENAMBAHAN KODE) State untuk manajemen halaman
    const currentPage = ref(1);
    const itemsPerPage = ref(10); // Tampilkan 10 item per halaman

    // --- GETTERS (COMPUTED) ---
    // (PENAMBAHAN KODE) Menghitung total halaman yang dibutuhkan
    const totalPages = computed(() => {
        return Math.ceil(articles.value.length / itemsPerPage.value);
    });

    // (PENAMBAHAN KODE) Mengambil artikel hanya untuk halaman yang aktif
    const paginatedArticles = computed(() => {
        const startIndex = (currentPage.value - 1) * itemsPerPage.value;
        const endIndex = startIndex + itemsPerPage.value;
        return articles.value.slice(startIndex, endIndex);
    });


    // --- ACTIONS ---
    async function fetchNews() {
        if (articles.value.length > 0) return; // Cache sederhana
        isLoading.value = true;
        error.value = null;
        try {
            const data = await apiFetchNews();
            if(data.error) throw new Error(data.error);

            // (PERBAIKAN KODE) Hapus .slice(0, 4) untuk menyimpan semua artikel
            articles.value = data;

        } catch (e) {
            error.value = e.message || 'Failed to fetch news.';
            console.error('[STORE] Failed to fetch news:', e);
        } finally {
            isLoading.value = false;
        }
    }

    // (PENAMBAHAN KODE) Aksi untuk mengubah halaman
    function setPage(page) {
        if (page > 0 && page <= totalPages.value) {
            currentPage.value = page;
        }
    }

    return {
        articles,
        isLoading,
        error,
        fetchNews,
        // (PENAMBAHAN KODE) Export state dan getter baru
        currentPage,
        itemsPerPage,
        totalPages,
        paginatedArticles,
        setPage
    };
});