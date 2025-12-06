//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\ai-trainer\BattleArena.vue total lines 183 
//#######################################################################

<template>
  <div class="d-flex flex-column fill-height pa-4">
    <div class="d-flex gap-4 mb-4">
        <v-select
            v-model="sparringConfig.base_model"
            :items="textModelsOnly"
            item-title="name"
            item-value="id"
            label="Fighter 1: Base Model (Original)"
            variant="outlined"
            density="compact"
            class="gold-input flex-grow-1 font-mono"
            color="#FFD700"
            prepend-inner-icon="mdi-robot-off"
        ></v-select>

        <v-select
            v-model="sparringConfig.adapter_model"
            :items="availableAdapters"
            item-title="new_model_name"
            item-value="new_model_name"
            label="Fighter 2: Trained Adapter (New Brain)"
            variant="outlined"
            density="compact"
            class="gold-input flex-grow-1 font-mono"
            color="#FFD700"
            prepend-inner-icon="mdi-robot"
        ></v-select>
    </div>

    <div class="d-flex flex-grow-1 gap-4 overflow-hidden mb-4 position-relative">

        <div v-if="isSparring" class="battle-overlay d-flex flex-column align-center justify-center">
            <div class="battle-grid"></div>
            <div class="battle-scanner"></div>
            <h1 class="text-h2 font-weight-black text-gold glitch-text mb-4" data-text="NEURAL BATTLE">NEURAL BATTLE</h1>
            <div class="d-flex align-center gap-4">
                <div class="text-center">
                    <v-icon size="60" color="grey" class="mb-2 blink-fast">mdi-robot-off</v-icon>
                    <div class="text-caption font-mono text-grey">BASE MODEL</div>
                </div>
                <div class="vs-text text-h4 font-weight-bold text-red-accent-2">VS</div>
                <div class="text-center">
                    <v-icon size="60" color="#FFD700" class="mb-2 blink-fast">mdi-robot</v-icon>
                    <div class="text-caption font-mono text-gold">ADAPTER</div>
                </div>
            </div>
            <div class="mt-6 text-center">
                <div class="text-caption text-grey font-mono typing-effect-fast">>> CALCULATING TENSORS...<br>>> INFERENCE IN PROGRESS...</div>
            </div>
        </div>

        <v-card class="gold-panel flex-grow-1 d-flex flex-column w-50">
            <div class="px-4 py-2 border-bottom-gold bg-black-transparent d-flex align-center">
                <v-icon color="grey" class="mr-2">mdi-brain</v-icon>
                <span class="text-caption font-mono font-weight-bold text-grey">BASE MODEL</span>
            </div>
            <div class="flex-grow-1 pa-4 overflow-y-auto font-mono text-grey-lighten-1" style="font-size: 0.9rem;">
                <div v-if="sparringResult.base_reply" style="white-space: pre-wrap;">{{ sparringResult.base_reply }}</div>
                <div v-else class="text-center mt-10 text-grey-darken-2">Waiting for input...</div>
            </div>
        </v-card>

        <div class="d-flex align-center justify-center">
            <v-avatar color="#FFD700" size="40" class="elevation-10">
                <span class="text-black font-weight-bold">VS</span>
            </v-avatar>
        </div>

        <v-card class="gold-panel flex-grow-1 d-flex flex-column w-50" style="border-color: #FFD700;">
            <div class="px-4 py-2 border-bottom-gold bg-black-transparent d-flex align-center">
                <v-icon color="#FFD700" class="mr-2">mdi-school</v-icon>
                <span class="text-caption font-mono font-weight-bold text-gold">TRAINED MODEL</span>
            </div>
            <div class="flex-grow-1 pa-4 overflow-y-auto font-mono text-white" style="font-size: 0.9rem;">
                <div v-if="sparringResult.adapter_reply" style="white-space: pre-wrap;">{{ sparringResult.adapter_reply }}</div>
                <div v-else class="text-center mt-10 text-grey-darken-2">Waiting for input...</div>
            </div>
        </v-card>
    </div>

    <div class="d-flex align-end gap-2">
        <v-textarea
            v-model="sparringPrompt"
            rows="2"
            auto-grow
            label="Enter Test Prompt (Sent to both models)"
            variant="outlined"
            class="gold-input font-mono"
            color="#FFD700"
            hide-details
            @keydown.enter.prevent="handleSparring"
        ></v-textarea>
        <v-btn
            height="56"
            width="100"
            color="#FFD700"
            variant="flat"
            class="text-black font-weight-bold font-mono"
            @click="handleSparring"
            :loading="isSparring"
            :disabled="!sparringConfig.base_model || !sparringConfig.adapter_model || !sparringPrompt"
        >
            FIGHT!
        </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTrainingStore } from '@/store/training';
