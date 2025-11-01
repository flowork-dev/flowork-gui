import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGetDashboardSummary } from '@/api';

export const useDashboardStore = defineStore('dashboard', () => {
    // --- STATE ---
    const summary = ref({
        active_jobs: [],
        recent_activity: [],
        execution_timeseries_24h: { labels: [], datasets: [] },
        system_overview: {
            kernel_version: 'N/A',
            license_tier: 'N/A',
            modules: 0,
            plugins: 0,
            widgets: 0,
            triggers: 0,
            presets: 0
        },
        top_failing_presets: [],
        top_slowest_presets: [],
        // (PENAMBAHAN KODE) State baru untuk menampung data kuota eksekusi
        usage_stats: {
            used: 0
        },
    });
    const isInitialLoading = ref(true);
    const isRefreshing = ref(false);
    const error = ref(null);

    // --- ACTIONS ---
    async function fetchDashboardSummary(isRefresh = false) {
        if (!isRefresh) {
            isInitialLoading.value = true;
        }
        isRefreshing.value = true;
        error.value = null;
        try {
            const data = await apiGetDashboardSummary();
            // (PERBAIKAN) Pastikan data default tetap ada jika API tidak mengembalikannya
            summary.value = { ...summary.value, ...data };
        } catch (e) {
            error.value = e.error || 'Failed to fetch dashboard summary.';
            console.error('[STORE] Failed to fetch dashboard summary:', e);
        } finally {
            isInitialLoading.value = false;
            isRefreshing.value = false;
        }
    }

    function updateActiveJobs(activeJobsList) {
        if (summary.value) {
            summary.value.active_jobs = activeJobsList;
        }
    }

    // --- RETURN ---
    return {
        summary,
        isInitialLoading,
        isRefreshing,
        error,
        fetchDashboardSummary,
        updateActiveJobs,
    };
});