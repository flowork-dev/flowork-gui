//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\QuickTools.vue total lines 519 
//#######################################################################

<template>
  <div class="quick-tools-layout">
    <NeuralCanvasBackground />

    <div class="left-panel glass-panel">
      <div class="panel-header-wrapper">
        <v-toolbar color="transparent" class="panel-header" density="compact">
          <v-icon icon="mdi-rocket-launch-outline" class="ml-4 mr-3" color="cyan" size="small"></v-icon>
          <v-toolbar-title class="orbitron-font text-subtitle-1">Quick Tools</v-toolbar-title>
        </v-toolbar>
        <v-divider></v-divider>

        <div class="pa-3 pb-0">
          <v-text-field
            v-model="searchTerm"
            label="Search tools..."
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            density="compact"
            hide-details
            clearable
            class="search-field"
          ></v-text-field>
        </div>

        <v-tabs v-model="activeTab" grow background-color="transparent" class="tabs-header mt-2" density="compact">
          <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="tab-item text-caption">
            {{ tab.title }}
          </v-tab>
        </v-tabs>
      </div>

      <div class="toolbox-window-wrapper">
        <v-window v-model="activeTab" class="toolbox-window fill-height">
          <v-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value" class="fill-height scrollable-item">
            <ComponentList
              :type="tab.value"
              :search-term="searchTerm"
              @item-click="handleToolClick"
            />
          </v-window-item>
        </v-window>
      </div>
    </div>

    <div class="main-content-area">
      <v-toolbar color="transparent" class="panel-header">
        <v-toolbar-title class="config-title orbitron-font ml-4">
            {{ selectedComponent ? loc(selectedComponent.name) : 'Configuration' }}
        </v-toolbar-title>
      </v-toolbar>
      <v-divider></v-divider>

      <div v-if="!selectedComponent" class="empty-state">
        <v-icon icon="mdi-arrow-left" size="64" color="grey-darken-2"></v-icon>
        <h2 class="mt-4 text-grey-darken-1 orbitron-font">Select a Tool</h2>
        <p class="text-grey">Select a tool from the left panel to configure and run it.</p>
      </div>

      <div v-else class="config-form-wrapper">
        <div class="pa-4 pb-2">
            <p class="text-body-2 text-grey-lighten-1">
                {{ loc(selectedComponent.manifest.description) }}
            </p>
        </div>

        <div v-if="nodeProperties.length === 0" class="text-center text-caption text-grey mt-4">
          This tool has no configurable properties. Ready to run.
        </div>

        <div v-for="prop in nodeProperties" :key="prop.id" class="prop-item px-4">
          <CronEditor
            v-if="prop.type === 'cron_editor'"
            :label="loc(prop.label)"
            :hint="loc(prop.description)"
            v-model="configValues[prop.id]"
          />
          <DynamicKeyValueEditor
            v-else-if="prop.type === 'dynamic_key_value_editor'"
            :label="loc(prop.label)"
            :hint="loc(prop.description)"
            v-model="configValues[prop.id]"
          />
          <v-text-field
            v-else-if="['string', 'integer', 'float', 'folderpath'].includes(prop.type)"
            :label="loc(prop.label)"
            :type="['integer', 'float'].includes(prop.type) ? 'number' : 'text'"
            v-model="configValues[prop.id]"
            variant="outlined"
            density="compact"
            :hint="loc(prop.description)"
            persistent-hint
            class="hacker-input"
          ></v-text-field>
          <v-switch
            v-else-if="prop.type === 'boolean'"
            :label="loc(prop.label)"
            v-model="configValues[prop.id]"
            color="cyan"
            inset
            :messages="loc(prop.description)"
          ></v-switch>
          <v-textarea
            v-else-if="prop.type === 'textarea'"
            :label="loc(prop.label)"
            v-model="configValues[prop.id]"
            variant="outlined"
            density="compact"
            rows="3"
            :hint="loc(prop.description)"
            persistent-hint
            class="hacker-input"
          ></v-textarea>
          <div v-else-if="prop.type === 'code'" class="code-editor-wrapper">
            <label class="v-label text-caption">{{ loc(prop.label) }}</label>
            <v-textarea
              class="code-editor hacker-input"
              v-model="configValues[prop.id]"
              variant="outlined"
              density="compact"
              rows="10"
              :hint="loc(prop.description)"
              persistent-hint
            ></v-textarea>
          </div>
          <v-select
            v-else-if="prop.type === 'enum'"
            :label="loc(prop.label)"
            :items="prop.options"
            v-model="configValues[prop.id]"
            variant="outlined"
            density="compact"
            :hint="loc(prop.description)"
            persistent-hint
            class="hacker-input"
          ></v-select>
          <FolderPairList
            v-else-if="prop.type === 'list'"
            :label="loc(prop.label)"
            :hint="loc(prop.description)"
            v-model="configValues[prop.id]"
          />
        </div>
      </div>

      <div class="execution-footer">
        <v-chip
          v-if="jobStatus"
          :color="jobStatus.color"
          label
          size="small"
          class="mr-4"
        >
          <v-icon start :icon="jobStatus.icon"></v-icon>
          {{ jobStatus.text }}
        </v-chip>
        <v-spacer></v-spacer>

        <v-btn
          variant="outlined"
          @click="handleExecute('SIMULATE')"
          :disabled="isExecuting || !selectedComponent"
          :loading="isSimulating"
          class="hacker-btn mr-2"
          size="small"
        >Simulate</v-btn>

        <v-btn
          v-if="!isExecuting"
          color="cyan"
          variant="flat"
          class="action-button"
          @click="handleExecute('EXECUTE')"
          :loading="isRunning"
          :disabled="!selectedComponent"
        >
          <v-icon start>mdi-play</v-icon>
          Run
        </v-btn>
        <v-btn
          v-else
          color="error"
          variant="flat"
          class="action-button"
          @click="handleStop"
          :loading="isStopping"
        >
          <v-icon start>mdi-stop</v-icon>
          Stop
        </v-btn>
      </div>
    </div>

    <div class="right-panel glass-panel">
      <v-toolbar color="transparent" class="panel-header">
        <v-toolbar-title class="orbitron-font text-subtitle-1 ml-2">Log</v-toolbar-title>
        <v-spacer></v-spacer>
         <v-btn icon="mdi-delete-outline" size="small" variant="text" color="grey" @click="logStore.clearLogs()"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>
      <LogPanelContent class="scrolling-content-wrapper" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useComponentStore } from '@/store/components';
