//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\MyEngines.vue
//#######################################################################

<template>
  <div class="my-engines-page">
    <NeuralCanvasBackground />

    <v-container fluid class="fill-height pa-0">
      <v-row no-gutters class="fill-height">
        <v-col cols="12" class="d-flex flex-column" style="height: 100%; max-height: 100vh; padding: 64px 24px 24px 24px;">

          <v-card class="center-panel-bg border-subtle d-flex flex-column overflow-hidden flex-grow-1 position-relative">

            <div class="hacker-header-large d-flex position-relative" style="z-index: 5; flex-shrink: 0;">
                <div class="header-left d-flex flex-column justify-space-between pa-5 position-relative">
                    <div class="header-info-container">
                        <div class="d-flex align-center mb-2">
                            <v-icon icon="mdi-server-network" color="grey-darken-1" class="mr-3" size="large"></v-icon>
                            <div class="text-h4 font-mono font-weight-black text-white text-truncate" style="letter-spacing: 2px; opacity: 0.9;">
                                ENGINE_FLEET
                            </div>
                        </div>
                        <div class="text-caption font-mono text-grey-darken-1 pl-10">
                            >> MANAGED NODES: {{ ownedEngines.length }} // EXTERNAL LINKS: {{ sharedWithMeEngines.length }}
                        </div>
                    </div>

                    <div class="d-flex align-center pl-10 header-controls">
                        <v-btn
                            color="grey-lighten-1"
                            variant="outlined"
                            @click="openRegisterDialog"
                            prepend-icon="mdi-plus-box"
                            class="stealth-btn font-weight-bold"
                        >
                            REGISTER_NODE
                        </v-btn>
                    </div>
                </div>

                <div class="header-right position-relative overflow-hidden d-flex align-center justify-center">
                    <div class="cyber-viz-wrapper">
                        <div class="perspective-grid"></div>
                        <div class="viz-overlay-text text-right pa-3 font-mono text-caption text-grey-darken-2">
                            <div>NET_STATUS: ONLINE</div>
                            <div>FLEET_HEALTH: 100%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel-scroll-area pa-6 custom-scrollbar position-relative flex-grow-1" style="z-index: 2; overflow-y: auto;">

                <div v-if="isLoading" class="d-flex flex-column align-center justify-center py-12">
                    <v-progress-circular indeterminate color="grey-darken-2" size="64"></v-progress-circular>
                    <div class="mt-4 font-mono text-grey-darken-1 blink">SYNCING FLEET DATA...</div>
                </div>

                <div v-else-if="error" class="text-center text-error py-8 border-subtle pa-4 bg-black-transparent">
                    <v-icon icon="mdi-alert-decagram" size="48" color="red-darken-4"></v-icon>
                    <p class="font-mono mt-2 text-red-lighten-2">NET_ERROR: {{ error }}</p>
                    <v-btn size="small" color="red" variant="outlined" class="mt-2 font-mono" @click="refreshData">RETRY_CONNECTION</v-btn>
                </div>

                <div v-else-if="ownedEngines.length === 0 && sharedWithMeEngines.length === 0" class="text-center text-grey py-16 opacity-30">
                    <v-icon icon="mdi-server-off" size="64" class="mb-4"></v-icon>
                    <div class="text-h6 font-mono">NO ACTIVE NODES DETECTED</div>
                    <div class="text-caption font-mono mt-2">Initiate registration sequence to begin.</div>
                </div>

                <div v-else>

                    <div v-if="ownedEngines.length > 0" class="mb-8">
                        <div class="d-flex align-center mb-4 border-bottom-subtle pb-2">
                            <v-icon icon="mdi-shield-account" color="grey-darken-2" size="small" class="mr-2"></v-icon>
                            <span class="text-subtitle-2 font-mono text-grey-lighten-2 font-weight-bold">OWNED_NODES</span>
                        </div>

                        <v-row>
                            <v-col
                                v-for="engine in ownedEngines"
                                :key="engine.id"
                                cols="12" sm="6" md="4" lg="3" xl="2"
                            >
                                <v-card
                                    class="engine-card"
                                    :class="{ 'active-card': isEngineSelected(engine.id) }"
                                    @click="handleConnectEngine(engine)"
                                    variant="outlined"
                                >
                                    <div class="card-status-bar" :class="engine.status === 'online' ? 'bg-gold-dim' : 'bg-red-dim'"></div>

                                    <v-card-text class="pa-4">
                                        <div class="d-flex justify-space-between align-start mb-2">
                                            <div class="text-truncate pr-2" style="max-width: 70%;">
                                                <div class="text-h6 font-weight-bold text-grey-lighten-4 font-mono text-truncate" :class="{ 'text-gold-subtle': engine.name === 'Default Dev Engine' }">
                                                    {{ engine.name }}
                                                </div>
                                                <div class="text-caption text-grey-darken-1 font-mono text-truncate">ID: {{ engine.id }}</div>
                                            </div>
                                            <v-chip
                                                size="x-small"
                                                :color="getEngineStatusColorText(engine.status)"
                                                variant="text"
                                                class="font-weight-bold font-mono px-0"
                                            >
                                                {{ engine.status?.toUpperCase() || 'UNKNOWN' }}
                                            </v-chip>
                                        </div>

                                        <div class="vitals-section mt-4 mb-2" v-if="engine.status === 'online'">
                                            <div class="d-flex justify-space-between text-caption font-mono text-grey-darken-2 mb-1">
                                                <span>CPU_LOAD</span>
                                                <span>{{ (engine.vitals?.cpu_percent || 0).toFixed(0) }}%</span>
                                            </div>
                                            <v-progress-linear
                                                :model-value="engine.vitals?.cpu_percent || 0"
                                                color="#8a7e58"
                                                bg-color="#333"
                                                height="2"
                                                class="mb-3"
                                                rounded
                                            ></v-progress-linear>

                                            <div class="d-flex justify-space-between text-caption font-mono text-grey-darken-2 mb-1">
                                                <span>MEM_USAGE</span>
                                                <span>{{ (engine.vitals?.ram_percent || 0).toFixed(0) }}%</span>
                                            </div>
                                            <v-progress-linear
                                                :model-value="engine.vitals?.ram_percent || 0"
                                                color="#6b6045"
                                                bg-color="#333"
                                                height="2"
                                                rounded
                                            ></v-progress-linear>
                                        </div>
                                        <div v-else class="vitals-section mt-4 mb-2 d-flex align-center justify-center" style="height: 50px; background: rgba(255,255,255,0.01);">
                                            <span class="text-caption text-grey-darken-3 font-mono">[TELEMETRY OFFLINE]</span>
                                        </div>

                                        <v-divider class="my-3 border-subtle"></v-divider>

                                        <div class="d-flex justify-space-between align-center">
                                            <v-btn
                                                v-if="!isEngineSelected(engine.id)"
                                                color="grey-lighten-1"
                                                variant="text"
                                                size="small"
                                                prepend-icon="mdi-power-plug"
                                                :disabled="engine.status !== 'online'"
                                                @click.stop="handleConnectEngine(engine)"
                                                class="font-weight-bold hover-gold"
                                            >
                                                CONNECT
                                            </v-btn>
                                            <v-btn
                                                v-else
                                                color="green-darken-3"
                                                variant="text"
                                                size="small"
                                                prepend-icon="mdi-check-network"
                                                class="font-weight-bold"
                                                readonly
                                            >
                                                CONNECTED
                                            </v-btn>

                                            <v-menu location="bottom end" content-class="cyber-menu">
                                                <template v-slot:activator="{ props }">
                                                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" color="grey-darken-2"></v-btn>
                                                </template>
                                                <v-list density="compact" bg-color="#0e0e0e" class="border-subtle">
                                                    <v-list-item @click="openShareDialog(engine)" prepend-icon="mdi-share-variant" class="cyber-list-item">
                                                        <v-list-item-title class="font-mono">ACCESS_CONTROL</v-list-item-title>
                                                    </v-list-item>
                                                    <v-list-item @click="openRenameDialog(engine)" prepend-icon="mdi-rename-box" class="cyber-list-item">
                                                        <v-list-item-title class="font-mono">RENAME_NODE</v-list-item-title>
                                                    </v-list-item>
                                                    <v-list-item @click="handleResetToken(engine)" prepend-icon="mdi-key-change" class="cyber-list-item">
                                                        <v-list-item-title class="font-mono">RESET_TOKEN</v-list-item-title>
                                                    </v-list-item>
                                                    <v-divider class="border-subtle"></v-divider>
                                                    <v-list-item @click="handleDeleteEngine(engine)" prepend-icon="mdi-delete-alert" class="cyber-list-item text-red-darken-2">
                                                        <v-list-item-title class="font-mono">DECOMMISSION</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                    <div v-if="sharedWithMeEngines.length > 0">
                        <div class="d-flex align-center mb-4 border-bottom-subtle pb-2">
                            <v-icon icon="mdi-lan-connect" color="purple-darken-3" size="small" class="mr-2"></v-icon>
                            <span class="text-subtitle-2 font-mono text-grey-lighten-2 font-weight-bold">EXTERNAL_LINKS (SHARED)</span>
                        </div>

                        <v-row>
                            <v-col
                                v-for="engine in sharedWithMeEngines"
                                :key="engine.id"
                                cols="12" sm="6" md="4" lg="3" xl="2"
                            >
                                <v-card
                                    class="engine-card shared-card"
                                    :class="{ 'active-card': isEngineSelected(engine.id) }"
                                    @click="handleConnectEngine(engine)"
                                    variant="outlined"
                                >
                                    <div class="card-status-bar" :class="engine.status === 'online' ? 'bg-purple-dim' : 'bg-red-dim'"></div>

                                    <v-card-text class="pa-4">
                                        <div class="d-flex justify-space-between align-start mb-2">
                                            <div class="text-truncate pr-2" style="max-width: 70%;">
                                                <div class="text-h6 font-weight-bold text-white font-mono text-truncate">
                                                    {{ engine.name }}
                                                </div>
                                                <div class="text-caption text-grey-darken-1 font-mono text-truncate">SOURCE: {{ engine.owner?.username || 'UNKNOWN' }}</div>
                                            </div>
                                            <v-chip
                                                size="x-small"
                                                :color="getEngineStatusColorText(engine.status)"
                                                variant="text"
                                                class="font-weight-bold font-mono px-0"
                                            >
                                                {{ engine.status?.toUpperCase() || 'UNKNOWN' }}
                                            </v-chip>
                                        </div>

                                        <div class="vitals-section mt-4 mb-2" v-if="engine.status === 'online'">
                                            <div class="d-flex justify-space-between text-caption font-mono text-grey-darken-2 mb-1">
                                                <span>CPU</span>
                                                <span>{{ (engine.vitals?.cpu_percent || 0).toFixed(0) }}%</span>
                                            </div>
                                            <v-progress-linear
                                                :model-value="engine.vitals?.cpu_percent || 0"
                                                color="#8a7e58"
                                                bg-color="#333"
                                                height="2"
                                                class="mb-3"
                                                rounded
                                            ></v-progress-linear>
                                        </div>
                                        <div v-else class="vitals-section mt-4 mb-2 d-flex align-center justify-center" style="height: 35px; background: rgba(255,255,255,0.01);">
                                            <span class="text-caption text-grey-darken-3 font-mono">[OFFLINE]</span>
                                        </div>

                                        <v-divider class="my-3 border-subtle"></v-divider>

                                        <div class="d-flex justify-space-between align-center">
                                            <v-btn
                                                v-if="!isEngineSelected(engine.id)"
                                                color="purple-lighten-4"
                                                variant="text"
                                                size="small"
                                                prepend-icon="mdi-power-plug"
                                                :disabled="engine.status !== 'online'"
                                                @click.stop="handleConnectEngine(engine)"
                                                class="font-weight-bold opacity-70"
                                            >
                                                LINK
                                            </v-btn>
                                            <v-btn
                                                v-else
                                                color="green-darken-3"
                                                variant="text"
                                                size="small"
                                                prepend-icon="mdi-check-network"
                                                class="font-weight-bold"
                                                readonly
                                            >
                                                LINKED
                                            </v-btn>

                                            <v-tooltip text="Disconnect Link" location="top" content-class="cyber-tooltip">
                                                <template v-slot:activator="{ props }">
                                                    <v-btn icon="mdi-link-off" variant="text" size="small" v-bind="props" color="grey-darken-2" @click.stop="handleLeaveEngine(engine)"></v-btn>
                                                </template>
                                            </v-tooltip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>

                </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="isRegisterDialogOpen" max-width="500px" persistent>
      <v-card class="glass-panel border-subtle bg-black">
        <v-card-title class="orbitron-font text-white border-bottom-subtle pa-4 text-body-1">
            <v-icon start size="small" color="grey">mdi-plus-network</v-icon> REGISTER_NODE
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-caption mb-4 font-mono text-grey-darken-1">Define identifier for new processing node.</p>
          <div class="cyber-form-inputs">
              <v-text-field
                v-model="newEngineName"
                label="NODE_ID (Name)"
                variant="outlined"
                autofocus
                hide-details
                class="stealth-input mb-2"
                @keyup.enter="confirmRegisterEngine"
              ></v-text-field>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="isRegisterDialogOpen = false" class="font-mono text-caption">ABORT</v-btn>
          <v-btn color="#8a7e58" variant="tonal" @click="confirmRegisterEngine" :loading="isLoading" class="stealth-btn text-white">
            INITIALIZE
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRenameDialogOpen" max-width="500px" persistent>
      <v-card class="glass-panel border-subtle bg-black">
        <v-card-title class="orbitron-font text-white border-bottom-subtle pa-4 text-body-1">
            <v-icon start size="small" color="grey">mdi-rename-box</v-icon> RENAME_NODE
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="cyber-form-inputs">
              <v-text-field
                v-model="renameEngineName"
                label="NEW_IDENTIFIER"
                variant="outlined"
                autofocus
                hide-details
                class="stealth-input"
                @keyup.enter="confirmRenameEngine"
              ></v-text-field>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="isRenameDialogOpen = false" class="font-mono text-caption">CANCEL</v-btn>
          <v-btn color="#8a7e58" variant="tonal" @click="confirmRenameEngine" :loading="isLoading" class="stealth-btn text-white">
            UPDATE
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isShareDialogOpen" max-width="700px" persistent scrollable>
        <v-card class="glass-panel border-subtle bg-black">
            <v-card-title class="orbitron-font text-white border-bottom-subtle pa-4 text-body-1">
                ACCESS_CONTROL: <span class="text-grey">{{ engineToManageShares?.name }}</span>
            </v-card-title>
            <v-card-text class="pa-4">
                <div class="mb-6 cyber-form-inputs">
                    <p class="text-caption mb-2 font-mono text-grey-darken-2">>> GRANT_ACCESS</p>
                    <div class="d-flex align-center" style="gap: 12px;">
                        <v-text-field
                            v-model="newShareIdentifier"
                            label="TARGET_USER (Public Address)"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="flex-grow-1 stealth-input"
                            placeholder="0x..."
                        ></v-text-field>

                        <v-select
                            v-model="newShareRole"
                            :items="roleOptions"
                            item-title="text"
                            item-value="value"
                            label="PERMISSIONS"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="stealth-input"
                            style="max-width: 180px;"
                        ></v-select>

                        <v-btn
                            color="#8a7e58"
                            variant="tonal"
                            @click="handleGrantShare"
                            :loading="isShareLoading"
                            class="stealth-btn text-white"
                            style="height: 40px;"
                        >
                            EXECUTE
                        </v-btn>
                    </div>
                </div>

                <v-divider class="my-4 border-subtle opacity-20"></v-divider>

                <div class="font-mono text-subtitle-2 mb-2 text-grey-darken-1">>> ACTIVE_SHARES</div>
                  <div v-if="isShareLoading && sharesForEngine.length === 0" class="text-center pa-4">
                    <v-progress-circular indeterminate color="grey-darken-2"></v-progress-circular>
                 </div>
                 <div v-else-if="sharesForEngine.length === 0" class="text-center text-caption text-grey-darken-2 pa-4 font-mono">
                    [NO EXTERNAL ACCESS GRANTED]
                </div>
                <v-list v-else lines="one" bg-color="transparent" class="pa-0">
                    <v-list-item v-for="share in sharesForEngine" :key="share.user_id" class="share-item border-bottom-subtle mb-1 rounded bg-black-transparent">
                        <v-list-item-title class="font-weight-medium font-mono text-grey-lighten-2">
                             {{ share.username || share.public_address || share.email }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption font-mono">
                            LEVEL: <strong :class="getRoleColor(share.role)">{{ share.role?.toUpperCase() }}</strong>
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn
                                icon="mdi-pencil"
                                variant="text"
                                color="grey"
                                size="small"
                                @click="populateEdit(share)"
                                title="Edit"
                            ></v-btn>
                            <v-btn
                                icon="mdi-close-circle"
                                variant="text"
                                color="red-darken-4"
                                size="small"
                                @click="handleRevokeShare(share.user_id)"
                                :loading="isShareLoading"
                                title="Revoke"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions class="pa-4 border-top-subtle">
                <v-spacer></v-spacer>
                <v-btn variant="text" color="grey-darken-1" @click="isShareDialogOpen = false" class="font-mono text-caption">TERMINATE</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useEngineStore } from '@/store/engines';
import { useUiStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { storeToRefs } from 'pinia';
import { apiUpdateEngine, apiResetEngineToken } from '@/api';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const uiStore = useUiStore();
const authStore = useAuthStore();
const engineStore = useEngineStore();

const { allAvailableEngines, isLoading, error, selectedEngineId } = storeToRefs(engineStore);
const ownedEngines = computed(() => allAvailableEngines.value.filter(e => e.isOwner));
const sharedWithMeEngines = computed(() => allAvailableEngines.value.filter(e => !e.isOwner));

const isRegisterDialogOpen = ref(false);
const newEngineName = ref('');
const isRenameDialogOpen = ref(false);
const engineToRename = ref(null);
const renameEngineName = ref('');
const isShareDialogOpen = ref(false);
const engineToManageShares = ref(null);
const sharesForEngine = ref([]);
const newShareIdentifier = ref('');
const newShareRole = ref('reader');
const isShareLoading = ref(false);

const roleOptions = [
    { text: 'Reader (View Only)', value: 'reader' },
    { text: 'Runner (Execute)', value: 'runner' },
    { text: 'Admin (Full Access)', value: 'admin' }
];

const refreshData = () => {
    engineStore.fetchEngines();
};
function isEngineSelected(id) {
    return selectedEngineId.value === id;
}

async function handleConnectEngine(engine) {
    if (engine.status !== 'online') {
        uiStore.showNotification({ text: 'Node is OFFLINE. Link failed.', color: 'warning' });
        return;
    }
    if (isEngineSelected(engine.id)) return;

    await engineStore.setSelectedEngineId(engine.id, true);
    uiStore.showNotification({ text: `Uplink established: '${engine.name}'`, color: 'success' });
}

function openRegisterDialog() {
  newEngineName.value = '';
  isRegisterDialogOpen.value = true;
}

async function confirmRegisterEngine() {
  if (newEngineName.value && newEngineName.value.trim()) {
    const success = await engineStore.registerEngine(newEngineName.value.trim());
    if (success) isRegisterDialogOpen.value = false;
  } else {
    uiStore.showNotification({ text: 'Invalid Node Identifier.', color: 'warning' });
  }
}

async function handleDeleteEngine(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Decommission Node',
        text: `Are you sure you want to PERMANENTLY remove node "${engine.name}"? This action is irreversible.`,
        color: 'error',
        confirmText: 'DECOMMISSION'
    });
    if (confirmed) {
        await engineStore.deleteEngine(engine.id);
    }
}

