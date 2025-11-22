//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\MyEngines.vue total lines 623 
//#######################################################################

<template>
  <div class="my-engines-page">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-card class="main-card">
            <v-toolbar color="transparent">
              <v-icon icon="mdi-server-network" class="ml-2 mr-4" color="cyan"></v-icon>
              <v-toolbar-title class="orbitron-font">My Engines</v-toolbar-title> <v-spacer></v-spacer>
              <v-btn
                color="cyan"
                variant="flat"
                @click="openRegisterDialog"
                prepend-icon="mdi-plus-circle-outline"
                class="action-button"
              >
                Register New Engine </v-btn>
            </v-toolbar>
            <v-divider></v-divider>

            <v-card-text>
              <p class="text-body-2 text-grey-lighten-1 mb-6">
                Manage your self-hosted Flowork Engines here. Connect to an engine to start working.
              </p>

              <div v-if="isLoading" class="text-center py-8">
                  <v-progress-circular indeterminate color="cyan"></v-progress-circular>
              </div>
              <div v-else-if="error" class="text-center text-error py-8">
                  <p>Failed to load engines: {{ error }}</p>
                  <v-btn size="small" color="cyan" variant="text" @click="refreshData">Retry</v-btn>
              </div>
              <div v-else-if="ownedEngines.length === 0 && sharedWithMeEngines.length === 0" class="text-center text-grey py-8">
                  <v-icon icon="mdi-server-off" size="48"></v-icon>
                  <p class="mt-4">You haven't registered any engines yet.</p> <v-btn color="primary" variant="tonal" @click="openRegisterDialog" class="mt-4">Register Your First Engine</v-btn>
              </div>

              <div v-else>
                  <h3 v-if="ownedEngines.length > 0" class="list-header orbitron-font">Owned Engines</h3>
                  <v-list v-if="ownedEngines.length > 0" lines="two" bg-color="transparent" class="mb-4">
                     <v-list-item
                        v-for="engine in ownedEngines"
                        :key="engine.id"
                        class="engine-item"
                        :class="{ 'active-engine': isEngineSelected(engine.id) }"
                        @click="handleConnectEngine(engine)"
                    >
                        <v-list-item-title :class="{ 'default-dev-engine-name': engine.name === 'Default Dev Engine' }">
                             {{ engine.name }}
                             <v-chip v-if="isEngineSelected(engine.id)" size="x-small" color="cyan" class="ml-2" variant="flat">ACTIVE</v-chip>
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption text-grey">
                             ID: {{ engine.id.substring(0,12) }}...
                        </v-list-item-subtitle>

                        <template v-slot:prepend>
                             <v-icon
                                :color="getEngineStatusColor(engine.status)"
                                size="large"
                                class="mr-4"
                            >
                                {{ getEngineStatusIcon(engine.status) }}
                            </v-icon>
                        </template>

                        <template v-slot:append>
                            <div class="d-flex align-center">
                                 <v-chip
                                    :color="getEngineStatusColor(engine.status)"
                                    size="small"
                                    variant="flat"
                                    label
                                    class="mr-4 status-chip font-weight-bold text-uppercase"
                                 >
                                    {{ engine.status || 'Unknown' }}
                                </v-chip>

                                <v-btn
                                    v-if="!isEngineSelected(engine.id)"
                                    color="cyan"
                                    variant="tonal"
                                    size="small"
                                    class="mr-2"
                                    prepend-icon="mdi-power-plug"
                                    :disabled="engine.status !== 'online'"
                                    @click.stop="handleConnectEngine(engine)"
                                >
                                     Connect
                                </v-btn>

                                <v-menu location="bottom end">
                                     <template v-slot:activator="{ props }">
                                        <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" color="grey"></v-btn>
                                     </template>
                                    <v-list density="compact" bg-color="#1e1e2f">
                                        <v-list-item @click="openShareDialog(engine)" prepend-icon="mdi-account-multiple-plus-outline">
                                            <v-list-item-title>Manage Shares</v-list-item-title>
                                        </v-list-item>
                                         <v-list-item @click="openRenameDialog(engine)" prepend-icon="mdi-pencil-outline">
                                            <v-list-item-title>Rename</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="handleResetToken(engine)" prepend-icon="mdi-lock-reset">
                                            <v-list-item-title>Reset Token</v-list-item-title>
                                         </v-list-item>
                                        <v-divider></v-divider>
                                         <v-list-item @click="handleDeleteEngine(engine)" prepend-icon="mdi-delete-outline" class="text-error">
                                            <v-list-item-title>Delete Engine</v-list-item-title>
                                        </v-list-item>
                                     </v-list>
                                </v-menu>
                            </div>
                        </template>
                    </v-list-item>
                  </v-list>

                  <h3 v-if="sharedWithMeEngines.length > 0" class="list-header orbitron-font mt-6">Shared With You</h3>
                  <v-list v-if="sharedWithMeEngines.length > 0" lines="two" bg-color="transparent">
                      <v-list-item
                          v-for="engine in sharedWithMeEngines"
                          :key="engine.id"
                          class="engine-item shared-item"
                          :class="{ 'active-engine': isEngineSelected(engine.id) }"
                          @click="handleConnectEngine(engine)"
                      >
                          <v-list-item-title>
                              {{ engine.name }}
                              <v-chip v-if="isEngineSelected(engine.id)" size="x-small" color="cyan" class="ml-2" variant="flat">ACTIVE</v-chip>
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-caption text-grey">
                              Shared by: <span class="text-cyan">{{ engine.owner?.username || engine.owner?.email || 'Unknown' }}</span>
                          </v-list-item-subtitle>

                          <template v-slot:prepend>
                              <v-icon
                                  :color="getEngineStatusColor(engine.status)"
                                  size="large"
                                  class="mr-4"
                               >
                                  {{ getEngineStatusIcon(engine.status) }}
                              </v-icon>
                          </template>
                          <template v-slot:append>
                                <v-chip
                                  :color="getEngineStatusColor(engine.status)"
                                  size="small"
                                  variant="flat"
                                  label
                                  class="status-chip mr-2"
                              >
                                  {{ engine.status || 'Unknown' }}
                              </v-chip>

                               <v-btn
                                    v-if="!isEngineSelected(engine.id)"
                                    color="cyan"
                                    variant="tonal"
                                     size="small"
                                    class="mr-2"
                                    prepend-icon="mdi-power-plug"
                                     :disabled="engine.status !== 'online'"
                                    @click.stop="handleConnectEngine(engine)"
                                >
                                     Connect
                                </v-btn>

                              <v-tooltip text="Leave Engine" location="top">
                                 <template v-slot:activator="{ props: tooltipProps }">
                                    <v-btn
                                        v-bind="tooltipProps"
                                        icon="mdi-logout-variant"
                                        variant="text"
                                         size="small"
                                        color="grey"
                                        @click.stop="handleLeaveEngine(engine)"
                                    ></v-btn>
                                </template>
                              </v-tooltip>
                          </template>
                      </v-list-item>
                  </v-list>
              </div>

            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="isRegisterDialogOpen" max-width="500px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="orbitron-font">Register New Engine</v-card-title>
        <v-card-text>
          <p class="text-caption mb-4">Give your new engine a recognizable name (e.g., "Home PC", "Office Server").</p>
          <v-text-field
            v-model="newEngineName"
            label="Engine Name"
            variant="outlined"
            autofocus
            @keyup.enter="confirmRegisterEngine"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isRegisterDialogOpen = false">Cancel</v-btn>
          <v-btn
            color="cyan"
            variant="flat"
            @click="confirmRegisterEngine"
            :loading="isLoading"
            class="action-button"
          >
            Register
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRenameDialogOpen" max-width="500px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="orbitron-font">Rename Engine</v-card-title>
        <v-card-text>
          <p class="text-caption mb-4">Enter a new name for the engine '{{ engineToRename?.name }}'.</p>
          <v-text-field
            v-model="renameEngineName"
            label="New Engine Name"
            variant="outlined"
            autofocus
            @keyup.enter="confirmRenameEngine"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isRenameDialogOpen = false">Cancel</v-btn>
          <v-btn
            color="cyan"
            variant="flat"
            @click="confirmRenameEngine"
            :loading="isLoading"
            class="action-button"
          >
            Rename
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isShareDialogOpen" max-width="700px" persistent scrollable>
        <v-card class="dialog-card share-dialog">
            <v-card-title class="orbitron-font">Manage Shares for '{{ engineToManageShares?.name }}'</v-card-title>
            <v-card-text>
                <div class="mb-4">
                    <p class="text-caption mb-2">Grant access to another Flowork user:</p>
                    <div class="d-flex align-center" style="gap: 16px;">
                        <v-text-field
                            v-model="newShareIdentifier"
                            label="User Public Address (Guest)"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="flex-grow-1"
                            placeholder="0x..."
                        ></v-text-field>

                        <v-select
                            v-model="newShareRole"
                            :items="roleOptions"
                            item-title="text"
                            item-value="value"
                            label="Role"
                            variant="outlined"
                            density="compact"
                            hide-details
                            style="max-width: 150px;"
                        ></v-select>

                        <v-btn
                            color="cyan"
                            variant="flat"
                            @click="handleGrantShare"
                            :loading="isShareLoading"
                            class="action-button"
                        >
                            Grant/Update
                        </v-btn>
                    </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <h3 class="text-subtitle-1 mb-2">Currently Shared With:</h3>
                  <div v-if="isShareLoading && sharesForEngine.length === 0" class="text-center pa-4">
                    <v-progress-circular indeterminate color="cyan"></v-progress-circular>
                 </div>
                 <div v-else-if="sharesForEngine.length === 0" class="text-center text-caption text-grey pa-4">
                    Not shared with anyone yet.
                </div>
                <v-list v-else lines="one" bg-color="transparent" class="pa-0">
                    <v-list-item v-for="share in sharesForEngine" :key="share.user_id" class="share-item">
                        <v-list-item-title class="font-weight-medium">
                             {{ share.username || share.public_address || share.email }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                            Role: <strong :class="getRoleColor(share.role)">{{ share.role?.toUpperCase() }}</strong> • Shared on: {{ share.shared_at ? new Date(share.shared_at).toLocaleString() : 'N/A' }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-btn
                                icon="mdi-pencil-outline"
                                variant="text"
                                color="info"
                                size="small"
                                @click="populateEdit(share)"
                                title="Edit Role"
                                class="mr-1"
                            ></v-btn>
                            <v-btn
                                icon="mdi-account-remove-outline"
                                variant="text"
                                color="error"
                                size="small"
                                @click="handleRevokeShare(share.user_id)"
                                :loading="isShareLoading"
                                title="Revoke Access"
                            ></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="isShareDialogOpen = false">Close</v-btn>
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
const newShareRole = ref('reader'); // [ADDED BY FLOWORK DEV] Default role
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
        uiStore.showNotification({ text: 'Engine is offline. Cannot connect.', color: 'warning' });
        return;
    }
    if (isEngineSelected(engine.id)) return;

    await engineStore.setSelectedEngineId(engine.id, true);
    uiStore.showNotification({ text: `Connected to '${engine.name}'`, color: 'success' });
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
    uiStore.showNotification({ text: 'Please enter a valid engine name.', color: 'warning' });
  }
}

