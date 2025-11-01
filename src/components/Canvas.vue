<template>
  <div class="canvas-wrapper">
    <VueFlow v-model="elements" @node-click="onNodeClick" @pane-click="onPaneClick" fit-view-on-init>
      <Background />
      <Controls />

      <template #node-default="{ data, id }">
        <CustomNode
          :module-id="data.moduleId"
          :manifest="data.manifest"
          :node-id="id"
        />
      </template>

    </VueFlow>
  </div>
</template>

<script setup>
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '@/store/workflow';
import { useUiStore } from '@/store/ui';
import CustomNode from './CustomNode.vue';

// Get the stores
const workflowStore = useWorkflowStore();
const uiStore = useUiStore();

// Get state and actions from the stores
const { elements } = storeToRefs(workflowStore);
const { setSelectedNode, clearSelectedNode } = workflowStore;

// Event handler for when a node is clicked
const onNodeClick = (event, { node }) => {
  setSelectedNode(node);
  uiStore.setActiveRightPanel('properties'); // ADDED: Open properties panel on node click
};

// Event handler for when the canvas pane is clicked (deselects nodes)
const onPaneClick = () => {
  clearSelectedNode();
  uiStore.closeRightPanel(); // ADDED: Close any right panel on pane click
};

</script>

<style>
.canvas-wrapper {
  height: 100%;
  width: 100%;
}
</style>