//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\ui.js total lines 212 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useUiStore = defineStore('ui', () => {
  const isToolboxOpen = ref(true);
  const activeRightPanel = ref(null);
  const isPropertiesPanelPinned = ref(false);
  const isFooterPinned = ref(false);
  const isDataViewerVisible = ref(false);
  const dataViewerContent = ref({});
  const notifications = ref([]);
  const designerMode = ref('logic');
  const isConnectEngineDialogVisible = ref(false);
  const isStandaloneRunnerVisible = ref(false);
  const standaloneRunnerComponent = ref(null);
  const isCommandPaletteVisible = ref(false);

  const confirmation = ref({
    visible: false,
    title: 'Confirm',
    text: 'Are you sure?',
    color: 'warning',
    icon: 'mdi-alert-outline',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    resolve: null,
  });

  const tokenDialog = ref({
    visible: false,
    title: 'Your Token',
    text: 'Please copy this token.',
    items: []
  });

  function toggleToolbox() {
    isToolboxOpen.value = !isToolboxOpen.value;
  }

  function setActiveRightPanel(panelName) {
    if (activeRightPanel.value === panelName) {
      activeRightPanel.value = null;
    } else {
      activeRightPanel.value = panelName;
    }
  }

  function closeRightPanel() {
    if (isPropertiesPanelPinned.value && activeRightPanel.value === 'properties') {
      return;
    }
    activeRightPanel.value = null;
  }

  function togglePropertiesPanelPin() {
    isPropertiesPanelPinned.value = !isPropertiesPanelPinned.value;
    if (isPropertiesPanelPinned.value && activeRightPanel.value !== 'properties') {
      activeRightPanel.value = 'properties';
    }
  }

  async function setFooterPin(isPinned) {
      isFooterPinned.value = isPinned;
      const { useSettingsStore } = await import('@/store/settings');
      const settingsStore = useSettingsStore();
      settingsStore.saveSetting('ui_footer_pinned', isPinned);
  }

  function loadUiPreferences(settingsData) {
      if (settingsData && settingsData.ui_footer_pinned !== undefined) {
          isFooterPinned.value = settingsData.ui_footer_pinned;
          console.log(`[UI Store] Footer pin state loaded: ${isFooterPinned.value}`);
      }
  }

  function showDataViewer(data) {
    dataViewerContent.value = data;
    isDataViewerVisible.value = true;
    console.log("[UI Store] Showing DataViewer with title:", data.title);
  }

  function hideDataViewer() {
    isDataViewerVisible.value = false;
    dataViewerContent.value = {};
  }

  function showNotification({ text, color = 'info', timeout = 4000 }) {
    const id = uuidv4();
    notifications.value.unshift({ id, text, color, timeout, model: true });
    if (notifications.value.length > 5) {
        notifications.value.pop();
    }
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }

  function setDesignerMode(mode) {
    designerMode.value = mode;
  }

  function showConnectEngineDialog() {
    isConnectEngineDialogVisible.value = true;
  }

  function hideConnectEngineDialog() {
    isConnectEngineDialogVisible.value = false;
  }

  function showStandaloneRunner(componentData) {
    standaloneRunnerComponent.value = componentData;
    isStandaloneRunnerVisible.value = true;
  }

  function hideStandaloneRunner() {
    isStandaloneRunnerVisible.value = false;
    setTimeout(() => {
        standaloneRunnerComponent.value = null;
    }, 300);
  }

  function showCommandPalette() {
    isCommandPaletteVisible.value = true;
  }
  function hideCommandPalette() {
    isCommandPaletteVisible.value = false;
  }

  function showConfirmation(options = {}) {
    return new Promise((resolve) => {
        confirmation.value = {
            visible: true,
            title: options.title || 'Confirm Action',
            text: options.text || 'Are you sure you want to proceed?',
            color: options.color || 'warning',
            icon: options.icon || 'mdi-alert-outline',
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            resolve: resolve,
        };
    });
  }

  function answerConfirmation(response) {
    if (confirmation.value.resolve) {
      confirmation.value.resolve(response);
    }
    confirmation.value.visible = false;
  }

  function showTokenDialog(options = {}) {
    tokenDialog.value = {
        visible: true,
        title: options.title || 'Your Token',
        text: options.text || 'Please copy the following credentials:',
        items: options.items || [] // e.g., [{ label: 'Token', value: 'xyz' }]
    };
  }

  function hideTokenDialog() {
    tokenDialog.value.visible = false;
  }

  return {
    isToolboxOpen,
    activeRightPanel,
    isPropertiesPanelPinned,
    isFooterPinned,
    isDataViewerVisible,
    dataViewerContent,
    notifications,
    designerMode,
    isConnectEngineDialogVisible,
    isStandaloneRunnerVisible,
    standaloneRunnerComponent,
    isCommandPaletteVisible,
    confirmation,
    tokenDialog,
    showCommandPalette,
    hideCommandPalette,
    toggleToolbox,
    setActiveRightPanel,
    closeRightPanel,
    togglePropertiesPanelPin,
    setFooterPin,
    loadUiPreferences,
    showDataViewer,
    hideDataViewer,
    showNotification,
    removeNotification,
    setDesignerMode,
    showConnectEngineDialog,
    hideConnectEngineDialog,
    showStandaloneRunner,
    hideStandaloneRunner,
    showConfirmation,
    answerConfirmation,
    showTokenDialog,
    hideTokenDialog,
  };
});
