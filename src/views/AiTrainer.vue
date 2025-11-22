<template>
  <div class="ai-trainer-page">
    <v-tabs v-model="activeTab" bg-color="transparent" color="cyan" grow>
      <v-tab value="datasets">
        <v-icon start>mdi-database-edit-outline</v-icon>
        {{ loc('ai_trainer_tab_datasets') }}
      </v-tab>
      <v-tab value="training">
        <v-icon start>mdi-brain</v-icon>
        {{ loc('ai_trainer_tab_training') }}
      </v-tab>
      <v-tab value="monitor">
        <v-icon start>mdi-monitor-dashboard</v-icon>
        {{ loc('ai_trainer_tab_monitor') }}
      </v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-window v-model="activeTab" class="fill-height">
      <v-window-item value="datasets" class="fill-height">
        <v-layout class="fill-height">
          <v-navigation-drawer width="300" class="left-panel">
            <v-toolbar color="transparent">
              <v-toolbar-title class="orbitron-font">Datasets</v-toolbar-title>
              <v-btn icon="mdi-plus" @click="openNewDatasetDialog" title="Create New Dataset"></v-btn>
            </v-toolbar>
            <v-divider></v-divider>

            <v-list nav density="compact">
              <div v-if="isLoadingList" class="text-center py-4">
                <v-progress-circular indeterminate color="cyan"></v-progress-circular>
              </div>
              <v-list-item
                v-for="dataset in datasets"
                :key="dataset.name"
                :title="dataset.name"
                :active="selectedDatasetName === dataset.name"
                @click="datasetStore.selectDataset(dataset.name)"
                color="cyan"
                class="dataset-list-item"
              >
                <template v-slot:append>
                  <v-btn icon="mdi-delete-outline" variant="text" size="x-small" @click.stop="handleDeleteDataset(dataset.name)"></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-navigation-drawer>

          <v-main class="right-panel">
            <div v-if="!selectedDatasetName" class="empty-state">
              <v-icon icon="mdi-database-eye-outline" size="64" color="grey-darken-2"></v-icon>
              <h2 class="mt-4 text-grey-darken-1 orbitron-font">Select a dataset to view its content.</h2>
            </div>
            <div v-else class="table-wrapper">
              <v-data-table
                :headers="dataTableHeaders"
                :items="selectedDatasetData"
                :loading="isLoadingData"
                class="data-table"
                density="compact"
              >
                <template v-slot:top>
                  <v-toolbar flat color="transparent">
                    <v-toolbar-title>{{ selectedDatasetName }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn color="cyan" variant="tonal" prepend-icon="mdi-plus" @click="openAddDataDialog">Add Data</v-btn>
                  </v-toolbar>
                </template>
                <template v-slot:item.actions="{ item }">
                   <v-icon class="me-2 action-icon" size="small" @click="handleEditRow(item)" title="Edit">mdi-pencil</v-icon>
                   <v-icon class="action-icon" size="small" @click="handleDeleteRow(item)" title="Delete">mdi-delete</v-icon>
                </template>
                <template v-slot:loading>
                  <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
                </template>
                <template v-slot:no-data>
                  <div class="text-center py-8 text-grey">This dataset is empty. Click 'Add Data' to begin.</div>
                </template>
              </v-data-table>
            </div>
          </v-main>
        </v-layout>
      </v-window-item>

      <v-window-item value="training" class="fill-height">
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card class="training-form-card">
                <v-card-title class="orbitron-font">{{ loc('ai_trainer_training_title') }}</v-card-title>
                <v-card-text>
                  <v-select
                    v-model="trainingConfig.base_model_id"
                    :items="availableBaseModels"
                    item-title="name"
                    item-value="id"
                    :label="loc('ai_trainer_base_model_label')"
                    variant="outlined"
                    :loading="trainingStore.isLoadingModels"
                    :no-data-text="trainingStore.isLoadingModels ? 'Loading models...' : 'No base models found'"
                    class="mb-4"
                  ></v-select>

                  <v-select
                    v-model="trainingConfig.dataset_name"
                    :items="datasets.map(d => d.name)"
                    :label="loc('ai_trainer_dataset_label')"
                    variant="outlined"
                    :loading="isLoadingList"
                    :no-data-text="isLoadingList ? 'Loading datasets...' : 'No datasets created yet'"
                    class="mb-4"
                  ></v-select>

                  <v-text-field
                    v-model="trainingConfig.new_model_name"
                    :label="loc('ai_trainer_new_model_name_label')"
                    variant="outlined"
                    class="mb-4"
                    :hint="loc('ai_trainer_new_model_name_hint')"
                    persistent-hint
                  ></v-text-field>

                  <v-row>
                    <v-col cols="6">
                        <v-text-field
                            v-model.number="trainingConfig.training_args.epochs"
                            :label="loc('ai_trainer_epochs_label')"
                            type="number"
                            variant="outlined"
                            density="compact"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field
                            v-model.number="trainingConfig.training_args.batch_size"
                            :label="loc('ai_trainer_batch_size_label')"
                            type="number"
                            variant="outlined"
                            density="compact"
                        ></v-text-field>
                    </v-col>
                  </v-row>

                </v-card-text>
                <v-card-actions class="pa-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    size="large"
                    color="cyan"
                    variant="flat"
                    @click="handleStartTraining"
                    :loading="trainingStore.isLoadingJobs"
                    prepend-icon="mdi-play-circle-outline"
                    class="action-button"
                  >{{ loc('ai_trainer_start_btn') }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="monitor" class="fill-height">
        <v-container fluid>
          <div v-if="trainingJobs.length === 0 && !trainingStore.isLoadingJobs" class="empty-state">
            <v-icon icon="mdi-monitor-off" size="64" color="grey-darken-2"></v-icon>
            <h2 class="mt-4 text-grey-darken-1 orbitron-font">{{ loc('ai_trainer_monitor_empty_title') }}</h2>
            <p>{{ loc('ai_trainer_monitor_empty_subtitle') }}</p>
          </div>

          <div v-else-if="trainingStore.isLoadingJobs && trainingJobs.length === 0" class="text-center py-8">
            <v-progress-circular indeterminate color="cyan"></v-progress-circular>
            <p class="mt-2 text-grey">Loading job statuses...</p>
          </div>

          <v-row v-else>
            <v-col v-for="job in trainingJobs" :key="job.job_id" cols="12">
              <v-card class="job-card">
                <v-card-text>
                  <div class="d-flex align-center">
                    <div>
                      <div class="text-caption text-grey">Job ID: {{ job.job_id.substring(0,8) }}...</div>
                      <div class="orbitron-font text-h6">{{ job.new_model_name }}</div>
                      <div class="text-caption">Base: {{ job.base_model_id }} | Dataset: {{ job.dataset_name }}</div>
                    </div>
                    <v-spacer></v-spacer>
                    <v-chip :color="getStatusColor(job.status)" variant="flat" label>{{ job.status }}</v-chip>
                  </div>
                  <div class="mt-2 text-body-2">{{ job.message }}</div>
                  <v-progress-linear
                    :active="job.status === 'TRAINING' || job.status === 'PREPARING'"
                    indeterminate
                    color="cyan"
                    class="mt-2"
                  ></v-progress-linear>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
    </v-window>

    <v-dialog v-model="isAddDataDialogOpen" max-width="800px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="orbitron-font">{{ isEditMode ? 'Edit Entry' : `Add New Entry to '${selectedDatasetName}'` }}</v-card-title>
        <v-card-text>
          <v-textarea v-model="newPrompt" label="Prompt" variant="outlined" rows="5"></v-textarea>
          <v-textarea v-model="newResponse" label="Response" variant="outlined" rows="5"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeAddDataDialog">Cancel</v-btn>
          <v-btn color="cyan" variant="flat" @click="handleSaveNewData" class="save-button">Save Entry</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isNewDatasetDialogOpen" max-width="500px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="orbitron-font">Create New Dataset</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDatasetName"
            label="Dataset Name"
            placeholder="my-new-dataset"
            variant="outlined"
            autofocus
            @keyup.enter="handleCreateNewDataset"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isNewDatasetDialogOpen = false">Cancel</v-btn>
          <v-btn color="cyan" variant="flat" @click="handleCreateNewDataset" class="save-button">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useDatasetStore } from '@/store/datasets';
import { useUiStore } from '@/store/ui';
import { useTrainingStore } from '@/store/training';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';

const datasetStore = useDatasetStore();
const uiStore = useUiStore();
const trainingStore = useTrainingStore();
const localeStore = useLocaleStore();

const { datasets, selectedDatasetName, selectedDatasetData, isLoadingList, isLoadingData } = storeToRefs(datasetStore);
const { localModels: availableBaseModels, trainingJobs } = storeToRefs(trainingStore);
const { loc } = storeToRefs(localeStore);

const activeTab = ref('datasets');
const isAddDataDialogOpen = ref(false);
const newPrompt = ref('');
const newResponse = ref('');
const isEditMode = ref(false);
const editingRowId = ref(null);
let pollInterval = null;

const isNewDatasetDialogOpen = ref(false);
const newDatasetName = ref('');

const trainingConfig = ref({
  base_model_id: null,
  dataset_name: null,
  new_model_name: '',
  training_args: {
    epochs: 1,
    batch_size: 4
  }
});

const dataTableHeaders = ref([
  { title: 'Prompt', key: 'prompt', sortable: false, width: '45%' },
  { title: 'Response', key: 'response', sortable: false, width: '45%' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]);

// [FIX AWENK] Init Data on Mount
onMounted(async () => {
    console.log("[AiTrainer] Mounting... Fetching initial data.");
    await datasetStore.fetchDatasets();
    await trainingStore.fetchLocalModels(); // Ini penting biar dropdown gak kosong!
    await trainingStore.fetchTrainingJobs();

    // Start Polling for Jobs
    startPolling();
});

onUnmounted(() => {
    stopPolling();
});

function startPolling() {
    stopPolling();
    pollInterval = setInterval(() => {
        if (activeTab.value === 'monitor') {
            trainingStore.fetchTrainingJobs();
        }
    }, 5000);
}

function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
}

function getStatusColor(status) {
    if (status === 'COMPLETED') return 'green';
    if (status === 'FAILED') return 'red';
    if (status === 'TRAINING' || status === 'PREPARING') return 'cyan';
    return 'grey';
}

function openNewDatasetDialog() {
  newDatasetName.value = '';
  isNewDatasetDialogOpen.value = true;
}

async function handleCreateNewDataset() {
  if (newDatasetName.value && newDatasetName.value.trim()) {
    await datasetStore.createNewDataset(newDatasetName.value.trim());
    isNewDatasetDialogOpen.value = false;
  } else {
    uiStore.showNotification({ text: 'Please enter a valid dataset name.', color: 'warning' });
  }
}

async function handleDeleteDataset(name) {
  const confirmed = await uiStore.showConfirmation({
    title: 'Delete Dataset',
    text: `Are you sure you want to delete dataset "${name}"? This is irreversible.`,
    color: 'error',
    confirmText: 'Delete'
  });
  if (confirmed) {
    await datasetStore.deleteDataset(name);
  }
}

function openAddDataDialog() {
  isEditMode.value = false;
  newPrompt.value = '';
  newResponse.value = '';
  isAddDataDialogOpen.value = true;
}

function handleEditRow(item) {
    isEditMode.value = true;
    editingRowId.value = item.id;
    newPrompt.value = item.prompt;
    newResponse.value = item.response;
    isAddDataDialogOpen.value = true;
}

function closeAddDataDialog() {
    isAddDataDialogOpen.value = false;
}

async function handleSaveNewData() {
    if (!newPrompt.value || !newResponse.value) {
        uiStore.showNotification({ text: 'Prompt and Response are required.', color: 'warning' });
        return;
    }

    if (isEditMode.value) {
        await datasetStore.updateRow(selectedDatasetName.value, {
            id: editingRowId.value,
            prompt: newPrompt.value,
            response: newResponse.value
        });
    } else {
        await datasetStore.addDataToDataset(selectedDatasetName.value, [{
            prompt: newPrompt.value,
            response: newResponse.value
        }]);
    }
    closeAddDataDialog();
}

async function handleDeleteRow(item) {
    if(confirm("Delete this row?")) {
        await datasetStore.deleteRow(selectedDatasetName.value, item.id);
    }
}

async function handleStartTraining() {
    if (!trainingConfig.value.base_model_id || !trainingConfig.value.dataset_name || !trainingConfig.value.new_model_name) {
        uiStore.showNotification({ text: 'Please fill in all required fields.', color: 'warning' });
        return;
    }

    const success = await trainingStore.startTrainingJob(trainingConfig.value);
    if (success) {
        uiStore.showNotification({ text: 'Training Job Started!', color: 'success' });
        activeTab.value = 'monitor';
        trainingConfig.value.new_model_name = ''; // Reset name
    }
}
</script>

<style scoped>
.ai-trainer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #13141b; /* Match layout */
}

