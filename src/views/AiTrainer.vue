//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\AiTrainer.vue
//#######################################################################

<template>
  <div class="ai-trainer-page">
    <v-tabs v-model="activeTab" bg-color="transparent" color="#FFD700" grow class="text-white flex-shrink-0 border-bottom-gold">
      <v-tab value="datasets" class="text-grey-lighten-1 font-weight-bold font-mono tracking-wide">
        <v-icon start>mdi-database-edit-outline</v-icon>
        DATASETS
      </v-tab>
      <v-tab value="training" class="text-grey-lighten-1 font-weight-bold font-mono tracking-wide">
        <v-icon start>mdi-brain</v-icon>
        TRAINING
      </v-tab>
      <v-tab value="monitor" class="text-grey-lighten-1 font-weight-bold font-mono tracking-wide">
        <v-icon start>mdi-console-network</v-icon>
        MONITOR
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="fill-height flex-grow-1" style="overflow: hidden;">

      <v-window-item value="datasets" class="fill-height">
        <div class="d-flex flex-row fill-height w-100 overflow-hidden">
          <div class="left-panel d-flex flex-column" style="width: 300px; flex-shrink: 0;">
            <v-toolbar color="transparent" density="compact" class="pl-2">
              <v-toolbar-title class="font-mono text-gold font-weight-bold text-caption ml-2">DATA LIBRARY</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon="mdi-plus" color="#FFD700" variant="text" @click="openNewDatasetDialog" title="Create New Dataset"></v-btn>
            </v-toolbar>
            <v-divider class="border-gold-subtle"></v-divider>

            <div class="overflow-y-auto flex-grow-1 pa-2 custom-scrollbar">
                <div v-if="isLoadingList" class="text-center py-4">
                    <v-progress-circular indeterminate color="#FFD700" size="24"></v-progress-circular>
                </div>
                <v-list bg-color="transparent" density="compact" v-else>
                <v-list-item
                    v-for="dataset in datasets"
                    :key="dataset.name"
                    :title="dataset.name"
                    :active="selectedDatasetName === dataset.name"
                    @click="datasetStore.selectDataset(dataset.name)"
                    active-color="#FFD700"
                    class="dataset-list-item text-white mb-1"
                    rounded="lg"
                >
                    <template v-slot:append>
                    <v-btn
                        icon="mdi-delete-outline"
                        variant="text"
                        color="red-darken-2"
                        size="small"
                        @click.stop="handleDeleteDataset(dataset.name)"
                    ></v-btn>
                    </template>
                </v-list-item>
                </v-list>
            </div>
          </div>

          <div class="right-panel flex-grow-1 d-flex flex-column" style="min-width: 0; position: relative;">
            <div v-if="!selectedDatasetName" class="empty-state d-flex flex-column align-center justify-center h-100">
              <v-icon icon="mdi-database-eye-outline" size="80" color="#FFD700" class="mb-4 opacity-20"></v-icon>
              <h2 class="text-grey-darken-1 font-weight-light">Select a dataset to view content</h2>
            </div>

            <div v-else class="d-flex flex-column h-100 w-100">
              <div class="d-flex align-center pa-4 pb-0 flex-shrink-0">
                  <div class="text-h6 text-white font-weight-bold text-uppercase d-flex align-center font-mono">
                    <v-icon start color="#FFD700" class="mr-2">mdi-table</v-icon>
                    {{ selectedDatasetName }}
                  </div>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="#FFD700"
                    variant="outlined"
                    class="text-gold font-weight-bold hover-fill-gold"
                    prepend-icon="mdi-plus-box"
                    @click="openAddDataDialog"
                  >
                    Add Entry
                  </v-btn>
              </div>

              <v-divider class="mx-4 mt-4 mb-0 border-gold-subtle"></v-divider>

              <div class="flex-grow-1 pa-4 overflow-hidden" style="position: relative;">
                  <v-data-table
                    :headers="dataTableHeaders"
                    :items="selectedDatasetData"
                    :loading="isLoadingData"
                    class="data-table bg-transparent text-white h-100"
                    density="comfortable"
                    hover
                    fixed-header
                    style="height: 100%; overflow-y: auto;"
                  >
                    <template v-slot:item.prompt="{ item }">
                        <div class="text-truncate-2 text-white">{{ item.raw ? item.raw.prompt : item.prompt }}</div>
                    </template>
                    <template v-slot:item.response="{ item }">
                        <div class="text-truncate-2 text-grey">{{ item.raw ? item.raw.response : item.response }}</div>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <div class="d-flex justify-end">
                        <v-btn icon="mdi-pencil" variant="text" color="amber-darken-1" size="small" @click="handleEditRow(item)"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" color="red-darken-2" size="small" @click="handleDeleteRow(item)"></v-btn>
                        </div>
                    </template>
                  </v-data-table>
              </div>
            </div>
          </div>
        </div>
      </v-window-item>

      <v-window-item value="training" class="fill-height scroll-y">
        <v-container class="fill-height align-center justify-center">
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card class="gold-panel elevation-10">
                <v-card-item class="pb-4">
                  <template v-slot:prepend>
                    <v-icon size="x-large" color="#FFD700" class="beat-icon">mdi-school</v-icon>
                  </template>
                  <v-card-title class="text-h5 font-mono text-white font-weight-bold">FINE-TUNING JOB</v-card-title>
                  <v-card-subtitle class="text-grey-darken-1">Configure your AI model training parameters</v-card-subtitle>
                </v-card-item>

                <v-divider class="border-gold-subtle"></v-divider>

                <v-card-text class="pt-6">
                  <v-select
                    v-model="trainingConfig.base_model_id"
                    :items="availableBaseModels"
                    item-title="name"
                    item-value="id"
                    label="Select Base Model (Teacher)"
                    variant="outlined"
                    color="#FFD700"
                    base-color="grey-darken-2"
                    class="gold-input mb-4"
                    :loading="trainingStore.isLoadingModels"
                    prepend-inner-icon="mdi-robot"
                  ></v-select>

                  <v-select
                    v-model="trainingConfig.dataset_name"
                    :items="datasets.map(d => d.name)"
                    label="Select Dataset (Textbook)"
                    variant="outlined"
                    color="#FFD700"
                    base-color="grey-darken-2"
                    class="gold-input mb-4"
                    :loading="isLoadingList"
                    prepend-inner-icon="mdi-book-open-variant"
                  ></v-select>

                  <v-text-field
                    v-model="trainingConfig.new_model_name"
                    label="Name Your New Model"
                    placeholder="e.g. my-genius-model-v1"
                    variant="outlined"
                    color="#FFD700"
                    base-color="grey-darken-2"
                    class="gold-input mb-4"
                    prepend-inner-icon="mdi-tag-text"
                  ></v-text-field>

                  <v-row>
                    <v-col cols="6">
                        <v-text-field
                            v-model.number="trainingConfig.training_args.epochs"
                            label="Epochs (Cycles)"
                            type="number"
                            variant="outlined"
                            color="#FFD700"
                            base-color="grey-darken-2"
                            density="compact"
                            class="gold-input"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field
                            v-model.number="trainingConfig.training_args.batch_size"
                            label="Batch Size"
                            type="number"
                            variant="outlined"
                            color="#FFD700"
                            base-color="grey-darken-2"
                            density="compact"
                            class="gold-input"
                        ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-card-actions class="pa-6 pt-0">
                  <v-btn
                    block
                    size="x-large"
                    color="#FFD700"
                    variant="flat"
                    @click="handleStartTraining"
                    :loading="trainingStore.isLoadingJobs"
                    prepend-icon="mdi-rocket-launch"
                    class="text-black font-weight-bold glow-button"
                  >
                    START TRAINING
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>

      <v-window-item value="monitor" class="fill-height">
        <div class="d-flex flex-row fill-height w-100 overflow-hidden pa-4">

            <v-card class="gold-panel full-height-card mr-4" style="width: 350px; flex-shrink: 0;">
                <v-card-title class="text-gold font-weight-bold border-bottom-gold font-mono text-subtitle-2">
                    ACTIVE JOBS
                </v-card-title>
                <div v-if="trainingJobs.length === 0" class="text-center py-10 text-grey">
                    No jobs found.
                </div>
                <v-list bg-color="transparent" class="pa-2 overflow-y-auto flex-grow-1 custom-scrollbar" v-else>
                    <v-list-item
                        v-for="job in trainingJobs"
                        :key="job.job_id"
                        class="scanner-item my-1 mb-2"
                        :class="{ 'active-scanner': selectedJobId === job.job_id }"
                        @click="selectJob(job)"
                    >
                        <template v-slot:prepend>
                            <v-icon :color="getStatusColor(job.status)" icon="mdi-brain" class="mr-3"></v-icon>
                        </template>
                        <v-list-item-title class="text-white font-weight-bold font-mono text-body-2">
                            {{ job.new_model_name }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption text-grey font-mono mt-1">
                            Status: <span :class="`text-${getStatusColor(job.status)}`">{{ job.status }}</span>
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <div class="d-flex align-center">
                                <v-progress-circular
                                    v-if="job.status === 'TRAINING' || job.status === 'PREPARING'"
                                    indeterminate
                                    color="#FFD700"
                                    size="16"
                                    width="2"
                                    class="mr-2"
                                ></v-progress-circular>
                                <v-btn
                                    icon="mdi-delete"
                                    size="small"
                                    variant="text"
                                    color="red-darken-2"
                                    @click.stop="handleDeleteJob(job.job_id)"
                                    title="Delete Job History"
                                ></v-btn>
                            </div>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>

            <div class="d-flex flex-column flex-grow-1 full-height-card" style="min-width: 0;">
                <v-card class="terminal-card gold-panel flex-grow-1">
                    <div class="terminal-header d-flex align-center px-4 py-2 border-bottom-gold">
                        <v-icon icon="mdi-console" color="grey" size="small" class="mr-2"></v-icon>
                        <span class="text-caption text-grey font-weight-mono">TRAINING OUTPUT CONSOLE</span>
                        <v-spacer></v-spacer>
                        <span v-if="selectedJob" class="text-caption text-gold font-weight-bold">
                            ID: {{ selectedJob.job_id }}
                        </span>
                    </div>

                    <div class="terminal-body pa-4 font-weight-mono" ref="terminalBody">
                        <div v-if="!selectedJob" class="text-grey-darken-2 text-center mt-10">
                            Select a job from the left panel to view live logs.
                        </div>
                        <div v-else>
                            <div class="log-line text-gold font-weight-bold mb-2">
                                === ATTACHED TO SESSION: {{ selectedJob.new_model_name }} ===
                            </div>

                            <div v-for="(log, index) in parsedLogs" :key="index" class="log-line">
                                <span class="text-grey-darken-2 mr-2" v-if="log.time">[{{ log.time }}]</span>
                                <span :class="log.class">{{ log.msg }}</span>
                            </div>

                            <div v-if="selectedJob.status === 'TRAINING'" class="log-line mt-2">
                                <span class="text-gold blink-cursor">_</span>
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>

        </div>
      </v-window-item>
    </v-window>

    <v-dialog v-model="isAddDataDialogOpen" max-width="800px" persistent>
      <v-card class="gold-panel border-gold-thin">
        <v-toolbar color="transparent" class="border-bottom-gold">
            <v-toolbar-title class="text-gold font-weight-bold font-mono">
                {{ isEditMode ? 'Edit Entry' : `Add New Entry` }}
            </v-toolbar-title>
            <v-btn icon="mdi-close" variant="text" color="grey" @click="closeAddDataDialog"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <p class="text-grey-lighten-1 mb-2 font-mono text-caption">INPUT PROMPT (USER)</p>
          <v-textarea
            v-model="newPrompt"
            variant="outlined"
            rows="3"
            color="#FFD700"
            base-color="grey-darken-2"
            class="gold-input mb-4 font-mono"
          ></v-textarea>

          <p class="text-grey-lighten-1 mb-2 font-mono text-caption">EXPECTED RESPONSE (AI)</p>
          <v-textarea
            v-model="newResponse"
            variant="outlined"
            rows="5"
            color="#FFD700"
            base-color="grey-darken-2"
            class="gold-input font-mono"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="closeAddDataDialog">Cancel</v-btn>
          <v-btn color="#FFD700" variant="flat" @click="handleSaveNewData" class="text-black font-weight-bold">Save Entry</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isNewDatasetDialogOpen" max-width="500px" persistent>
      <v-card class="gold-panel border-gold-thin">
        <v-card-title class="font-mono text-gold pt-4 pl-4">Create New Dataset</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="newDatasetName"
            label="Dataset Name"
            variant="outlined"
            color="#FFD700"
            base-color="grey-darken-2"
            class="gold-input font-mono"
            autofocus
            @keyup.enter="handleCreateNewDataset"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="isNewDatasetDialogOpen = false">Cancel</v-btn>
          <v-btn color="#FFD700" variant="flat" @click="handleCreateNewDataset" class="text-black font-weight-bold">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useDatasetStore } from '@/store/datasets';
