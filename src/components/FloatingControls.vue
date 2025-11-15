<template>
  <div class="floating-controls-panel">
    <div class="control-row top-row">
      <div class="controls-group">
        <v-combobox
          :items="presetList"
          :loading="presetsLoading"
          v-model="currentPresetName"
          label="Load Preset"
          no-data-text="No presets found."
          variant="solo-filled"
          density="compact"
          hide-details
          class="preset-combobox"
          @update:modelValue="handlePresetLoad"
        ></v-combobox>
        <v-btn variant="tonal" size="small" @click="handlePresetSave">Save</v-btn>
      </div>
      <v-divider vertical class="mx-2"></v-divider>
      <div class="controls-group">
        <v-btn variant="tonal" size="small">Simulate</v-btn>
        <v-btn class="run-button" color="success" prepend-icon="mdi-play">Run Workflow</v-btn>
        <v-btn variant="tonal" size="small">Pause</v-btn>
      </div>
    </div>

    <div class="control-row bottom-row">
      <div class="controls-group">
        <v-switch label="Repeat" color="primary" density="compact" hide-details class="mr-2"></v-switch>
        <v-text-field label="Times" variant="outlined" density="compact" hide-details class="control-input short-input"></v-text-field>
        <v-switch label="Delay" color="primary" density="compact" hide-details class="ml-2 mr-2"></v-switch>
        <v-radio-group inline density="compact" hide-details class="mr-2" v-model="delayType">
          <v-radio label="Static" value="static"></v-radio>
          <v-radio label="Random" value="random"></v-radio>
        </v-radio-group>

        <div v-if="delayType === 'static'" class="controls-group">
          <v-text-field label="sec" variant="outlined" density="compact" hide-details class="control-input short-input"></v-text-field>
        </div>
        <div v-if="delayType === 'random'" class="controls-group">
          <v-text-field label="min" variant="outlined" density="compact" hide-details class="control-input short-input"></v-text-field>
          <span class="text-secondary">-</span>
          <v-text-field label="max" variant="outlined" density="compact" hide-details class="control-input short-input"></v-text-field>
        </div>

      </div>
      <v-spacer></v-spacer>
      <div class="controls-group">
        <v-btn-toggle rounded="xl" variant="outlined" density="compact">
          <v-btn>Logic</v-btn>
          <v-btn>Data</v-btn>
          <v-btn>Debugger</v-btn>
        </v-btn-toggle>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useWorkflowStore } from '@/store/workflow';
import { storeToRefs } from 'pinia';
import { getPresets } from '@/api';

const workflowStore = useWorkflowStore();
const { currentPresetName } = storeToRefs(workflowStore);
const { loadWorkflow, saveCurrentWorkflow } = workflowStore;
const presetList = ref([]);
const presetsLoading = ref(false);
const delayType = ref('static');

onMounted(async () => {
  presetsLoading.value = true;
  try {
    const presets = await getPresets();
    presetList.value = presets.map(p => p.name);
  } catch (error) {
    console.error("Could not populate preset list.", error);
  } finally {
    presetsLoading.value = false;
  }
});

function handlePresetLoad(presetName) {
  if (presetName && presetList.value.includes(presetName)) {
    loadWorkflow(presetName);
  }
}

async function handlePresetSave() {
  const newName = prompt("Save workflow as:", currentPresetName.value || 'new-workflow');
  if (newName && newName.trim()) {
    const success = await saveCurrentWorkflow(newName.trim());
    if (success) {
      presetsLoading.value = true;
      const presets = await getPresets();
      presetList.value = presets.map(p => p.name);
      currentPresetName.value = newName.trim();
      presetsLoading.value = false;
    } else {
      alert('Failed to save workflow.');
    }
  }
}
</script>
