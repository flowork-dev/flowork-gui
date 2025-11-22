//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\AiCenter.vue total lines 433 
//#######################################################################

<template>
  <div class="gemini-layout fill-height d-flex flex-column">

    <v-navigation-drawer
        v-model="drawer"
        color="#1e1f20"
        width="280"
        class="border-r-thin"
        floating
    >
        <div class="pa-4">
            <v-btn
                block
                rounded="xl"
                color="#28292a"
                class="text-none justify-start text-grey-lighten-1 new-chat-btn mb-4"
                height="44"
                variant="flat"
                @click="handleNewChat"
            >
                <v-icon start icon="mdi-plus" color="grey-lighten-1"></v-icon>
                New chat
            </v-btn>

            <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 ml-2">Recent</div>

            <div v-if="sessions.length === 0" class="text-caption text-grey-darken-2 text-center mt-4 italic">
                No history yet.
            </div>

            <v-list bg-color="transparent" density="compact" class="history-list">
                <v-hover v-for="session in sessions" :key="session.id" v-slot="{ isHovering, props }">
                    <v-list-item
                        v-bind="props"
                        rounded="lg"
                        :active="currentSessionId === session.id"
                        active-color="#004a77"
                        class="mb-1 history-item"
                        @click="aiCenterStore.switchSession(session.id)"
                    >
                        <template v-slot:prepend>
                            <v-icon icon="mdi-message-outline" size="small" class="mr-3 text-grey"></v-icon>
                        </template>

                        <v-list-item-title class="text-body-2 text-grey-lighten-2 text-truncate">
                            {{ session.title }}
                        </v-list-item-title>

                        <template v-slot:append>
                            <div v-if="isHovering || currentSessionId === session.id">
                                <v-menu location="end">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon v-bind="props" variant="text" density="compact" size="small" color="grey">
                                            <v-icon icon="mdi-dots-vertical" size="small"></v-icon>
                                        </v-btn>
                                    </template>
                                    <v-list bg-color="#2d2e30" density="compact" class="rounded-lg border-thin">
                                        <v-list-item @click.stop="aiCenterStore.deleteSession(session.id)" class="text-red-accent-2">
                                            <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template>
                                            <v-list-item-title>Delete</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </div>
                        </template>
                    </v-list-item>
                </v-hover>
            </v-list>
        </div>

        <template v-slot:append>
            <div class="pa-4 text-caption text-grey-darken-2">
                <div class="d-flex align-center mb-1"><v-icon icon="mdi-map-marker" size="x-small" class="mr-1"></v-icon> Jakarta, ID</div>
                <div class="font-mono" style="font-size: 10px;">Flowork Neural v3.0 (Mnemosyne)</div>
            </div>
        </template>
    </v-navigation-drawer>

    <div class="header-bar px-4 py-3 d-flex align-center justify-space-between bg-glass-header">

        <div class="d-flex align-center">
            <v-app-bar-nav-icon variant="text" color="grey-lighten-1" @click="drawer = !drawer"></v-app-bar-nav-icon>
            <div class="d-flex align-center cursor-pointer ml-2 hover-opacity" @click="$router.push('/')">
                <span class="font-weight-bold text-h6 text-grey-lighten-1 orbitron-font">Flowork <span class="text-cyan-accent-3">AI</span></span>
                <v-chip size="x-small" color="cyan" variant="outlined" class="ml-2 mt-1 font-mono d-none d-sm-flex">BETA</v-chip>
            </div>
        </div>

        <div class="d-flex align-center flex-grow-1 justify-center">
             <v-menu location="bottom" transition="slide-y-transition" offset="8">
                <template v-slot:activator="{ props }">
                    <div v-bind="props" class="model-selector-btn d-flex align-center px-3 py-2 rounded-lg cursor-pointer transition-all">
                        <v-icon icon="mdi-shimmer" color="cyan-accent-3" size="small" class="mr-2"></v-icon>
                        <span class="text-grey-lighten-1 font-weight-bold mr-2 text-body-2 text-truncate" style="max-width: 200px;">
                            {{ getSelectedModelName() }}
                        </span>
                        <v-icon icon="mdi-chevron-down" color="grey-darken-1" size="small"></v-icon>
                    </div>
                </template>

                <v-list bg-color="#1e1f20" density="compact" class="border-thin rounded-lg nav-menu-list mt-2" width="300">
                    <v-list-subheader class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-1">Select Active Node</v-list-subheader>
                    <v-divider class="mb-2 border-opacity-10"></v-divider>

                    <div v-if="aiCenterStore.isLoadingStatus" class="pa-4 text-center">
                        <v-progress-circular indeterminate size="20" width="2" color="cyan"></v-progress-circular>
                    </div>

                    <template v-else>
                        <v-list-item
                            v-for="provider in aiProviders"
                            :key="provider.id"
                            :value="provider.id"
                            @click="selectedEndpointId = provider.id"
                            :active="selectedEndpointId === provider.id"
                            active-color="cyan"
                            class="mb-1 rounded mx-2"
                            variant="text"
                        >
                            <template v-slot:prepend>
                                <v-icon :icon="getProviderIcon(provider.type)" size="small" :color="provider.status === 'Ready' ? 'green-accent-3' : 'grey'" class="mr-2"></v-icon>
                            </template>
                            <v-list-item-title class="font-mono text-caption font-weight-medium">{{ provider.name }}</v-list-item-title>
                            <template v-slot:append>
                                <v-icon v-if="selectedEndpointId === provider.id" icon="mdi-check" color="cyan" size="small"></v-icon>
                            </template>
                        </v-list-item>
                        <v-list-item v-if="aiProviders.length === 0" disabled class="text-center">
                            <v-list-item-title class="text-grey italic text-caption">No active nodes found</v-list-item-title>
                        </v-list-item>
                    </template>

                    <v-divider class="my-2 border-opacity-10"></v-divider>
                    <v-list-item @click="aiCenterStore.fetchAiStatus()" class="mx-2 rounded text-center">
                        <v-list-item-title class="text-caption text-cyan-accent-3">Refresh List</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <div style="width: 48px;"></div>
    </div>

    <div class="main-content flex-grow-1 d-flex flex-column relative overflow-hidden">

        <div class="chat-scroll-area flex-grow-1 pa-4 d-flex flex-column align-center" ref="scrollContainer">
            <div class="w-100" style="max-width: 800px; padding-bottom: 120px;">

                <div v-if="currentMessages.length === 0" class="empty-state text-center mt-16 fade-in px-4">
                    <div class="gemini-logo-glow mb-6 mx-auto">
                        <v-icon icon="mdi-creation" size="56" color="transparent" class="gradient-icon"></v-icon>
                    </div>
                    <h1 class="text-h4 font-weight-medium text-gradient mb-2 font-secondary">Hello, Architect.</h1>
                    <p class="text-h6 text-grey-darken-1 font-weight-light mb-10">What would you like to build or simulate today?</p>

                    <div class="d-flex flex-wrap justify-center gap-3">
                        <v-card v-for="sug in suggestions" :key="sug" class="suggestion-card pa-4 rounded-xl" variant="outlined" @click="promptInput = sug">
                            <div class="text-body-2 text-grey-lighten-2">{{ sug }}</div>
                        </v-card>
                    </div>
                </div>

                <div v-else class="pt-4">
                     <div v-for="(msg, index) in currentMessages" :key="index" class="mb-6 fade-in-up">

                        <div v-if="msg.role === 'user'" class="d-flex align-start justify-end">
                             <div class="bg-user-bubble px-5 py-3 rounded-xl rounded-tr-sm text-body-1 text-white font-secondary shadow-sm" style="max-width: 85%;">
                                {{ msg.content }}
                            </div>
                        </div>

                        <div v-else class="d-flex align-start">
                            <div class="ai-avatar mr-4 mt-1">
                                <v-icon icon="mdi-shimmer" size="22" :color="msg.error ? 'red-accent-2' : 'cyan-accent-2'"></v-icon>
                            </div>
                            <div class="flex-grow-1" style="max-width: 95%;">
                                <div v-if="msg.error" class="text-red-accent-2 bg-red-dim pa-4 rounded-lg border-red-thin">
                                    <div class="font-weight-bold mb-1 d-flex align-center">
                                        <v-icon start icon="mdi-alert-circle" size="small" class="mr-2"></v-icon> Error
                                    </div>
                                    {{ msg.content }}
                                </div>
                                <div v-else class="markdown-body text-grey-lighten-3">
                                    <pre class="response-text">{{ msg.content }}</pre>
                                </div>

                                <div v-if="!msg.error && !msg.isStreaming" class="d-flex mt-2 opacity-60 hover-opacity-100">
                                    <v-btn size="x-small" variant="text" icon="mdi-content-copy" color="grey" @click="copyToClipboard(msg.content)"></v-btn>
                                    <v-btn size="x-small" variant="text" icon="mdi-thumb-up-outline" color="grey"></v-btn>
                                </div>
                            </div>
                        </div>

                     </div>

                     <div v-if="aiCenterStore.isGenerating" class="d-flex align-start mt-4">
                        <div class="ai-avatar mr-4 mt-1">
                            <v-icon icon="mdi-creation" size="20" class="icon-spin gradient-icon"></v-icon>
                        </div>
                        <div class="loading-shimmer rounded-lg" style="width: 60%; height: 40px;"></div>
                     </div>
                </div>

            </div>
        </div>

        <div class="input-footer py-6 px-4 d-flex justify-center bg-gradient-footer">
            <div class="input-wrapper w-100 position-relative" style="max-width: 760px;">

                <v-textarea
                    v-model="promptInput"
                    placeholder="Enter a prompt here..."
                    variant="solo"
                    bg-color="#1e1f20"
                    class="gemini-input font-body-1"
                    hide-details
                    auto-grow
                    rows="1"
                    max-rows="8"
                    rounded="xl"
                    @keydown.enter.prevent="handleSend"
                >
                    <template v-slot:prepend-inner>
                        <v-btn icon="mdi-plus-circle-outline" variant="text" color="grey" size="small" class="mr-1"></v-btn>
                    </template>
                    <template v-slot:append-inner>
                        <v-btn
                            :disabled="!promptInput || aiCenterStore.isGenerating"
                            icon="mdi-send"
                            variant="flat"
                            :color="promptInput ? 'white' : 'grey-darken-3'"
                            class="ml-2 send-btn"
                            size="small"
                            @click="handleSend"
                            :loading="aiCenterStore.isGenerating"
                        >
                            <v-icon :color="promptInput ? 'black' : 'grey'" icon="mdi-arrow-up"></v-icon>
                        </v-btn>
                    </template>
                </v-textarea>
                <div class="text-center text-caption text-grey-darken-2 mt-2 font-weight-medium">
                    Flowork can make mistakes. Check important info.
                </div>
            </div>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useAiCenterStore } from '@/store/aiCenter';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';

