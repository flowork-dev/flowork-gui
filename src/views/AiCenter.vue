#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\AiCenter.vue
# REVISI:
# 1. Memperbaiki computed property 'providerItems' agar lebih robust
#    dengan mengecek 'Array.isArray(aiProviders.value)' sebelum map.
# 2. Membersihkan kode dari komentar tidak perlu.
#######################################################################
<template>
  <div class="ai-center-page">
    <v-container fluid>
      <div class="animate-on-load animate-fade-in-down">
        <h1 class="main-title orbitron-font">AI Command Center</h1>
        <p class="text-h6 text-grey-lighten-1 mt-2">Monitor, test, and manage your AI ecosystem.</p>
      </div>

      <h2 class="section-title orbitron-font">
        <v-icon class="mr-2">mdi-radar</v-icon>
        AI System Status
      </h2>
      <div v-if="aiCenterStore.isLoadingStatus" class="text-center py-8">
        <v-progress-circular indeterminate color="cyan" size="48"></v-progress-circular>
      </div>
      <v-row v-else>
        <v-col v-for="provider in aiProviders" :key="provider.id" cols="12" md="6" lg="4">
          <v-card class="status-card" variant="tonal" :color="getStatusColor(provider.status)">
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="32" class="mr-4">{{ getProviderIcon(provider.type) }}</v-icon>
                <div>
                  <div class="font-weight-bold">{{ provider.name }}</div>
                  <div class="text-caption">{{ provider.id }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-chip size="small" :color="getStatusColor(provider.status)" variant="flat">{{ provider.status }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="!aiCenterStore.isLoadingStatus && aiProviders.length === 0" cols="12">
            <v-alert type="info" variant="tonal" density="compact">
                No AI providers found or engine is offline.
            </v-alert>
        </v-col>
      </v-row>

      <h2 class="section-title orbitron-font mt-12">
          <v-icon class="mr-2">mdi-rocket-launch-outline</v-icon>
          AI Tool Suite
      </h2>
      <v-row>
          <v-col v-for="link in navLinks" :key="link.title" cols="12" sm="6" md="3">
              <v-card class="nav-card" :to="link.to" variant="outlined">
                  <v-card-text class="text-center">
                      <v-icon :icon="link.icon" size="48" class="mb-4 nav-icon"></v-icon>
                      <h3 class="orbitron-font">{{ link.title }}</h3>
                      <p class="text-caption text-grey-lighten-1">{{ link.description }}</p>
                  </v-card-text>
              </v-card>
          </v-col>
      </v-row>

      <h2 class="section-title orbitron-font mt-12">
          <v-icon class="mr-2">mdi-flask-outline</v-icon>
          AI Playground
      </h2>
      <v-row>
          <v-col cols="12" md="6">
              <v-card class="playground-card">
                  <v-textarea
                      v-model="playground.prompt"
                      label="Enter your prompt here..."
                      variant="solo-filled"
                      flat
                      rows="10"
                      no-resize
                      hide-details
                  ></v-textarea>
                  <div class="d-flex align-center pa-4" style="gap: 16px;">
                      <v-select
                          v-model="playground.endpointId"
                          :items="providerItems"
                          label="Select AI Provider"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="flex-grow-1"
                          :disabled="!providerItems.length || providerItems[0].disabled"
                          :no-data-text="aiCenterStore.isLoadingStatus ? 'Loading models...' : 'No models available'"
                      ></v-select>
                      <v-btn
                          color="cyan"
                          variant="flat"
                          @click="handlePlaygroundSubmit"
                          :loading="aiCenterStore.isPlaygroundLoading"
                          :disabled="!playground.endpointId"
                          class="action-btn"
                      >Generate</v-btn>
                  </div>
              </v-card>
          </v-col>
          <v-col cols="12" md="6">
              <v-card class="playground-card fill-height">
                  <v-card-title class="text-subtitle-2">Response</v-card-title>
                  <v-divider></v-divider>
                  <v-card-text>
                      <div v-if="aiCenterStore.isPlaygroundLoading" class="text-center">
                          <v-progress-circular indeterminate color="cyan"></v-progress-circular>
                      </div>
                      <div v-else-if="playgroundResult" class="response-content">
                          <pre v-if="playgroundResult.error" class="text-error">{{ playgroundResult.error }}</pre>
                          <pre v-else>{{ playgroundResult.data }}</pre>
                      </div>
                       <div v-else class="text-center text-grey text-caption">
                          AI response will appear here.
                      </div>
                  </v-card-text>
              </v-card>
          </v-col>
      </v-row>

    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAiCenterStore } from '@/store/aiCenter';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';

const aiCenterStore = useAiCenterStore();
const localeStore = useLocaleStore();
const { aiProviders, playgroundResult } = storeToRefs(aiCenterStore);
const { loc } = storeToRefs(localeStore);

const playground = ref({
    prompt: 'Write a short story about a robot who discovers music.', // English Hardcode
    endpointId: null,
});

const navLinks = ref([
    { title: 'AI Trainer', description: 'Fine-tune AI models with your custom data.', icon: 'mdi-school-outline', to: '/ai-trainer' }, // English Hardcode
    { title: 'Prompt Manager', description: 'Create, manage, and reuse powerful prompt templates.', icon: 'mdi-text-box-multiple-outline', to: '/prompt-manager' }, // English Hardcode
    { title: 'AI Architect', description: 'Generate entire workflows from a single sentence.', icon: 'mdi-sitemap-outline', to: '/ai-architect' }, // English Hardcode
    { title: 'Model Factory', description: 'Convert and optimize models to the GGUF format.', icon: 'mdi-factory', to: '/model-factory' }, // English Hardcode
]);

const providerItems = computed(() => {
    // Memastikan aiProviders.value adalah array sebelum map
    if (!Array.isArray(aiProviders.value) || aiProviders.value.length === 0) {
        return [{ title: 'No models available', value: null, disabled: true }]; // English Hardcode
    }
    return aiProviders.value.map(p => ({ title: p.name, value: p.id }));
});

function getStatusColor(status) {
    if (status === 'Ready') return 'success'; // English Hardcode
    return 'grey';
}

function getProviderIcon(type) {
    if (type === 'local') return 'mdi-server'; // English Hardcode
    return 'mdi-cloud-outline';
}

function handlePlaygroundSubmit() {
    if (playground.value.prompt && playground.value.endpointId) {
        aiCenterStore.runPlaygroundQuery(playground.value.prompt, playground.value.endpointId);
    }
}

onMounted(() => {
    aiCenterStore.fetchAiStatus();
});
</script>

<style scoped>
.ai-center-page {
  padding: 24px;
}
.main-title {
  color: #f0f0f0;
}
.section-title {
  margin-top: 48px;
  margin-bottom: 24px;
  color: var(--neon-cyan);
}
.orbitron-font {
  font-family: 'Orbitron', monospace;
}
.status-card {
  border-left-width: 4px;
  border-left-style: solid;
}
.nav-card {
  text-align: center;
  height: 100%;
  transition: all 0.2s ease-in-out;
}
.nav-card:hover {
  transform: translateY(-5px);
  border-color: var(--neon-cyan);
}
.nav-icon {
    color: var(--neon-cyan);
}
.playground-card {
  background-color: #161625;
}
.response-content pre {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.9rem;
}
.action-btn {
    font-weight: bold;
    color: #010c03 !important;
}
.animate-on-load {
  opacity: 0;
  animation-fill-mode: forwards;
}
.animate-fade-in-down {
  animation-name: fade-in-down;
  animation-duration: 0.8s;
}
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

.playground-card :deep(textarea) {
  color: #FFFFFF !important;
}
.playground-card :deep(.v-field) {
    background-color: #2a2a4a !important;
}
.response-content pre {
    color: #E0E0E0;
}
</style>