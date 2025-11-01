// C:\FLOWORK\flowork-gui\template\web\src\store\training.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
// (COMMENT) Deprecated API calls are commented out
// import { apiGetLocalModels, apiStartTrainingJob, apiGetTrainingJobStatus } from '@/api';
// (ADDED) Import the socket store
import { useSocketStore } from './socket';
import { useUiStore } from './ui';

export const useTrainingStore = defineStore('training', () => {
    // --- STATE ---
    const localModels = ref([]);
    const trainingJobs = ref([]);
    const isLoadingModels = ref(false);
    const isLoadingJobs = ref(false);
    const error = ref(null);

    // --- ACTIONS ---

    async function fetchLocalModels() {
        isLoadingModels.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            console.log("[TrainingStore] Requesting local models via WebSocket..."); // English Hardcode
            // (REPLACED) apiGetLocalModels()
            await socketStore.sendMessage({ type: 'request_local_models' }); // English Hardcode
            // (COMMENT) isLoadingModels will be set to false by socket listener
        } catch (e) {
            error.value = e.message || 'Failed to request local models.'; // English Hardcode
            isLoadingModels.value = false;
        }
    }

    // (ADDED) Action called by socket.js listener
    function setLocalModels(models) {
        localModels.value = models;
        isLoadingModels.value = false;
    }

    async function startTrainingJob(config) {
        isLoadingJobs.value = true;
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        try {
            console.log("[TrainingStore] Starting new training job via WebSocket..."); // English Hardcode
            // (REPLACED) apiStartTrainingJob(config)
            await socketStore.sendMessage({ type: 'start_training_job', config: config }); // English Hardcode
            uiStore.showNotification({ text: 'Training job started.', color: 'success' }); // English Hardcode
            // (COMMENT) Job status might be returned or we might need to fetch
            fetchTrainingJobStatus(null); // (COMMENT) Let's assume we fetch all statuses
        } catch (e) {
            error.value = e.message || 'Failed to start training job.'; // English Hardcode
            uiStore.showNotification({ text: error.value, color: 'error' });
            isLoadingJobs.value = false;
        }
    }

    async function fetchTrainingJobStatus(jobId) {
        isLoadingJobs.value = true;
        const socketStore = useSocketStore();
        try {
            console.log(`[TrainingStore] Requesting training job status for ${jobId || 'all'}...`); // English Hardcode
            // (REPLACED) apiGetTrainingJobStatus(jobId)
            await socketStore.sendMessage({ type: 'request_training_job_status', job_id: jobId }); // English Hardcode
            // (COMMENT) isLoadingJobs will be set to false by socket listener
        } catch (e) {
            error.value = e.message || 'Failed to fetch job status.'; // English Hardcode
            isLoadingJobs.value = false;
        }
    }

    // (ADDED) Action called by socket.js listener
    function setTrainingJobStatus(statusData) {
        if (Array.isArray(statusData)) {
            trainingJobs.value = statusData;
        } else if (typeof statusData === 'object' && statusData !== null && statusData.job_id) {
            // Update or add a single job
            const index = trainingJobs.value.findIndex(j => j.job_id === statusData.job_id);
            if (index !== -1) {
                trainingJobs.value[index] = statusData;
            } else {
                trainingJobs.value.push(statusData);
            }
        }
        isLoadingJobs.value = false;
    }

    // (ADDED) Action for live updates from socket
    function addTrainingJobStatus(statusData) {
        setTrainingJobStatus(statusData); // Re-use the same logic
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
        // (ADDED) Expose new actions for socket listener
        setLocalModels,
        setTrainingJobStatus,
        addTrainingJobStatus
    };
});