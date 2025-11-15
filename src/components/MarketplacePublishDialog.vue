<template>
  <v-dialog :model-value="modelValue" @update:modelValue="$emit('update:modelValue', $event)" max-width="600px" persistent>
    <v-card class="dialog-card">
      <v-card-title class="orbitron-font d-flex align-center">
        <v-icon color="cyan" start size="large">mdi-store-plus-outline</v-icon>
        Publish to Marketplace
      </v-card-title>
      <v-card-text>
        <p class="text-caption text-grey-lighten-1 mb-4">
          Publish your current workflow to the public marketplace for others to use.
        </p>
        <v-text-field
          v-model="formData.name"
          label="Item Name"
          placeholder="e.g., AI YouTube Short Video Generator"
          variant="outlined"
          density="compact"
          class="hacker-input mb-4"
          :rules="[v => !!v || 'Name is required']"
          hide-details="auto"
        ></v-text-field>

        <v-textarea
          v-model="formData.desc"
          label="Description"
          placeholder="Describe what this workflow does, what it's useful for, and any required variables (like API keys)."
          variant="outlined"
          density="compact"
          rows="4"
          class="hacker-input mb-4"
          hide-details
        ></v-textarea>

        <v-text-field
          v-model.number="formData.price"
          label="Price (USD)"
          type="number"
          min="0"
          step="0.5"
          variant="outlined"
          density="compact"
          class="hacker-input"
          prefix="$"
          hint="Set to 0 for 'Free'. You must handle payment delivery yourself via your product URL."
          persistent-hint
        ></v-text-field>

      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)" :disabled="isPublishing">
          Cancel
        </v-btn>
        <v-btn
          color="cyan"
          variant="flat"
          @click="handlePublish"
          :loading="isPublishing"
          :disabled="!formData.name"
          class="action-button"
        >
          Publish Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useMarketplaceStore } from '@/store/marketplace';
import { useWorkflowStore } from '@/store/workflow';
import { storeToRefs } from 'pinia';

const props = defineProps({
  modelValue: Boolean, // (English Hardcode) for v-model
});
const emit = defineEmits(['update:modelValue']);

const marketplaceStore = useMarketplaceStore();
const workflowStore = useWorkflowStore();
const { isPublishing } = storeToRefs(marketplaceStore);
const { currentPresetName } = storeToRefs(workflowStore);

const formData = ref({
  name: '',
  desc: '',
  price: 0
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    formData.value = {
      name: currentPresetName.value || '',
      desc: '',
      price: 0
    };
  }
});

async function handlePublish() {
  const success = await marketplaceStore.publishCurrentWorkflow(formData.value);
  if (success) {
    emit('update:modelValue', false); // (English Hardcode) Close dialog on success
  }
}
</script>

<style scoped>
/* (English Hardcode) Rule #5: High contrast text */
.dialog-card {
  background-color: #2a2a4a;
  border: 1px solid var(--neon-cyan);
}
.orbitron-font {
  font-family: 'Orbitron', monospace;
  color: var(--neon-cyan);
}
.action-button {
  font-weight: bold;
  color: #010c03 !important; /* (English Hardcode) Rule #5 */
}

/* (English Hardcode) Rule #5: High contrast inputs */
.hacker-input :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
    color: var(--text-primary) !important;
}
.hacker-input :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}
.hacker-input :deep(.v-field--active .v-field__outline) {
    border-color: var(--neon-cyan) !important;
    border-width: 1px !important;
}
.hacker-input :deep(input),
.hacker-input :deep(textarea) {
    color: var(--text-primary) !important; /* (English Hardcode) Rule #5: White/Yellow text */
}
.hacker-input :deep(.v-label) {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
}
.hacker-input :deep(.v-field--active .v-label) {
    color: var(--neon-cyan) !important;
}
</style>
