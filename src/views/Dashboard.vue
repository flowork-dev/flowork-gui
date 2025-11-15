<template>
  <div class="dashboard-page">
    <v-container fluid class="dashboard-container">
      <div v-if="isInitialLoading" class="d-flex justify-center align-center fill-height">
        <v-progress-circular indeterminate color="cyan" size="64"></v-progress-circular>
      </div>
      <div v-else-if="error" class="text-center text-error">
        <p>Failed to load dashboard data: {{ error }}</p>
      </div>

      <v-row v-else dense>
        <v-col cols="12" md="3" class="d-flex flex-column" style="gap: 16px;">
          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-account-circle-outline</v-icon>User Profile</v-card-title> <v-list density="compact" bg-color="transparent">
                <v-list-item :title="authStore.user?.username || 'N/A'" subtitle="Username"> <template v-slot:append>
                    <v-tooltip text="Copy Public Address" location="top"> <template v-slot:activator="{ props: tooltipProps }">
                        <v-btn v-bind="tooltipProps" icon="mdi-content-copy" variant="text" size="x-small" @click="copyPublicAddress"></v-btn>
                      </template>
                    </v-tooltip>
                  </template>
                </v-list-item>
                </v-list>
          </v-card>
          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-chip</v-icon>System Overview</v-card-title> <v-list density="compact" bg-color="transparent">
                <v-list-item :title="summary.system_overview?.kernel_version || 'N/A'" subtitle="Kernel Version"></v-list-item> <v-list-item :title="String(summary.system_overview?.modules ?? 'N/A')" subtitle="Modules"></v-list-item> <v-list-item :title="String(summary.system_overview?.plugins ?? 'N/A')" subtitle="Plugins"></v-list-item> <v-list-item :title="String(summary.system_overview?.triggers ?? 'N/A')" subtitle="Triggers"></v-list-item> </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" class="d-flex flex-column" style="gap: 16px;">
          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-chart-bar</v-icon>Executions (Last 24h)</v-card-title>
            <v-card-text>
              <div style="height: 250px;">
                <Bar v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="empty-chart">
                  <v-icon icon="mdi-chart-gantt" size="48" color="grey-darken-2"></v-icon>
                  <p class="mt-2 text-caption">No execution data recorded in the last 24 hours.</p>
                </div>
              </div>
              </v-card-text>
          </v-card>

          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-play-box-multiple</v-icon>Active Jobs</v-card-title> <v-card-text class="pa-0">
              <div v-if="!summary.active_jobs || summary.active_jobs.length === 0" class="text-center text-grey py-4">
                <p class="text-caption">No workflows are currently running.</p> </div>
              <v-table v-else density="compact" class="bg-transparent">
                <thead>
                  <tr>
                    <th class="text-left">Preset</th> <th class="text-left">Duration</th> <th class="text-right">Actions</th> </tr>
                </thead>
                <tbody>
                  <tr v-for="job in summary.active_jobs" :key="job.id">
                    <td class="text-truncate" :title="job.preset">{{ job.preset }}</td>
                    <td>{{ job.duration_seconds.toFixed(1) }}s</td>
                    <td class="text-right">
                      <v-btn
                        icon="mdi-stop-circle-outline"
                        color="error"
                        variant="text"
                        size="x-small"
                        @click="workflowStore.stopJobById(job.id)"
                        title="Stop Job" ></v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3" class="d-flex flex-column" style="gap: 16px;">
          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-server-network</v-icon>Engine Status</v-card-title> <v-card-text>
              <div v-if="!engines.length && !isLoadingEngines" class="text-center text-grey py-4">
                No engines registered. <router-link to="/my-engines">Add one now</router-link>. </div>
              <v-skeleton-loader v-if="isLoadingEngines && !engines.length" type="list-item-avatar-two-line@3"></v-skeleton-loader>
              <div v-else>
                <div v-for="engine in engines" :key="engine.id" class="engine-status-item">
                  <div class="d-flex align-center">
                    <v-icon :color="getEngineStatusColor(engine.status)" icon="mdi-server" class="mr-3"></v-icon>
                    <div>
                      <div
                        class="font-weight-bold"
                        :class="{ 'default-dev-engine-name': engine.name === 'Default Dev Engine' }"
                      >
                        {{ engine.name }}
                        <span v-if="!engine.isOwner" class="text-caption text-grey ml-1">(Shared)</span>
                      </div>
                      <div class="text-caption" :class="engine.status === 'online' ? 'text-green-accent-4' : 'text-grey-darken-1'">
                        {{ engine.status.toUpperCase() }} <span v-if="engine.vitals"> - v{{ engine.vitals.kernel_version }}</span>
                      </div>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn :color="selectedEngineId === engine.id ? 'cyan' : 'grey'" size="x-small" :variant="selectedEngineId === engine.id ? 'flat' : 'outlined'" @click="engineStore.setSelectedEngineId(engine.id)" :disabled="engine.status !== 'online'">
                      {{ selectedEngineId === engine.id ? 'Active' : 'Set Active' }} </v-btn>
                  </div>
                  <div v-if="engine.status === 'online' && engine.vitals" class="vitals-grid mt-2">
                    <div class="text-caption">CPU: {{ engine.vitals.cpu_percent.toFixed(1) }}%</div>
                    <v-progress-linear :model-value="engine.vitals.cpu_percent" color="cyan" height="6" rounded></v-progress-linear>
                    <div class="text-caption">RAM: {{ engine.vitals.ram_percent.toFixed(1) }}%</div>
                    <v-progress-linear :model-value="engine.vitals.ram_percent" color="purple-accent-2" height="6" rounded></v-progress-linear>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="dashboard-card" variant="flat">
            <v-card-title class="card-title"><v-icon start>mdi-rocket-launch-outline</v-icon>Quick Run</v-card-title> <v-card-text>
              <div v-if="favoritePresets.length === 0" class="text-center text-grey">
                <v-icon>mdi-star-cog-outline</v-icon>
                <p class="mt-2 text-caption">Go to the Designer, load a preset, and click the star icon in the preset dropdown to add a Quick Run shortcut here.</p> </div>
              <div v-else class="quick-run-grid">
                <v-btn
                  v-for="presetName in favoritePresets"
                  :key="presetName"
                  @click="workflowStore.executePresetByName(presetName)"
                  variant="tonal"
                  color="cyan"
                  class="quick-run-btn"
                  :disabled="isExecuting || !isEngineOnline"
                >
                  <v-icon start>mdi-play-circle-outline</v-icon>
                  {{ presetName }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="dashboard-card" variant="flat">
             <v-card-title class="card-title"><v-icon start>mdi-alert-decagram-outline</v-icon>Performance Hotspots</v-card-title>
             <div v-if="summary.top_failing_presets.length === 0 && summary.top_slowest_presets.length === 0" class="text-center text-grey py-4">
                 <p class="text-caption">No performance data recorded in the last 24h.</p>
             </div>
             <v-list v-else dense density="compact" bg-color="transparent" class="pt-0">
                  <v-list-subheader>Top Failing</v-list-subheader>
                  <v-list-item v-for="item in summary.top_failing_presets" :key="item.name" :title="item.name">
                      <template v-slot:append>
                          <v-chip color="error" size="x-small" label>{{ item.count }} failed</v-chip>
                      </template>
                  </v-list-item>

                  <v-list-subheader class="mt-2">Top Slowest (Avg.)</v-list-subheader>
                   <v-list-item v-for="item in summary.top_slowest_presets" :key="item.name" :title="item.name">
                      <template v-slot:append>
                          <v-chip color="warning" size="x-small" label>{{ item.avg_duration_ms.toFixed(0) }} ms</v-chip>
                      </template>
                  </v-list-item>
              </v-list>
             </v-card>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { useDashboardStore } from '@/store/dashboard';
import { useEngineStore } from '@/store/engines';
import { useWorkflowStore } from '@/store/workflow';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

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
  uiStore.showNotification({ text: 'Public Address copied to clipboard!', color: 'success' });
}

