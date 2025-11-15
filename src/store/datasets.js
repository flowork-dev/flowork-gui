//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\datasets.js total lines 155 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSocketStore } from './socket';

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
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({ type: 'request_datasets_list' });
        } catch (e) {
            error.value = e.message || 'Failed to request dataset list.';
            isLoadingList.value = false;
        }
    }

    function setDatasetsList(datasetList) {
        datasets.value = datasetList;
        isLoadingList.value = false;
    }

    async function selectDataset(datasetName) {
        if (!datasetName) {
            selectedDatasetName.value = null;
            selectedDatasetData.value = [];
            return;
        }
        selectedDatasetName.value = datasetName;
        isLoadingData.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({ type: 'load_dataset_data', name: datasetName });
        } catch (e) {
            error.value = e.message || 'Failed to request dataset data.';
            selectedDatasetData.value = [];
            isLoadingData.value = false;
        }
    }

    function setDatasetData(data) {
        selectedDatasetData.value = data;
        isLoadingData.value = false;
    }


    function clearSelection() {
        selectedDatasetName.value = null;
        selectedDatasetData.value = [];
    }

    async function createNewDataset(name) {
        if (!name || !name.trim()) return false;
        isLoadingList.value = true;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({ type: 'create_dataset', name: name.trim() });
            return true;
        } catch(e) {
            error.value = e.message || 'Failed to create dataset.';
            return false;
        } finally {
            isLoadingList.value = false; // (COMMENT) Or let listener handle it? Let's keep this for safety.
        }
    }

    async function addDataToSelectedDataset(dataRows) {
        if (!selectedDatasetName.value || !dataRows || dataRows.length === 0) return false;
        isLoadingData.value = true;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({
                type: 'add_dataset_data',
                name: selectedDatasetName.value,
                data: dataRows
            });
            return true;
        } catch (e) {
            error.value = e.message || 'Failed to add data.';
            return false;
        } finally {
            isLoadingData.value = false; // (COMMENT) Let listener handle this? Keep for safety.
        }
    }

    async function removeDataset(datasetName) {
        isLoadingList.value = true;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({ type: 'delete_dataset', name: datasetName });
            if (selectedDatasetName.value === datasetName) {
                clearSelection();
            }
        } catch (e) {
            console.error(`[STORE] Failed to delete dataset ${datasetName}:`, e); // English Log
            error.value = e.message || 'Failed to delete dataset.';
        } finally {
            isLoadingList.value = false;
        }
    }

    async function updateRowInSelectedDataset(rowData) {
        if (!selectedDatasetName.value || !rowData.id) return false;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({
                type: 'update_dataset_row',
                name: selectedDatasetName.value,
                row_data: rowData
            });
            return true;
        } catch(e) {
            console.error(`[STORE] Failed to update row ${rowData.id}:`, e); // English Log
            error.value = e.message || 'Failed to update row.';
            return false;
        }
    }

    async function removeRowFromSelectedDataset(rowId) {
        if (!selectedDatasetName.value || !rowId) return;
        const socketStore = useSocketStore();
        try {
            await socketStore.sendMessage({
                type: 'delete_dataset_row',
                name: selectedDatasetName.value,
                row_id: rowId
            });
        } catch (e) {
            console.error(`[STORE] Failed to delete row ${rowId}:`, e); // English Log
            error.value = e.message || 'Failed to delete row.';
        }
    }

    return {
        datasets, selectedDatasetName, selectedDatasetData, isLoadingList, isLoadingData, error,
        fetchDatasets, selectDataset, clearSelection, createNewDataset, addDataToSelectedDataset, removeDataset,
        updateRowInSelectedDataset, removeRowFromSelectedDataset,
        setDatasetsList, setDatasetData
    };
});
