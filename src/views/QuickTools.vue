#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\QuickTools.vue
# REVISI:
# 1. Memastikan warna teks tab (inactive) menggunakan warna terang (--text-primary).
# 2. Memastikan warna teks input/label di form tengah kontras.
#######################################################################
<template>
  <div class="quick-tools-layout">
    <NeuralCanvasBackground />

    <div class="left-panel glass-panel">
      <v-toolbar color="transparent" class="panel-header">
        <v-icon icon="mdi-rocket-launch-outline" class="ml-2 mr-4" color="cyan"></v-icon>
        <v-toolbar-title class="orbitron-font">Quick Tools</v-toolbar-title>
      </v-toolbar>
      <v-divider></v-divider>

      <div class="scrolling-content-wrapper">
        <div class="pa-2">
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

        <v-tabs v-model="activeTab" grow background-color="transparent" class="tabs-header">
          <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="tab-item">{{ tab.title }}</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="toolbox-window flex-grow-1">
          <v-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value" class="fill-height">
            <ComponentList :type="tab.value" :search-term="searchTerm" @item-click="handleToolClick" />
          </v-window-item>
        </v-window>
      </div>
    </div>

    <div class="main-content-area">
      <v-toolbar color="transparent" class="panel-header">
        <v-toolbar-title v-if="selectedComponent" class="config-title orbitron-font">{{ loc(selectedComponent.name) }}</v-toolbar-title>
      </v-toolbar>
      <v-divider></v-divider>

      <div v-if="!selectedComponent" class="empty-state">
        <v-icon icon="mdi-arrow-left" size="64" color="grey-darken-2"></v-icon>
        <h2 class="mt-4 text-grey-darken-1 orbitron-font">Select a Tool</h2>
        <p>Select a tool from the left panel to configure and run it.</p>
      </div>

      <div v-else class="config-form-wrapper">
        <p class="text-caption text-grey-lighten-1 mb-6">{{ loc(selectedComponent.manifest.description) }}</p>

        <div v-if="nodeProperties.length === 0" class="text-center text-caption text-grey mt-4">
          This node has no configurable properties.
        </div>

        <div v-for="prop in nodeProperties" :key="prop.id" class="prop-item">
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
          class="hacker-btn"
        >Simulate</v-btn>
        <v-btn
          v-if="!isExecuting"
          color="cyan"
          variant="flat"
          class="action-button ml-2"
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
          class="action-button ml-2"
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
        <v-toolbar-title class="orbitron-font">Execution Log</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
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
import ComponentList from '@/components/ComponentList.vue';
import LogPanelContent from '@/components/panels/LogPanelContent.vue';
import CronEditor from '@/components/custom-properties/CronEditor.vue';
import DynamicKeyValueEditor from '@/components/custom-properties/DynamicKeyValueEditor.vue';
import FolderPairList from '@/components/custom-properties/FolderPairList.vue';
import { getComponentIconUrl } from '@/api';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const componentStore = useComponentStore();
const socketStore = useSocketStore();
const logStore = useLogStore();
const localeStore = useLocaleStore();
const uiStore = useUiStore();

const { allComponents, isLoading } = storeToRefs(componentStore);
const { loc } = storeToRefs(localeStore);
const { executionLogs } = storeToRefs(logStore);

const activeTab = ref('modules'); // English Hardcode
const searchTerm = ref('');
const tabs = ref([
    { title: 'MODULES', value: 'modules' }, // English Hardcode
    { title: 'PLUGINS', value: 'plugins' }, // English Hardcode
    { title: 'TOOLS', value: 'tools' }, // English Hardcode
]);

const selectedComponent = ref(null);
const configValues = ref({});

const currentJobId = ref(null);
const jobStatus = ref(null);
const isRunning = ref(false);
const isSimulating = ref(false);
const isStopping = ref(false);
const isExecuting = computed(() => isRunning.value || isSimulating.value);

function handleToolClick(item) {
    if (!socketStore.isConnected) {
        socketStore.connect();
        uiStore.showNotification({ text: "Connecting to engine...", color: 'info' }); // English Hardcode
        return;
    }
    console.log("Selected tool:", item.name); // English Log
    selectedComponent.value = item;

    logStore.clearLogs();
    jobStatus.value = null;
    currentJobId.value = null;
    if (isExecuting.value) handleStop();

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
    uiStore.setActiveRightPanel('log'); // English Hardcode
}

const nodeProperties = computed(() => {
  return selectedComponent.value?.manifest?.properties || [];
});

