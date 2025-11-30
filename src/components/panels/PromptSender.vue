<template>
  <v-card class="sidebar-content-card" width="auto">
    <v-card-title class="panel-title d-flex align-center pa-4">
      <v-icon :icon="currentMode === 'chat' ? 'mdi-robot-outline' : 'mdi-flash-outline'" class="mr-2" :color="currentMode === 'chat' ? 'cyan' : 'green-accent-3'"></v-icon>
      {{ currentMode === 'chat' ? 'Agent Chat' : 'Prompt Receiver' }}
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="uiStore.closeRightPanel"></v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-tabs v-model="currentMode" density="compact" grow class="mb-2 border-bottom-light">
        <v-tab value="chat" color="cyan">Agent Chat</v-tab>
        <v-tab value="command" color="green-accent-3">Direct Command</v-tab>
    </v-tabs>

    <v-card-text class="panel-content d-flex flex-column">

      <div v-if="currentMode === 'chat'" class="d-flex flex-column flex-grow-1">
          <v-textarea
            label="Chat with Agent..."
            placeholder="e.g., 'Run system diagnostics' or 'Summarize the last log'"
            variant="outlined"
            rows="5"
            hide-details
            class="mb-4 prompt-textarea flex-grow-0"
            v-model="prompt"
            @keydown.enter.ctrl="handleAgentSubmit"
          ></v-textarea>

          <div class="d-flex justify-center mt-2">
            <v-btn
              color="cyan"
              variant="tonal"
              block
              @click="handleAgentSubmit"
              :loading="isLoading"
              :disabled="!prompt.trim()"
            >
              <v-icon start>mdi-send</v-icon>
              {{ agentStore.currentSessionId ? 'Send Message' : 'Start Session' }}
            </v-btn>
          </div>
      </div>

      <div v-if="currentMode === 'command'" class="d-flex flex-column flex-grow-1">
          <div class="text-caption text-grey-lighten-1 mb-2">
              Send raw text directly to <b>Prompt Receiver Module</b>.
          </div>
          <v-textarea
            v-model="commandPrompt"
            label="Command Input"
            placeholder="Ketik perintah langsung..."
            variant="outlined"
            bg-color="rgba(0, 100, 50, 0.2)"
            class="mb-3 command-textarea flex-grow-0"
            rows="6"
            hide-details
            color="green-accent-3"
            @keydown.enter.ctrl="handleCommandSubmit"
          ></v-textarea>

          <v-spacer></v-spacer>

          <v-btn
            color="green-accent-4"
            variant="flat"
            block
            @click="handleCommandSubmit"
            :loading="engineStore.isLoading"
            :disabled="!commandPrompt.trim()"
          >
            <v-icon start>mdi-flash</v-icon>
            Execute Workflow
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
import { useWorkflowStore } from '@/store/workflow'; // [ADD] Import Workflow Store
import { apiStartSession } from '@/api';
import { v4 as uuidv4 } from 'uuid'; // [ADD] Import UUID for Job ID

const uiStore = useUiStore();
const socketStore = useSocketStore();
const agentStore = socketStore.useAgentStore();
const engineStore = useEngineStore();
const workflowStore = useWorkflowStore(); // [ADD] Init Store

const currentMode = ref('chat'); // 'chat' | 'command'

const prompt = ref('');
const commandPrompt = ref('');

const isLoading = computed(() => agentStore.currentPhase === 'running' || agentStore.isStreaming);

