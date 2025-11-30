//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\ModelFactory.vue
//#######################################################################

<template>
  <div class="model-factory-view h-100 d-flex flex-column relative bg-deep-space">
    <NeuralCanvasBackground />

    <div class="vignette-overlay"></div>

    <div class="factory-content d-flex flex-column flex-grow-1 pa-6 relative" style="z-index: 10;">

        <div class="header-section mb-8 d-flex align-end justify-space-between">
            <div class="d-flex align-center">
                <div class="icon-box mr-4 d-flex align-center justify-center">
                    <v-icon icon="mdi-hexagon-multiple-outline" color="#555" size="42"></v-icon>
                </div>
                <div>
                    <div class="d-flex align-center mb-1">
                        <h1 class="text-h4 font-weight-black text-white orbitron-font tracking-wide">
                            MODEL <span class="text-gold-subtle">FACTORY</span>
                        </h1>
                        <v-chip size="x-small" color="grey" variant="outlined" class="ml-3 font-mono border-subtle">
                            GGUF FORGE v2.0
                        </v-chip>
                    </div>

                    <div class="d-flex align-center gap-4 mt-2">
                        <div class="d-flex align-center">
                            <v-icon icon="mdi-memory" color="grey-darken-1" size="x-small" class="mr-2"></v-icon>
                            <div class="d-flex flex-column">
                                <span class="text-caption text-grey-darken-2 font-mono" style="font-size: 9px;">VRAM LOAD</span>
                                <v-progress-linear model-value="65" color="#555" height="4" rounded class="mt-1" style="width: 60px;"></v-progress-linear>
                            </div>
                        </div>
                        <div class="d-flex align-center">
                            <v-icon icon="mdi-cpu-64-bit" color="grey-darken-1" size="x-small" class="mr-2"></v-icon>
                            <div class="d-flex flex-column">
                                <span class="text-caption text-grey-darken-2 font-mono" style="font-size: 9px;">CORE TEMP</span>
                                <span class="text-caption text-grey-lighten-1 font-mono leading-none">42°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="engine-status-pill px-4 py-2 rounded-xl d-flex align-center border-subtle bg-cyber-glass">
                <div class="status-dot mr-3" :class="{ 'online': !trainingStore.isLoadingModels }"></div>
                <div class="d-flex flex-column text-right">
                    <span class="text-caption font-weight-bold text-grey-lighten-1 font-mono">NEURAL ENGINE</span>
                    <span class="text-caption text-grey-darken-1 font-mono" style="font-size: 10px;">{{ trainingStore.isLoadingModels ? 'SCANNING...' : 'ONLINE' }}</span>
                </div>
                <v-divider vertical class="mx-3 border-opacity-20"></v-divider>
                <v-btn icon size="x-small" variant="text" color="grey-darken-1" @click="refreshData">
                    <v-icon :class="{ 'spin': trainingStore.isLoadingModels }">mdi-refresh</v-icon>
                </v-btn>
            </div>
        </div>

        <v-row class="fill-height" style="min-height: 0;">

            <v-col cols="12" lg="4" class="d-flex flex-column h-100 pb-0">
                <v-card class="control-panel-card flex-grow-1 d-flex flex-column border-subtle bg-cyber-glass">

                    <div class="panel-header pa-5 border-bottom-subtle d-flex align-center justify-space-between">
                        <span class="text-subtitle-2 font-weight-bold text-grey-lighten-2 orbitron-font">
                            <v-icon start icon="mdi-tune" size="small" class="mr-1 text-grey-darken-1"></v-icon> CONFIGURATION
                        </span>
                        <v-icon icon="mdi-dots-horizontal" color="grey-darken-3" size="small"></v-icon>
                    </div>

                    <div class="panel-body pa-6 flex-grow-1 overflow-y-auto custom-scrollbar">

                        <div class="form-group mb-6">
                            <label class="label-text mb-2 d-flex align-center justify-space-between">
                                <span>SOURCE ARTIFACT</span>
                                <span class="text-caption text-grey-darken-2 font-mono">.safetensors / .bin</span>
                            </label>
                            <div class="input-wrapper" :class="{ 'focused': focusedField === 'model' }">
                                <v-select
                                    v-model="config.model_id"
                                    :items="localModels"
                                    item-title="name"
                                    item-value="id"
                                    placeholder="Select Model Checkpoint..."
                                    variant="plain"
                                    density="compact"
                                    hide-details
                                    class="cyber-input font-mono"
                                    :loading="isLoadingModels"
                                    @focus="focusedField = 'model'"
                                    @blur="focusedField = null"
                                >
                                    <template v-slot:prepend-inner>
                                        <v-icon icon="mdi-cube-scan" size="small" color="grey-darken-1" class="mr-2"></v-icon>
                                    </template>
                                </v-select>
                            </div>

                            <div v-if="config.model_id" class="hologram-panel mt-4 pa-3 border-subtle rounded bg-glass-dark relative overflow-hidden fade-in">
                                <div class="scan-bar"></div>
                                <div class="d-flex justify-space-between align-start mb-2">
                                    <span class="text-caption text-gold-subtle font-weight-bold font-mono">ARTIFACT ANALYSIS</span>
                                    <v-icon icon="mdi-chart-bubble" color="grey-darken-2" size="x-small"></v-icon>
                                </div>
                                <div class="d-flex justify-space-between font-mono text-caption text-grey-darken-1">
                                    <span>Est. Source Size:</span>
                                    <span class="text-grey-lighten-2">~12.0 GB</span>
                                </div>
                                <div class="d-flex justify-space-between font-mono text-caption text-grey-darken-1">
                                    <span>Est. Output ({{ config.quantization.toUpperCase() }}):</span>
                                    <span class="text-grey-lighten-2 font-weight-bold">{{ estimateSize(config.quantization) }} GB</span>
                                </div>
                                <div class="d-flex justify-space-between font-mono text-caption text-grey-darken-1 mt-1">
                                    <span>VRAM Req:</span>
                                    <span class="text-gold-subtle">~{{ estimateVram(config.quantization) }} GB</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-group mb-6">
                            <label class="label-text mb-2">COMPRESSION LEVEL</label>
                            <div class="quant-grid">
                                <div
                                    v-for="opt in quantizationOptions"
                                    :key="opt.value"
                                    class="quant-card pa-3 rounded cursor-pointer transition-all"
                                    :class="{ 'active': config.quantization === opt.value }"
                                    @click="config.quantization = opt.value"
                                >
                                    <div class="d-flex justify-space-between align-center mb-1">
                                        <span class="text-body-2 font-weight-bold text-grey-lighten-2 font-mono">{{ opt.title.split(' ')[0] }}</span>
                                        <v-icon v-if="config.quantization === opt.value" icon="mdi-check-circle" size="x-small" color="#8a7e58"></v-icon>
                                    </div>
                                    <div class="text-caption text-grey-darken-2 lh-12" style="font-size: 10px;">{{ opt.desc }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group mb-8">
                            <label class="label-text mb-2">OUTPUT IDENTITY</label>
                            <div class="input-wrapper" :class="{ 'focused': focusedField === 'output' }">
                                <v-text-field
                                    v-model="config.output_name"
                                    placeholder="e.g. llama3-8b-instruct-q4"
                                    variant="plain"
                                    density="compact"
                                    hide-details
                                    class="cyber-input font-mono"
                                    @focus="focusedField = 'output'"
                                    @blur="focusedField = null"
                                >
                                    <template v-slot:prepend-inner>
                                        <v-icon icon="mdi-file-code-outline" size="small" color="grey-darken-1" class="mr-2"></v-icon>
                                    </template>
                                    <template v-slot:append-inner>
                                        <span class="text-grey-darken-2 text-caption font-weight-bold">.GGUF</span>
                                    </template>
                                </v-text-field>
                            </div>
                        </div>

                        <div class="action-area mt-auto">
                            <v-btn
                                block
                                height="56"
                                color="#8a7e58"
                                class="forge-btn font-weight-bold text-white orbitron-font"
                                :loading="trainingStore.isConverting"
                                @click="handleConvert"
                                :disabled="!isValid"
                                variant="tonal"
                            >
                                <template v-if="!trainingStore.isConverting">
                                    <v-icon start icon="mdi-hammer-wrench" class="mr-2"></v-icon>
                                    INITIALIZE FORGE
                                </template>
                                <template v-else>
                                    <span class="blink mr-2">PROCESSING TENSORS</span>
                                </template>
                            </v-btn>

                            <div class="d-flex justify-center mt-4">
                                <div class="d-flex align-center text-caption text-grey-darken-3">
                                    <v-icon icon="mdi-shield-check-outline" size="x-small" class="mr-1"></v-icon>
                                    Secure Local Processing
                                </div>
                            </div>
                        </div>

                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" lg="8" class="d-flex flex-column h-100 pb-0">

                <v-card class="vis-card mb-4 flex-grow-0 bg-cyber-glass border-subtle relative overflow-hidden" height="180">
                    <div class="grid-bg"></div>
                    <div class="d-flex align-center justify-space-around h-100 relative" style="z-index: 2;">

                        <div class="process-node text-center opacity-50" :class="{ 'active': trainingStore.isConverting }">
                            <div class="node-icon mb-3 bg-grey-darken-4 rounded-circle d-flex align-center justify-center border-subtle">
                                <v-icon icon="mdi-layers-triple" size="32" color="grey-darken-2"></v-icon>
                            </div>
                            <div class="text-caption font-weight-bold text-grey-darken-2 font-mono">RAW TENSORS</div>
                        </div>

                        <div class="connection-line flex-grow-1 mx-4 relative d-flex flex-column align-center justify-center">
                            <div class="line-bg"></div>
                            <div class="line-progress" :class="{ 'animating': trainingStore.isConverting }"></div>
                            <div v-if="trainingStore.isConverting" class="absolute-center-text bg-black px-2 rounded border-subtle text-gold-subtle text-caption font-mono blink">
                                EST: 04m 20s
                            </div>
                        </div>

                        <div class="process-node text-center center-node" :class="{ 'active': trainingStore.isConverting }">
                            <div class="node-icon mb-3 bg-black rounded-circle d-flex align-center justify-center border-subtle">
                                <v-icon icon="mdi-engine" size="40" color="#8a7e58" :class="{ 'spin-slow': trainingStore.isConverting }"></v-icon>
                            </div>
                            <div class="text-caption font-weight-bold text-grey-lighten-1 font-mono">QUANTIZER</div>
                        </div>

                        <div class="connection-line flex-grow-1 mx-4 relative">
                            <div class="line-bg"></div>
                            <div class="line-progress delay-1" :class="{ 'animating': trainingStore.isConverting }"></div>
                        </div>

                        <div class="process-node text-center opacity-50">
                            <div class="node-icon mb-3 bg-grey-darken-4 rounded-circle d-flex align-center justify-center border-subtle">
                                <v-icon icon="mdi-file-check" size="32" color="grey-darken-1"></v-icon>
                            </div>
                            <div class="text-caption font-weight-bold text-grey-darken-2 font-mono">GGUF BINARY</div>
                        </div>

                    </div>
                </v-card>

                <v-card class="terminal-card flex-grow-1 d-flex flex-column bg-black border-subtle elevation-10" style="max-height: calc(100vh - 350px);">

                    <div class="terminal-header px-4 py-3 bg-grey-darken-4 border-bottom-subtle d-flex align-center justify-space-between">
                        <div class="d-flex align-center">
                            <v-icon icon="mdi-console" color="#666" size="small" class="mr-2"></v-icon>
                             <span class="text-caption font-weight-bold text-grey font-mono">NEURAL LOG STREAM // ROOT ACCESS</span>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="window-dot red"></div>
                            <div class="window-dot yellow"></div>
                            <div class="window-dot green"></div>
                        </div>
                    </div>

                    <div class="terminal-body flex-grow-1 pa-4 font-mono text-caption overflow-y-auto custom-scrollbar relative" ref="logContainer">
                        <div class="scanlines"></div>

                        <div v-if="trainingStore.conversionJobs.length === 0" class="h-100 d-flex align-center justify-center flex-column opacity-30">
                            <v-icon icon="mdi-console-line" size="64" color="grey-darken-3"></v-icon>
                            <div class="mt-4 text-grey-darken-2 font-mono">AWAITING NEURAL INPUT...</div>
                        </div>

                        <template v-else>
                            <div v-for="job in trainingStore.conversionJobs" :key="job.id" class="job-entry mb-6 fade-in">
                                <div class="d-flex align-center mb-2 px-2 py-1 rounded" style="background: rgba(255,255,255,0.02); border-left: 2px solid #666;">
                                    <span class="text-grey font-weight-bold mr-2">➜</span>
                                    <span class="text-grey-lighten-2 font-weight-bold">EXEC:</span>
                                    <span class="ml-2 text-grey-darken-1">{{ job.source_model }}</span>
                                    <v-chip size="x-small" :color="getStatusColor(job.status)" class="ml-auto font-weight-bold" variant="text">
                                        {{ job.status.toUpperCase() }}
                                    </v-chip>
                                </div>

                                <div class="log-content pl-4">
                                    <div class="text-grey-darken-2 mb-1">Target Identity: <span class="text-grey-darken-1">{{ job.format.toUpperCase() }}</span></div>

                                    <div v-for="(log, i) in job.logs" :key="i" class="log-line mb-0" :class="getLogColorClass(log)">
                                        <span class="text-grey-darken-3 mr-2 font-weight-thin">[{{ new Date().toLocaleTimeString() }}]</span>
                                        {{ log }}
                                    </div>

                                    <div v-if="job.status === 'processing'" class="typing-cursor mt-1 text-gold-subtle">
                                        _ processing tensors...
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div class="d-flex align-center mt-4 border-top-subtle pt-2 opacity-50">
                            <span class="text-grey-darken-1 mr-2">root@flowork-forge:~$</span>
                            <span class="blink">_</span>
                        </div>
                    </div>
                </v-card>

            </v-col>
        </v-row>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useTrainingStore } from '@/store/training';
