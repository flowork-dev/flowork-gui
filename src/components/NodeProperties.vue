<template>
  <div class="properties-panel pa-4">
    <div v-if="selectedNode && nodeManifest">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="panel-title text-truncate" :title="loc(nodeManifest.name)">{{ loc(nodeManifest.name) }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" @click="workflowStore.clearSelectedNode"></v-btn>
      </div>

      <div>
        <div v-for="prop in nodeProperties" :key="prop.id" class="mb-3">

          <v-text-field
            v-if="prop.type === 'string' || prop.type === 'integer' || prop.type === 'float'"
            :label="loc(prop.label)"
            :type="prop.type === 'string' ? 'text' : 'number'"
            v-model="nodeConfigValues[prop.id]"
            @update:modelValue="updateConfig(prop.id, $event)"
            variant="outlined"
            density="compact"
            hide-details="auto"
          ></v-text-field>

          <v-switch
            v-if="prop.type === 'boolean'"
            :label="loc(prop.label)"
            v-model="nodeConfigValues[prop.id]"
            @update:modelValue="updateConfig(prop.id, $event)"
            color="primary"
            hide-details
          ></v-switch>

          <v-select
            v-if="prop.type === 'enum'"
            :label="loc(prop.label)"
            :items="prop.options"
            v-model="nodeConfigValues[prop.id]"
            @update:modelValue="updateConfig(prop.id, $event)"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>

          <v-textarea
            v-if="prop.type === 'textarea' || prop.type === 'code'"
            :label="loc(prop.label)"
            v-model="nodeConfigValues[prop.id]"
            @update:modelValue="updateConfig(prop.id, $event)"
            variant="outlined"
            density="compact"
            rows="4"
            hide-details
          ></v-textarea>

        </div>
      </div>
    </div>

    <div v-else class="text-center text-grey d-flex flex-column justify-center align-center fill-height">
      <v-icon icon="mdi-cursor-default-click-outline" size="48" class="mb-2"></v-icon>
      <p>Select a node to see its properties.</p>
    </div>
  </div>
</template>

<script setup>
// (COMMENT) Import 'ref' and 'watch' are no longer needed
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useWorkflowStore } from '@/store/workflow';
// (COMMENT) 'getComponentDetails' is deprecated and removed
// import { getComponentDetails } from '@/api';
// (ADDED) Import component store to read manifest data
import { useComponentStore } from '@/store/components';
// (ADDED) Import locale store for localization
import { useLocaleStore } from '@/store/locale';


// --- Store Initialization ---
const workflowStore = useWorkflowStore();
const { selectedNode } = storeToRefs(workflowStore);
// (COMMENT) 'clearSelectedNode' is not used, but let's keep it in case
const { clearSelectedNode } = workflowStore;
// (ADDED) Initialize new stores
const componentStore = useComponentStore();
const localeStore = useLocaleStore();
const { loc } = storeToRefs(localeStore);


// --- Local State ---
// (COMMENT) Loading state is no longer needed
// const isManifestLoading = ref(false);
// (COMMENT) Properties are now a computed property
// const manifestProperties = ref([]);


// --- (REFACTORED) Computed Properties ---
const nodeManifest = computed(() => {
    if (!selectedNode.value?.data?.moduleId) return {};
    // (ADDED) Find the full component data (including manifest) from the store
    const component = componentStore.findComponentById(selectedNode.value.data.moduleId);
    return component?.manifest || {};
});

const nodeProperties = computed(() => {
    // (ADDED) Get properties from the computed manifest
    return nodeManifest.value?.properties || [];
});

// (ADDED) Computed property for config_values (ensures reactivity)
const nodeConfigValues = computed(() => {
  if (selectedNode.value && !selectedNode.value.data.config_values) {
    // (COMMENT) Ensure config_values exists if node is selected
    selectedNode.value.data.config_values = {};
  }
  return selectedNode.value?.data?.config_values || {};
});

// (ADDED) Action to update the store
function updateConfig(key, value) {
  if (selectedNode.value) {
    workflowStore.updateNodeConfig({
      nodeId: selectedNode.value.id,
      key,
      value
    });
  }
}

// --- (REMOVED) Watcher ---
// (COMMENT) This entire 'watch' block is no longer needed as computed properties
// (COMMENT) handle the updates automatically.
/*
watch(selectedNode, async (newNode) => {
  if (newNode) {
    isManifestLoading.value = true;
    manifestProperties.value = [];
    try {
      // Fetch the full manifest for the selected node's module type
      const details = await getComponentDetails('modules', newNode.data.moduleId);
      manifestProperties.value = details.manifest.properties || [];
    } catch (error) {
      console.error(`Could not fetch manifest for ${newNode.data.moduleId}`, error); // English log
    } finally {
      isManifestLoading.value = false;
    }
  } else {
    // Clear the form when no node is selected
    manifestProperties.value = [];
  }
}, { immediate: true });
*/
</script>

<style scoped>
.properties-panel {
  height: 100%;
  background-color: #2a2a2a;
  color: white;
  overflow-y: auto;
}
.panel-title {
  font-family: 'Exo 2', sans-serif;
}
</style>