async function handleDeleteEngine(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Engine',
        text: `Are you sure you want to delete the engine "${engine.name}"? This cannot be undone.`,
        color: 'error',
        confirmText: 'Delete'
    });
    if (confirmed) {
        await engineStore.deleteEngine(engine.id);
    }
}

async function handleLeaveEngine(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Leave Shared Engine',
        text: `Remove access to "${engine.name}"? You will need to be invited again to access it.`,
        color: 'warning',
        confirmText: 'Leave'
    });
    if (confirmed) {
        try {
             uiStore.showNotification({ text: "Feature coming soon (API Pending)", color: 'info' });
        } catch(e) {
            uiStore.showNotification({ text: "Failed to leave engine.", color: 'error' });
        }
    }
}

function getEngineStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'success';
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

async function handleResetToken(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Reset Engine Token',
        text: `Are you sure you want to reset the token for "${engine.name}"? You must update the .env file on that engine immediately.`,
        color: 'warning',
        confirmText: 'Reset'
    });
    if (confirmed) {
        try {
            const response = await apiResetEngineToken(engine.id);
            uiStore.showTokenDialog({
                title: 'New Engine Credentials',
                text: 'IMPORTANT: Update your engine\'s .env file with these details.',
                items: [
                    { label: 'FLOWORK_ENGINE_ID', value: response.engine_id },
                    { label: 'FLOWORK_ENGINE_TOKEN', value: response.token }
                ]
            });
        } catch (e) {
            uiStore.showNotification({ text: e.message || 'Failed to reset token.', color: 'error' });
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
        uiStore.showNotification({ text: `Engine renamed.`, color: 'success' });
        refreshData();
        isRenameDialogOpen.value = false;
    } catch (e) {
        uiStore.showNotification({ text: e.message || 'Failed to rename engine.', color: 'error' });
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
    if(role === 'admin') return 'text-red-accent-2';
    if(role === 'runner') return 'text-green-accent-3';
    return 'text-grey-lighten-1';
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
.my-engines-page { height: 100%; overflow-y: auto; padding: 48px 0;
}
.main-card { background: rgba(30, 30, 47, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
}
.orbitron-font { font-family: 'Orbitron', monospace; color: #f0f0f0; }
.action-button { font-weight: bold; color: #000 !important;
}

.engine-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;
    cursor: pointer;
}
.engine-item:hover {
    background-color: rgba(0, 245, 255, 0.05);
}
.engine-item.active-engine {
    background: rgba(0, 245, 255, 0.1);
    border-left: 4px solid #00e5ff;
}

.shared-item {
    opacity: 0.9;
}
.status-chip {
    min-width: 80px;
    justify-content: center;
    letter-spacing: 1px;
}

.dialog-card {
  background-color: #2a2a4a;
  border: 1px solid var(--neon-cyan);
}
.share-dialog .v-list-item-title {
    font-size: 0.9rem;
}
.share-dialog .v-list-item-subtitle {
    font-size: 0.75rem;
}
.share-item {
    padding: 8px 0 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.list-header {
    font-size: 0.9rem;
    color: #a59dff;
    margin-bottom: 8px;
    padding-left: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.default-dev-engine-name {
    color: #FFEB3B !important;
    font-weight: bold;
}
.text-cyan { color: #00e5ff !important;
}
</style>