import { useUiStore } from '@/store/ui';
import { useTrainingStore } from '@/store/training';
import { storeToRefs } from 'pinia';

const datasetStore = useDatasetStore();
const uiStore = useUiStore();
const trainingStore = useTrainingStore();

const { datasets, selectedDatasetName, selectedDatasetData, isLoadingList, isLoadingData } = storeToRefs(datasetStore);
const { localModels: availableBaseModels, trainingJobs } = storeToRefs(trainingStore);

const activeTab = ref('datasets');
const isAddDataDialogOpen = ref(false);
const newPrompt = ref('');
const newResponse = ref('');
const isEditMode = ref(false);
const editingRowId = ref(null);
const isNewDatasetDialogOpen = ref(false);
const newDatasetName = ref('');

const selectedJobId = ref(null);
const terminalBody = ref(null);
let pollInterval = null;

const trainingConfig = ref({
  base_model_id: null,
  dataset_name: null,
  new_model_name: '',
  training_args: { epochs: 1, batch_size: 4 }
});

const dataTableHeaders = ref([
  { title: 'Prompt', key: 'prompt', sortable: false, width: '40%', class: 'text-gold font-weight-bold text-uppercase' },
  { title: 'Response', key: 'response', sortable: false, width: '45%', class: 'text-gold font-weight-bold text-uppercase' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '15%', class: 'text-gold font-weight-bold text-uppercase' },
]);

