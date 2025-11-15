//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\auth.js total lines 207 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSocketStore } from './socket';
import { ethers } from 'ethers';
import { useUiStore } from './ui';
import { apiDownloadLicenseFile, apiGetProfile } from '@/api';
import { useEngineStore } from './engines';
import { useWorkflowStore } from './workflow';
import { useComponentStore } from './components';
import { useSettingsStore } from './settings';
import { useProfileStore } from './profile';

export const useAuthStore = defineStore('auth', () => {
  const privateKey = ref(localStorage.getItem('flowork_private_key'));
  const user = ref(JSON.parse(localStorage.getItem('flowork_user_identity')));
  const isMnemonicDialogVisible = ref(false);
  const newMnemonic = ref('');
  const isLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!privateKey.value && !!user.value);
  const hasPermission = computed(() => (permissionName) => isAuthenticated.value);

  async function handleLoginSuccess() {
    console.log("[AuthStore] handleLoginSuccess called. Syncing with GATEWAY...");
    const router = (await import('@/router')).default;

    const engineStore = useEngineStore();
    const socketStore = useSocketStore();
    const uiStore = useUiStore();
    const workflowStore = useWorkflowStore();
    const componentStore = useComponentStore();
    const settingsStore = useSettingsStore();
    const profileStore = useProfileStore();
    await new Promise(resolve => setTimeout(resolve, 50));
    await workflowStore.fetchUserFavorites();
    await componentStore.fetchUserFavorites();

    console.log("[AuthStore] Fetching engine list from Gateway...");
    await engineStore.fetchEngines();
    if (engineStore.allAvailableEngines.length === 0) {
        console.warn("[AuthStore] User has no engines registered. Stopping connection sequence.");
        uiStore.showNotification({ text: "Login successful, but no engines are registered. Please register an engine in 'My Engines'.", color: 'warning', timeout: 7000 });
        const currentRoute = router.currentRoute.value;
        if (currentRoute.meta.requiresAuth && currentRoute.name !== 'MyEngines') {
             console.log(`[AuthStore] User is on private page '${currentRoute.name}', forcing redirect to 'MyEngines'.`);
             router.push({ name: 'MyEngines' });
        } else {
             console.log(`[AuthStore] User is on public page '${currentRoute.name}', allowing them to stay.`);
        }
        return;
    }
    console.log(`[AuthStore] Engine list fetched. Selected engine: ${engineStore.selectedEngineId}. Connecting WebSocket...`);
    socketStore.connect();

  }

  async function createNewIdentity() {
    isLoading.value = true;
    error.value = null;
    try {
      const wallet = ethers.Wallet.createRandom();
      newMnemonic.value = wallet.mnemonic.phrase;
      isMnemonicDialogVisible.value = true;
      localStorage.setItem('flowork_private_key_temp', wallet.privateKey);
      const identity = {
          id: wallet.address,
          publicKey: wallet.publicKey,
          username: wallet.address
      };
      localStorage.setItem('flowork_user_identity_temp', JSON.stringify(identity));
      return true;
    } catch (e) {
      error.value = e.message || "Failed to create identity.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleBackupConfirmation() {
       const tempKey = localStorage.getItem('flowork_private_key_temp');
       const tempIdentity = localStorage.getItem('flowork_user_identity_temp');
       if (!tempKey || !tempIdentity) {
           error.value = "Failed to finalize identity. Temporary data not found.";
           isMnemonicDialogVisible.value = false;
           return false;
       }
       localStorage.setItem('flowork_private_key', tempKey);
       localStorage.setItem('flowork_user_identity', tempIdentity);
       privateKey.value = tempKey;
       user.value = JSON.parse(tempIdentity);

       localStorage.removeItem('flowork_private_key_temp');
       localStorage.removeItem('flowork_user_identity_temp');

       isMnemonicDialogVisible.value = false;
       newMnemonic.value = '';


       return true;
  }

  async function importIdentity(keyOrMnemonic) {
    isLoading.value = true;
    error.value = null;
    let wallet;
    try {
        wallet = keyOrMnemonic.startsWith('0x') ? new ethers.Wallet(keyOrMnemonic) : ethers.Wallet.fromPhrase(keyOrMnemonic);
      localStorage.setItem('flowork_private_key', wallet.privateKey);
        const identity = {
            id: wallet.address,
            publicKey: wallet.publicKey,
            username: wallet.address
        };
        localStorage.setItem('flowork_user_identity', JSON.stringify(identity));
        privateKey.value = wallet.privateKey;
        user.value = identity;


        return true;
    } catch (e) {
        console.error("Error importing identity:", e);
        error.value = "Invalid Private Key or Mnemonic Phrase.";
        return false;
    } finally {
        isLoading.value = false;
    }
  }

  async function downloadLicenseFile() {
       const uiStore = useUiStore();
       if (!isAuthenticated.value) {
           uiStore.showNotification({ text: 'You must be logged in to download a license.', color: 'error' });
           return;
       }
       uiStore.showNotification({ text: 'Requesting license file from server...', color: 'info' });
       try {
           const licenseContent = await apiDownloadLicenseFile();
           if (licenseContent.error) throw new Error(licenseContent.error);

           const licenseString = JSON.stringify(licenseContent, null, 2);
           const blob = new Blob([licenseString], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = 'license.lic';
           document.body.appendChild(a);
           a.click();
             document.body.removeChild(a);
           URL.revokeObjectURL(url);
           uiStore.showNotification({ text: 'License file download started!', color: 'success' });
       } catch (error) {
           uiStore.showNotification({ text: error.message || 'Could not download license file.', color: 'error' });
       }
  }

  async function logout() {
    const socketStore = useSocketStore();
    socketStore.disconnect();
    privateKey.value = null;
    user.value = null;
    const profileStore = useProfileStore();
    profileStore.clearProfile();

    localStorage.removeItem('flowork_private_key');
    localStorage.removeItem('flowork_user_identity');
    localStorage.removeItem('flowork_selected_engine_id');

    const router = (await import('@/router')).default;
    router.push({ name: 'Lander' });

    window.location.reload();
  }
  function handleLogoutError() {
       console.warn("[AuthStore] handleLogoutError called (e.g., 401 Unauthorized). Logging out fully.");
       logout();
  }

  async function tryAutoLogin() {
    isLoading.value = true;
   if (privateKey.value && user.value) {
     console.log("[AuthStore] Found existing local identity. Handling post-login sequence...");
   } else {
        console.log("[AuthStore] No local identity found. Waiting for user action.");
   }
    isLoading.value = false;
  }

  return {

    user, privateKey, isAuthenticated, isLoading, error,
    isMnemonicDialogVisible, newMnemonic,

    hasPermission,

    logout, tryAutoLogin, createNewIdentity, importIdentity, handleBackupConfirmation,
    handleLogoutError,
    handleLoginSuccess
};
});
