//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\Dashboard.vue
//#######################################################################

<template>
  <div class="dashboard-page">
    <NeuralCanvasBackground />
    <div class="scanner-overlay"></div>

    <v-container fluid class="dashboard-container custom-scrollbar">
      <div class="hud-header d-flex align-center justify-space-between mb-6 pa-4">
        <div>
          <div class="text-h4 font-weight-light text-white orbitron-font">
            COMMAND <span class="text-amber-darken-1 font-weight-bold">CENTER</span>
          </div>
          <div class="text-caption font-mono text-grey mt-1">
            >> SYSTEM STATUS: <span class="text-green-accent-3">ONLINE</span>
          </div>
        </div>
        <div class="d-flex align-center gap-3">
           <v-chip color="grey-darken-1" variant="outlined" class="font-mono" size="small">
              <v-icon start icon="mdi-clock-outline" size="small" color="amber-darken-1"></v-icon>
              <span class="text-grey-lighten-2">{{ new Date().toLocaleTimeString() }}</span>
           </v-chip>
        </div>
      </div>

      <div v-if="isInitialLoading" class="d-flex justify-center align-center fill-height" style="min-height: 400px;">
        <div class="text-center">
           <v-progress-circular indeterminate color="amber-darken-3" size="48" class="mb-4"></v-progress-circular>
           <div class="text-caption font-mono text-grey blink">INITIALIZING...</div>
        </div>
      </div>

      <div v-else-if="error" class="text-center text-error border-subtle-gold pa-6 rounded-lg bg-black-transparent">
        <v-icon icon="mdi-alert-decagram" size="48" color="red-darken-2" class="mb-2"></v-icon>
        <p class="font-mono text-red-lighten-2">CRITICAL ERROR: {{ error }}</p>
      </div>

      <v-row v-else dense>

        <v-col cols="12" md="3" class="d-flex flex-column gap-4">

          <v-card class="cyber-card" variant="flat">
            <div class="card-header border-bottom-subtle">
              <v-icon color="amber-darken-3" start size="small">mdi-account-circle</v-icon>
              <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">OPERATOR_PROFILE</span>
            </div>
            <div class="pa-4">
               <div class="d-flex align-center mb-3">
                  <v-avatar color="#1a1a1a" rounded="0" class="mr-3 border-subtle">
                     <span class="text-h6 font-weight-bold text-amber-darken-3">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <div class="overflow-hidden">
                     <div class="text-subtitle-2 font-weight-bold text-white text-truncate">{{ authStore.user?.username || 'GHOST_USER' }}</div>
                     <div class="text-caption text-grey-darken-1 font-mono" style="font-size: 0.7rem;">ARCHITECT</div>
                  </div>
               </div>
               <v-btn block variant="tonal" color="grey-darken-3" size="small" class="font-mono text-grey-lighten-1" @click="copyPublicAddress">
                  <v-icon start icon="mdi-fingerprint" size="small"></v-icon> COPY ID
               </v-btn>
            </div>
          </v-card>

          <v-card class="cyber-card" variant="flat">
            <div class="card-header border-bottom-subtle">
              <v-icon color="amber-darken-3" start size="small">mdi-memory</v-icon>
              <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">SYSTEM_SPECS</span>
            </div>
            <v-list density="compact" bg-color="transparent" class="pa-0 font-mono text-caption">
                <v-list-item>
                   <template v-slot:prepend><v-icon color="grey-darken-3" size="x-small" icon="mdi-chevron-right"></v-icon></template>
                   <span class="text-grey-darken-1">KERNEL:</span>
                   <template v-slot:append><span class="text-grey-lighten-1">{{ summary.system_overview?.kernel_version || 'UNKNOWN' }}</span></template>
                </v-list-item>
                <v-list-item>
                   <template v-slot:prepend><v-icon color="grey-darken-3" size="x-small" icon="mdi-chevron-right"></v-icon></template>
                   <span class="text-grey-darken-1">MODULES:</span>
                   <template v-slot:append><span class="text-amber-lighten-4">{{ summary.system_overview?.modules || 0 }}</span></template>
                </v-list-item>
                <v-list-item>
                   <template v-slot:prepend><v-icon color="grey-darken-3" size="x-small" icon="mdi-chevron-right"></v-icon></template>
                   <span class="text-grey-darken-1">PLUGINS:</span>
                   <template v-slot:append><span class="text-amber-lighten-4">{{ summary.system_overview?.plugins || 0 }}</span></template>
                </v-list-item>
            </v-list>
          </v-card>

        </v-col>

        <v-col cols="12" md="6" class="d-flex flex-column gap-4">

          <v-card class="cyber-card" variant="flat">
            <div class="card-header border-bottom-subtle d-flex justify-space-between">
               <div>
                  <v-icon color="amber-darken-3" start size="small">mdi-chart-bar</v-icon>
                  <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">EXECUTION_METRICS (24H)</span>
               </div>
               <div class="d-flex gap-2 align-center">
                  <div class="status-dot"></div>
                  <span class="text-caption font-mono text-grey-darken-1">LIVE</span>
               </div>
            </div>
            <v-card-text class="pa-4 bg-grid-pattern">
              <div style="height: 220px; position: relative;">
                <Bar v-if="chartData && chartData.datasets && chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="empty-chart">
                  <v-icon icon="mdi-chart-line-variant" size="48" color="grey-darken-3"></v-icon>
                  <p class="mt-2 text-caption font-mono text-grey-darken-2">NO DATA STREAM</p>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="cyber-card flex-grow-1" variant="flat" style="min-height: 250px;">
            <div class="card-header border-bottom-subtle">
              <v-icon color="amber-darken-3" start size="small">mdi-console-line</v-icon>
              <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">ACTIVE_PROCESSES</span>
            </div>
            <v-card-text class="pa-0">
              <div v-if="!summary.active_jobs || summary.active_jobs.length === 0" class="d-flex flex-column align-center justify-center py-8 text-grey">
                <v-icon icon="mdi-sleep" size="24" class="mb-2 opacity-30"></v-icon>
                <p class="text-caption font-mono text-grey-darken-2">SYSTEM IDLE</p>
              </div>

              <v-table v-else density="compact" class="bg-transparent terminal-table font-mono">
                <thead>
                  <tr>
                    <th class="text-left text-grey-darken-1">PID / PRESET</th>
                    <th class="text-left text-grey-darken-1">TIME</th>
                    <th class="text-right text-grey-darken-1">ACT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="job in summary.active_jobs" :key="job.id" class="terminal-row">
                    <td class="text-truncate" style="max-width: 150px;">
                        <span class="text-amber-darken-3">> </span> {{ job.preset }}
                    </td>
                    <td class="text-grey-lighten-1">{{ job.duration_seconds.toFixed(1) }}s</td>
                    <td class="text-right">
                      <v-btn
                        icon="mdi-close"
                        color="red-darken-3"
                        variant="text"
                        size="x-small"
                        @click="workflowStore.stopJobById(job.id)"
                        title="KILL PROCESS" ></v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

        </v-col>

        <v-col cols="12" md="3" class="d-flex flex-column gap-4">

          <v-card class="cyber-card" variant="flat">
            <div class="card-header border-bottom-subtle">
              <v-icon color="amber-darken-3" start size="small">mdi-server-network</v-icon>
              <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">ENGINE_CORE</span>
            </div>
            <v-card-text class="pa-3">
              <div v-if="!engines.length && !isLoadingEngines" class="text-center text-grey py-4 font-mono text-caption">
                NO CORES <br> <router-link to="/my-engines" class="text-amber-darken-3 text-decoration-none">DEPLOY NEW</router-link>
              </div>

              <v-skeleton-loader v-if="isLoadingEngines && !engines.length" type="list-item-avatar-two-line" bg-color="transparent"></v-skeleton-loader>

              <div v-else class="engine-list custom-scrollbar" style="max-height: 250px; overflow-y: auto;">
                <div v-for="engine in engines" :key="engine.id" class="engine-unit mb-2 pa-2 rounded border-thin" :class="{'active-engine': selectedEngineId === engine.id}">

                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center">
                        <div v-if="selectedEngineId === engine.id" class="status-dot-active mr-2"></div>
                        <v-icon v-else :color="getEngineStatusColor(engine.status)" icon="mdi-server" size="small" class="mr-2 opacity-50"></v-icon>

                        <div class="font-mono lh-1">
                            <div class="text-caption font-weight-bold text-white text-truncate" style="max-width: 100px;">{{ engine.name }}</div>
                            <div class="text-caption" style="font-size: 0.65rem;" :class="engine.status === 'online' ? 'text-amber-darken-1' : 'text-grey-darken-1'">
                                {{ engine.status?.toUpperCase() || 'OFFLINE' }}
                            </div>
                        </div>
                    </div>

                    <v-btn
                        :color="selectedEngineId === engine.id ? 'amber-darken-4' : 'grey-darken-3'"
                        size="x-small"
                        variant="tonal"
                        class="font-weight-medium"
                        @click="engineStore.setSelectedEngineId(engine.id)"
                        :disabled="engine.status !== 'online'"
                    >
                        {{ selectedEngineId === engine.id ? 'LINKED' : 'LINK' }}
                    </v-btn>
                  </div>

                  <div v-if="engine.status === 'online' && engine.vitals" class="vitals-micro-grid">
                    <div class="d-flex align-center justify-space-between text-caption text-grey-darken-1" style="font-size: 0.6rem;">
                        <span>CPU</span>
                        <span>{{ (engine.vitals.cpu_percent || 0).toFixed(0) }}%</span>
                    </div>
                    <v-progress-linear :model-value="engine.vitals.cpu_percent || 0" color="amber-darken-1" height="2" class="mb-1 bg-grey-darken-3"></v-progress-linear>

                    <div class="d-flex align-center justify-space-between text-caption text-grey-darken-1" style="font-size: 0.6rem;">
                        <span>RAM</span>
                        <span>{{ (engine.vitals.ram_percent || 0).toFixed(0) }}%</span>
                    </div>
                    <v-progress-linear :model-value="engine.vitals.ram_percent || 0" color="amber-darken-3" height="2" class="bg-grey-darken-3"></v-progress-linear>
                  </div>

                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="cyber-card" variant="flat">
            <div class="card-header border-bottom-subtle">
              <v-icon color="grey-lighten-1" start size="small">mdi-rocket-launch-outline</v-icon>
              <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">QUICK_RUN</span>
            </div>
            <v-card-text class="pa-3">
              <div v-if="favoritePresets.length === 0" class="text-center text-grey font-mono text-caption py-2 opacity-50">
                NO SHORTCUTS
              </div>
              <div v-else class="d-flex flex-column gap-2">
                <v-btn
                  v-for="presetName in favoritePresets"
                  :key="presetName"
                  @click="workflowStore.executePresetByName(presetName)"
                  variant="outlined"
                  color="amber-darken-1"
                  block
                  size="small"
                  class="hacker-btn-outline justify-start px-2 text-grey-lighten-1"
                  :disabled="isExecuting || !isEngineOnline"
                >
                  <v-icon start size="small" class="mr-2">mdi-play</v-icon>
                  <span class="text-truncate">{{ presetName }}</span>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="cyber-card" variant="flat">
             <div class="card-header border-bottom-subtle">
                <v-icon color="red-darken-2" start size="small">mdi-alert-circle-outline</v-icon>
                <span class="text-caption font-weight-bold font-mono text-grey-lighten-1">BOTTLENECKS</span>
             </div>
             <div class="pa-3 custom-scrollbar" style="max-height: 150px; overflow-y: auto;">
                 <div v-if="(!summary.top_failing_presets || summary.top_failing_presets.length === 0) && (!summary.top_slowest_presets || summary.top_slowest_presets.length === 0)" class="text-center text-grey-darken-2 font-mono text-caption">
                     OPTIMAL
                 </div>
                 <div v-else class="font-mono">
                      <div v-for="item in summary.top_failing_presets" :key="'fail-'+item.name" class="d-flex justify-space-between align-center mb-1 text-caption">
                          <span class="text-red-lighten-1 text-truncate" style="max-width: 70%;">{{ item.name }}</span>
                          <span class="text-red-darken-1 font-weight-bold">{{ item.count }} X</span>
                      </div>
                      <div v-for="item in summary.top_slowest_presets" :key="'slow-'+item.name" class="d-flex justify-space-between align-center mb-1 text-caption">
                          <span class="text-amber-lighten-1 text-truncate" style="max-width: 70%;">{{ item.name }}</span>
                          <span class="text-amber-darken-1">{{ item.avg_duration_ms.toFixed(0) }}ms</span>
                      </div>
                 </div>
             </div>
          </v-card>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, watch } from 'vue';
