<template>
  <v-dialog v-model="dialog" max-width="90vw" persistent scrollable>
    <v-card class="variable-manager-card">
      <v-card-title class="pa-4 d-flex align-center">
        <v-icon icon="mdi-key-chain-variant" class="mr-3" color="cyan"></v-icon>
        <span class="orbitron-font">Global Variable Manager</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <div v-if="isLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="cyan"></v-progress-circular>
          <p class="mt-2 text-grey">Loading variables...</p>
        </div>
        <div v-else>
          <div v-for="(item, index) in localVariables" :key="index" class="variable-item">
            <div class="variable-main-row">
              <v-text-field
                label="Name"
                v-model="item.name"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="VARIABLE_NAME"
                :readonly="item.isOriginal"
                class="variable-name"
              ></v-text-field>
              <v-select
                label="Type"
                v-model="item.value.type"
                :items="['static', 'random', 'sequential']"
                variant="outlined"
                density="compact"
                hide-details
                class="variable-type"
              ></v-select>
              <div class="enabled-actions-group">
                <v-switch v-model="item.is_enabled" color="cyan" hide-details inset title="Enable/Disable"></v-switch>
                <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="confirmDelete(item)" title="Delete Variable"></v-btn>
              </div>
            </div>

            <div class="variable-config-row">
                <div v-if="item.value.type === 'static'" class="d-flex align-center" style="gap: 16px;">
                    <v-text-field
                        v-model="item.value.value"
                        :type="item.is_secret ? 'password' : 'text'"
                        variant="filled"
                        density="compact"
                        hide-details
                        label="Static Value"
                        class="flex-grow-1"
                    ></v-text-field>
                    <v-checkbox-btn v-model="item.is_secret" color="cyan" title="Is Secret?"></v-checkbox-btn>
                </div>
                <div v-if="item.value.type === 'random'" class="random-config">
                    <v-text-field v-model.number="item.value.length" label="Length" type="number" density="compact" hide-details variant="filled"></v-text-field>
                    <v-checkbox v-model="item.value.use_uppercase" label="A-Z" density="compact" hide-details color="cyan"></v-checkbox>
                    <v-checkbox v-model="item.value.use_lowercase" label="a-z" density="compact" hide-details color="cyan"></v-checkbox>
                    <v-checkbox v-model="item.value.use_digits" label="0-9" density="compact" hide-details color="cyan"></v-checkbox>
                    <v-checkbox v-model="item.value.use_symbols" label="#$%" density="compact" hide-details color="cyan"></v-checkbox>
                </div>
                <div v-if="item.value.type === 'sequential'" class="sequential-config">
                    <v-text-field v-model="item.value.prefix" label="Prefix" density="compact" hide-details variant="filled"></v-text-field>
                    <v-text-field v-model.number="item.value.start" label="Start" type="number" density="compact" hide-details variant="filled"></v-text-field>
                    <v-text-field v-model.number="item.value.step" label="Step" type="number" density="compact" hide-details variant="filled"></v-text-field>
                    <v-text-field v-model.number="item.value.padding" label="Padding" type="number" density="compact" hide-details variant="filled"></v-text-field>
                </div>
            </div>
          </div>

           <div v-if="localVariables.length === 0" class="text-center text-grey py-8">
                No variables defined. Click 'Add New Variable' to start.
            </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-btn variant="tonal" @click="addNewVariable" prepend-icon="mdi-plus">Add New Variable</v-btn>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn size="large" color="cyan" variant="flat" @click="saveChanges" :loading="isLoading" class="save-button">Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useVariablesStore } from '@/store/variables';
import { storeToRefs } from 'pinia';

const props = defineProps({
  modelValue: Boolean, // for v-model
});
const emit = defineEmits(['update:modelValue']);

const variablesStore = useVariablesStore();
const { variables, isLoading } = storeToRefs(variablesStore);

const localVariables = ref([]);
const variablesToDelete = ref([]);

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

watch(dialog, (isOpen) => {
  if (isOpen) {
    variablesStore.fetchVariables();
  }
});

function prepareLocalData(apiVars) {
    return (apiVars || []).map(apiVar => {
        const localCopy = JSON.parse(JSON.stringify(apiVar));
        if (typeof localCopy.value !== 'object' || localCopy.value === null) {
            localCopy.value = { type: 'static', value: localCopy.value };
        }
        localCopy.isOriginal = true;
        return localCopy;
    });
}

watch(variables, (newVars) => {
  localVariables.value = prepareLocalData(newVars);
  variablesToDelete.value = [];
});

function addNewVariable() {
    localVariables.value.push({
        name: '',
        is_secret: false,
        is_enabled: true,
        value: {
            type: 'static',
            value: '',
        },
        isOriginal: false
    });
}

function confirmDelete(item) {
    if (confirm(`Are you sure you want to delete the variable "${item.name}"? This cannot be undone.`)) {
        if (item.isOriginal) {
            variablesToDelete.value.push(item.name);
        }
        localVariables.value = localVariables.value.filter(v => v !== item);
    }
}

async function saveChanges() {
    for (const nameToDelete of variablesToDelete.value) {
        await variablesStore.removeVariable(nameToDelete);
    }
    for (const item of localVariables.value) {
        if (!item.name) {
            alert('Variable name cannot be empty.');
            return;
        }
        await variablesStore.saveVariable(item);
    }
    closeDialog();
}

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.variable-manager-card {
  background-color: rgba(107, 104, 114, 0.5);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(7, 206, 130, 0.1);
}
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
  color: var(--neon-cyan);
}

.variable-item {
    padding: 16px;
    border-bottom: 1px solid rgba(7, 206, 130, 0.1);
    transition: background-color 0.3s ease;
}

.variable-item:hover {
    background-color: rgba(79, 21, 214, 0.05);
}

.variable-main-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.variable-name {
    flex-grow: 1;
}

.variable-type {
    min-width: 150px;
    flex-grow: 0;
}

.enabled-actions-group {
    display: flex;
    align-items: center;
}

.variable-config-row {
    padding: 16px;
    margin-top: 16px;
    background: rgba(0, 24, 15, 0.1);
    border-radius: 4px;
}

.random-config, .sequential-config {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}

/* PERUBAHAN: Warna tulisan di tombol Save */
.save-button {
    font-weight: bold;
    color: #010c03 !important;
}
</style>