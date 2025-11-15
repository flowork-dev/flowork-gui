<template>
  <div>
    <h2 class="section-title">{{ loc('settings_section_cloud_sync') }}</h2>
    <SettingsField :label="loc('settings_sync_title')" :hint="loc('settings_sync_description')">
      <div class="d-flex" style="gap: 16px;">
        <v-btn
          variant="tonal"
          color="primary"
          @click="openDialog('backup')"
          :disabled="!isEngineOnline"
          :loading="isBackupLoading"
        >
          {{ loc('settings_sync_backup_btn') }}
        </v-btn>
        <v-btn
          variant="tonal"
          color="warning"
          @click="openDialog('restore')"
          :disabled="!isEngineOnline"
          :loading="isRestoreLoading"
        >
          {{ loc('settings_sync_restore_btn') }}
        </v-btn>
      </div>
       <div v-if="!isEngineOnline" class="text-caption text-warning mt-2">
        An engine must be online to perform backup or restore.
      </div>
    </SettingsField>

    <v-dialog v-model="isDialogOpen" max-width="500px" persistent>
      <v-card class="dialog-card">
        <v-card-title class="orbitron-font">{{ dialog.title }}</v-card-title>
        <v-card-text>
          <v-alert v-if="dialog.mode === 'restore'" type="warning" variant="tonal" density="compact" class="mb-4">
            {{ loc('settings_sync_dialog_warning') }}
          </v-alert>
          <v-text-field
            v-model="password"
            :label="loc('settings_sync_dialog_password_label')"
            type="password"
            variant="outlined"
            density="compact"
            autofocus
            @keyup.enter="handleConfirm"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isDialogOpen = false">Cancel</v-btn>
          <v-btn :color="dialog.color" variant="flat" @click="handleConfirm" :loading="isBackupLoading || isRestoreLoading" class="action-button">
            {{ dialog.actionText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useEngineStore } from '@/store/engines';
import { useUiStore } from '@/store/ui';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';
import SettingsField from '@/components/settings/SettingsField.vue';
import { wsOnlyError } from '@/api';


const authStore = useAuthStore();
const engineStore = useEngineStore();
const uiStore = useUiStore();
const localeStore = useLocaleStore();

const { user } = storeToRefs(authStore);
const { allAvailableEngines } = storeToRefs(engineStore);
const { loc } = storeToRefs(localeStore);

const isDialogOpen = ref(false);
const dialog = ref({ mode: '', title: '', actionText: '', color: '' });
const password = ref('');
const isBackupLoading = ref(false);
const isRestoreLoading = ref(false);

const isEngineOnline = computed(() => allAvailableEngines.value.some(e => e.status === 'online'));

function openDialog(mode) {
  password.value = '';
  if (mode === 'backup') {
    dialog.value = {
      mode: 'backup',
      title: loc.value('settings_sync_dialog_backup_title'),
      actionText: loc.value('settings_sync_dialog_backup_action'),
      color: 'primary'
    };
  } else {
    dialog.value = {
      mode: 'restore',
      title: loc.value('settings_sync_dialog_restore_title'),
      actionText: loc.value('settings_sync_dialog_restore_action'),
      color: 'warning'
    };
  }
  isDialogOpen.value = true;
}

async function handleConfirm() {
  if (!password.value) {
    uiStore.showNotification({ text: 'Password is required.', color: 'error' });
    return;
  }

  if (dialog.value.mode === 'backup') {
    isBackupLoading.value = true;
    try {
      const response = await wsOnlyError('apiTriggerBackup');
      if (response.error) throw new Error(response.error);
      uiStore.showNotification({ text: response.message || 'Backup initiated successfully!', color: 'success' });
    } catch (error) {
      uiStore.showNotification({ text: error.error || error.message || 'Failed to start backup.', color: 'error' });
    } finally {
      isBackupLoading.value = false;
      isDialogOpen.value = false;
    }
  } else if (dialog.value.mode === 'restore') {
    isRestoreLoading.value = true;
    try {
      const response = await wsOnlyError('apiTriggerRestore');
      if (response.error) throw new Error(response.error);
      uiStore.showNotification({ text: response.message || 'Restore initiated! The engine will restart.', color: 'success' });
    } catch (error) {
      uiStore.showNotification({ text: error.error || error.message || 'Failed to start restore.', color: 'error' });
    } finally {
      isRestoreLoading.value = false;
      isDialogOpen.value = false;
    }
  }
}
</script>

<style scoped>
.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  margin-bottom: 32px;
  color: #f0f0f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
}
.tier-lock {
  display: flex;
  align-items: center;
  background-color: rgba(255, 193, 7, 0.1);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #FFC107;
  font-size: 0.9rem;
}
.dialog-card {
  background-color: #2a2a4a;
  border: 1px solid var(--neon-cyan);
}
.action-button {
  font-weight: bold;
  color: #000 !important;
}
</style>