async function handleExecute(mode) {
  if (!selectedComponent.value) {
    uiStore.showNotification({ text: "No tool selected.", color: 'error' }); // English Hardcode
    return;
  }
  if (mode === 'EXECUTE') isRunning.value = true;
  if (mode === 'SIMULATE') isSimulating.value = true;

  logStore.clearLogs();
  uiStore.setActiveRightPanel('log'); // English Hardcode

  const newJobId = `quickjob-${uuidv4()}`; // English Hardcode
  currentJobId.value = newJobId;
  jobStatus.value = { text: 'Running...', color: 'info', icon: 'mdi-autorenew' }; // English Hardcode

  try {
    await socketStore.sendMessage({
      type: 'execute_standalone_node', // English Hardcode
      job_id: newJobId,
      node_data: {
        module_id: selectedComponent.value.id,
        config_values: configValues.value
      },
      mode: mode
    });
  } catch (e) {
    uiStore.showNotification({ text: `Failed to start: ${e.message}`, color: 'error' }); // English Hardcode
    jobStatus.value = { text: 'Failed to Start', color: 'error', icon: 'mdi-alert-circle-outline' }; // English Hardcode
    isRunning.value = false;
    isSimulating.value = false;
  }
}

async function handleStop() {
    if (!currentJobId.value) return;
    isStopping.value = true;
    try {
        await socketStore.sendMessage({
            type: 'stop_workflow', // English Hardcode
            job_id: currentJobId.value
        });
        uiStore.showNotification({ text: 'Stop signal sent.', color: 'warning' }); // English Hardcode
    } catch (e) {
        uiStore.showNotification({ text: `Failed to send stop signal: ${e.message}`, color: 'error' }); // English Hardcode
    } finally {
        isStopping.value = false;
    }
}

watch(executionLogs, (logs) => {
    if (!currentJobId.value) return;
    const statusLogs = logs.filter(l => l.workflow_context_id === currentJobId.value && l.source === 'Executor' && l.message.startsWith('Workflow finished')); // English Hardcode
    if (statusLogs.length > 0) {
        const lastStatusMsg = statusLogs[statusLogs.length - 1].message;
        if (lastStatusMsg.includes('SUCCEEDED')) jobStatus.value = { text: 'Succeeded', color: 'success', icon: 'mdi-check-circle-outline' }; // English Hardcode
        else if (lastStatusMsg.includes('FAILED')) jobStatus.value = { text: 'Failed', color: 'error', icon: 'mdi-alert-circle-outline' }; // English Hardcode
        else if (lastStatusMsg.includes('STOPPED')) jobStatus.value = { text: 'Stopped', color: 'warning', icon: 'mdi-stop-circle-outline' }; // English Hardcode
        isRunning.value = false;
        isSimulating.value = false;
        isStopping.value = false;
        currentJobId.value = null;
    }
}, { deep: true });

function getToolIcon(item) {
  if (item.componentType === 'modules') return 'mdi-cog-outline'; // English Hardcode
  if (item.componentType === 'plugins') return 'mdi-power-plug-outline'; // English Hardcode
  if (item.componentType === 'tools') return 'mdi-hammer-wrench'; // English Hardcode
  return 'mdi-cube-outline'; // English Hardcode
}

const canvasEl = ref(null);
let animationFrameId = null;
let mouse = { x: null, y: null, radius: 150 }; // English Hardcode
function handleMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
}

const setupCanvasAnimation = () => {
    const canvas = canvasEl.value; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resizeCanvas = () => { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove); // English Hardcode

    class Particle {
        constructor(x, y, size, color, speedX, speedY) {
            this.x = x; this.y = y; this.originX = x; this.originY = y;
            this.size = size; this.color = color; this.speedX = speedX; this.speedY = speedY;
            this.density = (Math.random() * 30) + 1;
        }
        update() {
            let dx = mouse.x - this.x; let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance; let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                let directionX = forceDirectionX * force * this.density * 0.5;
                let directionY = forceDirectionY * force * this.density * 0.5;
                this.x -= directionX; this.y -= directionY;
            } else {
                if (this.x !== this.originX) { let dx = this.x - this.originX; this.x -= dx/10; }
                if (this.y !== this.originY) { let dy = this.y - this.originY; this.y -= dy/10; }
            }
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
            if (distance >= mouse.radius) { this.x += this.speedX; this.y += this.speedY; }
        }
        draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    function init() {
        particles = []; let numberOfParticles = (canvas.height * canvas.width) / 9000; // English Hardcode
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1; let x = Math.random() * (innerWidth - size * 4) + size * 2; let y = Math.random() * (innerHeight - size * 4) + size * 2;
            let speedX = (Math.random() * 0.4) - 0.2; let speedY = (Math.random() * 0.4) - 0.2;
            particles.push(new Particle(x, y, size, 'rgba(0, 245, 255, 0.5)', speedX, speedY)); // English Hardcode
        }
    }
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                if (distance < (canvas.width / 7) * (canvas.height / 7)) { // English Hardcode
                    opacityValue = 1 - (distance / 20000); // English Hardcode
                    ctx.strokeStyle = `rgba(191, 0, 255, ${opacityValue})`; // English Hardcode
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke();
                }
            }
        }
    }
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
    }
    init(); animate();
};
onMounted(() => {
    setupCanvasAnimation();
    if (!socketStore.isConnected && !socketStore.isConnecting) {
      socketStore.connect();
    }
});
onUnmounted(() => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', setupCanvasAnimation);
    window.removeEventListener('mousemove', handleMouseMove); // English Hardcode
});
</script>

