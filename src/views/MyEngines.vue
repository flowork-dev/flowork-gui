#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\MyEngines.vue
# REVISI:
# 1. Mengganti 'alert()' dan 'prompt()' dengan 'uiStore.showTokenDialog()'.
# 2. Mengganti 'confirm()' dengan 'await uiStore.showConfirmation()'.
# 3. Membuat 'handleDeleteEngine' dan 'handleResetToken' menjadi 'async'.
#######################################################################
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
                Manage your self-hosted Flowork Engines here. Each engine runs your workflows locally on your own hardware or servers. </p>

              <div v-if="isLoading" class="text-center py-8">
                  <v-progress-circular indeterminate color="cyan"></v-progress-circular>
              </div>
              <div v-else-if="error" class="text-center text-error py-8">
                  <p>Failed to load engines: {{ error.message || error }}</p> </div>
              <div v-else-if="engines.length === 0 && sharedEngines.length === 0" class="text-center text-grey py-8">
                  <v-icon icon="mdi-server-off" size="48"></v-icon>
                  <p class="mt-4">You haven't registered any engines yet.</p> <v-btn color="primary" variant="tonal" @click="openRegisterDialog" class="mt-4">Register Your First Engine</v-btn> </div>

              <div v-else>
                  <h3 v-if="engines.length > 0" class="list-header orbitron-font">Owned Engines</h3> <v-list v-if="engines.length > 0" lines="two" bg-color="transparent" class="mb-4">
                    <v-list-item
                        v-for="engine in engines"
                        :key="engine.id"
                        class="engine-item"
                        :subtitle="`ID: ${engine.id.substring(0,8)}...`"
                    >
                        <v-list-item-title :class="{ 'default-dev-engine-name': engine.name === 'Default Dev Engine' }">
                            {{ engine.name }}
                        </v-list-item-title>
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
                                class="mr-4 status-chip"
                            >
                                {{ engine.status || 'Unknown' }}
                            </v-chip>

                            <v-tooltip text="Manage Shares" location="top"> <template v-slot:activator="{ props: tooltipProps }">
                                    <v-btn
                                        v-bind="tooltipProps"
                                        icon="mdi-account-multiple-plus-outline"
                                        variant="text"
                                        size="small"
                                        class="mx-1"
                                        @click.stop="openShareDialog(engine)"
                                        color="grey-lighten-1"
                                    ></v-btn>
                                </template>
                             </v-tooltip>
                             <v-tooltip text="Reset Engine Token" location="top"> <template v-slot:activator="{ props: tooltipProps }">
                                    <v-btn
                                        v-bind="tooltipProps"
                                        icon="mdi-lock-reset" variant="text"
                                        size="small"
                                        class="mx-1"
                                        @click.stop="handleResetToken(engine)"
                                        color="grey-lighten-1"
                                    ></v-btn>
                                </template>
                             </v-tooltip>
                             <v-tooltip text="Rename Engine" location="top"> <template v-slot:activator="{ props: tooltipProps }">
                                    <v-btn
                                        v-bind="tooltipProps"
                                        icon="mdi-pencil-outline"
                                        variant="text"
                                        size="small"
                                        class="mx-1"
                                        @click.stop="openRenameDialog(engine)"
                                        color="grey-lighten-1"
                                    ></v-btn>
                                </template>
                             </v-tooltip>
                             <v-tooltip text="Delete Engine" location="top"> <template v-slot:activator="{ props: tooltipProps }">
                                    <v-btn
                                        v-bind="tooltipProps"
                                        icon="mdi-delete-outline"
                                        variant="text"
                                        size="small"
                                        color="error" class="mx-1"
                                        @click.stop="handleDeleteEngine(engine)"
                                    ></v-btn>
                                </template>
                             </v-tooltip>
                        </template>
                    </v-list-item>
                  </v-list>

                  <h3 v-if="sharedEngines.length > 0" class="list-header orbitron-font mt-6">Shared With You</h3> <v-list v-if="sharedEngines.length > 0" lines="two" bg-color="transparent">
                      <v-list-item
                          v-for="engine in sharedEngines"
                          :key="engine.id"
                          class="engine-item shared-item"
                          :title="engine.name"
                          :subtitle="`Shared by: ${engine.owner?.username || engine.owner?.email || 'Unknown'}`"
                      >
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
                                  class="status-chip"
                              >
                                  {{ engine.status || 'Unknown' }}
                              </v-chip>
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
                            label="Username or Public Address"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="flex-grow-1"
                            placeholder="flowork_user or 0x..."
                        ></v-text-field>
                        <v-btn
                            color="cyan"
                            variant="flat"
                            @click="handleGrantShare"
                            :loading="isShareLoading"
                            class="action-button"
                        >
                            Grant Access
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
                            Shared on: {{ share.shared_at ? new Date(share.shared_at).toLocaleString() : 'N/A' }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
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
import { storeToRefs } from 'pinia';
import { apiResetEngineToken, apiUpdateEngine } from '@/api';

const engineStore = useEngineStore();
const uiStore = useUiStore();
const { engines, sharedEngines, isLoading, error } = storeToRefs(engineStore);

const isRegisterDialogOpen = ref(false);
const newEngineName = ref('');

const isRenameDialogOpen = ref(false);
const engineToRename = ref(null);
const renameEngineName = ref('');

const isShareDialogOpen = ref(false);
const engineToManageShares = ref(null);
const sharesForEngine = ref([]);
const newShareIdentifier = ref('');
const isShareLoading = ref(false);

function openRegisterDialog() {
  newEngineName.value = '';
  isRegisterDialogOpen.value = true;
}
async function confirmRegisterEngine() {
  if (newEngineName.value && newEngineName.value.trim()) {
    const success = await engineStore.registerEngine(newEngineName.value.trim());
    if (success) {
      isRegisterDialogOpen.value = false;
    }
  } else {
    uiStore.showNotification({ text: 'Please enter a valid engine name.', color: 'warning' }); // English Hardcode
  }
}

async function handleDeleteEngine(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Delete Engine', // English Hardcode
        text: `Are you sure you want to delete the engine "${engine.name}"? This cannot be undone.`, // English Hardcode
        color: 'error', // English Hardcode
        confirmText: 'Delete' // English Hardcode
    });
    if (confirmed) {
        await engineStore.deleteEngine(engine.id);
    }
}

function getEngineStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'success'; // English Hardcode
        case 'offline': return 'grey'; // English Hardcode
        case 'connecting': return 'info'; // English Hardcode
        case 'error': return 'error'; // English Hardcode
        default: return 'grey-darken-1';
    }
}
function getEngineStatusIcon(status) {
    switch (status?.toLowerCase()) {
        case 'online': return 'mdi-server-network'; // English Hardcode
        case 'offline': return 'mdi-server-network-off'; // English Hardcode
        case 'connecting': return 'mdi-lan-pending'; // English Hardcode
        case 'error': return 'mdi-server-network-off-outline'; // English Hardcode
        default: return 'mdi-help-circle-outline';
    }
}

async function handleResetToken(engine) {
    const confirmed = await uiStore.showConfirmation({
        title: 'Reset Engine Token', // English Hardcode
        text: `Are you sure you want to reset the token for "${engine.name}"? You must update the .env file on that engine.`, // English Hardcode
        color: 'warning', // English Hardcode
        confirmText: 'Reset' // English Hardcode
    });
    if (confirmed) {
        let localIsLoading = ref(false);
        try {
            localIsLoading.value = true;
            const response = await apiResetEngineToken(engine.id);
            if (response.error) throw new Error(response.error);

            uiStore.showTokenDialog({
                title: 'New Engine Credentials', // English Hardcode
                text: 'IMPORTANT: Copy these details and update your engine\'s C:\\FLOWORK\\.env file. The token is only shown once!', // English Hardcode
                items: [
                    { label: 'FLOWORK_ENGINE_ID', value: response.engine_id }, // English Hardcode
                    { label: 'FLOWORK_ENGINE_TOKEN', value: response.token } // English Hardcode
                ]
            });

        } catch (e) {
            const errorMsg = e.error || e.message || 'Failed to reset token.'; // English Hardcode
            console.error('[MyEngines] Error resetting token:', errorMsg); // English Hardcode
            uiStore.showNotification({ text: errorMsg, color: 'error' }); // English Hardcode
        } finally {
            localIsLoading.value = false;
        }
    }
}

function openRenameDialog(engine) {
    engineToRename.value = engine;
    renameEngineName.value = engine.name;
    isRenameDialogOpen.value = true;
}
async function confirmRenameEngine() {
    if (!engineToRename.value || !renameEngineName.value || !renameEngineName.value.trim()) {
        uiStore.showNotification({ text: 'Please enter a valid new name.', color: 'warning' }); // English Hardcode
        return;
    }
    let localIsLoading = ref(false);
    try {
        localIsLoading.value = true;
        const result = await apiUpdateEngine(engineToRename.value.id, { name: renameEngineName.value.trim() });
        if (result.error) throw new Error(result.error);
        uiStore.showNotification({ text: `Engine renamed to '${renameEngineName.value.trim()}'.`, color: 'success' }); // English Hardcode
        await engineStore.fetchEngines();
        isRenameDialogOpen.value = false;
    } catch (e) {
        const errorMsg = e.error || e.message || 'Failed to rename engine.'; // English Hardcode
        console.error('[MyEngines] Error renaming engine:', errorMsg); // English Hardcode
        uiStore.showNotification({ text: errorMsg, color: 'error' }); // English Hardcode
    } finally {
        localIsLoading.value = false;
    }
}

async function openShareDialog(engine) {
    engineToManageShares.value = engine;
    isShareDialogOpen.value = true;
    isShareLoading.value = true;
    sharesForEngine.value = [];
    newShareIdentifier.value = '';
    try {
        sharesForEngine.value = await engineStore.fetchEngineShares(engine.id);
    } finally {
        isShareLoading.value = false;
    }
}
async function handleGrantShare() {
    if (!engineToManageShares.value || !newShareIdentifier.value.trim()) return;
    isShareLoading.value = true;
    const success = await engineStore.grantShare(engineToManageShares.value.id, newShareIdentifier.value.trim());
    if (success) {
        newShareIdentifier.value = '';
        sharesForEngine.value = await engineStore.fetchEngineShares(engineToManageShares.value.id);
    }
    isShareLoading.value = false;
}
async function handleRevokeShare(sharedUserId) {
    isShareLoading.value = true;
    const success = await engineStore.revokeShare(engineToManageShares.value.id, sharedUserId);
    if (success) {
        sharesForEngine.value = await engineStore.fetchEngineShares(engineToManageShares.value.id);
    }
    isShareLoading.value = false;
}

onMounted(() => {
  engineStore.fetchEngines();
});
</script>

<style scoped>
.my-engines-page { height: 100%; overflow-y: auto; padding: 48px 0; }
.main-card { background: rgba(30, 30, 47, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
.orbitron-font { font-family: 'Orbitron', monospace; color: #f0f0f0; }
.action-button { font-weight: bold; color: #000 !important; }
.engine-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background-color 0.2s ease;
}
.engine-item:hover {
    background-color: rgba(0, 245, 255, 0.05);
}
.shared-item {
    opacity: 0.8;
}
.status-chip {
    min-width: 80px;
    justify-content: center;
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
</style>