//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\marketplace.js total lines 233 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    apiGetMarketplaceItems,
    apiGetMarketplaceItemDetail,
    apiPublishMarketplaceItem,
    apiListCapsules,
    apiGetCapsule,
    apiInstallCapsule,
    apiRemixCapsule
} from '@/api';
import { useUiStore } from './ui';
import { useWorkflowStore } from './workflow';

export const useMarketplaceStore = defineStore('marketplace', () => {
    const items = ref([]);
    const selectedItem = ref(null);
    const isLoadingList = ref(false);
    const isLoadingDetail = ref(false);
    const isPublishing = ref(false);
    const error = ref(null);

    const capsules = ref([]);
    const selectedCapsule = ref(null);
    const isLoadingCapsuleList = ref(false);
    const isLoadingCapsuleDetail = ref(false);
    const capsuleError = ref(null);


    /**
     * (English Hardcode) Fetches the list of items from the public API.
     * @param {object} filters - { type: 'preset', ... }
     */
    async function fetchItems(filters = { type: 'preset' }) {
        isLoadingList.value = true;
        error.value = null;
        try {
            const itemList = await apiGetMarketplaceItems(filters);
            if (itemList.error) throw new Error(itemList.error);
            items.value = itemList;
            console.log(`[MarketStore] Fetched ${itemList.length} items.`);
        } catch (e) {
            error.value = e.message || 'Failed to fetch marketplace items.';
            console.error(`[MarketStore] ${error.value}`);
        } finally {
            isLoadingList.value = false;
        }
    }

    /**
     * (English Hardcode) Fetches the full detail (including 'data') of a single item.
     * @param {string} id - The item ID.
     */
    async function fetchItemDetail(id) {
        isLoadingDetail.value = true;
        error.value = null;
        selectedItem.value = null;
        try {
            const itemData = await apiGetMarketplaceItemDetail(id);
            if (itemData.error) throw new Error(itemData.error);
            selectedItem.value = itemData;
            console.log(`[MarketStore] Fetched detail for item: ${id}`);
            return itemData;
        } catch (e) {
            error.value = e.message || 'Failed to fetch item detail.';
            console.error(`[MarketStore] ${error.value}`);
            return null;
        } finally {
            isLoadingDetail.value = false;
        }
    }

    /**
     * (English Hardcode) Publishes the currently active workflow to the marketplace.
     * @param {object} formData - { name, desc, price }
     */
    async function publishCurrentWorkflow(formData) {
        const uiStore = useUiStore();
        const workflowStore = useWorkflowStore();

        if (!formData.name) {
            uiStore.showNotification({ text: 'Item name is required.', color: 'error' });
            return false;
        }

        const workflowData = workflowStore.getWorkflowForPublishing;
        if (!workflowData || workflowData.nodes.length === 0) {
             uiStore.showNotification({ text: 'Cannot publish an empty workflow.', color: 'error' });
            return false;
        }

        isPublishing.value = true;
        error.value = null;

        const payload = {
            type: 'preset',
            name: formData.name,
            desc: formData.desc,
            price: formData.price || 0,
            data: workflowData
        };

        try {
            const result = await apiPublishMarketplaceItem(payload);
            if (result.error) throw new Error(result.error);

            uiStore.showNotification({ text: 'Preset published successfully!', color: 'success' });
            console.log(`[MarketStore] Publish successful. New ID: ${result.id}`);
            await fetchItems();
            return true;
        } catch (e) {
            error.value = e.message || 'Failed to publish item.';
            console.error(`[MarketStore] ${error.value}`);
            uiStore.showNotification({ text: `Publish Error: ${error.value}`, color: 'error' });
            return false;
        } finally {
            isPublishing.value = false;
        }
    }


    /**
     * (English Hardcode) Fetch the list of all local capsules from the Gateway
     */
    async function fetchCapsules() {
        isLoadingCapsuleList.value = true;
        capsuleError.value = null;
        try {
            const data = await apiListCapsules();
            if (data.error) throw new Error(data.error);
            capsules.value = data.items || [];
            console.log(`[MarketStore] Fetched ${capsules.value.length} local capsules.`);
        } catch (e) {
            capsuleError.value = e.message || 'Failed to fetch local capsules.';
            console.error(`[MarketStore] ${capsuleError.value}`);
            const ui = useUiStore();
            ui.showNotification({ text: `Failed to load local capsules: ${e.message}`, color: 'error' });
        } finally {
            isLoadingCapsuleList.value = false;
        }
    }

    /**
     * (English Hardcode) Fetch the full details for a single local capsule
     * @param {string} capsuleId
     */
    async function fetchCapsuleDetails(capsuleId) {
        isLoadingCapsuleDetail.value = true;
        capsuleError.value = null;
        selectedCapsule.value = null;
        try {
            const data = await apiGetCapsule(capsuleId);
            if (data.error) throw new Error(data.error);
            selectedCapsule.value = data;
            console.log(`[MarketStore] Fetched detail for capsule: ${capsuleId}`);
            return data;
        } catch (e) {
            capsuleError.value = e.message || 'Failed to fetch capsule detail.';
            console.error(`[MarketStore] ${capsuleError.value}`);
            return null;
        } finally {
            isLoadingCapsuleDetail.value = false;
        }
    }

    /**
     * (English Hardcode) Install a capsule
     * @param {Object} capsulePayload
     */
    async function installCapsule(capsulePayload) {
        const ui = useUiStore();
        try {
            const installed = await apiInstallCapsule(capsulePayload);
            if (installed.error) throw new Error(installed.error);
            ui.showNotification({ text: `Capsule '${installed.capsule_id}' installed!`, color: 'success' });
            await fetchCapsules(); // (English Hardcode) Refresh list
            return true;
        } catch (e) {
            console.error("[MarketStore] Failed to install capsule:", e);
            ui.showNotification({ text: `Install failed: ${e.message}`, color: 'error' });
            return false;
        }
    }

    /**
     * (English Hardcode) Remix a capsule
     * @param {string} baseId
     * @param {string} newId
     * @param {Object} patch
     */
    async function remixCapsule(baseId, newId, patch) {
        const ui = useUiStore();
        try {
            const remixed = await apiRemixCapsule(baseId, newId, patch);
            if (remixed.error) throw new Error(remixed.error);
            ui.showNotification({ text: `Remix '${remixed.capsule_id}' created!`, color: 'success' });
            await fetchCapsules(); // (English Hardcode) Refresh list
            return remixed;
        } catch (e) {
            console.error("[MarketStore] Failed to remix capsule:", e);
            ui.showNotification({ text: `Remix failed: ${e.message}`, color: 'error' });
            return null;
        }
    }

    return {
        items,
        selectedItem,
        isLoadingList,
        isLoadingDetail,
        isPublishing,
        error,
        fetchItems,
        fetchItemDetail,
        publishCurrentWorkflow,

        capsules,
        selectedCapsule,
        isLoadingCapsuleList,
        isLoadingCapsuleDetail,
        capsuleError,
        fetchCapsules,
        fetchCapsuleDetails,
        installCapsule,
        remixCapsule
    };
});
