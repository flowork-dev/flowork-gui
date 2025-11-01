//#######################################################################
//# WEBSITE https://flowork.cloud
//# File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\components.js
//# NOTE: (PENAMBAHAN KODE) Menambahkan `currentState.hasFetched = true;`
//#       di blok 'else' (socket disconnected) agar example data
//#       dianggap 'fetched' dan pencarian berfungsi normal.
//#######################################################################
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSocketStore } from './socket';
import { useLocaleStore } from './locale';
import exampleComponents from '@/../public/example/components.json';
import { apiGetUserComponentFavorites, apiSetUserComponentFavorites } from '@/api';
import { debounce } from '@/utils/debounce.js';
import { useAuthStore } from './auth';
import { useUiStore } from './ui';

// Helper function to create the initial state structure for each component type
const createComponentTypeState = () => ({
  items: [],
  isLoading: false, // Akan true hanya sangat singkat
  hasFetched: false, // Flag to indicate if real data has been fetched successfully
});

export const useComponentStore = defineStore('components', () => {
  // --- STATE ---
  const modules = ref(createComponentTypeState());
  const plugins = ref(createComponentTypeState());
  const tools = ref(createComponentTypeState());
  const triggers = ref(createComponentTypeState());
  const favoriteComponents = ref([]); // Menyimpan ID komponen favorit
  const installingComponentId = ref(null); // ID komponen yg sedang di-install
  const uninstallingComponentId = ref(null); // ID komponen yg sedang di-uninstall

  const fetchTimers = ref({}); // Object to store timeout IDs { [type]: { realDataTimeoutId } }
  const error = ref(null); // Optional: for storing fetch errors

  // --- GETTERS ---
  const isLoading = computed(() =>
    modules.value.isLoading ||
    plugins.value.isLoading ||
    tools.value.isLoading ||
    triggers.value.isLoading
  );

  const allComponents = computed(() => {
        const all = [];
        modules.value.items.forEach(m => all.push({ ...m, componentType: 'modules' }));
        plugins.value.items.forEach(p => all.push({ ...p, componentType: 'plugins' }));
        tools.value.items.forEach(t => all.push({ ...t, componentType: 'tools' }));
        triggers.value.items.forEach(t => all.push({ ...t, componentType: 'triggers' }));
        return all;
    });

    const findComponentById = (id) => {
        return allComponents.value.find(c => c.id === id);
    };

  // --- ACTIONS ---

  // --- (PENAMBAHAN KODE: FUNGSI YANG HILANG) ---
  /**
   * Clears timers for a specific component type. Helper function.
   * @param {string} type - Component type ('modules', 'plugins', etc.)
   */
  function clearTimersForType(type) {
    if (fetchTimers.value[type]) {
      clearTimeout(fetchTimers.value[type]?.realDataTimeoutId); // Hanya ada satu jenis timer sekarang
      delete fetchTimers.value[type];
      // console.log(`[ComponentStore] Cleared timers for ${type}.`); // English Hardcode
    }
  }
  // --- (AKHIR PENAMBAHAN KODE) ---

  const saveFavoritesDebounced = debounce(async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
        console.log("[ComponentStore] Debounced save: Sending updated component favorites to Gateway..."); // English Log
        await apiSetUserComponentFavorites(favoriteComponents.value);
        console.log("[ComponentStore] Debounced save: Component favorites successfully saved to Gateway."); // English Log
    } catch (error) {
        console.error("[ComponentStore] Debounced save: Failed to save component favorites:", error); // English Log
        const uiStore = useUiStore();
        uiStore.showNotification({ text: `Error saving component favorites: ${error.error || error.message}`, color: 'error'}); // English Hardcode
    }
  }, 1500); // Wait 1.5 seconds

  async function fetchUserFavorites() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
        console.log("[ComponentStore] Fetching user favorite components from Gateway..."); // English Log
        const favorites = await apiGetUserComponentFavorites();
        if (favorites.error) throw new Error(favorites.error);
        favoriteComponents.value = favorites;
        console.log(`[ComponentStore] User component favorites loaded: ${favorites.length} items.`); // English Log
    } catch (error) {
        console.error("[ComponentStore] Failed to fetch user component favorites:", error); // English Log
        favoriteComponents.value = [];
    }
  }

  function toggleFavorite(componentId) {
    const index = favoriteComponents.value.indexOf(componentId);
    if (index > -1) {
        favoriteComponents.value.splice(index, 1);
    } else {
        favoriteComponents.value.push(componentId);
    }
    saveFavoritesDebounced();
  }


  async function installComponent(componentType, componentId) {
    if (installingComponentId.value || uninstallingComponentId.value) {
        useUiStore().showNotification({ text: 'Another component operation is already in progress.', color: 'warning' }); // English Hardcode
        return;
    }
    const socketStore = useSocketStore();
    installingComponentId.value = componentId;
    try {
        await socketStore.sendMessage({
            type: 'install_component', // English Hardcode
            component_type: componentType,
            component_id: componentId,
        });
        useUiStore().showNotification({ text: `Installation started for ${componentId}...`, color: 'info' }); // English Hardcode
    } catch (e) {
        console.error("[ComponentStore] Failed to send install request:", e); // English Log
        useUiStore().showNotification({ text: `Failed to start installation: ${e.message}`, color: 'error' }); // English Hardcode
        installingComponentId.value = null;
    }
  }

  async function uninstallComponent(componentType, componentId) {
    if (installingComponentId.value || uninstallingComponentId.value) {
        useUiStore().showNotification({ text: 'Another component operation is already in progress.', color: 'warning' }); // English Hardcode
        return;
    }
    const socketStore = useSocketStore();
    uninstallingComponentId.value = componentId;
    try {
        await socketStore.sendMessage({
            type: 'uninstall_component', // English Hardcode
            component_type: componentType,
            component_id: componentId,
        });
        useUiStore().showNotification({ text: `Uninstalling ${componentId}...`, color: 'info' }); // English Hardcode
    } catch (e) {
        console.error("[ComponentStore] Failed to send uninstall request:", e); // English Log
        useUiStore().showNotification({ text: `Failed to start uninstallation: ${e.message}`, color: 'error' }); // English Hardcode
        uninstallingComponentId.value = null;
    }
  }

  function handleInstallStatusUpdate(data) {
    const { component_id, component_type, success, message, is_installed } = data;

    if (installingComponentId.value === component_id) installingComponentId.value = null;
    if (uninstallingComponentId.value === component_id) uninstallingComponentId.value = null;

    const uiStore = useUiStore();
    if (success) {
        uiStore.showNotification({ text: `${component_id}: ${message}`, color: 'success' }); // English Hardcode
    } else {
        uiStore.showNotification({ text: `${component_id}: ${message}`, color: 'error', timeout: 7000 }); // English Hardcode
    }

    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[component_type];
    if (stateRef && stateRef.value) {
        const item = stateRef.value.items.find(i => i.id === component_id);
        if (item) {
            item.is_installed = is_installed;
            console.log(`[ComponentStore] Updated install status for ${component_id}: ${is_installed}`); // English Log
        }
    }
  }


  function updateComponentsList(type, components) {
    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[type];

    if (stateRef && stateRef.value) {
      console.log(`[ComponentStore] Received ${components.length} REAL items for ${type}. Replacing examples.`); // English Hardcode
      clearTimersForType(type);

      stateRef.value.items = components.map(c => ({
          ...c,
          is_example: false,
          is_installed: c.is_installed || false
      }));
      stateRef.value.isLoading = false;
      stateRef.value.hasFetched = true;
      error.value = null;
      console.log(`[ComponentStore] Updated ${type} list from engine.`); // English Hardcode
    } else {
      console.warn(`[ComponentStore] Received update for unknown type: ${type}`); // English Hardcode
    }
  }

  async function fetchComponentsForType(type, options = { reset: false }) {
    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[type];
    if (!stateRef || !stateRef.value) {
        console.error(`[ComponentStore] Invalid component type requested: ${type}`); // English Hardcode
        return;
    }
    const currentState = stateRef.value;

    // (PERBAIKAN BUG) Panggil fungsi yang sudah kita tambahkan kembali
    clearTimersForType(type);

    if (options.reset) {
        console.log(`[ComponentStore] Resetting state for ${type}.`); // English Log
        currentState.items = [];
        currentState.hasFetched = false;
        currentState.isLoading = false;
    }
    if (currentState.hasFetched && !options.reset) {
        return;
    }
    currentState.isLoading = true;
    error.value = null;
    fetchTimers.value[type] = {};
    const localeStore = useLocaleStore();
    const exampleData = exampleComponents[type] || [];
    const translatedExamples = exampleData.map(comp => ({
        ...comp,
        name: localeStore.loc(comp.name) || comp.name,
        manifest: {
            ...comp.manifest,
            name: localeStore.loc(comp.manifest?.name) || comp.manifest?.name || comp.name,
            description: localeStore.loc(comp.manifest?.description) || comp.manifest?.description || ''
        },
        is_example: true,
        is_installed: false
    }));
    currentState.items = translatedExamples;
    currentState.isLoading = false;
    // (PERBAIKAN) Baris ini dipindahkan ke dalam 'else' di bawah
    // currentState.hasFetched = false;
    console.log(`[ComponentStore] Immediately showing EXAMPLE data for ${type}. Attempting real fetch in background...`); // English Log
    const socketStore = useSocketStore();
    const REAL_DATA_TIMEOUT = 10000;
    const handleRealDataTimeout = () => {
        if (!currentState.hasFetched) {
            console.warn(`[ComponentStore] Timeout (${REAL_DATA_TIMEOUT/1000}s) waiting for REAL ${type} data. Examples remain displayed.`); // English Hardcode
            // (PENAMBAHAN KODE) Set hasFetched ke true agar tidak mencoba lagi
            currentState.hasFetched = true;
        }
        clearTimersForType(type);
    };

    // --- (PERBAIKAN KODE: BUG SEARCH KOSONG) ---
    // Hanya coba kirim pesan jika WebSocket KONEK.
    // Jika tidak, biarkan example data yang tampil.
    if (socketStore.isConnected) {
        try {
            // (PERBAIKAN) Kita tidak 'await' sendMessage karena ingin proses ini jalan di background
            socketStore.sendMessage({ type: 'request_components_list', component_type: type });
            console.log(`[ComponentStore] Sent request for real ${type} data.`); // English Log
            fetchTimers.value[type].realDataTimeoutId = setTimeout(handleRealDataTimeout, REAL_DATA_TIMEOUT);
        } catch (e) {
            // Error saat mengirim pesan (jarang terjadi jika socketStore.sendMessage punya error handling)
            console.error(`[ComponentStore] Error sending request for ${type}: ${e}`); // English Log
            // Biarkan data example tetap tampil
            clearTimersForType(type);
            currentState.hasFetched = true; // (PENAMBAHAN KODE) Tandai sebagai fetched
        }
    } else {
        // Jika tidak konek, jangan kirim pesan. Biarkan example data tampil.
        console.log(`[ComponentStore] Socket not connected. Skipping real data fetch for ${type}. Examples will be shown.`); // English Hardcode
        // (PENAMBAHAN KODE) Tetapkan hasFetched ke true agar pencarian
        // dan navigasi tab berfungsi dengan example data.
        currentState.hasFetched = true;
    }
    // --- (AKHIR PERBAIKAN KODE) ---
  }

  // --- RETURN ---
  return {
    // State refs
    modules, plugins, tools, triggers,
    favoriteComponents,
    installingComponentId,
    uninstallingComponentId,
    // Computed getters
    isLoading,
    allComponents,
    // Actions
    fetchComponentsForType,
    updateComponentsList,
    findComponentById,
    fetchUserFavorites,
    toggleFavorite,
    installComponent,
    uninstallComponent,
    handleInstallStatusUpdate,
    error
  };
});