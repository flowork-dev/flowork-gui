//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\training.js total lines 96 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSocketStore } from './socket';
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
        const socketStore = useSocketStore();
        try {
            console.log("[TrainingStore] Requesting local models via WebSocket...");
            await socketStore.sendMessage({ type: 'request_local_models' });
        } catch (e) {
            error.value = e.message || 'Failed to request local models.';
            isLoadingModels.value = false;
        }
    }

    function setLocalModels(models) {
        localModels.value = models;
        isLoadingModels.value = false;
    }

    async function startTrainingJob(config) {
        isLoadingJobs.value = true;
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        try {
            console.log("[TrainingStore] Starting new training job via WebSocket...");
            await socketStore.sendMessage({ type: 'start_training_job', config: config });
            uiStore.showNotification({ text: 'Training job started.', color: 'success' });
            fetchTrainingJobStatus(null);
        } catch (e) {
            error.value = e.message || 'Failed to start training job.';
            uiStore.showNotification({ text: error.value, color: 'error' });
            isLoadingJobs.value = false;
        }
    }

    async function fetchTrainingJobStatus(jobId) {
        isLoadingJobs.value = true;
        const socketStore = useSocketStore();
        try {
            console.log(`[TrainingStore] Requesting training job status for ${jobId || 'all'}...`);
            await socketStore.sendMessage({ type: 'request_training_job_status', job_id: jobId });
        } catch (e) {
            error.value = e.message || 'Failed to fetch job status.';
            isLoadingJobs.value = false;
        }
    }

    function setTrainingJobStatus(statusData) {
        if (Array.isArray(statusData)) {
            trainingJobs.value = statusData;
        } else if (typeof statusData === 'object' && statusData !== null && statusData.job_id) {
            const index = trainingJobs.value.findIndex(j => j.job_id === statusData.job_id);
            if (index !== -1) {
                trainingJobs.value[index] = statusData;
            } else {
                trainingJobs.value.push(statusData);
            }
        }
        isLoadingJobs.value = false;
    }
    function addTrainingJobStatus(statusData) {
        setTrainingJobStatus(statusData);
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
        setLocalModels,
        setTrainingJobStatus,
        addTrainingJobStatus
    };
});
