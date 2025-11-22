//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Designer.vue total lines 430 
//#######################################################################

<template>
  <v-layout class="designer-view-layout fill-height">

    <v-navigation-drawer
        v-model="uiStore.isToolboxOpen"
        width="300"
        class="left-drawer glass-panel"
        >
        <Toolbox />
    </v-navigation-drawer>

    <v-main class="main-canvas flex-grow-1">

      <template v-if="uiStore.designerMode === 'logic'">
          <NeuralCanvasBackground />

          <div v-if="!socketStore.isConnected && authStore.isAuthenticated && !socketStore.isGracePeriod" class="offline-banner">
              <v-icon icon="mdi-server-network-off-outline" class="mr-2"></v-icon>
              Engine is Offline. You are in Offline Mode.
              <v-btn to="/my-engines" size="small" variant="tonal" class="ml-4">Configure Identity & Engine</v-btn>
          </div>

          <div v-if="isReadOnly" class="read-only-indicator">
              <v-icon icon="mdi-eye-outline" class="mr-2"></v-icon>
              {{ loc('sharing_readonly_mode') }}
          </div>

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

      <div v-if="uiStore.designerMode === 'logs'" class="log-full-page-wrapper">
         <LogPanelContent :is-full-page="true" />
      </div>

      <ControlsFooter />
    </v-main>

    <v-navigation-drawer
        location="right"
        :model-value="isRightPanelOpen"
        @update:modelValue="handleRightPanelClose"
        width="500"
        :temporary="!uiStore.isPropertiesPanelPinned"
        class="right-drawer glass-panel"
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
import LogPanelContent from '@/components/panels/LogPanelContent.vue';

import { useComponentStore } from '@/store/components';
import { useWorkflowStore } from '@/store/workflow';
import { useUiStore } from '@/store/ui';
import { useLocaleStore } from '@/store/locale';
import { useAuthStore } from '@/store/auth';
import { useSocketStore } from '@/store/socket';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import DataflowView from '@/views/DataflowView.vue';
import DebuggerView from '@/views/DebuggerView.vue'; // Pastikan ini ada
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
  { name: 'Default', value: null, icon: 'mdi-circle-off-outline', color: 'grey' },
  { name: 'Blue', value: '#2196F3', icon: 'mdi-circle', color: '#2196F3' },
  { name: 'Green', value: '#4CAF50', icon: 'mdi-circle', color: '#4CAF50' },
  { name: 'Orange', value: '#FF9800', icon: 'mdi-circle', color: '#FF9800' },
  { name: 'Red', value: '#F44336', icon: 'mdi-circle', color: '#F44336' },
];

function onPaneReady() {
    setTimeout(() => { fitView(); }, 100);
}

function getEdgeClass(edge) {
    const status = connectionStatus.value[edge.id]?.status;
    if (status === 'ACTIVE') {
        return 'connection-active';
    }
    return '';
}

function handleEdgeClick({ event, edge }) {
    workflowStore.fetchConnectionData(edge.id);
}

function handleRightPanelClose(isOpen) {
    if (!isOpen) {
        if (!uiStore.isPropertiesPanelPinned || uiStore.activeRightPanel !== 'properties') {
             uiStore.closeRightPanel();
        }
    }
}

function onPaneContextMenu(event) {
  event.preventDefault();
  lastPaneClickPosition.value = { x: event.clientX, y: event.clientY };
  contextMenu.value.target = null;
  contextMenu.value.items = [
    { title: 'Paste Node', icon: 'mdi-content-paste', action: () => {
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
    { title: 'Run From This Node', icon: 'mdi-play-box-outline', action: () => workflowStore.executeCurrentWorkflow(node.id), disabled: !workflowStore.canExecute },
    {
      title: 'Change Color',
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
    { title: 'Copy Node', icon: 'mdi-content-copy', action: () => workflowStore.copyNode(node) },
    { title: 'Duplicate Node', icon: 'mdi-content-duplicate', action: () => workflowStore.duplicateNode(node), disabled: isReadOnly.value },
    { title: 'View Execution Log', icon: 'mdi-console-line', action: () => console.log('View logs for', node.id) },
    { isDivider: true },
    { title: 'Delete Node', icon: 'mdi-delete-outline', color: 'red', action: () => workflowStore.removeElements([node]), disabled: isReadOnly.value }
  ];
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  nextTick(() => { contextMenu.value.visible = true; });
}

function onEdgeContextMenu({ event, edge }) {
  event.preventDefault();
  contextMenu.value.target = edge;
  contextMenu.value.items = [
    { title: 'View Data History', icon: 'mdi-history', action: () => workflowStore.fetchConnectionData(edge.id) },
    { isDivider: true },
    { title: 'Delete Connection', icon: 'mdi-delete-outline', color: 'red', action: () => workflowStore.removeElements([edge]), disabled: isReadOnly.value }
  ];
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  nextTick(() => { contextMenu.value.visible = true; });
}

onMounted(() => {
  const token = route.params.token;
  if (token) {
    console.log(`[Designer] Found share token: ${token}, loading workflow...`);
    workflowStore.loadSharedWorkflow(token);
  } else {
    console.log('[Designer] Normal session. Waiting for WebSocket connection to fetch data.');
  }
  uiStore.isToolboxOpen = true;
});

function handleDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function handleDrop(event) {
  if (isReadOnly.value) return;

  try {
      const jsonData = event.dataTransfer?.getData('application/json');
      if (!jsonData) return;

      const droppedData = JSON.parse(jsonData);
      if (!droppedData.id) return;

      const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY - 64 });
      workflowStore.addNode({
          moduleId: droppedData.id,
          x: position.x,
          y: position.y,
      });
  } catch (e) {
      console.error("[Designer] Failed to parse dropped item:", e);
  }
}

function onConnect(connectionData) {
    if (isReadOnly.value) return;
    workflowStore.addEdge(connectionData);
}

function handlePaneClick() {
    workflowStore.clearSelectedNode();
    if (uiStore.activeRightPanel !== 'properties' || !uiStore.isPropertiesPanelPinned) {
        uiStore.closeRightPanel();
    }
    contextMenu.value.visible = false;
}

function handleNodeClick({ event, node }) {
    workflowStore.setSelectedNode(node);
    uiStore.setActiveRightPanel('properties');
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
  /* FIX: Padding Top biar gak ketutupan App Bar */
  padding-top: 65px !important;
}

.log-full-page-wrapper {
    width: 100%;
    height: 100%;
    background-color: #0F111A;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
}

.offline-banner {
  position: absolute;
  top: 16px;
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
  top: 16px;
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