// --- LOGIC 1: AGENT CHAT (DUAL MODE: AGENT + WORKFLOW TRIGGER) ---
async function handleAgentSubmit() {
  const currentIntent = prompt.value;
  if (!currentIntent.trim()) return;
  prompt.value = '';

  if (!engineStore.selectedEngineId) {
    uiStore.showNotification({ text: "Please select an engine first.", color: 'error' });
    return;
  }

  // [FIX FINAL] JALANKAN WORKFLOW (BUKAN CUMA MODULE)
  // Kalau ada workflow yang lagi dibuka di canvas, kita inject prompt ke sana.
  // Ini bikin aliran data ngalir dari Receiver -> Popup -> dst.
  if (workflowStore.workflowData) {
      console.log("[PromptSender] 🚀 Triggering Active Workflow with Prompt...");

      socketStore.sendMessage({
          type: 'execute_workflow',
          job_id: uuidv4(),
          target_engine_id: engineStore.selectedEngineId,
          payload: {
              workflow_data: workflowStore.workflowData, // Kirim struktur workflow lengkap
              // [PATCH BY FOWORK DEV] Rename 'global_payload' -> 'initial_payload'
              // Core Handler (workflow_handler.py) expects 'initial_payload' to map to Input Data
              initial_payload: { prompt: currentIntent }
          }
      });
  } else {
      // Fallback: Kalau gak ada workflow kebuka, baru kita tembak module doang (Standalone)
      // Biar tetep ada feedback kalau user cuma iseng chat tanpa buka canvas.
      engineStore.runModule(
          engineStore.selectedEngineId,
          'prompt_receiver_module',
          { prompt: currentIntent }
      ).catch(e => console.warn("Shadow send failed:", e));
  }

  // --- LOGIC STANDARD AGENT SESSION ---
  try {
    if (!agentStore.currentSessionId) {
      agentStore.addUserMessage(currentIntent);
      const result = await apiStartSession(engineStore.selectedEngineId, currentIntent);

      if (result.error) throw new Error(result.error);

      if (result.session_id && result.ws_token) {
        socketStore.joinAgentSession(result.session_id, result.ws_token);
      } else {
        throw new Error("Invalid response from server.");
      }
    } else {
      socketStore.sendAgentInput(currentIntent);
    }
  } catch (err) {
    console.error("[Agent] Error:", err);
    uiStore.showNotification({ text: err.message, color: 'error' });
    if (!agentStore.currentSessionId) agentStore.reset();
  }
}

// --- LOGIC 2: PROMPT RECEIVER (DIRECT WORKFLOW TRIGGER) ---
async function handleCommandSubmit() {
    const txt = commandPrompt.value;
    if (!txt.trim()) return;

    if (!engineStore.selectedEngineId) {
        uiStore.showNotification({ text: "Please select an engine first.", color: 'error' });
        return;
    }

    // [FIX FINAL] SAMA KAYA DIATAS, PRIORITASIN WORKFLOW
    if (workflowStore.workflowData) {
        uiStore.showNotification({ text: "Injecting to Workflow...", color: 'info' });

        try {
            socketStore.sendMessage({
                type: 'execute_workflow',
                job_id: uuidv4(),
                target_engine_id: engineStore.selectedEngineId,
                payload: {
                    workflow_data: workflowStore.workflowData,
                    // [PATCH BY FOWORK DEV] FIX: Use 'initial_payload' to match Core expectation
                    initial_payload: { prompt: txt }
                }
            });
            commandPrompt.value = '';
            // Gak perlu notif success manual disini, nanti dapet dari socket 'WORKFLOW_EXECUTION_UPDATE'
        } catch (err) {
            console.error("Workflow Trigger Failed:", err);
            uiStore.showNotification({ text: "Failed to trigger workflow.", color: 'error' });
        }
    } else {
        // Fallback Standalone
        try {
            uiStore.showNotification({ text: "Running Receiver (Standalone)...", color: 'info' });
            await engineStore.runModule(
                engineStore.selectedEngineId,
                'prompt_receiver_module',
                { prompt: txt }
            );
            uiStore.showNotification({ text: "Command Sent (No Active Workflow)", color: 'success' });
            commandPrompt.value = '';
        } catch (err) {
            console.error("Command Failed:", err);
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
  padding-top: 16px !important;
  overflow-y: auto;
}

.panel-title {
  color: #E0E0E0 !important;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  padding-bottom: 0px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.prompt-textarea :deep(.v-field),
.command-textarea :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
}

.prompt-textarea :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}

.command-textarea :deep(.v-field__outline) {
    border-color: rgba(0, 230, 118, 0.3) !important;
}

.prompt-textarea :deep(textarea),
.command-textarea :deep(textarea) {
  color: var(--text-primary) !important;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
}

.border-bottom-light {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>