async function handleLeaveEngine(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Disconnect Link',
        text: `Sever connection to shared node "${engine.name}"?`,
        color: 'warning',
        confirmText: 'DISCONNECT'
    });
    if (confirmed) {
        try {
             uiStore.showNotification({ text: "Protocol unavailable (API Pending)", color: 'info' });
        } catch(e) {
            uiStore.showNotification({ text: "Failed to sever link.", color: 'error' });
        }
    }
}

function getEngineStatusColorText(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'text-green-darken-1';
        case 'offline': return 'text-grey-darken-1';
        case 'connecting': return 'text-grey';
        case 'error': return 'text-red-darken-2';
        default: return 'text-grey-darken-2';
    }
}

async function handleResetToken(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Reset Access Token',
        text: `Regenerate secure token for "${engine.name}"? You must update the .env configuration immediately.`,
        color: 'warning',
        confirmText: 'RESET'
    });
    if (confirmed) {
        try {
            const response = await apiResetEngineToken(engine.id);
            uiStore.showTokenDialog({
                title: 'NEW CREDENTIALS',
                text: 'UPDATE .ENV CONFIGURATION IMMEDIATELY:',
                items: [
                    { label: 'FLOWORK_ENGINE_ID', value: response.engine_id },
                    { label: 'FLOWORK_ENGINE_TOKEN', value: response.token }
                ]
            });
        } catch (e) {
            uiStore.showNotification({ text: e.message || 'Token reset failed.', color: 'error' });
        }
    }
}

