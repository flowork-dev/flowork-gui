//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\PromptManager.vue
//#######################################################################

<template>
  <v-card class="prompt-manager-container" flat>
    <v-layout class="fill-height">
      <v-navigation-drawer
        v-model="uiStore.isToolboxOpen"
        width="320"
        class="left-panel"
        permanent
      >
        <v-toolbar color="transparent" density="compact" class="pa-1">
          <v-icon icon="mdi-text-box-multiple" color="#FFD700" class="ml-2"></v-icon>
          <v-toolbar-title class="font-mono text-subtitle-1 font-weight-bold ml-2 text-gold">
            PROMPT TEMPLATES
          </v-toolbar-title>
          <v-btn icon="mdi-plus" variant="text" color="#FFD700" @click="createNewPrompt" title="Create New Prompt"></v-btn>
        </v-toolbar>
        <v-divider class="border-gold-subtle"></v-divider>

        <div class="pa-3">
          <v-text-field
            v-model="searchTerm"
            label="Search prompts..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            bg-color="rgba(0,0,0,0.3)"
            base-color="grey-darken-2"
            color="#FFD700"
            hide-details
            clearable
            class="search-field"
          ></v-text-field>
        </div>

        <v-list nav density="compact" class="prompt-list bg-transparent">
          <div v-if="isLoading" class="text-center py-4">
            <v-progress-circular indeterminate color="#FFD700" size="24"></v-progress-circular>
            <div class="text-caption text-grey-lighten-1 mt-2">Loading prompts...</div>
          </div>

          <div v-if="error && !isLoading" class="pa-4 text-center">
             <v-icon icon="mdi-alert-circle" color="red-accent-2" size="small"></v-icon>
             <div class="text-caption text-red-accent-1 mt-1">{{ error }}</div>
             <v-btn size="x-small" color="#FFD700" variant="text" class="mt-2" @click="promptStore.fetchPrompts()">Retry Connection</v-btn>
          </div>

          <v-list-item
            v-for="prompt in filteredPrompts"
            :key="prompt.id"
            :value="prompt.id"
            @click="promptStore.selectPrompt(prompt)"
            :class="{'selected-prompt': selectedPrompt?.id === prompt.id}"
            class="prompt-list-item mb-1 rounded-lg"
            color="#FFD700"
          >
            <template v-slot:prepend>
               <v-icon icon="mdi-file-document-edit-outline" size="small" color="grey-lighten-1"></v-icon>
            </template>
            <v-list-item-title class="font-weight-medium text-white">{{ prompt.name }}</v-list-item-title>

            <template v-slot:append>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                color="red-darken-2"
                class="delete-btn"
                @click.stop="handleDelete(prompt)"
                title="Delete Prompt"
              ></v-btn>
            </template>
          </v-list-item>

          <v-list-item v-if="!filteredPrompts.length && !isLoading && !error" class="text-center">
              <v-list-item-title class="text-grey-lighten-1 text-caption italic">
                  {{ searchTerm ? 'No matching prompts.' : 'No prompts yet.' }}
              </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main class="right-panel fill-height">
        <div v-if="!selectedPrompt" class="empty-state">
          <v-icon icon="mdi-robot-confused-outline" size="80" color="#FFD700" class="opacity-20"></v-icon>
          <h2 class="mt-4 text-grey-lighten-2 font-mono text-h6">Select a prompt or create new</h2>
          <p class="text-caption text-grey-lighten-1">Manage your AI system prompts efficiently.</p>
        </div>

        <div v-else class="editor-form pa-4 d-flex flex-column fill-height">
          <div class="d-flex align-center mb-4">
             <div class="flex-grow-1 mr-4">
                 <v-text-field
                  v-model="selectedPrompt.name"
                  label="Prompt Name (Unique Identifier)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="#050505"
                  base-color="grey-darken-2"
                  color="#FFD700"
                  class="text-white gold-input"
                ></v-text-field>
             </div>
             <v-btn
                color="#FFD700"
                variant="flat"
                @click="handleSave"
                :loading="isLoading"
                prepend-icon="mdi-content-save"
                class="text-none font-weight-bold text-black"
                elevation="0"
             >
                Save Template
            </v-btn>
          </div>

          <v-card variant="outlined" class="editor-card flex-grow-1 d-flex flex-column mb-4" color="rgba(255, 215, 0, 0.2)">
             <v-toolbar density="compact" color="#080808" class="border-bottom-gold">
                 <span class="text-caption text-gold ml-4 font-weight-mono">EDITOR MODE</span>
                 <v-spacer></v-spacer>
                 <v-btn size="x-small" variant="text" icon="mdi-content-copy" color="#FFD700" @click="copyToClipboard(selectedPrompt.content)" title="Copy Content"></v-btn>
             </v-toolbar>
             <v-textarea
                v-model="selectedPrompt.content"
                variant="plain"
                class="code-editor flex-grow-1 pa-0 fill-height"
                hide-details
                no-resize
                placeholder="Enter your system prompt here..."
            ></v-textarea>
          </v-card>

          <div class="variable-helper">
              <div class="d-flex align-center mb-2">
                 <v-icon icon="mdi-code-braces" size="small" class="mr-2 text-gold"></v-icon>
                 <span class="text-caption text-white font-weight-bold">Dynamic Variables Injection</span>
              </div>
              <div class="d-flex flex-wrap gap-2">
                  <v-chip @click="copyToClipboard('{{payload.data.my_var}}')" size="small" label color="#FFD700" variant="outlined" class="cursor-pointer font-weight-mono">
                      {{ payloadExampleText }}
                  </v-chip>
                  <v-chip @click="copyToClipboard('{{vars.API_KEY}}')" size="small" label color="amber-darken-3" variant="outlined" class="cursor-pointer font-weight-mono">
                      {{ varsExampleText }}
                  </v-chip>
                  <v-chip @click="copyToClipboard('{{history}}')" size="small" label color="grey" variant="outlined" class="cursor-pointer font-weight-mono">
                      {{ historyExampleText }}
                  </v-chip>
              </div>
          </div>
        </div>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePromptStore } from '@/store/prompts';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';

