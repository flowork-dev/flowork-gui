//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\layouts\DefaultLayout.vue total lines 51 
//#######################################################################

<template>
  <div class="animated-background"></div>
  <v-app>
    <v-app-bar app color="transparent" density="compact">
      <v-app-bar-nav-icon @click.stop="toolboxDrawer = !toolboxDrawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon icon="mdi-share-variant-outline" class="mr-2"></v-icon>
        FLOWORK.SYNAPSE
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-tabs centered color="primary">
        <v-tab>Designer</v-tab>
        <v-tab>Dashboard</v-tab>
        <v-tab>Settings</v-tab>
      </v-tabs>
      <v-spacer></v-spacer>
      <v-btn>Guide</v-btn>
    </v-app-bar>
    <v-navigation-drawer app color="transparent" :width="300" v-model="toolboxDrawer">
      <slot name="toolbox"></slot>
    </v-navigation-drawer>
    <v-navigation-drawer app location="right" :width="350" color="transparent" v-model="isPropertiesPanelOpen">
      <slot name="properties-panel"></slot>
    </v-navigation-drawer>
    <v-main><slot name="main-content"></slot></v-main>
    <FloatingControls />
    <v-footer app height="28" class="px-2" color="transparent">
      <span class="text-caption">Ready.</span>
      <v-spacer></v-spacer>
      <span class="text-caption">User: Guest Mode</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/store/workflow';
import { storeToRefs } from 'pinia';
import FloatingControls from '@/components/FloatingControls.vue';

const workflowStore = useWorkflowStore();
const { selectedNode } = storeToRefs(workflowStore);
const toolboxDrawer = ref(true);
const isPropertiesPanelOpen = computed(() => !!selectedNode.value);
</script>
