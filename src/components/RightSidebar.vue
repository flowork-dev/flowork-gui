<template>
  <div class="right-sidebar" :class="{ 'is-open': !!uiStore.activeRightPanel }">
    <div v-if="uiStore.activeRightPanel === 'properties'">
      <PropertiesPanel />
    </div>

    <div v-if="uiStore.activeRightPanel === 'log'" class="sidebar-panel">
      <h3 class="panel-title">Execution Log</h3>
      <p>Log entries will appear here...</p>
    </div>

    <div v-if="uiStore.activeRightPanel === 'promptSender'" class="sidebar-panel">
      <h3 class="panel-title">Prompt Sender</h3>
      <v-textarea label="Enter your prompt here..." variant="outlined" rows="5"></v-textarea>
      <v-btn color="primary" block>Send Prompt</v-btn>
    </div>
  </div>
</template>

<script setup>
// This component reads the UI store and displays the correct panel.
import { useUiStore } from '@/store/ui';
import PropertiesPanel from './PropertiesPanel.vue';

const uiStore = useUiStore();
</script>

<style scoped>
.right-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 350px; /* Standard sidebar width */
  height: 100%;
  background-color: #1e1e1e;
  border-left: 1px solid #333;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 10;
  overflow-y: auto;
}

.right-sidebar.is-open {
  transform: translateX(0);
}

.sidebar-panel {
  padding: 16px;
}

.panel-title {
  color: #00f5ff;
  font-family: 'Orbitron', sans-serif;
  margin-bottom: 16px;
}
</style>