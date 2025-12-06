//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\WidgetDashboard.vue total lines 235 
//#######################################################################

<template>
  <div class="dashboard-layout">
    <div class="ambient-background"></div>
    <aside class="sidebar-area">
      <WidgetToolbox @open-marketplace="openMarketplace" @request-publish="handleRequestPublish" />
    </aside>

    <main class="canvas-area">
      <div v-if="activeWidgets.length > 0" class="widget-toolbar">
        <div class="active-tabs">
          <button
            v-for="w in activeWidgets"
            :key="w.instanceId"
            :class="['tab-btn', { active: currentTab === w.instanceId }]"
            @click="currentTab = w.instanceId"
          >
            <svg style="width:16px;height:16px;fill:#FFFFFF;margin-right:6px;" viewBox="0 0 24 24">
                <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z" />
            </svg>
            <span class="tab-label">{{ w.name }}</span>
            <span class="close-btn" @click.stop="closeWidget(w.instanceId)">
              <svg style="width:14px;height:14px;fill:#FF5555;" viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </span>
          </button>
        </div>

        <div class="toolbar-actions">
           <button class="action-btn save-btn" @click="triggerWidgetSave" :disabled="isSaving">
              <svg v-if="!isSaving" style="width:16px;height:16px;fill:#00FFFF;margin-right:6px;" viewBox="0 0 24 24">
                  <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
              </svg>
              <div v-else class="spinner-small"></div>
              <span>{{ isSaving ? 'Saving...' : 'Save State' }}</span>
           </button>

           <button class="action-btn" @click="triggerWidgetRefresh" title="Reload Widget">
              <svg style="width:16px;height:16px;fill:white;" viewBox="0 0 24 24">
                  <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
              </svg>
           </button>
        </div>
      </div>

      <div v-if="activeWidgets.length === 0" class="empty-state">
        <div class="empty-content-wrapper">
          <svg style="width:64px;height:64px;fill:#00FFFF;opacity:0.3;margin-bottom:1rem;" viewBox="0 0 24 24">
             <path d="M3,13H11V3H3V13M3,21H11V15H3V21M13,21H21V11H13V21M13,3V9H21V3H13Z" />
          </svg>
          <h2>Workspace Ready</h2>
          <p>Select a widget from the Quick Apps sidebar to launch.</p>
        </div>
      </div>

      <div v-else class="widget-content">
        <div v-for="w in activeWidgets" :key="w.instanceId" v-show="currentTab === w.instanceId" class="widget-frame-wrapper">
          <iframe
            :id="`iframe-${w.instanceId}`"
            :src="`${currentGatewayUrl}${w.localUrl}`"
            class="widget-frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            @load="onIframeLoad(w.instanceId, w.id)"
          ></iframe>
        </div>
      </div>
    </main>

    <MarketplacePublishDialog v-model="showPublishDialog" :existing-item="pendingPublishItem" @published="onPublished" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useWidgetStore } from '@/store/widgets';
import { useVariablesStore } from '@/store/variables';
import { useUiStore } from '@/store/ui';
import { apiClient, getGatewayUrl } from '@/api';
import WidgetToolbox from '@/components/WidgetToolbox.vue';
import MarketplacePublishDialog from '@/components/MarketplacePublishDialog.vue';

const widgetStore = useWidgetStore();
const variablesStore = useVariablesStore();
const uiStore = useUiStore();

const activeWidgets = computed(() => widgetStore.activeWidgets);
const currentTab = ref(null);
const isSaving = ref(false);
const showPublishDialog = ref(false);
const pendingPublishItem = ref(null);
const currentGatewayUrl = ref(getGatewayUrl());

const updateGateway = () => {
    currentGatewayUrl.value = getGatewayUrl();
};

const triggerWidgetSave = () => {
  if (!currentTab.value) return;
  isSaving.value = true;
  const iframe = document.getElementById(`iframe-${currentTab.value}`);
  if (iframe && iframe.contentWindow) {
      console.log("[Dashboard] Sending CMD_SAVE to Widget...");
      iframe.contentWindow.postMessage({ type: 'CMD_SAVE' }, '*');
      setTimeout(() => { if(isSaving.value) isSaving.value = false; }, 5000);
  } else { isSaving.value = false; }
};

const triggerWidgetRefresh = () => {
    if (!currentTab.value) return;
    const iframe = document.getElementById(`iframe-${currentTab.value}`);
    if (iframe) iframe.src = iframe.src;
};

const handleWidgetMessage = async (event) => {
  if (!event.data || !event.data.type) return;
  const { type, payload } = event.data;

  if (type === 'WIDGET_SAVE_REQUEST') {
    try {
      let senderWidget = activeWidgets.value.find(w => w.instanceId === currentTab.value);
      if (!senderWidget) return;

      const enforcedKey = `widget_${senderWidget.id}_data`;
      console.log(`[Dashboard Bridge] Manual Saving for ${senderWidget.name} -> Key: ${enforcedKey}`);

      const dataToSave = JSON.stringify(payload.data);

      await variablesStore.saveVariable(enforcedKey, {
          value: dataToSave,
          is_enabled: true,
          is_secret: false
      });

      uiStore.showNotification({ text: `${senderWidget.name} saved!`, color: "success" });
      if (event.source) event.source.postMessage({ type: 'WIDGET_SAVE_SUCCESS' }, '*');

    } catch (e) {
      console.error("Save Error:", e);
      uiStore.showNotification({ text: "Save Failed", color: "error" });
    } finally {
      isSaving.value = false;
    }
  }
};