const selectedJob = computed(() => {
    return trainingJobs.value.find(j => j.job_id === selectedJobId.value) || null;
});

const parsedLogs = computed(() => {
    if (!selectedJob.value || !selectedJob.value.live_logs) return [];

    return selectedJob.value.live_logs.split('\n').map(line => {
        if (!line.trim()) return null;

        const timeMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\](.*)/);
        let time = '';
        let msg = line;

        if (timeMatch) {
            time = timeMatch[1];
            msg = timeMatch[2].trim();
        }

        let cssClass = 'text-grey-lighten-1';
        const lowerMsg = msg.toLowerCase();

        if (lowerMsg.includes('error') || lowerMsg.includes('failed')) cssClass = 'text-red-accent-2';
        else if (lowerMsg.includes('warning') || lowerMsg.includes('warn')) cssClass = 'text-amber';
        else if (lowerMsg.includes('success') || lowerMsg.includes('done') || lowerMsg.includes('complete')) cssClass = 'text-green-accent-3';
        else if (lowerMsg.includes('step') || lowerMsg.includes('epoch')) cssClass = 'text-gold';
        else if (lowerMsg.includes('loading') || lowerMsg.includes('starting')) cssClass = 'text-grey';

        return { time, msg, class: cssClass };
    }).filter(l => l !== null);
});

