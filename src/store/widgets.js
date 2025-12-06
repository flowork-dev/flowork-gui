//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\widgets.js total lines 103 
//#######################################################################

import { defineStore } from 'pinia';
import { apiClient, getComponentIconUrl } from '@/api';

export const useWidgetStore = defineStore('widgets', {
    state: () => ({
        installedWidgets: [],
        isLoading: false,
        activeWidgets: [], // Widget yang lagi dibuka di Canvas
        isSyncing: false   // Flag biar gak tabrakan request
    }),

    getters: {
        getWidgetById: (state) => (id) => state.installedWidgets.find(w => w.id === id),
    },

    actions: {
        async fetchInstalledWidgets() {
            this.isLoading = true;
            try {
                const response = await apiClient.get('/widgets');

                this.installedWidgets = response.data.map(w => ({
                    ...w,
                    iconUrl: getComponentIconUrl('widget', w.id), // Helper dari api/index.js
                    localUrl: `/api/v1/widgets/${w.id}/assets/${w.manifest.entry_point || 'index.html'}`
                }));
            } catch (error) {
                console.error("[WidgetStore] Failed to fetch widgets:", error);
            } finally {
                this.isLoading = false;
            }
        },

        async restoreRemoteState() {
            try {
                if (this.installedWidgets.length === 0) {
                    await this.fetchInstalledWidgets();
                }

                const response = await apiClient.get('/user/state/active_widgets');
                const savedWidgets = response.data;

                if (Array.isArray(savedWidgets) && savedWidgets.length > 0) {
                    this.activeWidgets = savedWidgets.map(saved => {
                        const original = this.installedWidgets.find(w => w.id === saved.id);
                        return original ? {
                            ...original,
                            instanceId: saved.instanceId // PENTING: Pake ID sesi yang disave
                        } : null;
                    }).filter(w => w !== null);

                    console.log(`[WidgetStore] Restored ${this.activeWidgets.length} active widgets.`);
                }
            } catch (error) {
                console.warn("[WidgetStore] No remote state found or sync error:", error);
            }
        },

        async syncRemoteState() {
            if (this.isSyncing) return;
            this.isSyncing = true;
            try {
                const payload = this.activeWidgets.map(w => ({
                    id: w.id,
                    instanceId: w.instanceId,
                    name: w.name
                }));

                await apiClient.put('/user/state/active_widgets', payload);
                console.log("[WidgetStore] Layout synced to cloud (Auto-Save).");
            } catch (error) {
                console.error("[WidgetStore] Sync failed:", error);
            } finally {
                this.isSyncing = false;
            }
        },

        openWidget(widgetId) {
            const widget = this.getWidgetById(widgetId);
            if (widget) {
                const existing = this.activeWidgets.find(w => w.id === widgetId);
                if (!existing) {
                    this.activeWidgets.push({
                        ...widget,
                        instanceId: Date.now() // Unik Timestamp
                    });
                    this.syncRemoteState();
                }
            }
        },

        closeWidget(instanceId) {
            this.activeWidgets = this.activeWidgets.filter(w => w.instanceId !== instanceId);
            this.syncRemoteState();
        }
    }
});