import { useSocketStore } from '@/store/socket';
import { useLogStore } from '@/store/logs';
import { useLocaleStore } from '@/store/locale';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import ComponentList from '@/components/ComponentList.vue'; // Direct import for manual control
import LogPanelContent from '@/components/panels/LogPanelContent.vue';
import CronEditor from '@/components/custom-properties/CronEditor.vue';
import DynamicKeyValueEditor from '@/components/custom-properties/DynamicKeyValueEditor.vue';
import FolderPairList from '@/components/custom-properties/FolderPairList.vue';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const componentStore = useComponentStore();
const socketStore = useSocketStore();
const logStore = useLogStore();
const localeStore = useLocaleStore();
const uiStore = useUiStore();

const { loc } = storeToRefs(localeStore);

const activeTab = ref('modules');
const searchTerm = ref('');
const tabs = ref([
    { title: 'MODULES', value: 'modules' },
    { title: 'PLUGINS', value: 'plugins' },
    { title: 'TOOLS', value: 'tools' },
]);

const selectedComponent = ref(null);
const configValues = ref({});

const currentJobId = ref(null);
const jobStatus = ref(null);
const isRunning = ref(false);
const isSimulating = ref(false);
const isStopping = ref(false);
const isExecuting = computed(() => isRunning.value || isSimulating.value);

let offStatusListener = null;

