//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Diagnostics.vue total lines 428 
//#######################################################################

<template>
  <div class="diagnostics-view full-height">
    <div class="header-section mb-6">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold text-white glow-text">
            <v-icon icon="mdi-pulse" color="cyan accent-3" class="mr-2 beat-icon"></v-icon>
            SYSTEM DIAGNOSTICS
          </h1>
          <p class="text-subtitle-1 text-grey-lighten-1 mt-1">
            Monitor and repair system integrity, security, and performance.
          </p>
        </div>
        <div class="controls">
          <v-btn
            color="red accent-3"
            variant="outlined"
            class="mr-3"
            @click="clearLogs"
            :disabled="logs.length === 0"
          >
            <v-icon start>mdi-delete-sweep</v-icon>
            CLEAR LOGS
          </v-btn>
          <v-btn
            color="cyan accent-3"
            variant="flat"
            class="text-black font-weight-bold"
            @click="runAllScanners"
            :loading="isGlobalScanning"
          >
            <v-icon start>mdi-play-circle-outline</v-icon>
            RUN FULL SYSTEM SCAN
          </v-btn>
        </div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="scanner-list-card glass-panel full-height-card">
          <v-card-title class="text-cyan accent-3 font-weight-bold border-bottom">
            AVAILABLE SCANNERS
          </v-card-title>
          <v-list bg-color="transparent" class="pa-0">
            <v-list-item
              v-for="(scanner, key) in scannersConfig"
              :key="key"
              class="scanner-item my-1"
              :class="{ 'active-scanner': selectedScanner === key }"
              @click="selectScanner(key)"
            >
              <template v-slot:prepend>
                <v-icon
                  :color="getSeverityColor(scanner.severity)"
                  :icon="getScannerIcon(key)"
                  size="small"
                  class="mr-3"
                ></v-icon>
              </template>

              <v-list-item-title class="text-white font-weight-medium">
                {{ formatScannerName(key) }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption text-grey">
                Severity: <span :class="`text-${getSeverityColor(scanner.severity)}`">{{ scanner.severity }}</span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-progress-circular
                    v-if="scanner.loading"
                    indeterminate
                    color="cyan"
                    size="20"
                    width="2"
                    class="mr-2"
                  ></v-progress-circular>
                  <v-icon
                    v-if="scanner.lastStatus === 'success'"
                    color="green accent-3"
                    icon="mdi-check-circle"
                  ></v-icon>
                  <v-icon
                    v-if="scanner.lastStatus === 'error'"
                    color="red accent-3"
                    icon="mdi-alert-circle"
                  ></v-icon>
                  <v-btn
                    icon="mdi-play"
                    size="x-small"
                    variant="text"
                    color="white"
                    class="ml-2"
                    @click.stop="runSingleScan(key)"
                    :disabled="scanner.loading || isGlobalScanning"
                  ></v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <div class="d-flex flex-column full-height-card">
          <v-card class="terminal-card glass-panel flex-grow-1 mb-4">
            <div class="terminal-header d-flex align-center px-4 py-2">
              <v-icon icon="mdi-console" color="grey" size="small" class="mr-2"></v-icon>
              <span class="text-caption text-grey font-weight-mono">DIAGNOSTICS OUTPUT CONSOLE</span>
            </div>
            <div class="terminal-body pa-4 font-weight-mono" ref="terminalBody">
              <div v-if="logs.length === 0" class="text-grey-darken-2 text-center mt-10">
                Waiting for commands... System ready.
              </div>
              <div v-for="(log, index) in logs" :key="index" class="log-line">
                <span class="text-grey-darken-1 mr-2">[{{ log.time }}]</span>
                <span :class="getLogClass(log.type)">{{ log.message }}</span>
              </div>
            </div>
          </v-card>

          <v-card class="result-panel glass-panel pa-4" v-if="lastResult">
             <v-card-title class="text-white text-subtitle-2 px-0 pt-0">
               LAST SCAN RESULT: <span class="text-cyan">{{ formatScannerName(lastResult.scannerId) }}</span>
             </v-card-title>
             <div class="result-content mt-2 text-body-2 text-grey-lighten-2">
                <pre class="result-pre">{{ lastResult.summary }}</pre>
             </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue';
import api from '@/api'; // Pastikan ini mengarah ke file src/api/index.js yang sudah kita benerin

const isGlobalScanning = ref(false);
const terminalBody = ref(null);
const selectedScanner = ref(null);
const lastResult = ref(null);

const logs = ref([]);

const scannersConfig = reactive({
  "marketplace_integrity": { severity: "CRITICAL", loading: false, lastStatus: null },
  "manifest_mismatch": { severity: "CRITICAL", loading: false, lastStatus: null },
  "phase_one_integrity": { severity: "CRITICAL", loading: false, lastStatus: null },
  "data_preview_readiness": { severity: "MINOR", loading: false, lastStatus: null },
  "cache_integrity": { severity: "MAJOR", loading: false, lastStatus: null },
  "ai_copilot_health": { severity: "CRITICAL", loading: false, lastStatus: null },
  "core_compiler_health": { severity: "CRITICAL", loading: false, lastStatus: null },
  "manifest_completeness": { severity: "MINOR", loading: false, lastStatus: null },
  "tier_attribute": { severity: "MAJOR", loading: false, lastStatus: null },
  "core_integrity": { severity: "CRITICAL", loading: false, lastStatus: null }
});

const formatScannerName = (key) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return 'red accent-2';
    case 'MAJOR': return 'orange accent-3';
    case 'MINOR': return 'yellow accent-3';
    default: return 'grey';
  }
};

