// C:\FLOWORK\flowork-gui\template\web\src\store\datasets.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
// (COMMENT) Deprecated API calls are commented out
// import { getDatasets, createDataset, getDatasetData, addDatasetData, deleteDataset, updateDatasetRow, deleteDatasetRow } from '@/api';
// (ADDED) Import the socket store
import { useSocketStore } from './socket';

export const useDatasetStore = defineStore('datasets', () => {
    // --- STATE ---
    const datasets = ref([]);
    const selectedDatasetName = ref(null);
    const selectedDatasetData = ref([]);
    const isLoadingList = ref(false);
    const isLoadingData = ref(false);
    const error = ref(null);

    // --- ACTIONS ---

    async function fetchDatasets() {
        isLoadingList.value = true;
        error.value = null;
        const socketStore = useSocketStore();
        try {
            // (REPLACED) getDatasets()
            await socketStore.sendMessage({ type: 'request_datasets_list' }); // English Hardcode
            // (COMMENT) isLoadingList will be set to false by socket listener
        } catch (e) {
            error.value = e.message || 'Failed to request dataset list.'; // English Hardcode
            isLoadingList.value = false;
        }
    }

    // (ADDED) Action called by socket.js listener
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
            // (REPLACED) getDatasetData(datasetName)
            await socketStore.sendMessage({ type: 'load_dataset_data', name: datasetName }); // English Hardcode
            // (COMMENT) isLoadingData will be set to false by socket listener
        } catch (e) {
            error.value = e.message || 'Failed to request dataset data.'; // English Hardcode
            selectedDatasetData.value = [];
            isLoadingData.value = false;
        }
    }

    // (ADDED) Action called by socket.js listener
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
            // (REPLACED) createDataset(name)
            await socketStore.sendMessage({ type: 'create_dataset', name: name.trim() }); // English Hardcode
            // (COMMENT) List will be refreshed by 'datasets_list_response' listener
            return true;
        } catch(e) {
            error.value = e.message || 'Failed to create dataset.'; // English Hardcode
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
            // (REPLACED) addDatasetData(selectedDatasetName.value, dataRows)
            await socketStore.sendMessage({
                type: 'add_dataset_data', // English Hardcode
                name: selectedDatasetName.value,
                data: dataRows
            });
            // (COMMENT) Data will be refreshed by 'dataset_data_response' listener
            return true;
        } catch (e) {
            error.value = e.message || 'Failed to add data.'; // English Hardcode
            return false;
        } finally {
            isLoadingData.value = false; // (COMMENT) Let listener handle this? Keep for safety.
        }
    }

    async function removeDataset(datasetName) {
        isLoadingList.value = true;
        const socketStore = useSocketStore();
        try {
            // (REPLACED) deleteDataset(datasetName)
            await socketStore.sendMessage({ type: 'delete_dataset', name: datasetName }); // English Hardcode
            if (selectedDatasetName.value === datasetName) {
                clearSelection();
            }
            // (COMMENT) List will be refreshed by 'datasets_list_response' listener
        } catch (e) {
            console.error(`[STORE] Failed to delete dataset ${datasetName}:`, e); // English Log
            error.value = e.message || 'Failed to delete dataset.'; // English Hardcode
        } finally {
            isLoadingList.value = false;
        }
    }

    async function updateRowInSelectedDataset(rowData) {
        if (!selectedDatasetName.value || !rowData.id) return false;
        const socketStore = useSocketStore();
        try {
            // (REPLACED) updateDatasetRow(selectedDatasetName.value, rowData)
            await socketStore.sendMessage({
                type: 'update_dataset_row', // English Hardcode
                name: selectedDatasetName.value,
                row_data: rowData
            });
            // (COMMENT) Data will be refreshed by 'dataset_data_response' listener
            return true;
        } catch(e) {
            console.error(`[STORE] Failed to update row ${rowData.id}:`, e); // English Log
            error.value = e.message || 'Failed to update row.'; // English Hardcode
            return false;
        }
    }

    async function removeRowFromSelectedDataset(rowId) {
        if (!selectedDatasetName.value || !rowId) return;
        const socketStore = useSocketStore();
        try {
            // (REPLACED) deleteDatasetRow(selectedDatasetName.value, rowId)
            await socketStore.sendMessage({
                type: 'delete_dataset_row', // English Hardcode
                name: selectedDatasetName.value,
                row_id: rowId
            });
            // (COMMENT) Data will be refreshed by 'dataset_data_response' listener
        } catch (e) {
            console.error(`[STORE] Failed to delete row ${rowId}:`, e); // English Log
            error.value = e.message || 'Failed to delete row.'; // English Hardcode
        }
    }

    return {
        datasets, selectedDatasetName, selectedDatasetData, isLoadingList, isLoadingData, error,
        fetchDatasets, selectDataset, clearSelection, createNewDataset, addDataToSelectedDataset, removeDataset,
        updateRowInSelectedDataset, removeRowFromSelectedDataset,
        // (ADDED) Expose new actions for socket listener
        setDatasetsList, setDatasetData
    };
});