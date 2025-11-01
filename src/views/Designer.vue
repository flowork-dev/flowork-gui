#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Designer.vue
# REVISI:
# 1. Mengubah style '.offline-banner' dan '.read-only-indicator'
#    'top: 16px' menjadi 'top: calc(var(--v-layout-top, 64px) + 16px)'
#    agar posisinya dinamis di bawah AppBar.
#######################################################################
<template>
  <v-layout class="designer-view-layout fill-height">

    <v-navigation-drawer
        v-model="uiStore.isToolboxOpen"
        width="300"
        class="left-drawer glass-panel"
        app
        >
        <Toolbox />
    </v-navigation-drawer>

    <div class="main-canvas flex-grow-1">
      <NeuralCanvasBackground />

      <div v-if="!socketStore.isConnected && authStore.isAuthenticated" class="offline-banner">
          <v-icon icon="mdi-server-network-off-outline" class="mr-2"></v-icon>
          Engine is Offline. You are in Offline Mode.
          <v-btn to="/my-engines" size="small" variant="tonal" class="ml-4">Configure Identity & Engine</v-btn>
      </div>
      <div v-if="isReadOnly" class="read-only-indicator">
          <v-icon icon="mdi-eye-outline" class="mr-2"></v-icon>
          {{ loc('sharing_readonly_mode') }}
      </div>

      <template v-if="uiStore.designerMode === 'logic'">
          <VueFlow
            v-model="elements"
            class="vue-flow-canvas"
            @dragover="handleDragOver"
            @drop="handleDrop"
            @pane-click="handlePaneClick"
            @node-click="handleNodeClick"
            @node-context-menu="onNodeContextMenu"
            @edge-context-menu="onEdgeContextMenu"
            @edge-click="handleEdgeClick"
            @pane-context-menu="onPaneContextMenu"
            :fit-view-on-init="true"
            :edge-class="getEdgeClass"
            @node-drag-start="onNodeDragStart"
            @node-drag-stop="onNodeDragStop"
            @connect="onConnect"
            :nodes-draggable="!isReadOnly"
            :nodes-connectable="!isReadOnly"
            :elements-selectable="true"
            :apply-changes="false"
            @pane-ready="onPaneReady"
          >

          <Background :variant="BackgroundVariant.Dots" :gap="25" :size="1" color="#2a2a4a" />

            <template #node-default="props">
              <CustomNode
                :id="props.id"
                :label="props.label"
                :selected="props.selected"
                :data="props.data"
                :is-zoomed-out="isZoomedOut"
              />
            </template>
          </VueFlow>

          <div class="flow-watermark" v-if="isCanvasEmpty">
              <h1>FLOWORK</h1>
              <p>made with love</p>
          </div>
          <CommunityLinks />
      </template>

      <DataflowView v-if="uiStore.designerMode === 'data'" />
      <DebuggerView v-if="uiStore.designerMode === 'debugger'" />

      <ControlsFooter />
    </div>

    <v-navigation-drawer
        location="right"
        :model-value="isRightPanelOpen"
        @update:modelValue="handleRightPanelClose"
        width="500"
        temporary
        class="right-drawer glass-panel"
        app
      >
      <RightSidebar />
    </v-navigation-drawer>

    <v-menu
      v-model="contextMenu.visible"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      location="top start"
      absolute
      >
      <v-list density="compact">
        <template v-for="(item, index) in contextMenu.items">
          <v-divider v-if="item.isDivider" :key="`divider-${index}`"></v-divider>
           <v-list-item v-else-if="item.items" :key="`submenu-${index}`">
              <template v-slot:prepend>
                  <v-icon :icon="item.icon" :color="item.color"></v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <v-menu activator="parent" location="end">
                  <v-list density="compact">
                      <v-list-item v-for="(subItem, subIndex) in item.items" :key="subIndex" @click="subItem.action">
                          <template v-slot:prepend>
                              <v-icon :icon="subItem.icon" :color="subItem.color"></v-icon>
                          </template>
                          <v-list-item-title>{{ subItem.title }}</v-list-item-title>
                      </v-list-item>
                  </v-list>
              </v-menu>
          </v-list-item>
          <v-list-item v-else :key="index" @click="item.action" :disabled="item.disabled">
            <template v-slot:prepend>
              <v-icon :icon="item.icon" :color="item.color"></v-icon>
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <DataViewer />
    <ShareWorkflowModal />

  </v-layout>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import { Background, BackgroundVariant } from '@vue-flow/background';