const promptStore = usePromptStore();
const uiStore = useUiStore();
const { prompts, selectedPrompt, isLoading, error } = storeToRefs(promptStore);

const searchTerm = ref('');
const payloadExampleText = ref('{{payload.data.variable}}');
const varsExampleText = ref('{{vars.SECRET_KEY}}');
const historyExampleText = ref('{{history}}');

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
        name: 'New Prompt Template',
        content: 'You are a helpful AI assistant. \n\nContext: {{payload.data.context}}'
    });
}

async function handleSave() {
    if (selectedPrompt.value) {
        if(!selectedPrompt.value.name.trim()) {
            uiStore.showNotification({ text: 'Please enter a prompt name.', color: 'warning' });
            return;
        }

        try {
            await promptStore.savePrompt(selectedPrompt.value);
            uiStore.showNotification({ text: 'Prompt saved successfully!', color: 'black bg-gold' });
        } catch (e) {
            console.error("Save failed", e);
        }
    }
}

async function handleDelete(prompt) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Prompt',
        text: `Are you sure you want to delete "${prompt.name}"? This action cannot be undone.`,
        color: 'error',
        confirmText: 'Delete Forever'
    });
    if (confirmed) {
        await promptStore.removePrompt(prompt.id);
        if (selectedPrompt.value && selectedPrompt.value.id === prompt.id) {
            selectedPrompt.value = null;
        }
        uiStore.showNotification({ text: 'Prompt deleted.', color: 'success' });
    }
}

function copyToClipboard(text) {
    if(!text) return;
    navigator.clipboard.writeText(text).then(() => {
        uiStore.showNotification({ text: 'Copied to clipboard!', color: 'black bg-gold' });
    });
}

onMounted(() => {
    uiStore.isToolboxOpen = true;
    promptStore.fetchPrompts();
});
</script>

<style scoped>
.prompt-manager-container {
  height: 100%;
  width: 100%;
  background: #000 !important;
  position: relative;
  overflow: hidden;
}
.left-panel {
  background-color: #050505 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.right-panel {
  background-color: #000 !important;
  height: 100%;
  overflow-y: hidden;
}
.font-mono { font-family: 'Fira Code', monospace; }
.text-gold { color: #FFD700 !important; }
.border-gold-subtle { border-color: rgba(255, 215, 0, 0.1) !important; }
.opacity-20 { opacity: 0.2; }

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.prompt-list-item {
    transition: all 0.2s;
    border: 1px solid transparent;
}
.prompt-list-item:hover {
    background-color: rgba(255,215,0,0.05);
    border-color: rgba(255,215,0,0.1);
}
.selected-prompt {
    background-color: rgba(255, 215, 0, 0.05) !important;
    border: 1px solid rgba(255, 215, 0, 0.3) !important;
}
.delete-btn { opacity: 0.5; transition: opacity 0.2s ease-in-out; }
.prompt-list-item:hover .delete-btn { opacity: 1; }

.code-editor { display: flex; flex-direction: column; }
.code-editor :deep(.v-field) { flex-grow: 1; border-radius: 0 !important; }
.code-editor :deep(.v-field__input) { height: 100% !important; }
.code-editor :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #e0e0e0 !important;
  background-color: #050505;
  padding: 16px !important;
}

.editor-card {
    background-color: #050505 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    overflow: hidden;
}
.variable-helper {
    background-color: rgba(255, 215, 0, 0.02);
    padding: 12px;
    border-radius: 8px;
    border: 1px dashed rgba(255, 215, 0, 0.2);
}
.border-bottom-gold { border-bottom: 1px solid rgba(255, 215, 0, 0.1); }
.gap-2 { gap: 8px; }
.cursor-pointer { cursor: pointer; }
.font-weight-mono { font-family: 'JetBrains Mono', monospace; }

/* INPUT OVERRIDES */
.gold-input :deep(.v-field) {
    border-color: rgba(255,255,255,0.1);
}
.gold-input :deep(.v-field--focused) {
    border-color: #FFD700 !important;
}

:deep(.v-list-item-title),
:deep(input) { color: #ffffff !important; }
:deep(.v-label) { color: rgba(255,255,255,0.7) !important; }
</style>