function openRenameDialog(engine) {
    engineToRename.value = engine;
    renameEngineName.value = engine.name;
    isRenameDialogOpen.value = true;
}
async function confirmRenameEngine() {
    if (!engineToRename.value || !renameEngineName.value || !renameEngineName.value.trim()) return;
    try {
        await apiUpdateEngine(engineToRename.value.id, { name: renameEngineName.value.trim() });
        uiStore.showNotification({ text: `Node identifier updated.`, color: 'success' });
        refreshData();
        isRenameDialogOpen.value = false;
    } catch (e) {
        uiStore.showNotification({ text: e.message || 'Update failed.', color: 'error' });
    }
}

async function openShareDialog(engine) {
    engineToManageShares.value = engine;
    isShareDialogOpen.value = true;
    isShareLoading.value = true;
    sharesForEngine.value = [];
    newShareIdentifier.value = '';
    newShareRole.value = 'reader'; // Reset default
    try {
        const rawShares = await engineStore.fetchEngineShares(engine.id);
        sharesForEngine.value = rawShares.filter(s => s.engine_id === engine.id);
    } catch(e) {
        console.error("Failed to fetch shares", e);
    } finally {
        isShareLoading.value = false;
    }
}

function populateEdit(share) {
    newShareIdentifier.value = share.public_address || share.username;
    newShareRole.value = share.role;
}

