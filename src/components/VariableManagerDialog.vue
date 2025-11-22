//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\VariableManagerDialog.vue total lines 145 
//#######################################################################

<template>
  <v-dialog v-model="dialog" max-width="90vw" persistent scrollable>
    <v-card class="variable-manager-card">
      <v-card-title class="pa-4 d-flex align-center">
        <v-icon icon="mdi-key-chain-variant" class="mr-3" color="cyan"></v-icon>
        <span class="orbitron-font">Global Variable Manager</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>
      <v-divider style="border-color: var(--neon-cyan); opacity: 0.3;"></v-divider>

      <v-card-text>
        <div v-if="isLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="cyan"></v-progress-circular>
          <p class="mt-3 text-cyan">Syncing variables with Engine...</p>
        </div>
        <div v-else>
          <div v-for="(item, index) in localVariables" :key="index" class="variable-item mb-4">
            <div class="d-flex align-center" style="gap: 12px;">
              <v-text-field
                v-model="item.name"
                label="Name (Key)"
                variant="outlined"
                density="compact"
                hide-details
                class="hacker-input flex-grow-1"
                :readonly="item.isOriginal"
                prepend-inner-icon="mdi-identifier"
              ></v-text-field>

              <v-select
                v-model="item.value.type"
                :items="['static', 'random', 'sequential']"
                label="Type"
                variant="outlined"
                density="compact"
                hide-details
                class="hacker-input"
                style="max-width: 150px;"
              ></v-select>

              <v-switch v-model="item.is_enabled" color="cyan" hide-details inset density="compact"></v-switch>
              <v-btn icon="mdi-delete" color="red-accent-2" variant="text" @click="confirmDelete(item)"></v-btn>
            </div>

            <div class="mt-2 pa-3 bg-grey-darken-4 rounded border-thin">
                <div v-if="item.value.type === 'static'" class="d-flex align-center">
                    <v-text-field v-model="item.value.value" :type="item.is_secret ? 'password' : 'text'" label="Value" variant="underlined" density="compact" hide-details class="flex-grow-1 mr-2"></v-text-field>
                    <v-checkbox v-model="item.is_secret" label="Secret" density="compact" hide-details color="cyan"></v-checkbox>
                </div>
                <div v-else class="text-caption text-grey">Advanced configuration for dynamic types available in full editor.</div>
            </div>
          </div>

          <v-btn block variant="tonal" color="cyan" class="mt-4 border-dashed" @click="addNewVariable">
            <v-icon start>mdi-plus</v-icon> Add New Variable
          </v-btn>
        </div>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog" variant="text">Cancel</v-btn>
        <v-btn @click="saveChanges" color="cyan" variant="flat" :loading="isLoading" class="font-weight-bold text-black">Save All Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useVariablesStore } from '@/store/variables';
import { useUiStore } from '@/store/ui'; // [ADDED] Import UI Store buat Popup Keren
import { storeToRefs } from 'pinia';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const variablesStore = useVariablesStore();
const uiStore = useUiStore(); // [ADDED] Init UI Store
const { variables, isLoading } = storeToRefs(variablesStore);
const localVariables = ref([]);
const variablesToDelete = ref([]);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

watch(dialog, (isOpen) => {
  if (isOpen) variablesStore.fetchVariables();
});

watch(variables, (newVars) => {
    localVariables.value = (newVars || []).map(v => ({
        ...JSON.parse(JSON.stringify(v)),
        value: typeof v.value === 'object' ? v.value : { type: 'static', value: v.value },
        isOriginal: true
    }));
    variablesToDelete.value = [];
});

function addNewVariable() {
    localVariables.value.push({ name: '', is_enabled: true, is_secret: false, value: { type: 'static', value: '' }, isOriginal: false });
}

async function confirmDelete(item) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Variable',
        text: `Are you sure you want to delete global variable "${item.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'error', // Merah biar keliatan bahaya
        icon: 'mdi-delete-forever'
    });

    if (confirmed) {
        if (item.isOriginal) variablesToDelete.value.push(item.name);
        localVariables.value = localVariables.value.filter(v => v !== item);
    }
}

async function saveChanges() {
    for (const name of variablesToDelete.value) await variablesStore.removeVariable(name);
    for (const item of localVariables.value) {
        if (item.name) await variablesStore.saveVariable(item.name, item);
    }
    closeDialog();
}
function closeDialog() { emit('update:modelValue', false); }
</script>

<style scoped>
.variable-manager-card { background: #1e1e2f; border: 1px solid var(--neon-cyan); }
.orbitron-font { font-family: 'Orbitron', monospace; color: #fff; }
.hacker-input :deep(.v-field) { background: rgba(0,0,0,0.3); color: white; }
.hacker-input :deep(input) { color: white; font-family: monospace; }
.border-dashed { border-style: dashed !important; }
</style>