const aiCenterStore = useAiCenterStore();
const uiStore = useUiStore();
const { aiProviders, sessions, currentSessionId, currentMessages } = storeToRefs(aiCenterStore);

const drawer = ref(true);
const promptInput = ref('');
const selectedEndpointId = ref(null);
const scrollContainer = ref(null);

const suggestions = ref([
    "Explain Quantum Computing",
    "Write a Python script for CSV",
    "Creative writing ideas",
    "Debug this SQL query"
]);

watch(currentMessages, () => {
    scrollToBottom();
}, { deep: true });

function scrollToBottom() {
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
        }
    });
}

function getSelectedModelName() {
    if (!selectedEndpointId.value) return 'Select Model';
    const model = aiProviders.value.find(p => p.id === selectedEndpointId.value);
    return model ? model.name : 'Unknown Model';
}

function getProviderIcon(type) {
    if (type === 'local') return 'mdi-server-network';
    if (type === 'provider') return 'mdi-cloud-outline';
    return 'mdi-brain';
}

function handleSend(e) {
    if (e && e.shiftKey) return;

    if (promptInput.value && selectedEndpointId.value) {
        aiCenterStore.sendMessage(promptInput.value, selectedEndpointId.value);
        promptInput.value = ''; // Clear input
    } else if (!selectedEndpointId.value) {
        uiStore.showNotification({ text: 'Please select an Active Node first!', color: 'warning' });
    }
}

