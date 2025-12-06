//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\training.js total lines 223 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';
import { useUiStore } from './ui';

export const useTrainingStore = defineStore('training', () => {
    const localModels = ref([]);
    const trainingJobs = ref([]);

    const conversionJobs = ref([]);
    const isConverting = ref(false);

    const activeEngineId = ref('LOCAL');

    const isLoadingModels = ref(false);
    const isLoadingJobs = ref(false);
    const error = ref(null);

    async function fetchLocalModels() {
        isLoadingModels.value = true;
        try {
            const response = await api.get('/api/v1/models/local');
            const rawData = response.data || [];

            let formattedModels = [];
            if (Array.isArray(rawData)) {
                formattedModels = rawData.map(m => ({ id: m.id || m.name, name: m.name || m.id }));
            } else if (typeof rawData === 'object') {
                formattedModels = Object.entries(rawData).map(([key, val]) => ({ id: key, name: val.name || key }));
            }
            localModels.value = formattedModels;
        } catch (e) {
            console.warn("[TrainingStore] Failed to load models:", e);
        } finally {
            isLoadingModels.value = false;
        }
    }

    async function rescanModels() {
        isLoadingModels.value = true;
        const uiStore = useUiStore();
        try {
            await api.post('/api/v1/models/rescan');
            await fetchLocalModels();
            uiStore.showNotification({ text: "Model list refreshed!", color: "success" });
        } catch (e) {
            console.error("Rescan failed:", e);
            uiStore.showNotification({ text: "Failed to rescan models.", color: "error" });
        } finally {
            isLoadingModels.value = false;
        }
    }

    async function fetchTrainingJobs() {
        isLoadingJobs.value = true;
        try {
            const response = await api.get('/api/v1/training/jobs');
            if (Array.isArray(response.data)) {
                trainingJobs.value = response.data;
            }

            const convResponse = await api.get('/api/v1/models/conversions');
            if (Array.isArray(convResponse.data)) {
                conversionJobs.value = convResponse.data;
            }

        } catch (e) {
            console.error("[TrainingStore] Failed to list jobs:", e);
        } finally {
            isLoadingJobs.value = false;
        }
    }

    async function fetchTrainingJobStatus(jobId) {
        return await fetchTrainingJobs();
    }

    async function startTrainingJob(config) {
        isLoadingJobs.value = true;
        const uiStore = useUiStore();
        try {
            const response = await api.post('/api/v1/training/start', config);

            if (response.data && response.data.job_id) {
                addTrainingJobStatus({
                    job_id: response.data.job_id,
                    status: 'QUEUED',
                    new_model_name: config.new_model_name,
                    base_model_id: config.base_model_id,
                    message: 'Request sent. Waiting for sync...',
                    live_logs: 'Connecting...'
                });

                setTimeout(() => fetchTrainingJobs(), 1000);

                return { success: true, job_id: response.data.job_id };
            }

            return { success: false, error: "No Job ID returned from server." };

        } catch (e) {
            const msg = e.response?.data?.error || e.message;
            uiStore.showNotification({ text: msg, color: 'error' });
            return { success: false, error: msg };
        } finally {
            isLoadingJobs.value = false;
        }
    }

    async function uploadDatasetFile(file) {
        const actualFile = Array.isArray(file) ? file[0] : file;
        if (!actualFile) return { success: false, error: "No file selected" };

        const formData = new FormData();
        formData.append('file', actualFile);

        const uiStore = useUiStore();
        try {
            const response = await api.post('/api/v1/training/upload', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            return { success: true, filename: response.data.filename };
        } catch (e) {
            console.error("Upload failed:", e);
            const msg = e.response?.data?.error || "Upload failed";
            uiStore.showNotification({ text: msg, color: 'error' });
            return { success: false, error: msg };
        }
    }

    async function startConversionJob(payload) {
        isConverting.value = true;
        const uiStore = useUiStore();
        try {
            const response = await api.post('/api/v1/training/convert', payload);

            const newJob = {
                job_id: response.data.job_id || 'job_' + Date.now(),
                type: 'CONVERSION',
                source_model: payload.model_id,
                status: 'QUEUED',
                progress: 0,
                live_logs: 'Initializing GGUF Factory...',
                new_model_name: `GGUF-${payload.model_id}`
            };
            addTrainingJobStatus(newJob);

            uiStore.showNotification({ text: 'Conversion Started! The factory is running.', color: 'cyan' });
            setTimeout(() => fetchTrainingJobs(), 1000);
            return { success: true };
        } catch (e) {
            console.error("Conversion Failed:", e);
            uiStore.showNotification({ text: 'Failed to start conversion.', color: 'error' });
            return { success: false, error: e.message };
        } finally {
            isConverting.value = false;
        }
    }

    async function runSparringMatch(payload) {
        const uiStore = useUiStore();
        try {
            const response = await api.post('/api/v1/training/sparring', payload);
            return response.data;
        } catch (e) {
            console.error("Sparring Failed:", e);
            uiStore.showNotification({ text: 'Sparring Match Failed: ' + (e.response?.data?.error || e.message), color: 'error' });
            return null;
        }
    }

    async function deleteJob(jobId) {
        const uiStore = useUiStore();
        try {
            await api.delete(`/api/v1/training/jobs/${jobId}`);

            trainingJobs.value = trainingJobs.value.filter(j => j.job_id !== jobId);
            uiStore.showNotification({ text: 'Job deleted from history.', color: 'success' });
            return true;
        } catch (e) {
            console.error("[TrainingStore] Failed to delete job:", e);
            uiStore.showNotification({ text: 'Failed to delete job.', color: 'error' });
            return false;
        }
    }

    function addTrainingJobStatus(statusData) {
        const index = trainingJobs.value.findIndex(j => j.job_id === statusData.job_id);
        if (index !== -1) {
            trainingJobs.value[index] = { ...trainingJobs.value[index], ...statusData };
        } else {
            trainingJobs.value.unshift(statusData);
        }
    }

    return {
        localModels,
        trainingJobs,
        conversionJobs,
        isLoadingModels,
        isLoadingJobs,
        isConverting,
        activeEngineId,
        fetchLocalModels,
        rescanModels,
        fetchTrainingJobs,
        fetchTrainingJobStatus,
        startTrainingJob,
        uploadDatasetFile,
        startConversionJob,
        runSparringMatch,
        deleteJob
    };
});