function handleToolClick(item) {
    if (!socketStore.isConnected) {
        socketStore.connect();
        uiStore.showNotification({ text: "Connecting to engine...", color: 'info' });
        return;
    }
    console.log("[QuickTools] Selected tool:", item.name);
    selectedComponent.value = item;

    logStore.clearLogs();
    jobStatus.value = null;
    currentJobId.value = null;
    isRunning.value = false;
    isSimulating.value = false;

    const defaults = {};
    (item.manifest?.properties || []).forEach(prop => {
      if (prop.default !== undefined) {
        let defaultValue = prop.default;
        if (prop.type === 'integer' || prop.type === 'float') defaultValue = Number(defaultValue);
        else if (prop.type === 'boolean') defaultValue = String(defaultValue).toLowerCase() === 'true';
        else if (prop.type === 'list' && !Array.isArray(defaultValue)) defaultValue = [];
        defaults[prop.id] = defaultValue;
      } else {
        defaults[prop.id] = null;
      }
    });
    configValues.value = defaults;

    uiStore.setActiveRightPanel('log');
}

const nodeProperties = computed(() => {
  return selectedComponent.value?.manifest?.properties || [];
});

async function handleExecute(mode) {
  if (!selectedComponent.value) {
    uiStore.showNotification({ text: "No tool selected.", color: 'error' });
    return;
  }

  if (mode === 'EXECUTE') isRunning.value = true;
  if (mode === 'SIMULATE') isSimulating.value = true;

  logStore.clearLogs();

  const newJobId = `quickjob-${uuidv4()}`;
  currentJobId.value = newJobId;
  jobStatus.value = { text: 'Running...', color: 'info', icon: 'mdi-autorenew' };

  try {
    await socketStore.sendMessage({
      type: 'execute_standalone_node',
      job_id: newJobId,
      node_data: {
        module_id: selectedComponent.value.id,
        config_values: configValues.value
      },
      mode: mode
    });
  } catch (e) {
    uiStore.showNotification({ text: `Failed to start: ${e.message}`, color: 'error' });
    jobStatus.value = { text: 'Failed to Start', color: 'error', icon: 'mdi-alert-circle-outline' };
    isRunning.value = false;
    isSimulating.value = false;
  }
}

async function handleStop() {
    if (!currentJobId.value) return;
    isStopping.value = true;
    try {
        await socketStore.sendMessage({
            type: 'stop_workflow',
            job_id: currentJobId.value
        });
        uiStore.showNotification({ text: 'Stop signal sent.', color: 'warning' });
    } catch (e) {
        uiStore.showNotification({ text: `Failed to send stop signal: ${e.message}`, color: 'error' });
    } finally {
        isStopping.value = false;
    }
}

function setupStatusListener() {
    if (!socketStore.socket) return;

    const listener = (data) => {
        const payload = data.payload || data;

        if (payload.job_id === currentJobId.value) {
            const status = payload.status_data?.status;
            console.log(`[QuickTools] Job Update: ${status}`);

            if (['SUCCEEDED', 'DONE', 'COMPLETED'].includes(status)) {
                jobStatus.value = { text: 'Succeeded', color: 'success', icon: 'mdi-check-circle-outline' };
                isRunning.value = false;
                isSimulating.value = false;
            } else if (['FAILED', 'ERROR'].includes(status)) {
                jobStatus.value = { text: 'Failed', color: 'error', icon: 'mdi-alert-circle-outline' };
                isRunning.value = false;
                isSimulating.value = false;
            } else if (['STOPPED', 'CANCELLED'].includes(status)) {
                jobStatus.value = { text: 'Stopped', color: 'warning', icon: 'mdi-stop-circle-outline' };
                isRunning.value = false;
                isSimulating.value = false;
            }
        }
    };

    socketStore.socket.on('WORKFLOW_EXECUTION_UPDATE', listener);

    return () => {
        if(socketStore.socket) socketStore.socket.off('WORKFLOW_EXECUTION_UPDATE', listener);
    };
}

watch(() => socketStore.isConnected, (connected) => {
    if (connected) {
        if (offStatusListener) offStatusListener();
        offStatusListener = setupStatusListener();
    }
});

onMounted(() => {
    if (!socketStore.isConnected && !socketStore.isConnecting) {
      socketStore.connect();
    }
    if (socketStore.isConnected) {
        offStatusListener = setupStatusListener();
    }
    componentStore.fetchAllComponents();
});