function getRoleColor(role) {
    if(role === 'admin') return 'text-red-darken-3';
    if(role === 'runner') return 'text-green-darken-2';
    return 'text-grey-darken-1';
}

async function handleGrantShare() {
    if (!engineToManageShares.value || !newShareIdentifier.value.trim()) return;
    isShareLoading.value = true;
    try {
        const success = await engineStore.grantShare(
            engineToManageShares.value.id,
            newShareIdentifier.value.trim(),
            newShareRole.value // Send the role
        );
        if (success) {
             newShareIdentifier.value = '';
             newShareRole.value = 'reader'; // Reset
             const rawShares = await engineStore.fetchEngineShares(engineToManageShares.value.id);
             sharesForEngine.value = rawShares.filter(s => s.engine_id === engineToManageShares.value.id);
        }
    } finally {
        isShareLoading.value = false;
    }
}
async function handleRevokeShare(sharedUserId) {
    isShareLoading.value = true;
    try {
        const success = await engineStore.revokeShare(engineToManageShares.value.id, sharedUserId);
        if (success) {
             const rawShares = await engineStore.fetchEngineShares(engineToManageShares.value.id);
             sharesForEngine.value = rawShares.filter(s => s.engine_id === engineToManageShares.value.id);
        }
    } finally {
        isShareLoading.value = false;
    }
}

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap');

