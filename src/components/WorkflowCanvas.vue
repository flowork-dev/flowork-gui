//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\WorkflowCanvas.vue total lines 111 
//#######################################################################

<template>
  <div class="canvas-wrapper">
    <VueFlow
      v-model="elements"
      class="vue-flow-canvas"
      :apply-changes="false"
      :fit-view-on-init="true"
      @dragover="onDragOver"
      @drop="onDrop"
      @connect="onConnect"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @node-drag-start="onNodeDragStart"
      @node-drag-stop="onNodeDragStop"
    >
      <template #node-default="props">
        <div
          class="vue-flow__node-custom flowork-node"
          :class="{ 'is-dragging': props.data.isDragging }"
        >
          <Handle type="target" :position="Position.Left" />
          <div class="node-body">
            <div class="node-icon">
              <img :src="getIconUrl(props.data.componentType, props.data.moduleId)" alt="">
            </div>
            <div class="node-label">
              {{ props.label }}
            </div>
          </div>
          <Handle type="source" :position="Position.Right" />
        </div>
      </template>

      <Background :pattern-color="BG_COLOR" gap="16" />
      <Controls />
    </VueFlow>

    <CanvasWatermark />
  </div>
</template>

<script setup>
import { VueFlow, useVueFlow, Handle, Position } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '@/store/workflow';
import CanvasWatermark from './CanvasWatermark.vue';
import { getComponentIconUrl } from '@/api';

const workflowStore = useWorkflowStore();
const { elements } = storeToRefs(workflowStore);
const { addNode, addEdge, setSelectedNode, clearSelectedNode } = workflowStore;
const { onPaneReady, screenToFlowCoordinate } = useVueFlow();
const BG_COLOR = '#444';

onPaneReady(({ fitView }) => { fitView(); });

function onNodeDragStart(event) {
  if (event.node) {
    event.node.data.isDragging = true;
  }
}
function onNodeDragStop(event) {
  if (event.node) {
    setTimeout(() => {
      event.node.data.isDragging = false;
    }, 100);
  }
}

function getIconUrl(type, id) {
    return getComponentIconUrl(type, id);
}

function onDrop(event) {
  event.preventDefault();
  const componentData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}');
  if (!componentData.id) return;
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  addNode({
    moduleId: componentData.id,
    label: componentData.name,
    componentType: componentData.type,
    x: position.x,
    y: position.y,
  });
}

function onDragOver(event) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; }
function onConnect(connection) { addEdge(connection); }
function onNodeClick(event) { setSelectedNode(event.node); }
function onPaneClick() { clearSelectedNode(); }
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
