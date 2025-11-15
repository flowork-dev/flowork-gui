<template>
  <v-card
    class="sidebar-content-card"
    width="auto"
  >
    <v-card-title class="panel-title">
      <v-icon icon="mdi-text-box-send-outline" class="mr-2"></v-icon>
      {{ agentStore.currentSessionId ? 'Agent Chat' : 'Prompt Sender' }}
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="uiStore.closeRightPanel"></v-btn>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="panel-content">
      <v-textarea
        label="Enter your prompt here..."
        variant="outlined"
        rows="5"
        hide-details
        class="mb-4 prompt-textarea"
        v-model="prompt"
        @keydown.enter.ctrl="handleSubmit"
      ></v-textarea>
      <v-file-input
        label="Attach a file (optional)"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4 file-input"
        disabled
      ></v-file-input>

      <div class="d-flex justify-center mt-4">
        <v-btn
          color="cyan"
          variant="tonal"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="!prompt.trim()"
        >
          {{ agentStore.currentSessionId ? 'Send Message' : 'Start Session' }}
        </v-btn>
        </div>

    </v-card-text>
    </v-card>
</template>

<script setup>
import { useUiStore } from '@/store/ui';
import { ref, computed } from 'vue';
import { useSocketStore } from '@/store/socket';
import { useEngineStore } from '@/store/engines';
import { apiStartSession } from '@/api'; //
const uiStore = useUiStore();
const prompt = ref('');
const socketStore = useSocketStore();
const agentStore = socketStore.useAgentStore();
const engineStore = useEngineStore();
const uiStore = useUiStore();

const isLoading = computed(() => agentStore.currentPhase === 'running' || agentStore.isStreaming);

async function handleSubmit() {
  const currentIntent = prompt.value;
  if (!currentIntent.trim()) return;
  prompt.value = '';

  try {
    if (!agentStore.currentSessionId) {
      console.log("[PromptSender] No session. Starting new session...");

      if (!engineStore.selectedEngineId) {
        uiStore.showNotification({ text: "Please select an engine first.", color: 'error' });
        return;
      }
      agentStore.addUserMessage(currentIntent);
      const result = await apiStartSession(engineStore.selectedEngineId, currentIntent);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.session_id && result.ws_token) {
        console.log(`[PromptSender] Session started ${result.session_id}. Joining WebSocket room...`);
        socketStore.joinAgentSession(result.session_id, result.ws_token);
      } else {
        throw new Error("Invalid response from server when starting session.");
      }

    } else {
      console.log(`[PromptSender] Sending input to existing session ${agentStore.currentSessionId}...`);
      socketStore.sendAgentInput(currentIntent);
    }
  } catch (err) {
    console.error("[PromptSender] Error handling submit:", err);
    uiStore.showNotification({ text: err.message, color: 'error' });
    if (!agentStore.currentSessionId) {
      agentStore.reset();
    }
  }
}
</script>

<style scoped>
.sidebar-content-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  box-shadow: none;
}

.panel-content {
  flex-grow: 1;
  padding-top: 24px !important;
}

.panel-title {
  color: #00f5ff !important;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  padding-bottom: 16px;
  text-shadow: 0 0 4px rgba(0, 245, 255, 0.5);
}

/* Memastikan kontras untuk form */
.prompt-textarea :deep(.v-field),
.file-input :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
}
.prompt-textarea :deep(.v-field__outline),
.file-input :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}
.prompt-textarea :deep(.v-field--active .v-field__outline),
.file-input :deep(.v-field--active .v-field__outline) {
    border-color: var(--neon-cyan) !important;
}
.prompt-textarea :deep(textarea),
.file-input :deep(input) {
  color: var(--text-primary) !important;
}
.prompt-textarea :deep(.v-label),
.file-input :deep(.v-label) {
  color: var(--text-secondary) !important;
  opacity: 1 !important;
}
.prompt-textarea :deep(.v-field--active .v-label),
.file-input :deep(.v-field--active .v-label) {
    color: var(--neon-cyan) !important;
}
</style>