import { storeToRefs } from 'pinia';

const trainingStore = useTrainingStore();
const { localModels: availableBaseModels, trainingJobs } = storeToRefs(trainingStore);

const sparringConfig = ref({ base_model: null, adapter_model: null });
const sparringPrompt = ref("");
const isSparring = ref(false);
const sparringResult = ref({ base_reply: "", adapter_reply: "" });

const textModelsOnly = computed(() => availableBaseModels.value);

const availableAdapters = computed(() => {
    return trainingJobs.value.filter(j => j.status === 'COMPLETED' && j.type === 'TRAINING');
});

onMounted(() => {
    if (availableBaseModels.value.length === 0) trainingStore.fetchLocalModels();
    if (trainingJobs.value.length === 0) trainingStore.fetchTrainingJobs();
});

async function handleSparring() {
    if (!sparringPrompt.value || !sparringConfig.value.base_model || !sparringConfig.value.adapter_model) return;

    isSparring.value = true;
    sparringResult.value = { base_reply: "", adapter_reply: "" };

    const result = await trainingStore.runSparringMatch({
        base_model_id: sparringConfig.value.base_model,
        adapter_model_id: sparringConfig.value.adapter_model,
        prompt: sparringPrompt.value
    });

    if (result) {
        sparringResult.value = result;
    }

    isSparring.value = false;
}
</script>

<style scoped>
.text-gold { color: #FFD700 !important; }
.gold-panel { background: #080808; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; backdrop-filter: blur(5px); }
.font-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important; }
.border-bottom-gold { border-bottom: 1px solid rgba(255, 215, 0, 0.15) !important; }
.bg-black-transparent { background-color: rgba(0,0,0,0.5); }
.gold-input :deep(.v-field) { background-color: rgba(20,20,20,0.5) !important; border-color: rgba(255,255,255,0.1); font-family: 'JetBrains Mono', monospace; }
.gold-input :deep(.v-field--focused) { border-color: #FFD700 !important; box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }

/* BATTLE STYLES */
.battle-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); z-index: 100; backdrop-filter: blur(5px); overflow: hidden; }
.battle-grid { position: absolute; top: 0; left: 0; width: 200%; height: 200%; background-image: linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(300px) rotateX(45deg); animation: battle-grid-move 10s linear infinite; opacity: 0.3; }
@keyframes battle-grid-move { from { transform: perspective(300px) rotateX(45deg) translateY(0); } to { transform: perspective(300px) rotateX(45deg) translateY(-40px); } }
.battle-scanner { position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: #FFD700; box-shadow: 0 0 15px #FFD700; animation: battle-scan 2s ease-in-out infinite alternate; opacity: 0.5; }
@keyframes battle-scan { from { top: 0%; } to { top: 100%; } }
.vs-text { text-shadow: 0 0 20px red; animation: pulse-red 0.5s infinite alternate; }
@keyframes pulse-red { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.2); opacity: 1; } }
.glitch-text { position: relative; color: #FFD700; }
.typing-effect-fast { display: inline-block; overflow: hidden; border-right: 2px solid #FFD700; white-space: nowrap; animation: typing 1s steps(40, end) infinite, blink-caret .5s step-end infinite; }
@keyframes typing { from { width: 0 } to { width: 100% } }
@keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #FFD700; } }
.blink-fast { animation: blink 0.5s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } }
</style>