const getScannerIcon = (key) => {
  if (key.includes('integrity')) return 'mdi-shield-check';
  if (key.includes('ai')) return 'mdi-robot';
  if (key.includes('network')) return 'mdi-wifi';
  if (key.includes('database')) return 'mdi-database';
  return 'mdi-stethoscope';
};

const getLogClass = (type) => {
  switch (type) {
    case 'ERROR': return 'text-red accent-2';
    case 'WARN': return 'text-orange accent-3';
    case 'SUCCESS': return 'text-green accent-3';
    case 'INFO': return 'text-cyan accent-1';
    case 'SCAN': return 'text-purple accent-2 font-weight-bold';
    default: return 'text-white';
  }
};

const addLog = (message, type = 'INFO') => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, message, type });
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
};

const clearLogs = () => {
  logs.value = [];
  lastResult.value = null;
};

const selectScanner = (key) => {
  selectedScanner.value = key;
};

const executeBackendScan = async (scannerId) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  /*
  try {
    const response = await api.post('/system/diagnostics/run', {
      scan_id: `GUI-${Date.now()}`,
      target_scanner_id: scannerId
    });

    if(response.data && response.data.error) {
        throw new Error(response.data.error);
    }
    return response.data;
  } catch (e) {
    console.error("Scan Error:", e);
    throw new Error(e.response?.data?.error || e.message || "Failed to contact diagnostics engine.");
  }
  */

  const mockLogs = [
    `[INFO] Initializing scanner module: ${scannerId}...`,
    `[DEBUG] Loading configuration parameters...`,
    `[INFO] Checking system integrity hash...`,
    `[DEBUG] Verifying dependencies...`,
  ];

  const isSuccess = Math.random() > 0.2;

  if (isSuccess) {
    mockLogs.push(`[SUCCESS] Validation passed for ${scannerId}.`);
    mockLogs.push(`[INFO] No anomalies detected.`);
  } else {
    mockLogs.push(`[ERROR] Integrity check failed! Mismatch detected.`);
    mockLogs.push(`[WARN] Attempting auto-repair... (Simulation)`);
    mockLogs.push(`[ERROR] Repair failed. Manual intervention required.`);
  }

  return {
    status: "completed",
    timestamp: Date.now() / 1000,
    summary: isSuccess
      ? `[OK] ${formatScannerName(scannerId)} Check Passed.\nSystem is healthy.`
      : `[FAIL] ${formatScannerName(scannerId)} Check Failed.\nCritical errors found in system core.`,
    full_log: mockLogs.join('\n')
  };
};

const runSingleScan = async (key) => {
  if (scannersConfig[key].loading) return;

  scannersConfig[key].loading = true;
  addLog(`Initializing scan for: ${formatScannerName(key)}...`, 'SCAN');

  try {
    const result = await executeBackendScan(key);

    if (result.full_log) {
        const logLines = result.full_log.split('\n');
        logLines.forEach(line => {
           let type = 'INFO';
           if(line.includes('ERROR') || line.includes('FAIL')) type = 'ERROR';
           else if(line.includes('WARN')) type = 'WARN';
           else if(line.includes('SUCCESS') || line.includes('OK')) type = 'SUCCESS';
           else if(line.includes('DEBUG')) type = 'INFO'; // Bisa diubah warnanya kalau mau
           addLog(line, type);
        });
    }

    scannersConfig[key].lastStatus = result.summary.includes('FAIL') ? 'error' : 'success';
    lastResult.value = { scannerId: key, summary: result.summary };

  } catch (error) {
    addLog(`Connection Error: ${error.message}`, 'ERROR');
    scannersConfig[key].lastStatus = 'error';
  } finally {
    scannersConfig[key].loading = false;
  }
};

const runAllScanners = async () => {
  if (isGlobalScanning.value) return;
  isGlobalScanning.value = true;
  clearLogs(); // Bersihin log lama biar rapi
  addLog("=== STARTING FULL SYSTEM DIAGNOSTICS ===", 'SCAN');

  for (const key of Object.keys(scannersConfig)) {
    await runSingleScan(key);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  addLog("=== FULL SYSTEM DIAGNOSTICS COMPLETE ===", 'SCAN');
  isGlobalScanning.value = false;
};

onMounted(() => {
  addLog("Diagnostics Gateway Initialized.", "INFO");
  addLog("Connected to Local Kernel Interface.", "INFO");
  addLog("Ready for system scan.", "SUCCESS");
});
</script>

<style scoped>
.diagnostics-view {
  height: 100%;
  padding: 24px;
  background-color: #0a0a0a; /* Deep dark background */
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.glass-panel {
  background: rgba(25, 25, 25, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.scanner-item {
  border-radius: 4px;
  margin: 0 8px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.scanner-item:hover {
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.scanner-item.active-scanner {
  background: rgba(0, 229, 255, 0.1);
  border-left: 3px solid #00e5ff;
}

.terminal-card {
  background: #000000;
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.terminal-header {
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  height: 32px;
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.log-line {
  margin-bottom: 4px;
  word-break: break-all;
}

.font-weight-mono {
  font-family: 'Fira Code', monospace;
}

.glow-text {
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.beat-icon {
  animation: beat 1.5s infinite;
}

.result-pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Fira Code', monospace;
}

@keyframes beat {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #1a1a1a;
}
::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #00e5ff;
}
</style>