import Toolbox from '@/components/Toolbox.vue';
import CustomNode from '@/components/CustomNode.vue';
import RightSidebar from '@/components/RightSidebar.vue';
import ControlsFooter from '@/components/ControlsFooter.vue';
import DataViewer from '@/components/DataViewer.vue';
import CommunityLinks from '@/components/CommunityLinks.vue';
import ShareWorkflowModal from '@/components/ShareWorkflowModal.vue';
import { useComponentStore } from '@/store/components';
import { useWorkflowStore } from '@/store/workflow';
import { useUiStore } from '@/store/ui';
import { useLocaleStore } from '@/store/locale';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import DataflowView from '@/views/DataflowView.vue';
import DebuggerView from '@/views/DebuggerView.vue';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const componentStore = useComponentStore();
const workflowStore = useWorkflowStore();
const uiStore = useUiStore();
const localeStore = useLocaleStore();
const authStore = useAuthStore();
const socketStore = useSocketStore();
const router = useRouter();
const route = useRoute();

const { elements, selectedNode, connectionStatus, isReadOnly, isCanvasEmpty } = storeToRefs(workflowStore);
const { loc } = storeToRefs(localeStore);
const isRightPanelOpen = computed(() => !!uiStore.activeRightPanel);

const { project, screenToFlowCoordinate, fitView, zoom } = useVueFlow();
const isZoomedOut = computed(() => zoom?.value < 0.4);
function goToMyEngines() { router.push('/my-engines'); }

const contextMenu = ref({ visible: false, x: 0, y: 0, items: [], target: null });
const lastPaneClickPosition = ref({ x: 0, y: 0 });

const colorPalette = [
  { name: 'Default', value: null, icon: 'mdi-circle-off-outline', color: 'grey' }, // English Hardcode
  { name: 'Blue', value: '#2196F3', icon: 'mdi-circle', color: '#2196F3' }, // English Hardcode
  { name: 'Green', value: '#4CAF50', icon: 'mdi-circle', color: '#4CAF50' }, // English Hardcode
  { name: 'Orange', value: '#FF9800', icon: 'mdi-circle', color: '#FF9800' }, // English Hardcode
  { name: 'Red', value: '#F44336', icon: 'mdi-circle', color: '#F44336' }, // English Hardcode
];

function onPaneReady() {
    setTimeout(() => { fitView(); }, 100);
}

function getEdgeClass(edge) {
    const status = connectionStatus.value[edge.id]?.status;
    if (status === 'ACTIVE') { // English Hardcode
        setTimeout(() => {
            if (connectionStatus.value[edge.id]) {
                connectionStatus.value[edge.id].status = 'IDLE'; // English Hardcode
            }
        }, 1000);
        return 'connection-active'; // English Hardcode
    }
    return '';
}

function handleEdgeClick({ event, edge }) {
    workflowStore.fetchConnectionData(edge.id);
}

function handleRightPanelClose(isOpen) {
    if (!isOpen) {
        if (!uiStore.isPropertiesPanelPinned || uiStore.activeRightPanel !== 'properties') { // English Hardcode
             uiStore.closeRightPanel();
        }
    }
}

function onPaneContextMenu(event) {
  event.preventDefault();
  lastPaneClickPosition.value = { x: event.clientX, y: event.clientY };
  contextMenu.value.target = null;
  contextMenu.value.items = [
    { title: 'Paste Node', icon: 'mdi-content-paste', action: () => { // English Hardcode
        const { x, y } = project(lastPaneClickPosition.value);
        workflowStore.pasteNode({ x, y });
    }, disabled: !workflowStore.clipboard || isReadOnly.value },
  ];
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  nextTick(() => { contextMenu.value.visible = true; });
}

function onNodeContextMenu({ event, node }) {
  event.preventDefault();
  contextMenu.value.target = node;
  contextMenu.value.items = [
    { title: 'Run From This Node', icon: 'mdi-play-box-outline', action: () => workflowStore.executeCurrentWorkflow(node.id), disabled: !workflowStore.canExecute }, // English Hardcode
    {
      title: 'Change Color', // English Hardcode
      icon: 'mdi-palette',
      items: colorPalette.map(color => ({
        title: color.name,
        icon: color.icon,
        color: color.color,
        action: () => workflowStore.setNodeColor({ nodeId: node.id, color: color.value })
      })),
      disabled: isReadOnly.value
    },
    { isDivider: true },
    { title: 'Copy Node', icon: 'mdi-content-copy', action: () => workflowStore.copyNode(node) }, // English Hardcode
    { title: 'Duplicate Node', icon: 'mdi-content-duplicate', action: () => workflowStore.duplicateNode(node), disabled: isReadOnly.value }, // English Hardcode
    { title: 'View Execution Log', icon: 'mdi-console-line', action: () => console.log('View logs for', node.id) }, // English Hardcode
    { isDivider: true },
    { title: 'Delete Node', icon: 'mdi-delete-outline', color: 'red', action: () => workflowStore.removeElements([node]), disabled: isReadOnly.value } // English Hardcode
  ];
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  nextTick(() => { contextMenu.value.visible = true; });
}

