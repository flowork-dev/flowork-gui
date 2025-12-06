//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\ai-trainer\TrainingConfig.vue total lines 612 
//#######################################################################

<template>
  <v-container fluid class="fill-height align-start justify-center pa-4">
    <v-row class="fill-height w-100">

      <v-col cols="12" md="6" class="d-flex flex-column">
        <v-card class="gold-panel elevation-10 flex-grow-1 d-flex flex-column">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-icon size="large" color="#FFD700" class="beat-icon">mdi-head-snowflake-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-mono text-white font-weight-bold">NEURAL CONFIG</v-card-title>
            <v-card-subtitle class="text-caption text-grey-darken-1 font-mono">Architecture & Hyperparameters</v-card-subtitle>
          </v-card-item>

          <v-divider class="border-gold-subtle"></v-divider>

          <v-card-text class="pt-6 flex-grow-1 d-flex flex-column">

            <div class="mb-4">
                <div class="text-caption text-gold font-weight-bold mb-1 font-mono">BASE MODEL SOURCE</div>
                <v-combobox
                  v-model="trainingConfig.base_model_id"
                  :items="textModelsOnly"
                  item-title="name"
                  item-value="id"
                  placeholder="Select Local Path or Type HF ID (e.g. unsloth/Qwen...)"
                  variant="outlined"
                  color="#FFD700"
                  base-color="grey-darken-2"
                  class="gold-input font-mono text-white"
                  :loading="trainingStore.isLoadingModels"
                  prepend-inner-icon="mdi-cube-scan"
                  density="compact"
                  hide-details="auto"
                  hint="Supports local folders or HuggingFace ID formats."
                  persistent-hint
                ></v-combobox>
            </div>

            <div class="mb-6">
                <div class="text-caption text-gold font-weight-bold mb-1 font-mono">NEW MODEL IDENTITY</div>
                <v-text-field
                    v-model="trainingConfig.new_model_name"
                    placeholder="e.g. flowork-brain-v1"
                    variant="outlined"
                    color="#FFD700"
                    base-color="grey-darken-2"
                    class="gold-input font-mono text-white"
                    prepend-inner-icon="mdi-tag-text-outline"
                    density="compact"
                    hide-details
                ></v-text-field>
            </div>

            <div class="mb-4 pa-3 border-gold-dashed rounded bg-glass animated-fade-in">
                <div class="d-flex align-center justify-space-between mb-2">
                    <div class="text-caption text-gold font-weight-bold font-mono">LORA PARAMETERS</div>
                    <v-icon size="small" color="grey">mdi-tune</v-icon>
                </div>

                <v-row dense>
                  <v-col cols="6">
                      <v-select
                          v-model="trainingConfig.training_args.max_seq_length"
                          label="Context Window"
                          :items="[2048, 4096, 8192, 16384]"
                          variant="outlined"
                          color="#FFD700"
                          base-color="grey-darken-2"
                          density="compact"
                          class="gold-input font-mono text-white"
                          hide-details
                      ></v-select>
                  </v-col>
                  <v-col cols="6">
                      <v-select
                          v-model="trainingConfig.training_args.lora_rank"
                          label="LoRA Rank (r)"
                          :items="[8, 16, 32, 64, 128]"
                          variant="outlined"
                          color="#FFD700"
                          base-color="grey-darken-2"
                          density="compact"
                          class="gold-input font-mono text-white"
                          hide-details
                      ></v-select>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                      <v-text-field
                          v-model.number="trainingConfig.training_args.epochs"
                          label="Epochs"
                          type="number"
                          variant="outlined"
                          color="#FFD700"
                          base-color="grey-darken-2"
                          density="compact"
                          class="gold-input font-mono text-white"
                          hide-details
                      ></v-text-field>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                      <v-text-field
                          v-model.number="trainingConfig.training_args.batch_size"
                          label="Batch Size"
                          type="number"
                          variant="outlined"
                          color="#FFD700"
                          base-color="grey-darken-2"
                          density="compact"
                          class="gold-input font-mono text-white"
                          hide-details
                      ></v-text-field>
                  </v-col>
                </v-row>
            </div>

            <div class="flex-grow-1 radar-container position-relative overflow-hidden rounded border-gold-subtle d-flex align-center justify-center mt-2">
                <div class="cyber-grid"></div>
                <div class="scanline"></div>

                <div v-if="!isReadyToTrain" class="d-flex flex-column align-center justify-center position-relative z-index-top">
                    <div class="radar-circle-outer"></div>
                    <div class="radar-sweep"></div>
                    <div class="text-center mt-12">
                        <div class="text-caption text-grey-darken-1 font-mono blink-text">AWAITING INPUT</div>
                        <div class="text-caption text-grey-darken-2 font-mono" style="font-size: 10px;">{{ readinessError }}</div>
                    </div>
                </div>

                <div v-else class="d-flex flex-column align-center justify-center position-relative z-index-top">
                    <div class="reactor-ring ring-1"></div>
                    <div class="reactor-ring ring-2"></div>
                    <div class="reactor-core pulse-fast">
                        <v-icon color="black" size="medium">mdi-lightning-bolt</v-icon>
                    </div>
                    <div class="target-bracket top-left"></div>
                    <div class="target-bracket top-right"></div>
                    <div class="target-bracket bottom-left"></div>
                    <div class="target-bracket bottom-right"></div>

                    <div class="text-center mt-10">
                        <div class="text-h6 text-gold font-mono font-weight-bold text-shadow-gold">SYSTEM LOCKED</div>
                        <div class="text-caption text-green-accent-3 font-mono">READY TO TRAIN</div>
                    </div>
                </div>
            </div>

          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" class="d-flex flex-column">
        <v-card class="gold-panel elevation-10 flex-grow-1 d-flex flex-column">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-icon size="large" color="#FFD700">mdi-database-sync</v-icon>
            </template>
            <v-card-title class="text-h6 font-mono text-white font-weight-bold">DATA INJECTION</v-card-title>
            <v-card-subtitle class="text-caption text-grey-darken-1 font-mono">Knowledge Base Management</v-card-subtitle>

            <template v-slot:append>
                <v-btn
                  size="large"
                  color="#FFD700"
                  variant="flat"
                  @click="handleStartTraining"
                  :loading="isBusy"
                  prepend-icon="mdi-rocket-launch"
                  class="text-black font-weight-bold glow-button font-mono"
                  :disabled="!isReadyToTrain"
                >
                  INITIATE TRAINING
                </v-btn>
            </template>
          </v-card-item>

          <v-divider class="border-gold-subtle"></v-divider>

          <v-card-text class="pt-4 flex-grow-1 overflow-y-auto custom-scrollbar d-flex flex-column">

            <v-tabs
                v-model="datasetSource"
                color="#FFD700"
                align-tabs="start"
                class="mb-6 border-bottom-gold custom-tabs flex-shrink-0"
            >
                <v-tab value="library" class="font-mono font-weight-bold text-caption"><v-icon start>mdi-bookshelf</v-icon> LIBRARY</v-tab>
                <v-tab value="upload" class="font-mono font-weight-bold text-caption"><v-icon start>mdi-upload</v-icon> UPLOAD NEW</v-tab>
            </v-tabs>

            <v-window v-model="datasetSource" class="flex-grow-1">

                <v-window-item value="library" class="fill-height">
                     <div class="pa-4 border-gold-dashed bg-glass rounded h-100 d-flex flex-column justify-center">
                         <div class="text-caption text-gold font-mono mb-2">SELECT PRE-PROCESSED DATASET</div>
                         <v-select
                            v-model="trainingConfig.dataset_name"
                            :items="datasets.map(d => d.name)"
                            placeholder="Choose JSONL File..."
                            variant="outlined"
                            color="#FFD700"
                            base-color="grey-darken-2"
                            class="gold-input font-mono text-white"
                            :loading="isLoadingList"
                            prepend-inner-icon="mdi-file-code-outline"
                            menu-icon="mdi-chevron-down"
                        ></v-select>

                        <div class="text-center mt-4" v-if="trainingConfig.dataset_name">
                            <v-chip color="green" variant="outlined" class="font-mono">
                                <v-icon start size="small">mdi-check</v-icon> DATASET LINKED
                            </v-chip>
                        </div>
                     </div>
                </v-window-item>

                <v-window-item value="upload" class="fill-height">
                    <div class="d-flex mb-4 gap-2">
                         <v-btn-toggle v-model="uploadMode" density="compact" color="#FFD700" mandatory class="border-gold-subtle custom-toggle w-100">
                            <v-btn value="files" class="flex-grow-1 font-mono text-caption" prepend-icon="mdi-file-multiple">FILES</v-btn>
                            <v-btn value="folder" class="flex-grow-1 font-mono text-caption" prepend-icon="mdi-folder-search">FOLDER SCANNER</v-btn>
                         </v-btn-toggle>
                    </div>

                    <div v-if="uploadMode === 'files'" class="animated-fade-in">
                        <v-file-input
                            v-model="manualFiles"
                            label="Select Source Files"
                            placeholder="PDF, DOCX, TXT, JSON, ZIP"
                            variant="outlined"
                            color="#FFD700"
                            base-color="grey-darken-2"
                            class="gold-input mb-2 font-mono text-white"
                            prepend-inner-icon="mdi-paperclip"
                            show-size
                            multiple
                            counter
                            accept=".pdf,.docx,.doc,.txt,.json,.md,.zip"
                        >
                            <template v-slot:selection="{ fileNames }">
                                <span class="text-gold font-weight-bold">{{ fileNames.length }} file(s) queued</span>
                            </template>
                        </v-file-input>
                    </div>

                    <div v-else class="animated-fade-in">
                        <div class="pa-6 border-gold-dashed bg-glass text-center position-relative scanner-zone">
                             <input type="file" ref="folderInput" webkitdirectory directory multiple style="display: none" @change="handleFolderSelect" />

                             <div v-if="folderFiles.length === 0">
                                 <v-icon size="48" color="grey-darken-2" class="mb-2">mdi-radar</v-icon>
                                 <div class="text-body-2 text-grey font-mono mb-2">TARGET DIRECTORY NOT SET</div>
                                 <v-btn color="#FFD700" variant="outlined" class="font-mono font-weight-bold" @click="triggerFolderScan">
                                    INITIATE SCAN
                                 </v-btn>
                             </div>

                             <div v-else>
                                 <v-icon size="48" color="green" class="mb-2 beat-icon">mdi-folder-check</v-icon>
                                 <div class="text-h6 text-white font-mono font-weight-bold mb-1">{{ folderStats.count }} FILES ACQUIRED</div>
                                 <div class="text-caption text-grey font-mono mb-4">Volume: {{ (folderStats.size / 1024 / 1024).toFixed(2) }} MB</div>
                                 <v-btn color="red" variant="text" size="small" class="font-mono" prepend-icon="mdi-close" @click="clearFolderSelection">
                                    ABORT SELECTION
                                 </v-btn>
                             </div>
                        </div>
                    </div>

                    <div class="mt-4" v-if="manualFiles.length > 0 || folderFiles.length > 0">
                         <v-btn
                            block
                            color="green-darken-3"
                            variant="flat"
                            size="large"
                            class="font-mono font-weight-bold glow-button"
                            @click="executeIngestion"
                            :loading="isBusy"
                            prepend-icon="mdi-import"
                          >
                            INGEST & MERGE [{{ manualFiles.length + folderFiles.length }} FILES]
                          </v-btn>
                    </div>

                    <div v-if="trainingConfig.dataset_name && datasetSource === 'upload'" class="mt-4">
                         <v-alert color="#002200" border="start" border-color="green" class="font-mono" density="compact">
                            <template v-slot:prepend><v-icon color="green">mdi-check-network</v-icon></template>
                            <div class="text-caption text-white">Active Dataset: <b class="text-green">{{ trainingConfig.dataset_name }}</b></div>
                         </v-alert>
                    </div>

                </v-window-item>
            </v-window>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showScanResult" max-width="400" persistent>
      <v-card color="black" class="border-gold">
         <v-card-title class="font-mono text-gold font-weight-bold d-flex align-center">
            <v-icon start color="green">mdi-radar</v-icon> SCAN COMPLETE
         </v-card-title>
         <v-card-text class="font-mono text-white pt-4">
            <div class="mb-2 text-caption">Target sector analysis finished.</div>
            <div class="d-flex justify-space-between border-gold-dashed pa-2 rounded bg-glass mb-2">
                <span class="text-grey">Files Locked:</span>
                <span class="text-green font-weight-bold">{{ folderStats.count }}</span>
            </div>
            <div class="d-flex justify-space-between border-gold-dashed pa-2 rounded bg-glass">
                <span class="text-grey">Data Volume:</span>
                <span class="text-gold font-weight-bold">{{ (folderStats.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
         </v-card-text>
         <v-card-actions class="pa-4">
           <v-spacer></v-spacer>
           <v-btn color="#FFD700" variant="flat" class="text-black font-weight-bold font-mono" @click="showScanResult = false">ACKNOWLEDGE</v-btn>
         </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isBusy" persistent fullscreen transition="dialog-bottom-transition">
      <v-card color="black" class="d-flex align-center justify-center">
        <div class="text-center" style="max-width: 500px;">
           <div class="mb-6 position-relative d-inline-block">
               <v-progress-circular indeterminate color="#FFD700" size="128" width="8"></v-progress-circular>
               <v-icon size="48" color="#FFD700" class="position-absolute" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">mdi-brain</v-icon>
           </div>
           <h2 class="text-h4 font-mono font-weight-bold text-white mb-2 blink-text">{{ processingStatus }}</h2>
           <p class="text-grey font-mono text-body-1">{{ processingDetail }}</p>
           <div class="mt-8 border-gold-dashed pa-4 rounded">
               <div class="d-flex justify-space-between text-caption text-gold font-mono mb-1">
                   <span>CORE ACTIVITY</span>
                   <span>ACTIVE</span>
               </div>
               <v-progress-linear indeterminate color="#FFD700" height="2"></v-progress-linear>
           </div>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTrainingStore } from '@/store/training';
import { useDatasetStore } from '@/store/datasets';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';

const emit = defineEmits(['training-started']);

const trainingStore = useTrainingStore();
const datasetStore = useDatasetStore();
const uiStore = useUiStore();

const { localModels: availableBaseModels } = storeToRefs(trainingStore);
const { datasets, isLoadingList } = storeToRefs(datasetStore);

const trainingConfig = ref({
  base_model_id: 'unsloth/Qwen2.5-7B-bnb-4bit',
  dataset_name: null,
  new_model_name: '',
  training_args: {
      epochs: 3,
      batch_size: 1,
      gradient_accumulation_steps: 4,
      max_seq_length: 2048,
      lora_rank: 16
  }
});

const datasetSource = ref('library');
const uploadMode = ref('files');
const manualFiles = ref([]);
const folderFiles = ref([]);
const folderStats = ref({ count: 0, size: 0 });
const folderInput = ref(null);

const showScanResult = ref(false);
const isBusy = ref(false);
const processingStatus = ref('PROCESSING');
const processingDetail = ref('Please wait...');

const textModelsOnly = computed(() => availableBaseModels.value);

const isReadyToTrain = computed(() => {
    return trainingConfig.value.base_model_id &&
           trainingConfig.value.dataset_name &&
           trainingConfig.value.new_model_name.trim();
});

const readinessError = computed(() => {
    if (!trainingConfig.value.base_model_id) return "MISSING: TARGET MODEL";
    if (!trainingConfig.value.new_model_name.trim()) return "MISSING: NEW IDENTITY";
    if (!trainingConfig.value.dataset_name) return "MISSING: DATASET";
    return "";
});

onMounted(async () => {
    if (availableBaseModels.value.length === 0) await trainingStore.fetchLocalModels();
    if (datasets.value.length === 0) await datasetStore.fetchDatasets();
});

function triggerFolderScan() {
    if (folderInput.value) folderInput.value.click();
}

function handleFolderSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    folderFiles.value = fileArray;
    folderStats.value.count = fileArray.length;
    folderStats.value.size = fileArray.reduce((acc, f) => acc + f.size, 0);
    showScanResult.value = true;
    event.target.value = '';
}

function clearFolderSelection() {
    folderFiles.value = [];
    folderStats.value = { count: 0, size: 0 };
}

async function executeIngestion() {
    const allFiles = [...manualFiles.value, ...folderFiles.value];

    if (allFiles.length === 0) {
        uiStore.showConfirmation({
            title: 'EMPTY QUEUE',
            text: 'Please select files or scan a folder first.',
            color: 'warning',
            confirmText: 'OK',
            cancelText: ' '
        });
        return;
    }

    processingStatus.value = "INGESTING DATA";
    processingDetail.value = `Merging ${allFiles.length} files into knowledge base...`;
    isBusy.value = true;

    try {
        const result = await trainingStore.uploadDatasetFile(allFiles);

        if (result.success) {
            trainingConfig.value.dataset_name = result.filename;
            uiStore.showNotification({ text: "Ingestion Successful!", color: "success" });
            manualFiles.value = [];
            clearFolderSelection();
        } else {
            uiStore.showConfirmation({
                title: 'INGESTION FAILED',
                text: result.error || "Server responded with error.",
                color: 'error',
                confirmText: 'CLOSE',
                cancelText: ' '
            });
        }
    } catch (e) {
        uiStore.showConfirmation({
            title: 'CONNECTION ERROR',
            text: e.message,
            color: 'error',
            confirmText: 'CLOSE',
            cancelText: ' '
        });
    } finally {
        isBusy.value = false;
    }
}

async function handleStartTraining() {
    if (!isReadyToTrain.value) {
        uiStore.showConfirmation({
            title: 'CONFIG INCOMPLETE',
            text: `Cannot initiate: ${readinessError.value}`,
            color: 'warning',
            confirmText: 'OK',
            cancelText: ' '
        });
        return;
    }

    processingStatus.value = "INITIATING PROTOCOL";
    processingDetail.value = "Allocating VRAM and preparing tensors...";
    isBusy.value = true;

    try {
        const result = await trainingStore.startTrainingJob(trainingConfig.value);

        if (result && result.success) {
            trainingConfig.value.new_model_name = '';
            emit('training-started');
        } else {
            uiStore.showConfirmation({
                title: 'KERNEL REJECTED',
                text: result?.error || "Kernel refused command.",
                color: 'error',
                confirmText: 'ACKNOWLEDGE',
                cancelText: ' '
            });
        }
    } catch (e) {
        uiStore.showConfirmation({
            title: 'CRITICAL ERROR',
            text: e.message,
            color: 'error',
            confirmText: 'CLOSE',
            cancelText: ' '
        });
    } finally {
        isBusy.value = false;
    }
}
</script>

<style scoped>
/* UTILS */
.text-gold { color: #FFD700 !important; }
.border-gold-subtle { border-color: rgba(255, 215, 0, 0.1) !important; }
.border-gold-dashed { border: 1px dashed rgba(255, 215, 0, 0.3); }
.border-bottom-gold { border-bottom: 1px solid rgba(255, 215, 0, 0.2); }
.border-gold { border: 1px solid #FFD700 !important; }
.text-shadow-gold { text-shadow: 0 0 10px rgba(255, 215, 0, 0.8); }
.z-index-top { z-index: 5; position: relative; }

/* PANEL */
.gold-panel {
    background: #080808;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
}
.bg-glass { background: rgba(255,255,255,0.03); }

/* INPUTS */
.gold-input :deep(.v-field) { background-color: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1); font-family: 'JetBrains Mono', monospace; }
.gold-input :deep(.v-field--focused) { border-color: #FFD700 !important; box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }
.gold-input :deep(.v-field__input), .gold-input :deep(.v-select__selection-text) { color: white !important; }

.custom-tabs :deep(.v-tab) { color: rgba(255, 255, 255, 0.5) !important; }
.custom-tabs :deep(.v-tab--selected) { color: #FFD700 !important; opacity: 1 !important; }
.custom-toggle .v-btn { color: rgba(255, 255, 255, 0.5) !important; background: rgba(0,0,0,0.3); }
.custom-toggle .v-btn--active { color: black !important; background-color: #FFD700 !important; font-weight: bold; }

/* RADAR VISUALIZER */
.radar-container { background: radial-gradient(circle, rgba(20,20,20,1) 0%, rgba(0,0,0,1) 90%); min-height: 180px; perspective: 1000px; }
.cyber-grid {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image: linear-gradient(rgba(255, 215, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.05) 1px, transparent 1px);
    background-size: 20px 20px; z-index: 1; opacity: 0.3;
}
/* RADAR IDLE */
.radar-circle-outer {
    position: absolute; width: 120px; height: 120px;
    border: 1px dashed rgba(255, 255, 255, 0.2); border-radius: 50%;
    animation: spin-slow 20s linear infinite;
}
.radar-sweep {
    position: absolute; width: 60px; height: 60px;
    background: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 100% 0 0 0; top: 50%; left: 50%; transform-origin: 0 0; margin-top: -60px; margin-left: -60px;
    animation: radar-sweep 4s linear infinite;
}
/* RADAR LOCKED */
.reactor-ring {
    position: absolute; border-radius: 50%;
    border-left: 2px solid #FFD700; border-right: 2px solid #FFD700; border-top: 2px solid transparent; border-bottom: 2px solid transparent;
}
.ring-1 { width: 140px; height: 140px; animation: spin-fast 2s linear infinite; opacity: 0.6; box-shadow: 0 0 10px rgba(255, 215, 0, 0.2); }
.ring-2 { width: 110px; height: 110px; animation: spin-fast-reverse 3s linear infinite; opacity: 0.8; }
.reactor-core {
    width: 50px; height: 50px; background: #FFD700; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px #FFD700;
}
.target-bracket {
    position: absolute; width: 20px; height: 20px;
    border-color: #FFD700; border-style: solid; border-width: 0; opacity: 0.8;
}
.top-left { top: 20px; left: 20px; border-top-width: 2px; border-left-width: 2px; }
.top-right { top: 20px; right: 20px; border-top-width: 2px; border-right-width: 2px; }
.bottom-left { bottom: 20px; left: 20px; border-bottom-width: 2px; border-left-width: 2px; }
.bottom-right { bottom: 20px; right: 20px; border-bottom-width: 2px; border-right-width: 2px; }

@keyframes spin-slow { 100% { transform: rotate(360deg); } }
@keyframes spin-fast { 100% { transform: rotate(360deg); } }
@keyframes spin-fast-reverse { 100% { transform: rotate(-360deg); } }
@keyframes radar-sweep { from { transform: rotate(0deg) skewX(0); } to { transform: rotate(360deg) skewX(0); } }
@keyframes core-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); box-shadow: 0 0 50px #FFD700; } }
.pulse-fast { animation: core-pulse 0.5s infinite alternate; }

.font-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important; }
.beat-icon { animation: beat 2s infinite ease-in-out; }
@keyframes beat { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
.glow-button { box-shadow: 0 0 10px rgba(255, 215, 0, 0.2); transition: all 0.3s ease; }
.glow-button:hover { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); transform: translateY(-2px); }
.blink-text { animation: blink 1.5s infinite; }
@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.animated-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 215, 0, 0.2); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 215, 0, 0.5); }
</style>