onUnmounted(() => {
    if (offStatusListener) offStatusListener();
});
</script>

<style scoped>
.quick-tools-layout {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: var(--bg-dark);
  overflow: hidden;
}

.neural-canvas {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.5;
}

/* LAYOUT STRUCTURE */
.left-panel {
  width: 320px;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
  display: flex;
  flex-direction: column;
  z-index: 2;
}
.main-content-area {
  z-index: 2;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  min-width: 350px;
  height: 100%;
}
.right-panel {
  width: 400px;
  border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
  display: flex;
  flex-direction: column;
  z-index: 2;
  color: var(--text-primary);
}

/* SCROLL AREAS (The Fix) */
.toolbox-window-wrapper {
  flex-grow: 1;
  min-height: 0; /* Important for nested flex scroll */
  overflow: hidden;
}
.toolbox-window .v-window-item {
    height: 100%;
    overflow-y: auto; /* Scroll happens here for list */
}
/* Custom Scrollbar for Component List */
.toolbox-window .v-window-item::-webkit-scrollbar,
.config-form-wrapper::-webkit-scrollbar,
.scrolling-content-wrapper::-webkit-scrollbar {
    width: 6px;
}
.toolbox-window .v-window-item::-webkit-scrollbar-thumb,
.config-form-wrapper::-webkit-scrollbar-thumb,
.scrolling-content-wrapper::-webkit-scrollbar-thumb {
    background-color: #4F4F4F;
    border-radius: 3px;
}

.config-form-wrapper {
  flex-grow: 1;
  overflow-y: auto; /* Scroll happens here for form */
  min-height: 0;
  background-color: rgba(26, 26, 46, 0.85);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}
.scrolling-content-wrapper {
    flex-grow: 1;
    overflow-y: auto;
    min-height: 0;
    background-color: #0F111A;
}

/* HEADERS */
.glass-panel {
  background-color: rgba(12, 12, 20, 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.panel-header {
    flex-shrink: 0;
    min-height: 56px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.execution-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--bg-panel);
  border-top: 1px solid var(--border-glow-soft);
  z-index: 3;
}

/* UTILS */
.orbitron-font { font-family: 'Orbitron', monospace; color: var(--text-primary); }
.config-title { color: var(--neon-cyan); font-size: 1.1rem; }
.action-button { font-weight: bold; color: #010c03 !important; }
.empty-state {
  display: flex; flex-direction: column; justify-content: center; align-items: center; flex-grow: 1; padding-bottom: 72px; text-align: center;
}

/* INPUTS */
.hacker-input :deep(.v-field) { background-color: #2a2a4a !important; color: #FFFFFF !important; }
.hacker-input :deep(.v-field__outline) { border-color: rgba(0, 245, 255, 0.5) !important; border-width: 1px !important; }
.hacker-input :deep(.v-field--focused .v-field__outline) { border-width: 2px !important; border-color: #00f5ff !important; }
.hacker-input :deep(textarea), .hacker-input :deep(input), .hacker-input :deep(.v-select__selection-text) {
  color: #FFFFFF !important; font-family: 'Courier New', monospace !important;
}
.search-field :deep(.v-field) { background-color: #2a2a4a !important; border-radius: 8px !important; }
.tabs-header { border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important; }
.tab-item { font-weight: bold; letter-spacing: 1px; color: var(--text-secondary) !important; }
.v-tab--selected { color: #64ffda !important; }
.prop-item { margin-bottom: 24px; }
.code-editor-wrapper .v-label { margin-bottom: 4px; display: block; color: var(--text-secondary); }
.code-editor :deep(textarea) { font-family: 'Courier New', Courier, monospace !important; font-size: 0.9rem; line-height: 1.6; }
.hacker-btn { color: var(--neon-cyan); border-color: rgba(0, 245, 255, 0.5); }
.hacker-btn:hover { border-color: var(--neon-cyan); background-color: rgba(0, 245, 255, 0.1); }
</style>