function handleNewChat() {
    aiCenterStore.createNewSession();
    promptInput.value = '';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    uiStore.showNotification({ text: 'Copied!', color: 'success' });
}

onMounted(async () => {
    await aiCenterStore.fetchAiStatus();
    aiCenterStore.loadHistory();

    if (aiProviders.value.length > 0 && !selectedEndpointId.value) {
        selectedEndpointId.value = aiProviders.value[0].id;
    }

    if (!currentSessionId.value) {
        if (sessions.value.length > 0) {
            aiCenterStore.switchSession(sessions.value[0].id);
        }
    }
});
</script>

<style scoped>
/* GLOBAL & LAYOUT */
.gemini-layout {
    background-color: #131314;
    color: #e3e3e3;
    height: 100vh;
    overflow: hidden;
}

.orbitron-font { font-family: 'Orbitron', sans-serif; letter-spacing: 1px; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
.font-secondary { font-family: 'Google Sans', 'Inter', sans-serif; }

/* SIDEBAR */
.bg-glass-header { background-color: #131314; }
.new-chat-btn:hover { background-color: #333435 !important; color: white !important; }
.history-item:hover { background-color: #2d2e30; }

.model-selector-btn {
    transition: all 0.2s ease;
}
.model-selector-btn:hover {
    background-color: #1e1f20;
}

/* MAIN CHAT AREA */
.chat-scroll-area {
    overflow-y: auto;
    scroll-behavior: smooth;
}
.chat-scroll-area::-webkit-scrollbar { width: 8px; }
.chat-scroll-area::-webkit-scrollbar-track { background: transparent; }
.chat-scroll-area::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

.empty-state { max-width: 600px; margin: 0 auto; }
.gradient-icon {
    background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.text-gradient {
    background: linear-gradient(90deg, #4facfe, #00f2fe);
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.suggestion-card {
    background-color: #1e1f20;
    border-color: #333;
    cursor: pointer;
    transition: background 0.2s;
    width: 180px; height: 100px;
    display: flex; align-items: start;
}
.suggestion-card:hover {
    background-color: #2a2b2d;
}

/* BUBBLES */
.bg-user-bubble { background-color: #2a2b2d; }
.response-text {
    white-space: pre-wrap; word-break: break-word; font-family: 'Roboto', sans-serif; font-size: 1rem; line-height: 1.6;
}
.markdown-body pre { background: #1e1f20; padding: 12px; border-radius: 8px; overflow-x: auto; margin-top: 10px; }

/* LOADING ANIMATION */
.icon-spin { animation: spin 2s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.loading-shimmer {
    background: linear-gradient(90deg, #1e1f20 25%, #2a2b2d 50%, #1e1f20 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* INPUT BAR */
.bg-gradient-footer {
    background: linear-gradient(to top, #131314 80%, rgba(19,19,20,0) 100%);
}
.gemini-input :deep(.v-field) {
    border-radius: 28px !important; background-color: #1e1f20 !important; box-shadow: none !important;
}
.gemini-input :deep(textarea) { color: #e3e3e3 !important; padding-top: 14px; }
.send-btn { transition: transform 0.2s; }
.send-btn:hover { transform: scale(1.1); }

/* UTILS */
.fade-in { animation: fadeIn 0.5s ease-out; }
.fade-in-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.hover-opacity:hover { opacity: 0.8; }
.bg-red-dim { background: rgba(255,82,82,0.1); }
.border-red-thin { border: 1px solid rgba(255,82,82,0.3); }
</style>