.left-panel {
  background-color: #1a1b23;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.left-panel :deep(.v-list-item-title) {
  color: var(--text-primary) !important;
}

.right-panel {
  padding: 0;
  height: calc(100vh - 48px - 1px - 64px); /* Approximate height calc */
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex-grow: 1;
  overflow-y: auto;
}

.data-table {
  background-color: transparent;
}

.data-table :deep(.v-toolbar) {
  background-color: #1a1b23 !important;
  padding: 0 16px;
}

.orbitron-font {
  font-family: 'Orbitron', monospace;
}

.dataset-list-item {
  transition: background-color 0.2s ease;
}

.dataset-list-item:hover {
  background-color: rgba(0, 245, 255, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 16px;
}

.training-form-card, .job-card, .dialog-card {
  background: rgba(30, 30, 47, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-button {
  font-weight: bold;
}

.save-button {
  font-weight: bold;
  color: #000 !important;
}

.job-card {
  margin-bottom: 16px;
}

/* Input field styling override for dark theme */
.training-form-card :deep(.v-field),
.dialog-card :deep(.v-field) {
  background-color: rgba(42, 42, 74, 0.5) !important;
  color: var(--text-primary) !important;
}

.training-form-card :deep(.v-field__outline),
.dialog-card :deep(.v-field__outline) {
  border-color: rgba(100, 255, 218, 0.3) !important;
}

.training-form-card :deep(input),
.training-form-card :deep(textarea),
.training-form-card :deep(.v-select__selection-text),
.dialog-card :deep(input),
.dialog-card :deep(textarea),
.dialog-card :deep(.v-select__selection-text) {
  color: #ffffff !important;
}

.training-form-card :deep(.v-label),
.dialog-card :deep(.v-label) {
  color: #b0bec5 !important;
  opacity: 1 !important;
}
</style>