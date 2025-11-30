//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\datasets.js total lines 144 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api'; // [FIX] Sekarang ini ngarah ke src/api/index.js

export const useDatasetStore = defineStore('datasets', () => {
    const datasets = ref([]);
    const selectedDatasetName = ref(null);
    const selectedDatasetData = ref([]);
    const isLoadingList = ref(false);
    const isLoadingData = ref(false);
    const error = ref(null);

    async function fetchDatasets() {
        isLoadingList.value = true;
        error.value = null;
        try {
            const response = await api.get('/api/v1/datasets');

            if (response.data && Array.isArray(response.data)) {
                datasets.value = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                datasets.value = response.data.data;
            } else {
                datasets.value = [];
            }
        } catch (e) {
            console.error("[DatasetStore] Fetch failed:", e);
            datasets.value = [];
        } finally {
            isLoadingList.value = false;
        }
    }

    async function selectDataset(datasetName) {
        if (!datasetName) {
            selectedDatasetName.value = null;
            selectedDatasetData.value = [];
            return;
        }
        selectedDatasetName.value = datasetName;
        isLoadingData.value = true;

        try {
            const response = await api.get(`/api/v1/datasets/${datasetName}/data`);
            if (response.data && Array.isArray(response.data)) {
                selectedDatasetData.value = response.data;
            } else if (response.data && response.data.data) {
                selectedDatasetData.value = response.data.data;
            } else {
                selectedDatasetData.value = [];
            }
        } catch (e) {
            console.error("[DatasetStore] Load data failed:", e);
            selectedDatasetData.value = [];
        } finally {
            isLoadingData.value = false;
        }
    }

    async function createNewDataset(name) {
        if (!name || !name.trim()) return false;
        isLoadingList.value = true;
        try {
            await api.post('/api/v1/datasets', { name: name.trim() });
            await fetchDatasets(); // Refresh list langsung
            return true;
        } catch(e) {
            error.value = e.message || 'Failed to create dataset.';
            return false;
        } finally {
            isLoadingList.value = false;
        }
    }

    async function addDataToSelectedDataset(dataRows) {
        if (!selectedDatasetName.value || !dataRows) return false;
        isLoadingData.value = true;
        try {
            await api.post(`/api/v1/datasets/${selectedDatasetName.value}/data`, { data: dataRows });

            const currentData = selectedDatasetData.value;
            selectedDatasetData.value = [...currentData, ...dataRows];
            return true;
        } catch (e) {
            error.value = e.message || 'Failed to add data.';
            return false;
        } finally {
            isLoadingData.value = false;
        }
    }

    async function updateRowInSelectedDataset(rowData) {
        if (!selectedDatasetName.value || !rowData.id) return false;
        try {
            await api.put(`/api/v1/datasets/${selectedDatasetName.value}/data/${rowData.id}`, rowData);

            const index = selectedDatasetData.value.findIndex(r => r.id === rowData.id);
            if (index !== -1) selectedDatasetData.value[index] = rowData;
            return true;
        } catch(e) {
            return false;
        }
    }

    async function removeRowFromSelectedDataset(rowId) {
        if (!selectedDatasetName.value || !rowId) return;
        try {
            await api.delete(`/api/v1/datasets/${selectedDatasetName.value}/data/${rowId}`);
            selectedDatasetData.value = selectedDatasetData.value.filter(r => r.id !== rowId);
        } catch (e) {
            console.error("Failed to delete row", e);
        }
    }

    async function removeDataset(datasetName) {
        isLoadingList.value = true;
        try {
            await api.delete(`/api/v1/datasets/${datasetName}`);
            if (selectedDatasetName.value === datasetName) {
                selectedDatasetName.value = null;
                selectedDatasetData.value = [];
            }
            await fetchDatasets();
        } catch (e) {
            console.error("Failed to delete dataset", e);
        } finally {
            isLoadingList.value = false;
        }
    }

    return {
        datasets, selectedDatasetName, selectedDatasetData,
        isLoadingList, isLoadingData, error,
        fetchDatasets, selectDataset, createNewDataset,
        addDataToSelectedDataset, removeDataset,
        updateRowInSelectedDataset, removeRowFromSelectedDataset
    };
});
