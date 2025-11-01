import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSocketStore } from './socket';
import { ethers } from 'ethers';
import { useUiStore } from './ui';
import { apiDownloadLicenseFile, apiGetProfile } from '@/api'; // (PERBAIKAN) Import apiGetProfile
import { useEngineStore } from './engines';
// --- PENAMBAHAN KODE ---
import { useWorkflowStore } from './workflow'; // Import workflow store
import { useComponentStore } from './components'; // Import component store
// --- (PENAMBAHAN KODE) ---
import { useSettingsStore } from './settings'; // Import settings store
// --- (AKHIR PENAMBAHAN KODE) ---
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  // --- STATE (Crypto Based) ---
  const privateKey = ref(localStorage.getItem('flowork_private_key')); // English Hardcode
  const user = ref(JSON.parse(localStorage.getItem('flowork_user_identity'))); // English Hardcode
  const isMnemonicDialogVisible = ref(false);
  const newMnemonic = ref('');
  const isLoading = ref(false);
  const error = ref(null);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!privateKey.value && !!user.value);
  const hasPermission = computed(() => (permissionName) => isAuthenticated.value); // Open Core: always true if logged in

  // --- ACTIONS ---

  /**
   * Orchestration after successful crypto login/auto-login.
   */
  async function handleLoginSuccess() {
    console.log("[AuthStore] Crypto Login successful. Handling post-login sequence..."); // English Log

    const engineStore = useEngineStore();
    const socketStore = useSocketStore();
    const uiStore = useUiStore();
    // --- PENAMBAHAN KODE ---
    const workflowStore = useWorkflowStore(); // Get workflow store instance
    const componentStore = useComponentStore(); // Get component store instance
    // --- (PENAMBAHAN KODE) ---
    const settingsStore = useSettingsStore(); // Get settings store instance


    // (PERBAIKAN) Call apiGetProfile to sync user data (including username) from Gateway
    try {
        console.log("[AuthStore] Syncing user profile from Gateway..."); // English Log
        const profileData = await apiGetProfile();
        if (profileData.error) throw new Error(profileData.error);

        // Update local user state with data from server
        const syncedIdentity = {
            id: profileData.public_address, // Main ID is public address
            publicKey: user.value?.publicKey, // publicKey isn't on server, keep local if exists
            username: profileData.username, // Get username from server (could be 'awenk' or 0x...)
            email: profileData.email // Get email from server
        };
        localStorage.setItem('flowork_user_identity', JSON.stringify(syncedIdentity)); // English Hardcode
        user.value = syncedIdentity;
        console.log("[AuthStore] User profile synced:", syncedIdentity); // English Log

    } catch (e) {
        console.error("[AuthStore] Failed to sync profile after login:", e.message); // English Log
        // If sync fails, proceed with local data (Gateway might be offline)
        // User is still authenticated locally.
    }

    // --- PENAMBAHAN KODE ---
    // Fetch favorite presets AFTER user identity is confirmed/synced
    await workflowStore.fetchUserFavorites();
    // Fetch favorite components
    await componentStore.fetchUserFavorites();
    // --- AKHIR PENAMBAHAN KODE ---

    // 1. Fetch engine list
    console.log("[AuthStore] Fetching engine list from Gateway..."); // English Log
    await engineStore.fetchEngines();

    // 2. Check if user has any engines
    if (engineStore.allAvailableEngines.length === 0) {
        console.warn("[AuthStore] User has no engines registered. Stopping connection sequence."); // English Log
        uiStore.showNotification({ text: "Login successful, but no engines are registered. Please register an engine in 'My Engines'.", color: 'warning', timeout: 7000 }); // English Hardcode

        // Redirect to engine management if not already there
        if (router.currentRoute.value.name !== 'MyEngines') { // English Hardcode
            router.push({ name: 'MyEngines' }); // English Hardcode
        }
        return; // Stop the sequence here
    }

    // 3. Initiate WebSocket connection (using the potentially auto-selected engine)
    console.log(`[AuthStore] Engine list fetched. Selected engine: ${engineStore.selectedEngineId}. Connecting WebSocket...`); // English Log
    socketStore.connect(); // This will use the selectedEngineId from engineStore

    // --- (PERBAIKAN KUNCI) ---
    // 4. Fetch settings
    // (KOMENTAR) Panggilan ini dihapus. socketStore.connect() akan memicu
    // 'request_settings' pada event 'onopen', dan listener 'onmessage'
    // di socket.js akan memuat data ke settingsStore.
    // await settingsStore.fetchSettings();
    // --- (AKHIR PERBAIKAN KUNCI) ---

    // 5. Handle redirection based on original request or default
    const route = router.currentRoute.value;
    if (route.query.redirect) {
      router.push(route.query.redirect);
    } else if (['Lander', 'Login', 'Register'].includes(router.currentRoute.value.name)) { // English Hardcode
        // Redirect from public pages to the main app view after login
        router.push({ name: 'Designer' }); // English Hardcode
    }
    // If already on an authenticated page, do nothing extra here.
  }

  /**
   * Generates a new random private key and mnemonic phrase.
   * Stores them temporarily and shows the backup dialog.
   */
  async function createNewIdentity() {
    isLoading.value = true;
    error.value = null;
    try {
      const wallet = ethers.Wallet.createRandom();
      newMnemonic.value = wallet.mnemonic.phrase; // Get the 12 words
      isMnemonicDialogVisible.value = true; // Show backup dialog
      // Store key and identity temporarily until confirmed
      localStorage.setItem('flowork_private_key_temp', wallet.privateKey); // English Hardcode

      // Use FULL PUBLIC ADDRESS as username and ID
      const identity = {
          id: wallet.address, // ID is the public address
          publicKey: wallet.publicKey,
          username: wallet.address // Username is also the public address
      };
      localStorage.setItem('flowork_user_identity_temp', JSON.stringify(identity)); // English Hardcode
      return true;
    } catch (e) {
      error.value = e.message || "Failed to create identity."; // English Hardcode
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Confirms the user has backed up the mnemonic.
   * Finalizes the identity creation by moving temp data to permanent storage.
   * Triggers the post-login sequence.
   */
  async function handleBackupConfirmation() {
      // Retrieve temporary data
      const tempKey = localStorage.getItem('flowork_private_key_temp'); // English Hardcode
      const tempIdentity = localStorage.getItem('flowork_user_identity_temp'); // English Hardcode
      if (!tempKey || !tempIdentity) {
          error.value = "Failed to finalize identity. Temporary data not found."; // English Hardcode
          isMnemonicDialogVisible.value = false; // Close dialog on error
          return false;
      }
      // Move temp data to permanent storage
      localStorage.setItem('flowork_private_key', tempKey); // English Hardcode
      localStorage.setItem('flowork_user_identity', tempIdentity); // English Hardcode
      privateKey.value = tempKey;
      user.value = JSON.parse(tempIdentity);

      // Clean up temporary data
      localStorage.removeItem('flowork_private_key_temp'); // English Hardcode
      localStorage.removeItem('flowork_user_identity_temp'); // English Hardcode

      // Close dialog and reset mnemonic display
      isMnemonicDialogVisible.value = false;
      newMnemonic.value = '';

      // Run the post-login sequence (fetch engines, connect socket, etc.)
      await handleLoginSuccess();
      return true;
  }

  /**
   * Imports an identity using a private key (0x...) or mnemonic phrase.
   * Stores the key/identity and triggers the post-login sequence.
   */
  async function importIdentity(keyOrMnemonic) {
    isLoading.value = true;
    error.value = null;
    let wallet;
    try {
        // Determine if input is private key or mnemonic and create wallet
        wallet = keyOrMnemonic.startsWith('0x') ? new ethers.Wallet(keyOrMnemonic) : ethers.Wallet.fromPhrase(keyOrMnemonic); // English Hardcode
        localStorage.setItem('flowork_private_key', wallet.privateKey); // English Hardcode

        // Use FULL PUBLIC ADDRESS as username and ID
        const identity = {
            id: wallet.address, // ID is the public address
            publicKey: wallet.publicKey,
            username: wallet.address // Username is the public address
        };
        localStorage.setItem('flowork_user_identity', JSON.stringify(identity)); // English Hardcode
        privateKey.value = wallet.privateKey;
        user.value = identity;

        // Run the post-login sequence
        await handleLoginSuccess();
        return true;
    } catch (e) {
        console.error("Error importing identity:", e); // English log
        error.value = "Invalid Private Key or Mnemonic Phrase."; // English Hardcode
        return false;
    } finally {
        isLoading.value = false;
    }
  }

  /**
   * Requests and initiates the download of the license certificate file.
   */
  async function downloadLicenseFile() {
      const uiStore = useUiStore();
      if (!isAuthenticated.value) {
          uiStore.showNotification({ text: 'You must be logged in to download a license.', color: 'error' }); // English Hardcode
          return;
      }
      uiStore.showNotification({ text: 'Requesting license file from server...', color: 'info' }); // English Hardcode
      try {
          const licenseContent = await apiDownloadLicenseFile();
          if (licenseContent.error) throw new Error(licenseContent.error);

          // Create downloadable file
          const licenseString = JSON.stringify(licenseContent, null, 2);
          const blob = new Blob([licenseString], { type: 'application/json' }); // English Hardcode
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'license.lic'; // Default filename // English Hardcode
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          uiStore.showNotification({ text: 'License file download started!', color: 'success' }); // English Hardcode
      } catch (error) {
          uiStore.showNotification({ text: error.message || 'Could not download license file.', color: 'error' }); // English Hardcode
      }
  }

  /**
   * Logs the user out by clearing local storage and state.
   * Disconnects WebSocket and reloads the page.
   */
  async function logout() {
    const socketStore = useSocketStore();
    socketStore.disconnect(); // Disconnect WebSocket
    privateKey.value = null; // Clear state
    user.value = null;
    localStorage.removeItem('flowork_private_key'); // English Hardcode
    localStorage.removeItem('flowork_user_identity'); // English Hardcode
    localStorage.removeItem('flowork_selected_engine_id'); // English Hardcode
    window.location.reload(); // Force reload to clear everything
  }

  /**
   * Special logout handler called by API interceptor on 401 errors.
   */
  function handleLogoutError() {
      console.warn("[AuthStore] handleLogoutError called (e.g., 401 Unauthorized). Logging out fully."); // English Log
      logout(); // Perform full logout
  }

  /**
   * Attempts to auto-login using credentials stored in localStorage on app startup.
   */
  async function tryAutoLogin() {
    isLoading.value = true;
    if (privateKey.value && user.value) {
      // If key and identity exist locally, proceed with post-login sequence
      console.log("[AuthStore] Found existing local identity. Handling post-login sequence..."); // English Hardcode
      await handleLoginSuccess();
    } else {
        console.log("[AuthStore] No local identity found. Waiting for user action."); // English Hardcode
    }
    isLoading.value = false;
  }

  return {
    // State
    user, privateKey, isAuthenticated, isLoading, error,
    isMnemonicDialogVisible, newMnemonic,
    // Getters
    hasPermission,
    // Actions
    logout, tryAutoLogin, createNewIdentity, importIdentity, handleBackupConfirmation,
    downloadLicenseFile,
    handleLoginSuccess, // Expose for potential external use if needed
    handleLogoutError // Expose for interceptor
  };
});