watch(parsedLogs, () => {
    nextTick(() => {
        if (terminalBody.value) {
            terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
        }
    });
});

onMounted(async () => {
    await datasetStore.fetchDatasets();
    await trainingStore.fetchLocalModels();
    await trainingStore.fetchTrainingJobs();

    if (trainingJobs.value.length > 0) {
        selectedJobId.value = trainingJobs.value[0].job_id;
    }

    startPolling();
});

onUnmounted(() => stopPolling());

function startPolling() {
    stopPolling();
    pollInterval = setInterval(() => {
        if (activeTab.value === 'monitor') {
            trainingStore.fetchTrainingJobs();
        }
    }, 2000);
}

function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
}

function selectJob(job) {
    selectedJobId.value = job.job_id;
}

function getStatusColor(status) {
    if (status === 'COMPLETED') return 'green-accent-3';
    if (status === 'FAILED') return 'red-accent-2';
    if (status === 'TRAINING' || status === 'PREPARING') return 'amber';
    return 'grey';
}

function openNewDatasetDialog() { newDatasetName.value = ''; isNewDatasetDialogOpen.value = true; }
async function handleCreateNewDataset() {
  if (newDatasetName.value && newDatasetName.value.trim()) {
    await datasetStore.createNewDataset(newDatasetName.value.trim());
    isNewDatasetDialogOpen.value = false;
  }
}
async function handleDeleteDataset(name) {
  if (confirm(`Delete ${name}?`)) await datasetStore.removeDataset(name);
}
function openAddDataDialog() { isEditMode.value = false; newPrompt.value = ''; newResponse.value = ''; isAddDataDialogOpen.value = true; }
function handleEditRow(item) {
    const actualItem = item.raw || item;
    isEditMode.value = true; editingRowId.value = actualItem.id; newPrompt.value = actualItem.prompt; newResponse.value = actualItem.response; isAddDataDialogOpen.value = true;
}
function closeAddDataDialog() { isAddDataDialogOpen.value = false; }
async function handleSaveNewData() {
    if (!newPrompt.value || !newResponse.value) return;
    if (isEditMode.value) await datasetStore.updateRowInSelectedDataset({ id: editingRowId.value, prompt: newPrompt.value, response: newResponse.value });
    else await datasetStore.addDataToSelectedDataset([{ prompt: newPrompt.value, response: newResponse.value }]);
    closeAddDataDialog();
}
async function handleDeleteRow(item) {
    const rowId = (item.raw || item).id;
    if (rowId && confirm('Delete row?')) await datasetStore.removeRowFromSelectedDataset(rowId);
}
async function handleStartTraining() {
    if (!trainingConfig.value.base_model_id || !trainingConfig.value.dataset_name) return;
    const success = await trainingStore.startTrainingJob(trainingConfig.value);
    if (success) {
        activeTab.value = 'monitor';
        trainingConfig.value.new_model_name = '';
        setTimeout(() => {
            if(trainingJobs.value.length > 0) selectedJobId.value = trainingJobs.value[0].job_id;
        }, 1000);
    }
}