function onEdgeContextMenu({ event, edge }) {
  event.preventDefault();
  contextMenu.value.target = edge;
  contextMenu.value.items = [
    { title: 'View Data History', icon: 'mdi-history', action: () => workflowStore.fetchConnectionData(edge.id) }, // English Hardcode
    { isDivider: true },
    { title: 'Delete Connection', icon: 'mdi-delete-outline', color: 'red', action: () => workflowStore.removeElements([edge]), disabled: isReadOnly.value } // English Hardcode
  ];
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  nextTick(() => { contextMenu.value.visible = true; });
}

onMounted(() => {
  const token = route.params.token;
  if (token) {
    console.log(`[Designer] Found share token: ${token}, loading workflow...`); // English Hardcode
    workflowStore.loadSharedWorkflow(token);
  } else {
    console.log('[Designer] Normal session. Waiting for WebSocket connection to fetch data.'); // English Hardcode
  }
  uiStore.isToolboxOpen = true;
});

function handleDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; // English Hardcode
}

function handleDrop(event) {
  if (isReadOnly.value) return;
  const droppedData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}'); // English Hardcode
  if (!droppedData.id) return;
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY - 64 });
  workflowStore.addNode({
      moduleId: droppedData.id,
      x: position.x,
      y: position.y,
  });
}

function onConnect(connectionData) {
    if (isReadOnly.value) return;
    workflowStore.addEdge(connectionData);
}

function handlePaneClick() {
    workflowStore.clearSelectedNode();
    if (uiStore.activeRightPanel !== 'properties' || !uiStore.isPropertiesPanelPinned) { // English Hardcode
        uiStore.closeRightPanel();
    }
    contextMenu.value.visible = false;
}

function handleNodeClick({ event, node }) {
    workflowStore.setSelectedNode(node);
    uiStore.setActiveRightPanel('properties'); // English Hardcode
}

function onNodeDragStart(event) {
  const node = event.node;
  if (node) {
    if (!node.data) node.data = {};
    node.data.isDragging = true;
  }
}
function onNodeDragStop({ event, node }) {
  if (node) {
    if (!node.data) node.data = {};
    node.data.isDragging = false;
  }
}
</script>

<style scoped>
.glass-panel {
  background-color: rgba(12, 12, 20, 0.7) !important;
  backdrop-filter: blur(10px);
  border: none !important;
}
.left-drawer {
    border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.right-drawer {
    border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.main-canvas {
  position: relative;
  flex-grow: 1;
  height: 100%;
}

.offline-banner {
  position: absolute;
  /* Menggunakan variabel CSS Vuetify untuk posisi Y dinamis */
  top: calc(var(--v-layout-top, 64px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background-color: rgba(255, 152, 0, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  color: #FF9800;
  font-size: 0.8rem;
  font-family: 'Orbitron', monospace;
  letter-spacing: 1px;
  pointer-events: all;
  border: 1px solid rgba(255, 152, 0, 0.5);
  display: flex;
  align-items: center;
}
.read-only-indicator {
  position: absolute;
  /* Menggunakan variabel CSS Vuetify untuk posisi Y dinamis */
  top: calc(var(--v-layout-top, 64px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background-color: rgba(255, 193, 7, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  color: #FFC107;
  font-size: 0.8rem;
  font-family: 'Orbitron', monospace;
  letter-spacing: 1px;
  pointer-events: none;
  border: 1px solid rgba(255, 193, 7, 0.5);
}
.flow-watermark {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none; z-index: 0; opacity: 0.1; text-align: center; color: white;
}
.flow-watermark h1 { font-size: 10rem; font-family: 'Orbitron', monospace; font-weight: 900; }
.flow-watermark p { font-size: 1.5rem; margin-top: -2rem; }

.orbitron-font { font-family: 'Orbitron', monospace; }
.action-btn { font-weight: bold; color: #010c03 !important; }
.neural-canvas {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.5;
}
</style>

<style>
/* Global style needed for edge animation */
.vue-flow__edge.connection-active .vue-flow__edge-path {
    stroke: #39ff14;
    stroke-width: 2.5;
    stroke-dasharray: 5;
    animation: vue-flow-animated-edge 1s linear infinite;
}
@keyframes vue-flow-animated-edge { to { stroke-dashoffset: -10; } }
</style>