const onIframeLoad = async (instanceId, widgetId) => {
    const dataKey = `widget_${widgetId}_data`;
    try {
        const response = await apiClient.get(`/variables/${dataKey}`);
        let variableData = response.data;

        if (!variableData || variableData.value === null || variableData.status === 'not_found') {
             const iframe = document.getElementById(`iframe-${instanceId}`);
             if (iframe) iframe.contentWindow.postMessage({ type: 'CMD_LOAD', payload: null }, '*');
             return;
        }

        let savedData = null;
        try {
            savedData = JSON.parse(variableData.value);
            if (typeof savedData === 'string' && (savedData.trim().startsWith('{') || savedData.trim().startsWith('['))) {
                 savedData = JSON.parse(savedData);
            }
        } catch(e) { savedData = variableData.value; }

        const iframe = document.getElementById(`iframe-${instanceId}`);
        if (iframe) iframe.contentWindow.postMessage({ type: 'CMD_LOAD', payload: savedData }, '*');
    } catch (e) {
        console.warn(`[Dashboard] Load info for ${dataKey}:`, e.message);
    }
};

onMounted(() => {
    updateGateway();
    window.addEventListener('message', handleWidgetMessage);
    window.addEventListener('storage', updateGateway);

    if (activeWidgets.value.length > 0 && !currentTab.value) {
        currentTab.value = activeWidgets.value[0].instanceId;
    }
});

onUnmounted(() => {
    window.removeEventListener('message', handleWidgetMessage);
    window.removeEventListener('storage', updateGateway);
});

watch(() => activeWidgets.value.length, (newLen, oldLen) => {
    if (newLen > oldLen) {
        currentTab.value = activeWidgets.value[newLen - 1].instanceId;
    } else if (newLen > 0 && !activeWidgets.value.find(w => w.instanceId === currentTab.value)) {
        currentTab.value = activeWidgets.value[0].instanceId;
    } else if (newLen === 0) {
        currentTab.value = null;
    }
});

const closeWidget = (id) => { widgetStore.closeWidget(id); };
const openMarketplace = () => { alert("Marketplace Coming Soon!"); };
const handleRequestPublish = (packageData) => { pendingPublishItem.value = { source: 'smart_package', componentType: packageData.type, data: { ...packageData.manifest, zip_data: packageData.files } }; showPublishDialog.value = true; };
const onPublished = () => { widgetStore.fetchInstalledWidgets(); };
</script>

<style scoped>
.dashboard-layout { display: flex; height: calc(100vh - 64px); background: var(--surface-ground); position: relative; overflow: hidden; }
.ambient-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.05) 0%, transparent 60%); pointer-events: none; z-index: 0; }
.sidebar-area { z-index: 2; background: rgba(30, 30, 46, 0.95); border-right: 1px solid var(--surface-border); width: 280px; }
.canvas-area { flex: 1; padding: 1rem; overflow: hidden; position: relative; display: flex; flex-direction: column; z-index: 1; gap: 0.5rem; }
.widget-toolbar { display: flex; justify-content: space-between; align-items: center; background: var(--surface-card); border: 1px solid var(--surface-border); padding: 0.5rem; border-radius: 12px; }
.active-tabs { display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none; }
.tab-btn { background: transparent; border: 1px solid transparent; color: #ccc; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.85rem; }
.tab-btn:hover { background: rgba(255,255,255,0.05); color: white; }
.tab-btn.active { background: rgba(0, 255, 255, 0.1); color: #00FFFF; border-color: #00FFFF; font-weight: 600; }
.close-btn { opacity: 0.5; margin-left: 5px; display: flex; align-items: center; }
.close-btn:hover { opacity: 1; color: #FF5555; }
.toolbar-actions { display: flex; gap: 0.5rem; }
.action-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--surface-border); color: #ccc; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; }
.action-btn:hover { border-color: #00FFFF; color: #00FFFF; }
.save-btn { background: rgba(0, 255, 255, 0.1); color: #00FFFF; border-color: rgba(0, 255, 255, 0.3); }
.save-btn:hover { background: rgba(0, 255, 255, 0.2); }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
.widget-content { flex: 1; overflow: hidden; position: relative; border-radius: 16px; border: 1px solid var(--surface-border); background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.widget-frame-wrapper { width: 100%; height: 100%; }
.widget-frame { width: 100%; height: 100%; border: none; display: block; }
.empty-state { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: var(--text-color-secondary); }
.empty-content-wrapper { text-align: center; padding: 3rem; border: 2px dashed var(--surface-border); border-radius: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