async function handleDeleteJob(jobId) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Job History',
        text: 'Are you sure you want to delete this training job history? This cannot be undone.',
        color: 'error',
        confirmText: 'Delete'
    });

    if (confirmed) {
        await trainingStore.deleteJob(jobId);
        if (selectedJobId.value === jobId) {
            selectedJobId.value = null;
        }
    }
}
</script>

<style scoped>
.ai-trainer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #000;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

/* BLACK GOLD THEME */
.text-gold { color: #FFD700 !important; }
.border-gold-subtle { border-color: rgba(255, 215, 0, 0.1) !important; }
.border-gold-thin { border: 1px solid rgba(255, 215, 0, 0.2) !important; }
.border-bottom-gold { border-bottom: 1px solid rgba(255, 215, 0, 0.1) !important; }

.gold-panel {
  background: #080808;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.left-panel { background-color: rgba(15, 15, 15, 0.95) !important; border-right: 1px solid rgba(255, 255, 255, 0.05) !important; }
.right-panel { background-color: #000 !important; }

.font-mono { font-family: 'Fira Code', 'Consolas', monospace; }
.tracking-wide { letter-spacing: 1px; }

.full-height-card { height: 100%; display: flex; flex-direction: column; }

/* SCANNER/JOB LIST ITEMS */
.scanner-item {
  border-radius: 4px;
  margin: 0 4px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}
.scanner-item:hover { background: rgba(255, 215, 0, 0.05); cursor: pointer; }
.scanner-item.active-scanner {
  background: rgba(255, 215, 0, 0.05);
  border-left: 3px solid #FFD700;
}

.dataset-list-item:hover { background-color: rgba(255, 215, 0, 0.05); }

/* TERMINAL STYLE */
.terminal-card { background: #000000; border: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; }
.terminal-body { flex: 1; overflow-y: auto; font-size: 0.85rem; line-height: 1.4; color: #ccc; }
.log-line { margin-bottom: 2px; word-break: break-all; }

/* ANIMATIONS */
.beat-icon { animation: beat 1.5s infinite; }
.blink-cursor { animation: blink 1s infinite; }
@keyframes beat { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes blink { 50% { opacity: 0; } }

/* SCROLLBARS */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #000; }
::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.2); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #FFD700; }

/* VUETIFY OVERRIDES */
.ai-trainer-page :deep(.v-list-item-title),
.ai-trainer-page :deep(.v-card-title),
.ai-trainer-page :deep(.v-field__input) { color: white !important; }

/* INPUTS */
.gold-input :deep(.v-field) {
    background-color: rgba(255,255,255,0.03);
    border-color: rgba(255,255,255,0.1);
}
.gold-input :deep(.v-field--focused) {
    border-color: #FFD700 !important;
}

/* DATA TABLE */
.data-table :deep(th) { background-color: #0a0a0a !important; color: #FFD700 !important; }
.data-table :deep(td) { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
.data-table :deep(tr:hover) { background-color: rgba(255, 215, 0, 0.05) !important; }

.hover-fill-gold:hover { background-color: #FFD700 !important; color: #000 !important; }
</style>