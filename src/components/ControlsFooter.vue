#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\ControlsFooter.vue
# REVISI:
# 1. Mengganti 'confirm()' dengan 'await uiStore.showConfirmation()'.
# 2. Membuat 'handleDeletePreset' menjadi 'async'.
# 3. Mengimpor 'useUiStore' (sudah ada, hanya memastikan).
#######################################################################
<template>
  <div
    class="controls-footer-container"
    :class="{ 'is-visible': isFooterVisible || isMouseOverFooter || isPinned || isMenuOpen }"
    @mouseover="isMouseOverFooter = true"
    @mouseleave="isMouseOverFooter = false"
  >
    <v-sheet class="controls-sheet" elevation="12" rounded="lg" color="transparent">
      <div class="control-row status-row">
        <v-chip
          :color="connectionChipColor"
          label
          size="small"
          class="connection-chip"
          @click="attemptReconnect"
          :prepend-icon="connectionChipIcon"
          :title="connectionChipTooltip"
        >
          {{ connectionChipText }}
        </v-chip>

        <v-chip
            v-if="isConnected && currentEngineStatus.isBusy !== undefined"
            :color="currentEngineStatus.isBusy ? 'warning' : 'grey-darken-1'"
            label
            size="small"
            class="ml-2"
            :prepend-icon="currentEngineStatus.isBusy ? 'mdi-timer-sand' : 'mdi-check-circle-outline'"
            :title="currentEngineStatus.isBusy ? 'Engine is currently processing a task' : 'Engine is idle'"
        >
            {{ currentEngineStatus.isBusy ? 'Busy' : 'Idle' }} </v-chip>

        <v-spacer></v-spacer>

        <div v-if="isConnected && currentEngineStatus.cpuPercent !== undefined" class="vitals-display">
          <v-icon size="x-small" color="grey-lighten-1">mdi-cpu-64-bit</v-icon>
          <span class="text-caption ml-1 mr-2">{{ currentEngineStatus.cpuPercent?.toFixed(0) ?? 'N/A' }}%</span>
          <v-icon size="x-small" color="grey-lighten-1">mdi-memory</v-icon>
          <span class="text-caption ml-1">{{ currentEngineStatus.memoryPercent?.toFixed(0) ?? 'N/A' }}%</span>
        </div>
      </div>
      <div class="control-row">
        <v-menu :disabled="isReadOnly" @update:modelValue="isMenuOpen = $event">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" prepend-icon="mdi-content-save" class="control-btn" :disabled="isReadOnly">File</v-btn> </template>
          <v-list density="compact">
            <v-list-item @click="handleSave" title="Save"></v-list-item> <v-list-item @click="handleSaveAs" title="Save As..."></v-list-item> <v-divider></v-divider>
            <v-list-item @click="handleShare" title="Share" :disabled="!currentPresetName"></v-list-item> </v-list>
        </v-menu>

        <v-btn @click="handleAutoLayout" prepend-icon="mdi-auto-fix" class="control-btn" :loading="layoutWorkerStore.isWorking" :disabled="isReadOnly">Layout</v-btn> <v-btn @click="workflowStore.clearCanvas" prepend-icon="mdi-delete-sweep-outline" class="control-btn-danger" :disabled="isReadOnly">Clear</v-btn> <v-spacer></v-spacer>
      </div>

      <div class="control-row execution-row">
        <v-select
          :items="presetItems"
          :model-value="selectedPreset"
          @update:modelValue="handlePresetSelection"
          label="Load Preset" density="compact"
          hide-details
          variant="solo-filled"
          flat
          class="preset-select"
          item-title="title"
          item-value="value"
          :disabled="workflowStore.isExecuting"
          @update:menu="isMenuOpen = $event"
        >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.title">
                <template v-slot:append>
                  <v-btn
                    :icon="favoritePresets.includes(item.raw.value) ? 'mdi-star' : 'mdi-star-outline'"
                    variant="text"
                    size="x-small"
                    :color="favoritePresets.includes(item.raw.value) ? 'yellow-accent-4' : 'grey'"
                    @click.stop="workflowStore.toggleFavorite(item.raw.value)"
                    title="Toggle Favorite" ></v-btn>
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="x-small"
                    @click.stop="handleDeletePreset(item.raw.value)"
                    title="Delete Preset" ></v-btn>
                </template>
              </v-list-item>
            </template>
        </v-select>
        <v-btn
            variant="outlined"
            density="comfortable"
            class="mx-2 control-btn"
            :disabled="workflowStore.isExecuting || !canExecute"
            @click="handleExecution('SIMULATE')"
        >Simulate</v-btn> <div v-if="!workflowStore.isExecuting">
          <v-btn
            @click="handleExecution('EXECUTE')"
            color="green-accent-4"
            class="run-button"
            elevation="4"
            :disabled="!canExecute"
          >
            <v-icon left>mdi-play</v-icon>
            Run Workflow </v-btn> </div>
        <div v-else class="d-flex" style="gap: 8px;">
          <v-btn
            @click="workflowStore.stopCurrentWorkflow()"
            color="red-darken-2"
            variant="flat"
            elevation="4"
          >
            <v-icon left>mdi-stop</v-icon>
            Stop </v-btn> <v-btn
            v-if="!workflowStore.isPaused"
            @click="workflowStore.pauseCurrentWorkflow()"
            variant="outlined"
          >
            <v-icon left>mdi-pause</v-icon>
            Pause </v-btn> <v-btn
            v-else
            @click="workflowStore.resumeCurrentWorkflow()"
            color="cyan"
            variant="flat"
          >
            <v-icon left>mdi-play</v-icon>
            Resume </v-btn> </div>
      </div>

      <div class="control-row">
        <div class="controls-group">
            <v-switch
                v-model="globalLoopConfig.isEnabled"
                label="Repeat" density="compact"
                hide-details
                color="primary"
                :disabled="isReadOnly"
            ></v-switch>
            <v-text-field
                v-model.number="globalLoopConfig.iterations"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 60px;"
                type="number"
                :disabled="!globalLoopConfig.isEnabled || isReadOnly"
            ></v-text-field>
        </div>

        <div class="controls-group">
            <v-switch
                v-model="globalLoopConfig.isDelayEnabled"
                label="Delay" density="compact"
                hide-details
                color="primary"
                :disabled="!globalLoopConfig.isEnabled || isReadOnly"
            ></v-switch>
            <v-radio-group
                inline
                density="compact"
                hide-details
                v-model="globalLoopConfig.delayType"
                :disabled="!globalLoopConfig.isEnabled || !globalLoopConfig.isDelayEnabled || isReadOnly"
            >
              <v-radio label="Static" value="static"></v-radio> <v-radio label="Random" value="random_range"></v-radio> </v-radio-group>
            <v-text-field
                v-if="globalLoopConfig.delayType === 'static'"
                v-model.number="globalLoopConfig.delayStatic"
                density="compact"
                hide-details
                variant="outlined"
                suffix="s."
                style="max-width: 80px;"
                type="number"
                :disabled="!globalLoopConfig.isEnabled || !globalLoopConfig.isDelayEnabled || isReadOnly"
            ></v-text-field>
            <div v-if="globalLoopConfig.delayType === 'random_range'" class="d-flex align-center" style="gap: 4px;">
                <v-text-field label="min" v-model.number="globalLoopConfig.delayRandomMin" type="number" density="compact" hide-details variant="outlined" style="max-width: 60px;" :disabled="!globalLoopConfig.isEnabled || !globalLoopConfig.isDelayEnabled || isReadOnly"></v-text-field>
                <span>-</span>
                <v-text-field label="max" v-model.number="globalLoopConfig.delayRandomMax" type="number" density="compact" hide-details variant="outlined" style="max-width: 60px;" :disabled="!globalLoopConfig.isEnabled || !globalLoopConfig.isDelayEnabled || isReadOnly"></v-text-field>
            </div>
        </div>

        <v-spacer></v-spacer>
      </div>

      <v-btn
        icon
        variant="text"
        size="x-small"
        class="pin-button"
        @click="uiStore.setFooterPin(!isPinned)"
        :color="isPinned ? 'cyan' : 'grey'"
      >
        <v-icon>{{ isPinned ? 'mdi-pin' : 'mdi-pin-outline' }}</v-icon>
      </v-btn>

      <div class="fab-wrapper-footer">
          <div v-if="isFabMenuOpen" class="fab-options-footer">
              <div class="fab-option-item" @click="uiStore.setActiveRightPanel('log')">
                  <span class="fab-label">Execution Log</span> <v-btn icon="mdi-console" color="blue-darken-2" size="small"></v-btn>
              </div>
              <div class="fab-option-item" @click="uiStore.setActiveRightPanel('promptSender')">
                  <span class="fab-label">Prompt Sender</span> <v-btn icon="mdi-auto-fix" color="teal-darken-2" size="small"></v-btn>
              </div>
          </div>
          <v-btn
              class="fab-activator-footer"
              icon
              variant="flat"
              style="width: 128px; height: 128px;"
              @click="isFabMenuOpen = !isFabMenuOpen"
          >
              <v-icon v-if="isFabMenuOpen" style="font-size: 64px;">mdi-close</v-icon>
              <v-img
                  v-else
                  src="/images/custom-button.png"
                  width="128"
                  height="128"
              ></v-img>
          </v-btn>
      </div>
    </v-sheet>

    <v-dialog v-model="isSaveAsDialogOpen" max-width="500px" persistent>
        <v-card class="dialog-card">
            <v-card-title class="orbitron-font">Save Workflow As</v-card-title> <v-card-text>
                <v-text-field
                    v-model="newPresetName"
                    label="Preset Name" placeholder="my-awesome-workflow" variant="outlined"
                    autofocus
                    @keyup.enter="confirmSaveAs"
                ></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="isSaveAsDialogOpen = false">Cancel</v-btn> <v-btn color="cyan" variant="flat" @click="confirmSaveAs" class="action-button">Save</v-btn> </v-card-actions>
        </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useWorkflowStore } from '@/store/workflow';