.my-engines-page {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; background-color: #050505; overflow: hidden; z-index: 5;
}

.center-panel-bg {
    background: #080808 !important; /* Hitam pekat */
    border-radius: 4px;
    z-index: 10;
}

/* HEADER */
.hacker-header-large {
    background: #0a0a0a;
    height: 140px; position: relative;
    border-bottom: 1px solid rgba(255,255,255,0.05); /* Border sangat tipis */
    flex-shrink: 0;
}
.header-left { width: 60%; z-index: 2; border-right: 1px solid rgba(255,255,255,0.03); }
.header-right { width: 40%; z-index: 1; overflow: hidden; background: #050505; }

/* VIZ - Disamarkan abis */
.cyber-viz-wrapper { width: 100%; height: 100%; position: relative; perspective: 500px; overflow: hidden; }
.perspective-grid { position: absolute; bottom: -50%; left: -50%; width: 200%; height: 100%; background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px); background-size: 40px 40px; transform: rotateX(60deg); animation: grid-move 10s linear infinite; opacity: 0.1; }
@keyframes grid-move { 0% { transform: rotateX(60deg) translateY(0); } 100% { transform: rotateX(60deg) translateY(40px); } }

/* ENGINE CARD - Stealth Mode */
.engine-card {
    background: #0d0d0d !important;
    border: 1px solid rgba(255, 255, 255, 0.05); /* Border abu-abu tipis */
    border-radius: 4px;
    transition: all 0.2s ease;
    overflow: hidden;
    position: relative;
}
.engine-card:hover {
    border-color: rgba(138, 126, 88, 0.3); /* Emas pudar saat hover */
    background: #111 !important;
}
.active-card {
    border: 1px solid rgba(138, 126, 88, 0.4); /* Emas redup untuk aktif */
    background: #0f0f0f !important;
}
.shared-card { border-left: 2px solid rgba(156, 39, 176, 0.3); }