const chartData = computed(() => {
    const ts = summary.value.execution_stats_24h;
    let labels = ['Success', 'Failed'];
    let data = [ts?.success || 0, ts?.failed || 0];

    return {
        labels: labels,
        datasets: [{
            label: 'Executions',
            backgroundColor: ['#39ff14', '#ff5252'],
            data: data,
            borderRadius: 4,
        }]
    }
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { ticks: { color: '#9E9E9E' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
        y: { ticks: { color: '#9E9E9E', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
    }
};

function getEngineStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'green-accent-4';
        case 'offline': return 'grey';
        case 'connecting': return 'info';
        case 'error': return 'error';
        default: return 'grey-darken-1';
    }
}
function getEngineStatusIcon(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'mdi-server-network';
        case 'offline': return 'mdi-server-network-off';
        case 'connecting': return 'mdi-lan-pending';
        case 'error': return 'mdi-server-network-off-outline';
        default: return 'mdi-help-circle-outline';
    }
}

onMounted(() => {
  dashboardStore.fetchDashboardSummary(false);
  refreshInterval = setInterval(() => {
    if (authStore.isAuthenticated) {
        dashboardStore.fetchDashboardSummary(true);
    }
  }, 10000);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>

<style scoped>
.dashboard-page {
  /* Hapus overflow: hidden agar bisa scroll */
  height: 100%;
  padding: 16px;
  position: relative;
  z-index: 1;
}
.dashboard-container {
    position: relative;
    z-index: 2;
    height: 100%;
    /* (PERBAIKAN KUNCI) Hapus scrollbar agar v-main yang handle */
    /* overflow-y: auto; */
}
/* Hapus semua style scrollbar di sini */
/* .dashboard-container::-webkit-scrollbar {} */
/* .dashboard-container::-webkit-scrollbar-track {} */
/* .dashboard-container::-webkit-scrollbar-thumb {} */
/* .dashboard-container::-webkit-scrollbar-thumb:hover {} */

.dashboard-card {
  background: rgba(30, 30, 47, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: card-border-glow 4s infinite alternate;
  color: var(--text-primary);
}

@keyframes card-border-glow {
  from {
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 245, 255, 0.1);
  }
  to {
    border-color: rgba(191, 0, 255, 0.2);
    box-shadow: 0 0 30px rgba(191, 0, 255, 0.15);
  }
}

.card-title {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  font-weight: 500;
  color: var(--neon-cyan);
}
.engine-status-item {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.engine-status-item:last-child {
    border-bottom: none;
}
.engine-status-item .text-caption {
    color: var(--text-secondary);
}
.vitals-grid {
    display: grid;
    grid-template-columns: 50px 1fr;
    gap: 4px 8px;
    align-items: center;
    padding-left: 40px;
}
.vitals-grid .text-caption {
    color: var(--text-secondary);
}
.activity-item :deep(.v-list-item-subtitle) {
    font-size: 0.7rem !important;
}
.activity-item :deep(.v-list-item-title) {
    font-size: 0.8rem !important;
    white-space: normal;
}
.empty-chart {
    min-height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
}
.text-empty {
    color: var(--text-secondary) !important;
}
.text-empty a {
    color: var(--neon-cyan);
    text-decoration: none;
}
.text-empty a:hover {
    text-decoration: underline;
}
.quick-run-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
}
.quick-run-btn {
    justify-content: start;
    text-transform: none;
    font-weight: 500;
}
.dashboard-card :deep(.v-table th) {
  color: var(--text-primary) !important;
  font-weight: bold;
}
.dashboard-card :deep(.v-table td) {
  color: var(--text-secondary) !important;
}
.dashboard-card :deep(.v-list-item-title) {
    color: var(--text-primary);
}
.dashboard-card :deep(.v-list-item-subtitle) {
    color: var(--text-secondary);
}
.dashboard-card :deep(.v-list-subheader) {
    color: var(--neon-cyan);
}
.orbitron-font {
    font-family: 'Orbitron', monospace;
}
.dashboard-card :deep(.v-list-item__append) {
    align-self: center;
}

.default-dev-engine-name {
    color: #FFEB3B !important;
    font-weight: bold;
}
</style>