import { useUiStore } from '@/store/ui';
import { useShareStore } from '@/store/share';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import { useLayoutWorkerStore } from '@/store/layoutWorker';
import { useSocketStore } from '@/store/socket';
import { useEngineStore } from '@/store/engines';

const workflowStore = useWorkflowStore();
const uiStore = useUiStore();
const shareStore = useShareStore();
const authStore = useAuthStore();
const router = useRouter();
const layoutWorkerStore = useLayoutWorkerStore();
const socketStore = useSocketStore();
const engineStore = useEngineStore();

const { presets, currentPresetName, globalLoopConfig, isReadOnly, canExecute, favoritePresets } = storeToRefs(workflowStore);
const { isConnected, isConnecting, connectionError, currentEngineStatus } = storeToRefs(socketStore);
const { selectedEngine } = storeToRefs(engineStore);
const { isFooterPinned: isPinned } = storeToRefs(uiStore);

const selectedPreset = computed(() => currentPresetName.value);

const isFooterVisible = ref(false);
const isMouseOverFooter = ref(false);
const isMenuOpen = ref(false);

const isFabMenuOpen = ref(false);
const isSaveAsDialogOpen = ref(false);
const newPresetName = ref('');

const handleAutoLayout = () => {
    layoutWorkerStore.runAutoLayout();
};


