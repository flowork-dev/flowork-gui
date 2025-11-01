#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\PromptManager.vue
# REVISI 3:
# 1. Menghapus 'promptStore.fetchPrompts()' dari onMounted.
#    (Sekarang di-handle oleh socket.js onopen).
#######################################################################
<template>
  <v-layout class="prompt-manager-layout">
    <v-navigation-drawer v-model="uiStore.isToolboxOpen" width="300" class="left-panel">
      <v-toolbar color="transparent">
        <v-toolbar-title class="orbitron-font" color="cyan">Prompt Templates</v-toolbar-title>
        <v-btn icon="mdi-plus" @click="createNewPrompt" title="Create New Prompt"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <div class="pa-2">
        <v-text-field
          v-model="searchTerm"
          label="Search prompts..."
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          density="compact"
          hide-details
          clearable
          class="search-field"
        ></v-text-field>
      </div>

      <v-list nav density="compact">
        <div v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="cyan"></v-progress-circular>
        </div>
        <v-list-item
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          :title="prompt.name"
          :active="selectedPrompt?.id === prompt.id"
          @click="promptStore.selectPrompt(prompt)"
          color="cyan"
          class="prompt-list-item"
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="x-small"
              class="delete-btn"
              @click.stop="handleDelete(prompt)"
              title="Delete Prompt"
            ></v-btn>
          </template>
        </v-list-item>
        <v-list-item v-if="!filteredPrompts.length && !isLoading">
            <v-list-item-title class="text-center text-grey">No prompts found.</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="right-panel">
      <div v-if="!selectedPrompt" class="empty-state">
        <v-icon icon="mdi-text-box-plus-outline" size="64" color="grey-darken-2"></v-icon>
        <h2 class="mt-4 text-grey-darken-1 orbitron-font">Select a prompt to edit, or create a new one.</h2>
      </div>

      <div v-else class="editor-form">
        <v-text-field
            v-model="selectedPrompt.name"
            label="Prompt Name"
            variant="outlined"
            density="compact"
            class="mb-4"
        ></v-text-field>

        <v-textarea
            v-model="selectedPrompt.content"
            label="Prompt Content"
            variant="outlined"
            rows="15"
            class="code-editor"
            placeholder="Enter your prompt template here. Use {{payload.data.some_key}} for payload variables."
        ></v-textarea>

        <div class="variable-helper mt-4">
            <div class="text-caption text-grey">Quick Insert:</div>
            <v-chip-group>
                <v-chip @click="copyToClipboard('{{payload.data.variable}}')" size="small">{{ payloadExampleText }}</v-chip>
                <v-chip @click="copyToClipboard('{{vars.SECRET_KEY}}')" size="small">{{ varsExampleText }}</v-chip>
            </v-chip-group>
        </div>

        <v-card-actions class="mt-4 pa-0">
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="promptStore.clearSelection()">Cancel</v-btn>
            <v-btn color="cyan" variant="flat" @click="handleSave" :loading="isLoading" class="save-button">
                Save Prompt
            </v-btn>
        </v-card-actions>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePromptStore } from '@/store/prompts';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';

const promptStore = usePromptStore();
const uiStore = useUiStore();
const { prompts, selectedPrompt, isLoading } = storeToRefs(promptStore);

const searchTerm = ref('');
const payloadExampleText = ref('{{payload.data...}}'); // English Hardcode
const varsExampleText = ref('{{vars...}}'); // English Hardcode

const filteredPrompts = computed(() => {
    if (!searchTerm.value) {
        return prompts.value;
    }
    return prompts.value.filter(p =>
        p.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

function createNewPrompt() {
    promptStore.selectPrompt({
        id: null,
        name: 'New Prompt Template', // English Hardcode
        content: 'Your prompt content here...' // English Hardcode
    });
}

function handleSave() {
    if (selectedPrompt.value) {
        promptStore.savePrompt(selectedPrompt.value);
    }
}

async function handleDelete(prompt) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Prompt', // English Hardcode
        text: `Are you sure you want to delete the prompt "${prompt.name}"?`, // English Hardcode
        color: 'error', // English Hardcode
        confirmText: 'Delete' // English Hardcode
    });
    if (confirmed) {
        promptStore.removePrompt(prompt.id);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        uiStore.showNotification({ text: 'Copied to clipboard!', color: 'success' }); // English Hardcode
    });
}

onMounted(() => {
});
</script>

<style scoped>
.prompt-manager-layout {
  height: 100%;
}
.left-panel {
  background-color: #161625;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}
.right-panel {
  padding: 32px;
}
.orbitron-font {
  font-family: 'Orbitron', sans-serif;
}
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.prompt-list-item .delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.prompt-list-item:hover .delete-btn {
  opacity: 1;
}
.code-editor :deep(textarea) {
  font-family: 'Courier New', Courier, monospace !important;
  font-size: 0.9rem;
  line-height: 1.6;
}
.variable-helper {
    background-color: rgba(0,0,0,0.2);
    padding: 8px 12px;
    border-radius: 4px;
}
.save-button {
    font-weight: bold;
    color: #000 !important;
}

.search-field :deep(.v-field) {
  background-color: #2a2a4a !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}
.search-field :deep(.v-field__outline) {
  border: none !important;
}
:deep(.search-field .v-field__input) {
   color: var(--text-primary) !important;
}
:deep(.v-field__input) {
  color: var(--text-primary) !important;
}
:deep(.v-label) {
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}

.prompt-list-item :deep(.v-list-item-title) {
    color: var(--text-primary) !important;
}

.editor-form :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
    color: var(--text-primary) !important;
}
.editor-form :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}
.editor-form :deep(.v-field--active .v-field__outline) {
    border-color: var(--neon-cyan) !important;
    border-width: 1px !important;
}
.editor-form :deep(input),
.editor-form :deep(textarea) {
    color: var(--text-primary) !important;
}
.editor-form :deep(.v-label) {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
}
.editor-form :deep(.v-field--active .v-label) {
    color: var(--neon-cyan) !important;
}
</style>