import { storeToRefs } from 'pinia';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const trainingStore = useTrainingStore();
const { localModels, isLoadingModels, conversionJobs } = storeToRefs(trainingStore);

const focusedField = ref(null);
const logContainer = ref(null);
const config = ref({
    model_id: null,
    quantization: 'q4_k_m',
    output_name: ''
});

const quantizationOptions = [
    { title: 'Q4_K_M (Balanced)', value: 'q4_k_m', desc: 'Best for 8GB VRAM. Good speed/quality ratio.' },
    { title: 'Q5_K_M (Quality)', value: 'q5_k_m', desc: 'Higher accuracy. Requires 10GB+ VRAM.' },
    { title: 'Q8_0 (Max)', value: 'q8_0', desc: 'Near lossless. Heavy. Requires 16GB+.' },
    { title: 'FP16 (Raw)', value: 'f16', desc: 'Original precision. Huge file size.' }
];

const isValid = computed(() => {
    return config.value.model_id && config.value.output_name.length > 2;
});

// Auto scroll logs
watch(conversionJobs, () => {
    nextTick(() => {
        if(logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
    });
}, { deep: true });

function getStatusColor(status) {
    if(status === 'success') return 'green-darken-2';
    if(status === 'error') return 'red-darken-3';
    return 'grey';
}

function getLogColorClass(logText) {
    const lower = logText.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('abort')) {
        return 'text-red-darken-2 font-weight-bold';
    }
    if (lower.includes('warn') || lower.includes('load') || lower.includes('process')) {
        return 'text-grey-lighten-1';
    }
    if (lower.includes('success') || lower.includes('complete') || lower.includes('done') || lower.includes('saved')) {
        return 'text-green-darken-2 font-weight-bold';
    }
    if (lower.includes('quantizing') || lower.includes('compiling')) {
        return 'text-gold-subtle';
    }
    return 'text-grey-darken-1';
}

