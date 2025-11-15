//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\components.js total lines 291 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSocketStore } from './socket';
import { useLocaleStore } from './locale';
import exampleComponents from '../../public/example/components.json';
import { apiGetUserComponentFavorites, apiSetUserComponentFavorites } from '@/api';
import { debounce } from '@/utils/debounce.js';
import { useAuthStore } from './auth';
import { useUiStore } from './ui';

const createComponentTypeState = () => ({
  items: [],
  isLoading: false,
  hasFetched: false,
});

export const useComponentStore = defineStore('components', () => {
  const modules = ref(createComponentTypeState());
  const plugins = ref(createComponentTypeState());
  const tools = ref(createComponentTypeState());
  const triggers = ref(createComponentTypeState());
  const favoriteComponents = ref([]);
  const installingComponentId = ref(null);
  const uninstallingComponentId = ref(null);

  const fetchTimers = ref({});
  const error = ref(null);

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


  /**
   * Clears timers for a specific component type. Helper function.
   * @param {string} type - Component type ('modules', 'plugins', etc.)
   */
  function clearTimersForType(type) {
    if (fetchTimers.value[type]) {
      clearTimeout(fetchTimers.value[type]?.realDataTimeoutId);
      delete fetchTimers.value[type];
    }
  }

  const saveFavoritesDebounced = debounce(async () => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
        console.log("[ComponentStore] Debounced save: Sending updated component favorites to Gateway...");
        await apiSetUserComponentFavorites(favoriteComponents.value);
        console.log("[ComponentStore] Debounced save: Component favorites successfully saved to Gateway.");
    } catch (error) {
        console.error("[ComponentStore] Debounced save: Failed to save component favorites:", error);
        const uiStore = useUiStore();
        uiStore.showNotification({ text: `Error saving component favorites: ${error.error || error.message}`, color: 'error'});
    }
  }, 1500);

  async function fetchUserFavorites() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
        console.log("[ComponentStore] Fetching user favorite components from Gateway...");
        const favorites = await apiGetUserComponentFavorites();
        if (favorites.error) throw new Error(favorites.error);
        favoriteComponents.value = favorites;
        console.log(`[ComponentStore] User component favorites loaded: ${favorites.length} items.`);
    } catch (error) {
        console.error("[ComponentStore] Failed to fetch user component favorites:", error);
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
        useUiStore().showNotification({ text: 'Another component operation is already in progress.', color: 'warning' });
        return;
    }
    const socketStore = useSocketStore();
    installingComponentId.value = componentId;
    try {
        await socketStore.sendMessage({
            type: 'install_component',
            component_type: componentType,
            component_id: componentId,
        });
        useUiStore().showNotification({ text: `Installation started for ${componentId}...`, color: 'info' });
    } catch (e) {
        console.error("[ComponentStore] Failed to send install request:", e);
        useUiStore().showNotification({ text: `Failed to start installation: ${e.message}`, color: 'error' });
        installingComponentId.value = null;
    }
  }

  async function uninstallComponent(componentType, componentId) {
    if (installingComponentId.value || uninstallingComponentId.value) {
        useUiStore().showNotification({ text: 'Another component operation is already in progress.', color: 'warning' });
        return;
    }
    const socketStore = useSocketStore();
    uninstallingComponentId.value = componentId;
    try {
        await socketStore.sendMessage({
            type: 'uninstall_component',
            component_type: componentType,
            component_id: componentId,
        });
        useUiStore().showNotification({ text: `Uninstalling ${componentId}...`, color: 'info' });
    } catch (e) {
        console.error("[ComponentStore] Failed to send uninstall request:", e);
        useUiStore().showNotification({ text: `Failed to start uninstallation: ${e.message}`, color: 'error' });
        uninstallingComponentId.value = null;
    }
  }

  function handleInstallStatusUpdate(data) {
    const { component_id, component_type, success, message, is_installed } = data;

    if (installingComponentId.value === component_id) installingComponentId.value = null;
    if (uninstallingComponentId.value === component_id) uninstallingComponentId.value = null;

    const uiStore = useUiStore();
    if (success) {
        uiStore.showNotification({ text: `${component_id}: ${message}`, color: 'success' });
    } else {
        uiStore.showNotification({ text: `${component_id}: ${message}`, color: 'error', timeout: 7000 });
    }

    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[component_type];
    if (stateRef && stateRef.value) {
        const item = stateRef.value.items.find(i => i.id === component_id);
        if (item) {
            item.is_installed = is_installed;
            console.log(`[ComponentStore] Updated install status for ${component_id}: ${is_installed}`);
        }
    }
  }


  function updateComponentsList(type, components) {
    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[type];

    if (stateRef && stateRef.value) {
      console.log(`[ComponentStore] Received ${components.length} REAL items for ${type}. Replacing examples.`);

      stateRef.value.items = components.map(c => ({
          ...c,
          is_example: false,
          is_installed: c.is_installed || false
      }));
      stateRef.value.isLoading = false;
      stateRef.value.hasFetched = true;
      error.value = null;
      console.log(`[ComponentStore] Updated ${type} list from engine.`);
    } else {
      console.warn(`[ComponentStore] Received update for unknown type: ${type}`);
    }
  }

  async function fetchComponentsForType(type, options = { reset: false }) {
    const stateMap = { modules, plugins, tools, triggers };
    const stateRef = stateMap[type];
    if (!stateRef || !stateRef.value) {
        console.error(`[ComponentStore] Invalid component type requested: ${type}`);
        return;
    }
    const currentState = stateRef.value;

    clearTimersForType(type);

    if (options.reset) {
        console.log(`[ComponentStore] Resetting state for ${type}.`);
        currentState.items = [];
        currentState.hasFetched = false;
        currentState.isLoading = false;
    }
    if (currentState.hasFetched && !options.reset) {
        return;
    }

    currentState.isLoading = true;
    error.value = null;
    const localeStore = useLocaleStore();
    const exampleData = exampleComponents[type] || [];
    const translatedExamples = exampleData.map(c => ({
        ...c,
        name: localeStore.loc(c.name) || c.name,
        manifest: {
            ...c.manifest,
            name: localeStore.loc(c.manifest?.name) || c.manifest?.name || c.name,
            description: localeStore.loc(c.manifest?.description) || c.manifest?.description || ''
        },
        is_example: true,
        is_installed: false
    }));
    currentState.items = translatedExamples;
    currentState.isLoading = true;


    const socketStore = useSocketStore();
    if (socketStore.isConnected) {
        try {
            socketStore.sendMessage({ type: 'request_components_list', component_type: type });
            console.log(`[ComponentStore] Sent request for real ${type} data.`);
        } catch (e) {
            console.error(`[ComponentStore] Error sending request for ${type}: ${e}`);
            currentState.isLoading = false;
            currentState.hasFetched = false;
        }
    } else {
        console.log(`[ComponentStore] Socket not connected. Skipping real data fetch for ${type}. Examples will be shown.`);
        currentState.isLoading = false;
        currentState.hasFetched = false;
    }
  }

  async function fetchAllComponents() {
      console.log("[ComponentStore] Fetching ALL component types...");
      await Promise.all([
          fetchComponentsForType('modules'),
          fetchComponentsForType('plugins'),
          fetchComponentsForType('tools'),
          fetchComponentsForType('triggers')
      ]);
  }

  async function forceRefetchAllComponents() {
      console.log("[ComponentStore] FORCED refetch ALL component types (reset).");
      await Promise.all([
          fetchComponentsForType('modules',  { reset: true }),
          fetchComponentsForType('plugins',  { reset: true }),
          fetchComponentsForType('tools',    { reset: true }),
          fetchComponentsForType('triggers', { reset: true })
      ]);
  }

  return {
    modules, plugins, tools, triggers,
    favoriteComponents,
    installingComponentId,
    uninstallingComponentId,
    isLoading,
    allComponents,
    fetchComponentsForType,
    fetchAllComponents,
    forceRefetchAllComponents,
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