import { useDashboardStore } from '@/store/dashboard';
import { useEngineStore } from '@/store/engines';
import { useWorkflowStore } from '@/store/workflow';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const dashboardStore = useDashboardStore();
const engineStore = useEngineStore();
const workflowStore = useWorkflowStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const { summary, isInitialLoading, error } = storeToRefs(dashboardStore);
const { allAvailableEngines: engines, isLoading: isLoadingEngines, selectedEngineId } = storeToRefs(engineStore);
const { favoritePresets, isExecuting } = storeToRefs(workflowStore);
const isEngineOnline = computed(() => engineStore.hasOnlineEngine);

let refreshInterval = null;

function copyPublicAddress() {
  if (!authStore.user?.id) return;
  navigator.clipboard.writeText(authStore.user.id);
  uiStore.showNotification({ text: 'ID copied.', color: 'grey-darken-3' });
}

// SUBTLE GOLD CHART CONFIG
const chartData = computed(() => {
    const ts = summary.value?.execution_stats_24h || { success: 0, failed: 0 };
    let labels = ['Success', 'Failed'];
    let data = [ts.success || 0, ts.failed || 0];

    return {
        labels: labels,
        datasets: [{
            label: 'Executions',
            // Muted Gold & Red
            backgroundColor: ['rgba(255, 193, 7, 0.4)', 'rgba(211, 47, 47, 0.4)'],
            borderColor: ['#FFC107', '#D32F2F'],
            borderWidth: 1,
            data: data,
            barThickness: 40,
        }]
    }
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: {
            ticks: { color: '#BDBDBD', font: { family: 'Fira Code', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [2, 4] }
        },
        y: {
            ticks: { color: '#BDBDBD', stepSize: 1, font: { family: 'Fira Code', size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
    }
};

function getEngineStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'green-darken-1';
        case 'offline': return 'grey-darken-2';
        case 'connecting': return 'amber-darken-3';
        case 'error': return 'red-darken-3';
        default: return 'grey-darken-1';
    }
}

watch(selectedEngineId, (newId) => {
    if (newId) {
        dashboardStore.fetchDashboardSummary(false, newId);
    }
});

onMounted(async () => {
  if (authStore.isAuthenticated) {
      await engineStore.fetchEngines();
  }
  dashboardStore.fetchDashboardSummary(false, engineStore.selectedEngineId);
  refreshInterval = setInterval(() => {
    if (authStore.isAuthenticated && engineStore.selectedEngineId) {
        dashboardStore.fetchDashboardSummary(true, engineStore.selectedEngineId);
    }
  }, 10000);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap');

.dashboard-page {
  height: 100%;
  padding: 0;
  position: relative;
  z-index: 1;
  background-color: #050505;
}

.scanner-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none; z-index: 0; opacity: 0.5;
}

.dashboard-container {
    position: relative;
    z-index: 2;
    height: 100%;
    overflow-y: auto;
    padding: 16px;
}

/* SUBTLE CARD STYLE */
.cyber-card {
  background: rgba(18, 18, 18, 0.8) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  color: white;
  transition: all 0.2s ease;
  border-radius: 8px;
}
.cyber-card:hover {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(25, 25, 25, 0.9) !important;
}

.card-header {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.02);
}
.border-bottom-subtle { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.border-subtle { border: 1px solid rgba(255, 255, 255, 0.1); }
.border-subtle-gold { border: 1px solid rgba(255, 193, 7, 0.2); }

.bg-grid-pattern {
    background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 20px 20px;
}

.orbitron-font { font-family: 'Orbitron', monospace; }
.font-mono { font-family: 'Fira Code', monospace; }

/* BUTTONS */
.hacker-btn-outline {
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
}
.hacker-btn-outline:hover {
    background: rgba(255, 193, 7, 0.05);
    border-color: rgba(255, 193, 7, 0.3);
}

/* ENGINE UNIT */
.engine-unit { transition: all 0.2s; background: rgba(255,255,255,0.02); border: 1px solid transparent; }
.active-engine {
    border: 1px solid rgba(255, 193, 7, 0.3);
    background: rgba(255, 193, 7, 0.05);
}

.status-dot-active {
    width: 8px; height: 8px; border-radius: 50%; background: #FFC107;
    box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
}
.status-dot { width: 6px; height: 6px; background: #00E676; border-radius: 50%; }

/* TABLE */
.terminal-table th { border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; font-size: 0.7rem; }
.terminal-table td { border-bottom: 1px solid rgba(255, 255, 255, 0.02) !important; font-size: 0.75rem; color: #bbb; }
.terminal-row:hover td { background-color: rgba(255, 255, 255, 0.03); color: #fff; }

.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.border-dashed { border-style: dashed !important; border-color: rgba(255, 255, 255, 0.1) !important; }

/* SCROLLBAR */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>