// Mock Estimations
function estimateSize(quant) {
    if(quant.includes('q4')) return '4.8';
    if(quant.includes('q5')) return '5.9';
    if(quant.includes('q8')) return '8.5';
    return '14.2';
}

function estimateVram(quant) {
    if(quant.includes('q4')) return '6';
    if(quant.includes('q5')) return '8';
    if(quant.includes('q8')) return '12';
    return '16+';
}

async function handleConvert() {
    if(!isValid.value) return;
    await trainingStore.startConversionJob({ ...config.value });
}

function refreshData() {
    trainingStore.fetchLocalModels();
    trainingStore.fetchTrainingJobs();
}

onMounted(() => {
    refreshData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap');

/* GLOBAL & LAYOUT */
.bg-deep-space { background-color: #050505; }
.orbitron-font { font-family: 'Orbitron', sans-serif; }
.font-mono { font-family: 'Fira Code', monospace; }
.tracking-wide { letter-spacing: 2px; }

/* PANEL STYLES */
.bg-cyber-glass {
    background: #0a0a0a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.bg-glass-dark {
    background: #080808;
}

/* COLORS - Updated to Stealth Mode */
.text-gold-subtle { color: #8a7e58 !important; }
.lh-12 { line-height: 1.2; }

/* BORDERS - Invisible mostly */
.border-subtle { border: 1px solid rgba(255, 255, 255, 0.05); }
.border-bottom-subtle { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.border-top-subtle { border-top: 1px solid rgba(255, 255, 255, 0.05); }

/* HEADER ELEMENTS */
.icon-box {
    width: 64px; height: 64px;
    background: #0e0e0e;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}
.status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #333;
}
.status-dot.online { background: #8a7e58; box-shadow: 0 0 4px rgba(138, 126, 88, 0.5); }

/* FORM STYLING */
.label-text {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: #666;
    display: block;
    letter-spacing: 1px;
}
.input-wrapper {
    background: #050505;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    transition: all 0.3s;
    padding: 4px 0;
}
.input-wrapper.focused {
    border-color: rgba(138, 126, 88, 0.3);
    background: #080808;
}
.cyber-input :deep(input) {
    color: #ccc !important;
    font-size: 0.9rem;
}

/* QUANTIZATION GRID */
.quant-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quant-card { border: 1px solid rgba(255,255,255,0.05); background: #080808; }
.quant-card:hover { border-color: rgba(138, 126, 88, 0.2); background: #0c0c0c; }
.quant-card.active {
    border-color: rgba(138, 126, 88, 0.3);
    background: rgba(138, 126, 88, 0.05);
}

/* BUTTONS */
.forge-btn {
    border-radius: 4px;
    letter-spacing: 2px;
    transition: all 0.3s;
}
.forge-btn:hover {
    background-color: rgba(138, 126, 88, 0.2) !important;
}

/* VISUALIZATION NODES */
.process-node { width: 120px; transition: all 0.5s; }
.process-node.active { opacity: 1; transform: scale(1.02); }
.node-icon { width: 60px; height: 60px; margin: 0 auto; transition: all 0.5s; }
.center-node .node-icon { width: 80px; height: 80px; }

.connection-line { height: 1px; align-self: center; margin-bottom: 24px; }
.line-bg { width: 100%; height: 100%; background: #222; }
.line-progress {
    position: absolute; top: 0; left: 0; height: 100%; width: 0%;
    background: #8a7e58;
}
.line-progress.animating {
    width: 100%;
    transition: width 2s ease-in-out infinite;
}
.line-progress.delay-1 { animation-delay: 1s; }

.grid-bg {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.1;
}

/* TERMINAL */
.terminal-card { box-shadow: 0 -5px 20px rgba(0,0,0,0.5); }
.window-dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.5; }
.window-dot.red { background: #ff5f56; }
.window-dot.yellow { background: #ffbd2e; }
.window-dot.green { background: #27c93f; }

.scanlines {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 2px,
        rgba(0, 0, 0, 0.3) 3px
    );
    pointer-events: none;
    opacity: 0.3;
}

/* ANIMATIONS */
.spin { animation: spin 1s linear infinite; }
.spin-slow { animation: spin 3s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.blink { animation: blinker 1s linear infinite; }
@keyframes blinker { 50% { opacity: 0; } }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* HOLOGRAPHIC */
.hologram-panel .scan-bar {
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: rgba(138, 126, 88, 0.3);
    animation: scanDown 4s linear infinite;
    opacity: 0.2;
}
@keyframes scanDown {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
}

.absolute-center-text {
    position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
    white-space: nowrap;
}

/* SCROLLBAR */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
.gap-4 { gap: 16px; }
</style>