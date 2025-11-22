//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\training.js total lines 133 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api'; // [FIX] Pake HTTP Client
import { useUiStore } from './ui';

export const useTrainingStore = defineStore('training', () => {
    const localModels = ref([]);
    const trainingJobs = ref([]);
    const isLoadingModels = ref(false);
    const isLoadingJobs = ref(false);
    const error = ref(null);

    async function fetchLocalModels() {
        isLoadingModels.value = true;
        error.value = null;
        try {
            console.log("[TrainingStore] Fetching local models via HTTP...");
            const response = await api.get('/api/v1/models/local');

            const rawData = response.data || [];

            let formattedModels = [];

            if (Array.isArray(rawData)) {
                formattedModels = rawData.map(m => ({
                    id: m.id || m.name, // Pastikan ID unik
                    name: m.name || m.id, // Nama yang tampil
                    type: m.type || 'unknown'
                }));
            } else if (typeof rawData === 'object') {
                formattedModels = Object.entries(rawData).map(([key, val]) => ({
                    id: key,
                    name: val.name || key,
                    type: val.type || 'unknown'
                }));
            }

            localModels.value = formattedModels;
            console.log("[TrainingStore] Models loaded & formatted:", formattedModels);

        } catch (e) {
            console.warn("[TrainingStore] HTTP fetch failed, falling back to mock data.");
            localModels.value = [
                { id: 'Llama-3-8B', name: 'Llama 3 8B (Example)' },
                { id: 'Mistral-7B', name: 'Mistral 7B (Example)' }
            ];
        } finally {
            isLoadingModels.value = false;
        }
    }

    async function startTrainingJob(config) {
        isLoadingJobs.value = true;
        const uiStore = useUiStore();

        try {
            console.log("[TrainingStore] Starting training job...", config);
            const response = await api.post('/api/v1/training/start', config);

            if (response.data && response.data.job_id) {
                uiStore.showNotification({ text: 'Training job started!', color: 'success' });
                addTrainingJobStatus({
                    job_id: response.data.job_id,
                    status: 'QUEUED',
                    new_model_name: config.new_model_name,
                    base_model_id: config.base_model_id,
                    dataset_name: config.dataset_name,
                    message: 'Initializing job...'
                });
                return true;
            }
        } catch (e) {
            const errorMsg = e.response?.data?.error || e.message || 'Failed to start training.';
            error.value = errorMsg;
            uiStore.showNotification({ text: errorMsg, color: 'error' });
            return false;
        } finally {
            isLoadingJobs.value = false;
        }
    }

    async function fetchTrainingJobStatus(jobId) {
        if (trainingJobs.value.length === 0) return;

        const activeJobs = trainingJobs.value.filter(j => !['COMPLETED', 'FAILED'].includes(j.status));
        if (activeJobs.length === 0) return;

        try {
            for (const job of activeJobs) {
                const response = await api.get(`/api/v1/training/status/${job.job_id}`);
                if (response.data && !response.data.error) {
                    setTrainingJobStatus(response.data);
                }
            }
        } catch (e) {
            console.error(`[TrainingStore] Status update failed:`, e);
        }
    }

    function setTrainingJobStatus(statusData) {
        if (!statusData || !statusData.job_id) return;
        const index = trainingJobs.value.findIndex(j => j.job_id === statusData.job_id);
        if (index !== -1) {
            trainingJobs.value[index] = { ...trainingJobs.value[index], ...statusData };
        } else {
            trainingJobs.value.unshift(statusData);
        }
    }

    function addTrainingJobStatus(statusData) {
        const index = trainingJobs.value.findIndex(j => j.job_id === statusData.job_id);
        if (index === -1) trainingJobs.value.unshift(statusData);
    }

    return {
        localModels,
        trainingJobs,
        isLoadingModels,
        isLoadingJobs,
        error,
        fetchLocalModels,
        startTrainingJob,
        fetchTrainingJobStatus,
        setTrainingJobStatus,
        addTrainingJobStatus
    };
});