.card-status-bar { height: 1px; width: 100%; position: absolute; top: 0; left: 0; opacity: 0.4; }
.bg-gold-dim { background-color: #8a7e58; } /* Bronze */
.bg-red-dim { background-color: #8a2be2; } /* Purple pudar untuk error biar ga nyolok */
.bg-purple-dim { background-color: #7b1fa2; }

/* BUTTONS */
.stealth-btn {
    border-color: rgba(255,255,255,0.1);
    letter-spacing: 1px;
    transition: all 0.2s;
}
.stealth-btn:hover {
    border-color: rgba(138, 126, 88, 0.4);
    background: rgba(138, 126, 88, 0.05);
}
.hover-gold:hover { color: #d4c59a !important; }

/* UTILS */
.border-subtle { border: 1px solid rgba(255, 255, 255, 0.05); }
.border-bottom-subtle { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.border-top-subtle { border-top: 1px solid rgba(255, 255, 255, 0.05); }

/* INPUT OVERRIDES - Stealth */
.stealth-input :deep(.v-field) {
    background-color: #050505 !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #ccc !important;
    font-family: 'Fira Code', monospace;
}
.stealth-input :deep(.v-field--focused) { border-color: rgba(138, 126, 88, 0.3) !important; }

/* TEXT */
.text-gold-subtle { color: #8a7e58 !important; }
.font-mono { font-family: 'Fira Code', monospace; }
.orbitron-font { font-family: 'Orbitron', monospace; }

/* SCROLLBAR */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #222; border-radius: 2px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
</style>