function handleExecution(mode) {
    if (!socketStore.isConnected) {
        uiStore.showConnectEngineDialog();
        return;
    }

    if (canExecute.value && !authStore.isAuthenticated) {
        uiStore.showNotification({ text: 'Please login to run or simulate workflows.', color: 'warning' }); // English Hardcode
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } }); // English Hardcode
        return;
    }

    if (mode === 'SIMULATE') { // English Hardcode
        workflowStore.simulateCurrentWorkflow();
    } else {
        workflowStore.executeCurrentWorkflow();
    }
}

const handleMouseMove = (event) => {
  if (isPinned.value) {
    return;
  }
  const triggerZoneHeight = 100;
  const mouseY = event.clientY;
  const windowHeight = window.innerHeight;
  isFooterVisible.value = (windowHeight - mouseY < triggerZoneHeight);
};

onMounted(async () => {
  window.addEventListener('mousemove', handleMouseMove);
  layoutWorkerStore.initWorker();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});

const presetItems = computed(() => presets.value.map(p => ({ title: p.name, value: p.id })));

const handleSave = () => {
    if (!socketStore.isConnected) {
        uiStore.showConnectEngineDialog();
        return;
    }
    if (currentPresetName.value) {
        workflowStore.saveCurrentWorkflow(currentPresetName.value);
    } else {
        handleSaveAs();
    }
};
const handleSaveAs = () => {
  if (!socketStore.isConnected) {
    uiStore.showConnectEngineDialog();
    return;
  }
  newPresetName.value = currentPresetName.value || 'new-preset'; // English Hardcode
  isSaveAsDialogOpen.value = true;
};
const handleShare = () => {
    if (!currentPresetName.value) {
        uiStore.showNotification({ text: 'Please save the workflow before sharing.', color: 'warning' }); // English Hardcode
        return;
    }
    shareStore.openShareModal({ name: currentPresetName.value });
};


