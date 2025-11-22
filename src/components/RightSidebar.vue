//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\RightSidebar.vue total lines 77 
//#######################################################################

<template>
  <div class="right-sidebar" :class="{ 'is-open': !!uiStore.activeRightPanel }">
    <div v-if="uiStore.activeRightPanel === 'properties'">
      <PropertiesPanel />
    </div>

    <div v-if="uiStore.activeRightPanel === 'log'" class="sidebar-panel log-panel-wrapper">
      <LogPanel /> </div>

    <div v-if="uiStore.activeRightPanel === 'promptSender'" class="sidebar-panel">
      <h3 class="panel-title">Prompt Sender</h3> <v-textarea label="Enter your prompt here..." variant="outlined" rows="5"></v-textarea> <v-btn color="primary" block>Send Prompt</v-btn> </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/store/ui';
import PropertiesPanel from './PropertiesPanel.vue';
import LogPanel from './panels/LogPanel.vue'; // (ADDED BY GEMINI)

const uiStore = useUiStore();
</script>

<style scoped>
.right-sidebar {
  position: absolute;
  /* (MODIFIED BY GEMINI) top: 0; */
  top: var(--v-layout-top); /* (ADDED BY GEMINI) Starts below the AppBar */
  right: 0;
  width: 350px; /* Standard sidebar width */ /* (English Comment) */
  /* (MODIFIED BY GEMINI) height: 100%; */
  height: calc(100vh - var(--v-layout-top)); /* (ADDED BY GEMINI) Fills remaining height */
  background-color: #1e1e1e;
  border-left: 1px solid #333;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 10; /* (Reset to original) */
  overflow-y: auto;
  /* (ADDED BY GEMINI) START FIX */
  /* Ensure sidebar itself is a flex container to make panels grow */
  display: flex;
  flex-direction: column;
  /* (ADDED BY GEMINI) END FIX */
}

.right-sidebar.is-open {
  transform: translateX(0);
}

.sidebar-panel {
  padding: 16px;
  /* (ADDED BY GEMINI) START FIX */
  flex-grow: 1; /* Allow panel content to grow */
  display: flex;
  flex-direction: column;
  /* (ADDED BY GEMINI) END FIX */
}

/* (ADDED BY GEMINI) START FIX */
/* Wrapper for LogPanel to remove padding and allow full-height */
.log-panel-wrapper {
  padding: 0;
  height: 100%;
}
/* (ADDED BY GEMINI) END FIX */

.panel-title {
  color: #00f5ff;
  font-family: 'Orbitron', sans-serif;
  margin-bottom: 16px;
}
</style>