<style scoped>
.quick-tools-layout {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: var(--bg-dark);
}
.neural-canvas {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.5;
}
.glass-panel {
  background-color: rgba(12, 12, 20, 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  z-index: 2; display: flex; flex-direction: column; flex-shrink: 0; height: 100%;
}
.panel-header {
    flex-shrink: 0; min-height: 56px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.scrolling-content-wrapper {
    flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0;
}
.left-panel {
  width: 300px; border-right: 1px solid rgba(255, 255, 255, 0.1) !important; overflow-y: hidden;
}
.left-panel .toolbox-window {
    flex-grow: 1; overflow-y: hidden; min-height: 0;
}
.main-content-area {
  z-index: 2; display: flex; flex-direction: column; flex-grow: 1; position: relative; min-width: 350px;
}
.config-form-wrapper {
  padding: 24px; padding-top: 0px; padding-bottom: 96px; flex-grow: 1; overflow-y: auto; min-height: 0;
  background-color: rgba(26, 26, 46, 0.85);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}
.empty-state {
  display: flex; flex-direction: column; justify-content: center; align-items: center; flex-grow: 1; padding-bottom: 72px; text-align: center;
}
.execution-footer {
  flex-shrink: 0; display: flex; align-items: center; padding: 16px 24px;
  background-color: var(--bg-panel); border-top: 1px solid var(--border-glow-soft); z-index: 3;
}
.right-panel {
  width: 400px; border-left: 1px solid rgba(255, 255, 255, 0.1) !important; color: var(--text-primary);
}
.orbitron-font { font-family: 'Orbitron', monospace; color: var(--text-primary); }
.config-title { color: var(--neon-cyan); margin-bottom: 8px; font-family: 'Orbitron', monospace; font-size: 1.1rem; }
.action-button { font-weight: bold; color: #010c03 !important; }
.hacker-input :deep(.v-field) { background-color: #2a2a4a !important; color: #FFFFFF !important; }
.hacker-input :deep(.v-field__outline) { border-color: rgba(0, 245, 255, 0.5) !important; border-width: 1px !important; }
.hacker-input :deep(.v-field--focused .v-field__outline) { border-width: 2px !important; border-color: #00f5ff !important; }
.hacker-input :deep(textarea), .hacker-input :deep(input), .hacker-input :deep(.v-select__selection-text) {
  color: #FFFFFF !important; font-family: 'Courier New', monospace !important;
}
/* Memastikan label kontras */
.hacker-input :deep(.v-label),
.code-editor-wrapper .v-label {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
}
.hacker-input :deep(.v-field--active .v-label) { color: var(--neon-cyan) !important; }

.search-field :deep(.v-field) { background-color: #2a2a4a !important; border-radius: 8px !important; box-shadow: none !important; }
.tabs-header { border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important; }
.tab-item {
  color: var(--text-primary) !important; /* Warna putih untuk inactive */
  font-weight: bold; letter-spacing: 1px; transition: color 0.3s ease;
}
.tabs-header .v-tab--selected { color: #64ffda !important; }
.prop-item { margin-bottom: 24px; }
.code-editor-wrapper .v-label { margin-bottom: 4px; display: block; }
.code-editor :deep(textarea) { font-family: 'Courier New', Courier, monospace !important; font-size: 0.9rem; line-height: 1.6; }
.hacker-btn { color: var(--neon-cyan); border-color: rgba(0, 245, 255, 0.5); }
.hacker-btn:hover { border-color: var(--neon-cyan); background-color: rgba(0, 245, 255, 0.1); }
</style>