const confirmSaveAs = () => {
    if (newPresetName.value && newPresetName.value.trim()) {
        workflowStore.saveCurrentWorkflow(newPresetName.value.trim());
    }
    isSaveAsDialogOpen.value = false;
};

async function handleDeletePreset(presetId) {
    const preset = presets.value.find(p => p.id === presetId);
    if (preset) {
        const confirmed = await uiStore.showConfirmation({
            title: 'Delete Preset', // English Hardcode
            text: `Are you sure you want to delete the preset "${preset.name}"? This cannot be undone.`, // English Hardcode
            color: 'error', // English Hardcode
            confirmText: 'Delete' // English Hardcode
        });
        if (confirmed) {
            workflowStore.deletePresetAction(presetId);
        }
    }
}


function handlePresetSelection(presetId) {
    if (presetId) {
        workflowStore.loadWorkflow(presetId);
    }
}


const connectionChipColor = computed(() => {
  if (isConnecting.value) return 'info';
  if (isConnected.value) return 'success';
  if (connectionError.value) return 'error';
  return 'grey-darken-2';
});

const connectionChipIcon = computed(() => {
  if (isConnecting.value) return 'mdi-lan-pending';
  if (isConnected.value) return 'mdi-lan-connect';
  if (connectionError.value) return 'mdi-lan-disconnect';
  return 'mdi-power-plug-off-outline';
});

const connectionChipText = computed(() => {
  if (isConnecting.value) return 'Connecting...'; // English Hardcode
  if (isConnected.value) {
      const engineName = selectedEngine.value?.name || 'Engine'; // English Hardcode
      return `Connected: ${engineName}`; // English Hardcode
  }
  if (connectionError.value) {
      if (connectionError.value.includes('No engine selected')) return 'Select Engine'; // English Hardcode
      if (connectionError.value.includes('Auth Failed')) return 'Auth Failed'; // English Hardcode
      return 'Connection Error'; // English Hardcode
  }
  return 'Offline'; // English Hardcode
});

const connectionChipTooltip = computed(() => {
    if (isConnected.value) return `Connected to engine: ${selectedEngine.value?.name || 'N/A'}`; // English Hardcode
    if (connectionError.value) return connectionError.value;
    return 'Not connected to any engine'; // English Hardcode
});

function attemptReconnect() {
    if (connectionError.value && !isConnecting.value) {
        console.log("[ControlsFooter] Attempting manual reconnect..."); // English Log
        socketStore.connect();
    }
}
</script>

<style scoped>
.dialog-card {
  background-color: #2a2a4a !important;
  border: 1px solid rgba(0, 245, 255, 0.3) !important;
}
.dialog-card .v-card-title {
  font-family: 'Orbitron', monospace;
  color: var(--neon-cyan);
}
.dialog-card .action-button {
  font-weight: bold;
  color: #010c03 !important;
}

.controls-footer-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 150%);
  opacity: 0;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  z-index: 10;
  width: 90%;
  max-width: 800px;
  pointer-events: none;
}
.controls-footer-container.is-visible {
  transform: translate(-50%, 0);
  opacity: 1;
  pointer-events: auto;
}
.controls-sheet {
  background-color: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  padding: 12px;
  position: relative;
}
.pin-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 5;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.status-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
    margin-bottom: 10px;
    min-height: 36px;
}
.connection-chip {
    cursor: pointer;
    font-size: 0.75rem;
}
.vitals-display {
    display: flex;
    align-items: center;
    color: #B0BEC5;
}
.control-row:last-child { margin-bottom: 0; }
.execution-row { padding: 8px 0; }
.preset-select { max-width: 200px; }
.run-button {
  font-weight: bold;
  color: #000 !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.controls-sheet :deep(.v-label) {
    color: #E0E0E0 !important;
    opacity: 1 !important;
}
.control-btn {
  color: #00f5ff;
  border-color: rgba(0, 245, 255, 0.3);
}
.control-btn:hover {
  color: #FFFFFF;
  border-color: #00f5ff;
  text-shadow: 0 0 5px #00f5ff;
}

.control-btn-danger {
  color: #ff5252;
  border-color: rgba(255, 82, 82, 0.4);
}
.control-btn-danger:hover {
  border-color: #ff5252;
  text-shadow: 0 0 5px #ff5252;
}
.controls-group {
    display: flex;
    align-items: center;
    gap: 12px;
}
.fab-wrapper-footer {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
}
.fab-options-footer {
  position: absolute;
  bottom: 110%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}
.fab-option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.fab-label {
  background-color: rgba(20, 20, 30, 0.8);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.fab-activator-footer {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>