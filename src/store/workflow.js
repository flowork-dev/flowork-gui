//#######################################################################
//# WEBSITE https://flowork.cloud
//# File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\workflow.js
//# PERBAIKAN: Mengirim 'owner_id' saat me-load workflow yang di-share
//# PERBAIKAN 2: Memperbaiki logika canExecute agar mengenali 'view-edit-run'
//# PERBAIKAN 3: Memindahkan penyimpanan favorit ke database via API Gateway
//#######################################################################
import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue'; // (PENAMBAHAN KODE) Import nextTick
import { v4 as uuidv4 } from 'uuid';
import { useUiStore } from './ui';
import { useComponentStore } from './components';
import { useLogStore } from './logs';
import { useSocketStore } from './socket'; // Key dependency for communication
import { ethers } from 'ethers'; // Needed for signing save operations
import { useAuthStore } from './auth'; // Needed for signing key
import { useEngineStore } from './engines'; // <-- INI YANG HILANG
// --- PENAMBAHAN KODE: Import API favorit & debounce ---
import { apiCreateShareLink, apiGetWorkflowShares, apiUpdateSharePermission, apiDeleteShare, apiResolveShareToken, apiGetUserFavorites, apiSetUserFavorites } from '@/api'; // Import API favorit baru
import { debounce } from '@/utils/debounce'; // Asumsi ada util debounce
// --- AKHIR PENAMBAHAN KODE ---


// Helper function for delays (optional, could be removed if not used)
const delay = (ms) => new Promise(res => setTimeout(res, ms));


/**
 * (PERBAIKAN KODE) Stringify yang robust untuk deep sort.
 * Ini memastikan string JSON yang ditandatangani bersifat deterministik
 * dan akan cocok dengan `json.dumps(..., sort_keys=True)` di Python.
 */
function stableStringify(obj) {
    const replacer = (key, value) => {
        if (value === null) {
            return null;
        }
        // If value is an object (and not null, not array), return sorted version
        if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort() // Sort keys alphabetically
                .reduce((sorted, key) => {
                    sorted[key] = value[key];
                    return sorted;
                }, {});
        }
        // Otherwise return value as is
        return value;
    };
    // Stringify with the replacer that sorts object keys
    // separators: remove whitespace for compactness and consistency
    // sort_keys=true is handled by the replacer now
    try {
        // Need to parse/stringify again AFTER initial sort because replacer runs recursively
        const initiallySortedString = JSON.stringify(obj, replacer);
        const fullySortedObject = JSON.parse(initiallySortedString); // Parse back to ensure structure
        return JSON.stringify(fullySortedObject, replacer, undefined); // Stringify again with sorted keys
    } catch (e) {
        console.warn("[WorkflowStore] Error during stableStringify, falling back to basic stringify:", e); // English Log
        return JSON.stringify(obj); // Fallback to basic stringify on error
    }
}


export const useWorkflowStore = defineStore('workflow', () => {
    // --- STATE ---
    const elements = ref([]); // Stores nodes and edges for Vue Flow
    const selectedNode = ref(null); // Currently selected node object
    const currentPresetName = ref(null); // Name of the loaded preset
    const isExecuting = ref(false); // Is a workflow currently running?
    const isPaused = ref(false); // Is the current execution paused?
    const jobId = ref(null); // ID of the currently running or last run job
    const executionStatus = ref({}); // { [nodeId]: { status, timestamp } }
    const connectionStatus = ref({}); // { [edgeId]: { status, timestamp } }
    const presets = ref([]); // List of available presets { id, name }
    // --- PERUBAHAN: Hapus inisialisasi dari localStorage ---
    const favoritePresets = ref([]); // Array of preset names (IDs) marked as favorite, loaded from DB
    // --- AKHIR PERUBAHAN ---
    const clipboard = ref(null); // Stores copied node data
    const globalLoopConfig = ref({ // Global loop settings for the workflow
        isEnabled: false,
        iterations: 1,
        isDelayEnabled: false,
        delayType: 'static', // 'static' or 'random_range' // English Hardcode
        delayStatic: 1,
        delayRandomMin: 1,
        delayRandomMax: 5
    });
    const isStopRequested = ref(false); // Flag if user requested stop
    const permissionLevel = ref('edit'); // Permission level for shared workflows ('view', 'view-run', 'edit') // English Hardcode
    const error = ref(null); // Stores any general workflow errors

    // --- GETTERS (Computed Properties) ---
    const nodes = computed(() => elements.value.filter(el => 'position' in el));
    const edges = computed(() => elements.value.filter(el => 'source' in el));
    const isCanvasEmpty = computed(() => nodes.value.length === 0);
    const isReadOnly = computed(() => permissionLevel.value === 'view'); // English Hardcode

    // Determines if the current workflow can be executed or simulated
    // (PERBAIKAN KUNCI) Tambahkan 'view-edit-run' ke dalam pengecekan `canExecute`
    const canExecute = computed(() => {
        const hasPermission = permissionLevel.value === 'view-run' || permissionLevel.value === 'edit' || permissionLevel.value === 'view-edit-run'; // English Hardcode // <-- DITAMBAHKAN DI SINI
        // PERBAIKAN: Check isCanvasEmpty. Don't check isExecuting here, Run/Simulate buttons handle that.
        return hasPermission && !isCanvasEmpty.value;
    });

    // Checks if the selected node has a specific behavior defined in its manifest
    const selectedNodeHasBehavior = computed(() => (behaviorName) => {
        if (!selectedNode.value?.data?.manifest?.behaviors) {
            return false;
        }
        return selectedNode.value.data.manifest.behaviors.includes(behaviorName);
    });

    // --- ACTIONS ---

    // --- PENAMBAHAN KODE: Aksi baru untuk fetch favorit ---
    /**
     * Mengambil daftar preset favorit dari API Gateway.
     */
    async function fetchUserFavorites() {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) return; // Only fetch if logged in
        try {
            console.log("[WorkflowStore] Fetching user favorite presets from Gateway..."); // English Log
            const favorites = await apiGetUserFavorites();
            if (favorites.error) throw new Error(favorites.error);
            favoritePresets.value = favorites;
            console.log(`[WorkflowStore] User favorites loaded: ${favorites.length} items.`); // English Log
        } catch (error) {
            console.error("[WorkflowStore] Failed to fetch user favorites:", error); // English Log
            // No need for error notification here, might just mean no favorites yet
            favoritePresets.value = []; // Reset to empty on error
        }
    }
    // --- AKHIR PENAMBAHAN KODE ---

    // --- PENAMBAHAN KODE: Fungsi debounced untuk menyimpan favorit ---
    /**
     * Debounced function to save the current favoritePresets array to the Gateway API.
     */
    const saveFavoritesDebounced = debounce(async () => {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) return;
        try {
            console.log("[WorkflowStore] Debounced save: Sending updated favorites to Gateway..."); // English Log
            await apiSetUserFavorites(favoritePresets.value);
            console.log("[WorkflowStore] Debounced save: Favorites successfully saved to Gateway."); // English Log
        } catch (error) {
            console.error("[WorkflowStore] Debounced save: Failed to save favorites:", error); // English Log
            const uiStore = useUiStore();
            uiStore.showNotification({ text: `Error saving favorites: ${error.error || error.message}`, color: 'error'}); // English Hardcode
            // Optional: Consider rolling back local state if save fails? For now, no.
        }
    }, 1500); // Wait 1.5 seconds after the last click
    // --- AKHIR PENAMBAHAN KODE ---

    // --- PERUBAHAN: Modifikasi toggleFavorite ---
    /**
     * Toggles a preset's favorite status locally and triggers a debounced save to the backend.
     * @param {string} presetName - The name (ID) of the preset to toggle.
     */
    function toggleFavorite(presetName) {
        const index = favoritePresets.value.indexOf(presetName);
        if (index > -1) {
            favoritePresets.value.splice(index, 1);
        } else {
            favoritePresets.value.push(presetName);
        }
        // Remove localStorage interaction
        // localStorage.setItem('flowork_favorite_presets', JSON.stringify(favoritePresets.value));

        // Call the debounced save function
        saveFavoritesDebounced();
    }
    // --- AKHIR PERUBAHAN ---

    /**
     * Applies changes from Vue Flow (like node removal, position updates) to the elements ref.
     * Respects read-only mode.
     */
    function applyChanges(changes) {
        if (isReadOnly.value) return; // Do nothing if read-only

        let tempElements = [...elements.value];
        let selectionChanged = false;

        changes.forEach(change => {
            const index = tempElements.findIndex(el => el.id === change.id);

            if (change.type === 'remove' && index !== -1) { // English Hardcode
                // Check if the removed element was the selected node
                if (selectedNode.value && selectedNode.value.id === change.id) {
                    selectionChanged = true;
                }
                tempElements.splice(index, 1);
            } else if (change.type === 'position' && change.position && index !== -1) { // English Hardcode
                // Update node position
                tempElements[index].position = change.position;
            }
            // Add handling for other change types if needed (e.g., selection)
            // else if (change.type === 'select' && index !== -1) {
            //     tempElements[index].selected = change.selected;
            // }
        });

        // Update the reactive ref with the modified array
        elements.value = tempElements;

        // Clear selection if the selected node was removed
        if (selectionChanged) {
            clearSelectedNode();
        }
    }

    /**
     * Requests the data history for a specific connection from the backend via WebSocket.
     * @param {string} connectionId - The ID of the edge/connection.
     */
    async function fetchConnectionData(connectionId) {
        const uiStore = useUiStore();
        const currentJobId = jobId.value; // Use the currently stored job ID

        if (!currentJobId) {
            console.warn("[WorkflowStore] Cannot fetch connection history, no active or recent job ID stored."); // English Log
            // Show info in the data viewer instead of notification
            uiStore.showDataViewer({
                title: `Data for ${connectionId.substring(0,8)}...`, // English Hardcode
                error: "Workflow has not been run in this session.", // English Hardcode
                details: "Run the workflow at least once to see connection data." // English Hardcode
            });
            return;
        }

        try {
            const socketStore = useSocketStore();
            // Send request to the backend via WebSocket
            await socketStore.sendMessage({
                type: 'request_connection_history', // English Hardcode
                job_id: currentJobId,
                connection_id: connectionId
            });
            console.log(`[WorkflowStore] Requested history for connection ${connectionId} (Job: ${currentJobId})`); // English Log
        } catch (error) {
            console.error(`[WorkflowStore] Failed to request history for connection ${connectionId}:`, error); // English Log
            // Show error in data viewer
            uiStore.showDataViewer({
                title: `Data for ${connectionId.substring(0,8)}...`, // English Hardcode
                error: "No history data found for this connection in the last run.", // English Hardcode
                details: error.message
            });
        }
    }

    /**
     * Updates the status display for a connection (e.g., 'ACTIVE').
     */
    function updateConnectionStatus(data) {
        if (!data?.connection_id) return;
        connectionStatus.value[data.connection_id] = {
            status: data.status,
            timestamp: Date.now() // Use current time for potential cleanup later
        };
    }

    /**
     * Sets the background color data for a specific node.
     * Respects read-only mode.
     */
    function setNodeColor({ nodeId, color }) {
      if (isReadOnly.value) return; // Do nothing if read-only
      const node = elements.value.find(el => el.id === nodeId);
      if (node) {
        if (!node.data) node.data = {}; // Ensure data object exists
        node.data.color = color; // Set the color property
      }
    }

    /**
     * Removes specified elements (nodes or edges) from the canvas.
     * Respects read-only mode.
     */
    function removeElements(elementsToRemove) {
      if (isReadOnly.value) return; // Do nothing if read-only
      const idsToRemove = new Set(elementsToRemove.map(el => el.id));
      elements.value = elements.value.filter(el => !idsToRemove.has(el.id));
      // Clear selection if the selected node was among those removed
      if (selectedNode.value && idsToRemove.has(selectedNode.value.id)) {
          clearSelectedNode();
      }
    }

    /**
     * Copies a node's data to the internal clipboard.
     */
    function copyNode(node) {
        // Deep copy the node object to prevent reactivity issues
        clipboard.value = JSON.parse(JSON.stringify(node));
        console.log('[WorkflowStore] Node copied to clipboard:', node.id); // English Log
    }

    /**
     * Pastes the node from the clipboard onto the canvas at the specified coordinates.
     * Respects read-only mode.
     */
    function pasteNode({ x, y }) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot paste: Workflow is read-only.', color: 'warning' }); // English Hardcode
            return;
        }
        if (!clipboard.value) {
            console.warn('[WorkflowStore] Clipboard is empty.'); // English Log
            return;
        }

        // Deep copy data from clipboard to prevent modifying the source
        const nodeDataToPaste = JSON.parse(JSON.stringify(clipboard.value.data));
        const componentStore = useComponentStore();
        // Find the full component info (including manifest) using the stored module ID
        const component = componentStore.findComponentById(nodeDataToPaste.moduleId);

        if (!component) {
            console.error(`[WorkflowStore] Component not found for pasted node: ${nodeDataToPaste.moduleId}. Cannot paste.`); // English Log
            uiStore.showNotification({ text: `Cannot paste: Component '${nodeDataToPaste.moduleId}' not found.`, color: 'error' }); // English Hardcode
            return;
        }

        // Get default config values from the component's manifest
        const defaultConfig = (component.manifest?.properties || []).reduce((acc, prop) => {
            if (prop.default !== undefined) {
              // Ensure correct type casting for defaults
              let defaultValue = prop.default;
              if (prop.type === 'integer' || prop.type === 'float') { // English Hardcode
                  defaultValue = Number(defaultValue);
              } else if (prop.type === 'boolean') { // English Hardcode
                  defaultValue = String(defaultValue).toLowerCase() === 'true'; // English Hardcode
              } else if (prop.type === 'list' && !Array.isArray(defaultValue)) { // English Hardcode
                  // Handle case where default for list might be null/undefined
                  defaultValue = [];
              }
              acc[prop.id] = defaultValue;
            }
            return acc;
        }, {});

        // Create the new node object
        const newNode = {
            id: uuidv4(), // Generate a new unique ID
            type: 'default', // Use 'default' for CustomNode // English Hardcode
            label: clipboard.value.label, // Copy label from clipboard
            position: { x, y }, // Use the provided paste position
            data: {
              moduleId: nodeDataToPaste.moduleId, // Copy module ID
              componentType: nodeDataToPaste.componentType, // Copy component type
              // Merge default config with copied config values, prioritizing copied values
              config_values: { ...defaultConfig, ...(nodeDataToPaste.config_values || {}) },
              color: nodeDataToPaste.color, // Copy color if set
            },
        };
        // Add the new node to the elements array
        elements.value = [...elements.value, newNode];
        console.log('[WorkflowStore] Node pasted from clipboard:', newNode.id); // English Log
    }

    /**
     * Duplicates a selected node, offsetting its position slightly.
     * Respects read-only mode.
     */
    function duplicateNode(node) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot duplicate: Workflow is read-only.', color: 'warning' }); // English Hardcode
            return;
        }
        const { x, y } = node.position;
        const offset = 40; // Offset for the duplicated node
        copyNode(node); // Copy the original node
        pasteNode({ x: x + offset, y: y + offset }); // Paste it nearby
    }

    /**
     * Requests the list of available presets from the connected Core Engine via WebSocket.
     */
    async function fetchPresets() {
        try {
            console.log("[WorkflowStore] Requesting presets list from local engine via WebSocket..."); // English Log
            const socketStore = useSocketStore();
            // Check connection before sending
            if (socketStore.isConnected) {
                await socketStore.sendMessage({ type: 'request_presets_list' }); // English Hardcode
            } else {
                console.warn("[WorkflowStore] Cannot fetch presets, socket not connected."); // English Log
                // No need for connect dialog here, let other UI parts handle it
            }
        } catch (error) {
            console.error("[WorkflowStore] Failed to send preset list request via WebSocket:", error); // English Log
            presets.value = []; // Reset list on send failure
            // Handle error (e.g., show notification)
            const uiStore = useUiStore();
            uiStore.showNotification({ text: 'Failed to request preset list.', color: 'error' }); // English Hardcode
        }
    }

    /**
     * Updates the local list of presets based on data received from the backend.
     * Called by the WebSocket message handler.
     * @param {Array} presetList - Array of { name: string } from the backend.
     */
    // --- PERUBAHAN: Hapus parameter favoritesList ---
    function updatePresetsList(presetList) {
        console.log(`[WorkflowStore] Received ${presetList.length} presets from engine.`); // English Log - Updated Log
        // Map backend data to the structure needed by UI { id, name }
        presets.value = presetList.map(p => ({
             id: p.name, // Use original name (with hyphens/underscores) as the unique ID
             name: p.name // Keep original name for display consistency
        }));
        // Remove logic related to updating favorites here
        // favoritePresets.value = Array.isArray(favoritesList) ? favoritesList : [];
        // localStorage.setItem('flowork_favorite_presets', JSON.stringify(favoritePresets.value));
    }
    // --- AKHIR PERUBAHAN ---

    /**
     * Adds a new node to the canvas based on component data dragged from the toolbox.
     * Respects read-only mode.
     */
    function addNode(component) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
             uiStore.showNotification({ text: 'Cannot add node: Workflow is read-only.', color: 'warning' }); // English Hardcode
            return;
        }
        if (!component?.moduleId) {
            console.error('[WorkflowStore] addNode called without valid component data.'); // English Log
            return;
        }

        const componentStore = useComponentStore();
        // Find the full component data (including manifest) from the component store
        const fullComponentData = componentStore.findComponentById(component.moduleId);

        if (!fullComponentData) {
            console.error(`[WorkflowStore] Component with ID ${component.moduleId} not found in componentStore.`); // English Log
            uiStore.showNotification({ text: `Failed to add node: Component ${component.moduleId} not found.`, color: 'error'}); // English Hardcode
            return;
        }

        // Get default configuration values from the manifest
        const defaultConfig = (fullComponentData.manifest?.properties || []).reduce((acc, prop) => {
            if (prop.default !== undefined) {
                let defaultValue = prop.default;
                // Ensure correct type for default values
                if (prop.type === 'integer' || prop.type === 'float') { // English Hardcode
                    defaultValue = Number(defaultValue);
                } else if (prop.type === 'boolean') { // English Hardcode
                    defaultValue = String(defaultValue).toLowerCase() === 'true'; // English Hardcode
                } else if (prop.type === 'list' && !Array.isArray(defaultValue)) { // English Hardcode
                    // Ensure list defaults are arrays
                    defaultValue = [];
                }
                acc[prop.id] = defaultValue;
            }
            return acc;
        }, {});

        // Create the new node object for Vue Flow
        const newNode = {
            id: uuidv4(), // Generate unique ID
            type: 'default', // Use 'default' type for CustomNode // English Hardcode
            label: fullComponentData.name, // Use name from component store
            position: { x: component.x, y: component.y }, // Position from drop event
            data: {
                moduleId: fullComponentData.id, // Store the module ID
                componentType: fullComponentData.componentType, // Store the type (modules, plugins, etc.)
                config_values: defaultConfig, // Apply default config
                // Optionally store the full manifest if needed frequently by the node itself
                // manifest: fullComponentData.manifest
            }
        };

        // Add the new node to the elements array
        elements.value = [...elements.value, newNode];
        console.log(`[WorkflowStore] Added node: ${newNode.id} (${newNode.label})`); // English Log
    }

    /**
     * Adds a new edge (connection) between two nodes on the canvas.
     * Respects read-only mode.
     */
    function addEdge(connectionData) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot add connection: Workflow is read-only.', color: 'warning' }); // English Hardcode
            return;
        }
        // Create the new edge object for Vue Flow
        const newEdge = {
            id: `edge-${uuidv4()}`, // Generate unique ID // English Hardcode
            type: 'default', // Use default edge type // English Hardcode
            animated: true, // Make edges animated by default
            source: connectionData.source, // Source node ID
            target: connectionData.target, // Target node ID
            sourceHandle: connectionData.sourceHandle, // Source port name (handle ID)
            targetHandle: connectionData.targetHandle, // Target port name (handle ID)
        };
        // Add the new edge to the elements array
        elements.value = [...elements.value, newEdge];
        console.log(`[WorkflowStore] Added edge from ${newEdge.source} to ${newEdge.target}`); // English Log
    }

    /**
     * Sets the currently selected node.
     */
    function setSelectedNode(node) {
        // Only update if the selected node actually changes
        if (selectedNode.value?.id !== node.id) {
            selectedNode.value = node;
            console.log(`[WorkflowStore] Node selected: ${node.id}`); // English Log
        }
    }

    /**
     * Clears the currently selected node.
     */
    function clearSelectedNode() {
        if (selectedNode.value) {
            console.log(`[WorkflowStore] Node deselected: ${selectedNode.value.id}`); // English Log
            selectedNode.value = null;
        }
    }

    /**
     * Updates a specific configuration value for a node.
     * Respects read-only mode.
     */
    function updateNodeConfig({ nodeId, key, value }) {
        if (isReadOnly.value) return; // Do nothing if read-only
        // Find the index of the node in the elements array
        const nodeIndex = elements.value.findIndex(el => el.id === nodeId && 'position' in el);
        if (nodeIndex !== -1) {
            // Ensure the data.config_values object exists
            if (!elements.value[nodeIndex].data.config_values) {
                elements.value[nodeIndex].data.config_values = {};
            }
            // Update the specific configuration value
            elements.value[nodeIndex].data.config_values[key] = value;
            console.log(`[WorkflowStore] Updated config '${key}' for node ${nodeId}`); // English Log
        } else {
             console.warn(`[WorkflowStore] Attempted to update config for non-existent node: ${nodeId}`); // English Log
        }
    }

    /**
     * Sends a request to the backend via WebSocket to load a specific preset's data.
     * Also fetches component lists if they seem empty.
     * @param {string} presetName - The name (ID) of the preset to load.
     * @param {string|null} ownerId - The public address of the owner (for shared presets), null otherwise.
     * @returns {Promise<boolean>} True if the request was sent, false otherwise.
     */
    // --- PERBAIKAN KODE: Tambahkan parameter 'ownerId' ---
    async function loadWorkflow(presetName, ownerId = null) {
        if (!presetName) return false; // Exit if no name provided

        const uiStore = useUiStore();
        const socketStore = useSocketStore(); // Get socket store instance

        try {
            console.log(`[WorkflowStore] Requesting workflow '${presetName}' data (Owner: ${ownerId || 'Self'}) from local engine...`); // English Log
            // Reset permission level when loading a potentially new workflow
            // unless loading specifically from a share context (handled in loadSharedWorkflow)
            // permissionLevel.value = 'edit'; // Default to edit unless overridden later

            // Ensure component lists are available before loading the preset
            const componentStore = useComponentStore();
             if (componentStore.modules.items.length === 0 ||
                 componentStore.plugins.items.length === 0 ||
                 componentStore.tools.items.length === 0 ||
                 componentStore.triggers.items.length === 0)
             {
                 console.log("[WorkflowStore] Component lists seem empty, ensuring they are fetched before loading preset..."); // English Log
                 // Fetch components if lists are empty, await their completion
                 await Promise.all([
                     componentStore.fetchComponentsForType('modules', { reset: true }), // English Hardcode
                     componentStore.fetchComponentsForType('plugins', { reset: true }), // English Hardcode
                     componentStore.fetchComponentsForType('tools', { reset: true }), // English Hardcode
                     componentStore.fetchComponentsForType('triggers', { reset: true }) // English Hardcode
                 ]);
                 // Optional small delay for reactivity if needed
                 await delay(200);
             }


            // Check connection BEFORE sending the message
            if (socketStore.isConnected) {
                // --- PERBAIKAN KODE: Kirim 'owner_id' jika ada ---
                await socketStore.sendMessage({
                    type: 'load_preset', // English Hardcode
                    name: presetName,
                    owner_id: ownerId // Send the owner ID (null if loading own preset)
                });
                // --- AKHIR PERBAIKAN KODE ---
                return true; // Indicate request was successfully sent
            } else {
                 console.error(`[WorkflowStore] Cannot load workflow '${presetName}', socket not connected.`); // English Log
                 uiStore.showConnectEngineDialog(); // Prompt user to connect
                 // Throw an error to stop execution if socket isn't connected
                 throw new Error("Socket not connected"); // English Hardcode
            }

        } catch (error) {
            console.error(`[WorkflowStore] Failed to send load request for workflow ${presetName}:`, error); // English Log
            uiStore.showNotification({ text: `Error loading workflow: ${error.message || error}`, color: 'error'}); // English Hardcode
            clearCanvas(); // Clear canvas on load error
            return false; // Indicate failure
        }
    }

    /**
     * Updates the canvas and store state when preset data is received from the backend.
     * Called by the WebSocket message handler.
     * @param {string} presetName - The name of the preset received.
     * @param {object|null} presetData - The workflow data (nodes, connections, config) or null if not found.
     */
     function updateSinglePresetData(presetName, presetData) {
        // This function now purely updates the UI based on received data
        if (!presetData) {
             console.warn(`[WorkflowStore] Received empty data for preset '${presetName}'. Clearing canvas.`); // English Log
             clearCanvas(); // Clear canvas if data is null/empty
             currentPresetName.value = presetName; // Still set the name so user knows what failed
             const uiStore = useUiStore();
             uiStore.showNotification({ text: `Could not load data for '${presetName}'. It might be empty or corrupted.`, color: 'warning'}); // English Hardcode
             return;
        }
        console.log(`[WorkflowStore] Received data for preset '${presetName}'. Updating canvas...`); // English Log
        const componentStore = useComponentStore();

        // --- Map nodes and connections, ensuring compatibility and defaults ---
        const newNodes = (presetData.nodes || []).map(node => {
            // Find the corresponding component info from the store
            const component = componentStore.findComponentById(node.module_id);
            if (!component) {
                console.warn(`[WorkflowStore] Component '${node.module_id}' for node '${node.name || node.id}' not found during preset load. Node may not function correctly.`); // English Log
                // Provide a default manifest structure if component is missing to avoid errors later
            }
            const nodeConfig = node.config_values || {};

            // Ensure config values exist for all manifest properties, applying defaults if missing
            const manifestProps = component?.manifest?.properties || [];
            manifestProps.forEach(prop => {
                if (!(prop.id in nodeConfig) && prop.default !== undefined) {
                    // Apply default value if missing in saved data
                    let defaultValue = prop.default;
                     // Ensure correct type for default values
                     if (prop.type === 'integer' || prop.type === 'float') { // English Hardcode
                         defaultValue = Number(defaultValue);
                     } else if (prop.type === 'boolean') { // English Hardcode
                         defaultValue = String(defaultValue).toLowerCase() === 'true'; // English Hardcode
                     } else if (prop.type === 'list' && !Array.isArray(defaultValue)) { // English Hardcode
                         defaultValue = []; // Ensure list defaults are arrays
                     }
                    nodeConfig[prop.id] = defaultValue;
                }
            });


            // Create the node object for Vue Flow
            return {
                id: node.id || uuidv4(), // Ensure node has an ID
                type: 'default', // Always use 'default' for CustomNode // English Hardcode
                label: node.name || component?.name || node.module_id, // Use best available name
                position: { x: node.x || 0, y: node.y || 0 }, // Ensure position exists
                data: {
                    moduleId: node.module_id,
                    componentType: component ? component.componentType : 'modules', // Store component type ('modules', 'plugins', etc.) // English Hardcode
                    config_values: nodeConfig,
                    color: node.data?.color, // Preserve custom color if set
                    // Optionally store the manifest directly if frequently needed by the node component
                    // manifest: component?.manifest
                }
            }
        });

        // Map connection data
        const newConnections = (presetData.connections || []).map(conn => ({
            id: conn.id || `edge-${uuidv4()}`, // Ensure edge has an ID // English Hardcode
            type: conn.type || 'default', // Default edge type // English Hardcode
            animated: conn.animated !== undefined ? conn.animated : true, // Default to animated
            source: conn.source || conn.from, // Handle legacy 'from' key // English Hardcode
            target: conn.target || conn.to, // Handle legacy 'to' key // English Hardcode
            sourceHandle: conn.source_port_name || conn.sourceHandle || null, // Handle legacy names and map to sourceHandle
            targetHandle: conn.target_port_name || conn.targetHandle || null, // Handle legacy names and map to targetHandle
        }));

        // --- Reset execution state before applying new elements ---
        executionStatus.value = {};
        connectionStatus.value = {};
        jobId.value = null;
        isExecuting.value = false;
        isPaused.value = false;
        isStopRequested.value = false;

        // Update the elements ref with the new structure
        elements.value = [...newNodes, ...newConnections];

        // Only set the current preset name if NOT in a shared workflow context
        // (Shared workflows set their own display name via loadSharedWorkflow)
        if (!permissionLevel.value.startsWith('view')) { // English Hardcode
             currentPresetName.value = presetName;
        }

        // Apply global loop config from the preset data, or reset to default
        if (presetData.global_loop_config) {
            // Merge loaded config with defaults to ensure all keys exist
            globalLoopConfig.value = { ...globalLoopConfig.value, ...presetData.global_loop_config };
        } else {
             // Reset to default if not present in the preset
            globalLoopConfig.value = {
                isEnabled: false, iterations: 1, isDelayEnabled: false,
                delayType: 'static', delayStatic: 1, delayRandomMin: 1, delayRandomMax: 5 // English Hardcode
            };
        }

        clearSelectedNode(); // Deselect any previously selected node
        console.log(`[WorkflowStore] Workflow '${presetName}' loaded and rendered successfully.`); // English Log

        // Optional: Trigger fitView after Vue has rendered the new elements
        // nextTick(() => {
        //     const { fitView } = useVueFlow(); // Get fitView instance if needed here
        //     fitView();
        // });
    }

    /**
     * Loads a workflow shared via a token. Fetches details from Gateway,
     * checks core for preset existence, connects to owner's engine (if possible),
     * and loads the preset data. Sets permission level.
     * @param {string} token - The share token from the URL.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async function loadSharedWorkflow(token) {
        error.value = null; // Reset error state
        const uiStore = useUiStore();
        uiStore.showNotification({ text: 'Loading shared workflow...', color: 'info' }); // English Hardcode
        try {
            // 1. Resolve share token with Gateway
            const shareDetails = await apiResolveShareToken(token);
            if (shareDetails.error) throw new Error(shareDetails.error);

            const { preset_name: presetName, owner_id: ownerPublicAddress, permission_level: sharedPermission, workflow_name: sharedName } = shareDetails;

            // 2. Ensure local component lists are loaded (required before loading preset nodes)
            const componentStore = useComponentStore();
             await Promise.all([
                 componentStore.fetchComponentsForType('modules', { reset: true }), // English Hardcode
                 componentStore.fetchComponentsForType('plugins', { reset: true }), // English Hardcode
                 componentStore.fetchComponentsForType('tools', { reset: true }), // English Hardcode
                 componentStore.fetchComponentsForType('triggers', { reset: true }) // English Hardcode
             ]);
            await delay(200); // Small delay for reactivity

            const socketStore = useSocketStore();
            const engineStore = useEngineStore();

            // 3. Find target engine: Owner's online engine OR user's active engine
            const ownerEngine = engineStore.allAvailableEngines.find(e =>
                e.isOwner === false && // Must be a shared engine
                e.owner?.public_address?.toLowerCase() === ownerPublicAddress?.toLowerCase() &&
                e.status === 'online' // English Hardcode
            );
            let targetEngineId = null;

            if (ownerEngine) {
                targetEngineId = ownerEngine.id;
                console.log(`[WorkflowStore] Found owner's online engine for shared workflow: ${targetEngineId}`); // English Log
            } else {
                // Fallback to the user's currently selected (and presumably connected) engine
                targetEngineId = engineStore.selectedEngineId;
                if (targetEngineId) {
                     console.log(`[WorkflowStore] Owner engine not found/offline. Falling back to user's active engine: ${targetEngineId}`); // English Log
                } else {
                     throw new Error("No active engine (yours or the owner's) is available to load the shared workflow."); // English Hardcode
                }
            }

            // 4. Switch connection to the target engine
            socketStore.switchEngine(targetEngineId);

            // 5. Wait for connection (needs improvement - better to use socket events)
            // TODO: Replace this timeout with event listeners for 'connect'/'connect_error'
            await new Promise(resolve => setTimeout(resolve, 1500)); // Crude wait

            if (!socketStore.isConnected) {
                 throw new Error(`Failed to connect to the required engine (${targetEngineId.substring(0,8)}...).`); // English Hardcode
            }

            // 6. Request the preset data from the connected engine, specifying the owner
            const loadSuccess = await loadWorkflow(presetName, ownerPublicAddress); // Pass owner's public address
            if (!loadSuccess) {
                 throw new Error(`Engine connected, but failed to load preset '${presetName}' from it.`); // English Hardcode
            }

            // 7. Set state for shared workflow
            permissionLevel.value = sharedPermission || 'view'; // Default to 'view' // English Hardcode
            currentPresetName.value = `Shared: ${sharedName || 'Workflow'}`; // Set display name // English Hardcode

            uiStore.showNotification({ text: `Shared workflow loaded (${permissionLevel.value} mode).`, color: 'success' }); // English Hardcode
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to load shared workflow.'; // English Hardcode
            uiStore.showNotification({ text: error.value, color: 'error'}); // English Hardcode
            clearCanvas(); // Clear canvas on error
            return false;
        }
    }

    /**
     * Sanitizes a string to be used as part of a filename.
     * Removes illegal characters and replaces spaces.
     */
    function sanitizeForFilename(name) {
        if (!name || typeof name !== 'string') return 'untitled_workflow'; // English Hardcode
        // Keep original casing but sanitize symbols
        return name
            .trim()
            .replace(/[<>:"/\\|?*]/g, '') // Remove illegal filename characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Collapse multiple hyphens
            .substring(0, 50); // Limit length for safety
    }

    /**
     * Saves the current workflow state to the backend as a preset via WebSocket.
     * Signs the workflow data using the user's private key.
     * Respects read-only mode.
     * @param {string} newPresetName - The desired name for the preset.
     * @returns {Promise<boolean>} True if the save request was sent successfully, false otherwise.
     */
    async function saveCurrentWorkflow(newPresetName) {
        if (isReadOnly.value) {
            const uiStore = useUiStore();
            uiStore.showNotification({ text: 'You do not have permission to save this workflow.', color: 'warning' }); // English Hardcode
            return false;
        }
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        const authStore = useAuthStore();

        // Check WebSocket connection first
        if (!socketStore.isConnected) {
             uiStore.showConnectEngineDialog(); // Prompt to connect if disconnected
             return false;
        }

        if (!authStore.privateKey) {
             uiStore.showNotification({ text: 'Error: Private key not found. Cannot sign and save workflow.', color: 'error' }); // English Hardcode
            return false;
        }

        try {
            // Sanitize the name for the backend request, but keep original for UI state
            const sanitizedNameForRequest = sanitizeForFilename(newPresetName);
            if (!sanitizedNameForRequest) {
                uiStore.showNotification({ text: 'Invalid preset name.', color: 'error' }); // English Hardcode
                return false;
            }

            // Prepare workflow data in the expected backend format
            const workflowData = {
                nodes: elements.value.filter(el => 'position' in el).map(node => ({
                    id: node.id,
                    name: node.label, // Use label as name
                    x: node.position.x,
                    y: node.position.y,
                    module_id: node.data.moduleId,
                    config_values: node.data.config_values || {},
                    // Include color only if it exists
                    ...(node.data.color && { data: { color: node.data.color } })
                })),
                connections: elements.value.filter(el => 'source' in el).map(edge => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    source_port_name: edge.sourceHandle, // Match backend key
                    target_port_name: edge.targetHandle, // Match backend key
                    type: edge.type,
                    animated: edge.animated,
                })),
                 global_loop_config: globalLoopConfig.value // Include global loop config
            };

            // --- Cryptographic Signing ---
            const wallet = new ethers.Wallet(authStore.privateKey);
            // IMPORTANT: Create the exact structure the backend expects for verification
            const unsignedDataBlock = {
                "workflow_data": workflowData // English Hardcode
            };
            const messageToSign = stableStringify(unsignedDataBlock); // Use stable stringify for consistency
            const dataSignature = await wallet.signMessage(messageToSign);
            // --- End Signing ---

            // Prepare the full payload for the WebSocket message
            const payload = {
                type: 'save_preset', // English Hardcode
                name: sanitizedNameForRequest, // Send sanitized name
                workflow_data: workflowData, // Send full workflow data object
                signature: dataSignature // Send the calculated signature
            };

            console.log('[WorkflowStore] Preparing to send save payload:', JSON.stringify(payload, null, 2)); // English Log

            // Send save request via WebSocket
            await socketStore.sendMessage(payload);

            // Update UI state optimistically
            currentPresetName.value = newPresetName; // Use the user-provided name for UI
            uiStore.showNotification({ text: `Workflow '${newPresetName}' save request sent.`, color: 'success' }); // English Hardcode
            // Refresh the preset list in the UI dropdown
            await fetchPresets();
            return true; // Indicate success

        } catch (error) {
            // Handle errors during signing or sending
            console.error(`[WorkflowStore] Failed to save workflow as ${newPresetName}:`, error); // English Log
            uiStore.showNotification({ text: `Error saving workflow: ${error.message || error}`, color: 'error' }); // English Hardcode
            return false; // Indicate failure
        }
    }

    /**
     * Sends a request to delete a preset via WebSocket.
     * Respects read-only mode.
     * @param {string} presetName - The name (ID) of the preset to delete.
     * @returns {Promise<boolean>} True if the delete request was sent successfully, false otherwise.
     */
    async function deletePresetAction(presetName) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
             uiStore.showNotification({ text: 'Cannot delete: Workflow is read-only.', color: 'warning' }); // English Hardcode
             return false;
        }
        const socketStore = useSocketStore();

        // Check connection first
        if (!socketStore.isConnected) {
             uiStore.showConnectEngineDialog();
             return false;
        }

        try {
             // Find the preset object to ensure we send the correct ID (original name)
             const presetToDelete = presets.value.find(p => p.id === presetName);
             if (!presetToDelete) throw new Error("Preset not found in local list."); // English Hardcode

            // Send delete request via WebSocket using the original ID
            await socketStore.sendMessage({ type: 'delete_preset', name: presetToDelete.id }); // English Hardcode

            // Clear canvas if the deleted preset was the one currently loaded
            if (currentPresetName.value === presetName) {
                clearCanvas();
            }

            uiStore.showNotification({ text: `Preset '${presetName}' delete request sent.`, color: 'info' }); // English Hardcode
            // Refresh the preset list in the UI dropdown
            await fetchPresets();
            return true; // Indicate success
        } catch (error) {
            console.error(`[WorkflowStore] Failed to delete preset ${presetName}:`, error); // English Log
            uiStore.showNotification({ text: `Error deleting preset: ${error.message || error}`, color: 'error' }); // English Hardcode
            return false; // Indicate failure
        }
    }

    /**
     * Clears all elements from the canvas and resets related state.
     */
    function clearCanvas() {
        elements.value = [];
        selectedNode.value = null;
        currentPresetName.value = null; // Reset preset name
        executionStatus.value = {};
        connectionStatus.value = {};
        permissionLevel.value = 'edit'; // Reset permission to default // English Hardcode
        jobId.value = null; // Reset job ID
        isExecuting.value = false; // Reset execution state
        isPaused.value = false; // Reset pause state
        isStopRequested.value = false; // Reset stop flag
        globalLoopConfig.value = { // Reset global loop config to defaults
            isEnabled: false, iterations: 1, isDelayEnabled: false,
            delayType: 'static', delayStatic: 1, delayRandomMin: 1, delayRandomMax: 5 // English Hardcode
        };
        console.log("[WorkflowStore] Canvas cleared."); // English Log
    }

    /**
     * Applies new node positions calculated by the auto-layout worker.
     * Respects read-only mode.
     */
    function applyAutoLayout(updatedNodes) {
        if (isReadOnly.value) return; // Don't apply layout in read-only mode
        if (!Array.isArray(updatedNodes)) {
             console.warn("[WorkflowStore] applyAutoLayout received invalid data:", updatedNodes); // English Log
            return;
        }
        // Create a Map for efficient lookup of new positions by node ID
        const nodeMap = new Map(updatedNodes.map(n => [n.id, n.position]));

        // Create a new elements array to update the ref immutably
        const newElements = elements.value.map(el => {
            // Check if it's a node and its position exists in the update map
            if ('position' in el && nodeMap.has(el.id)) {
                // Return a *new* node object with the updated position
                return { ...el, position: nodeMap.get(el.id) };
            }
            // Return the original element (edge or unchanged node)
            return el;
        });

        // Update the reactive elements ref
        elements.value = newElements;
        console.log("[WorkflowStore] Applied auto-layout positions."); // English Log
    }

    /**
     * Internal function to initiate workflow execution or simulation via WebSocket.
     * @param {string|null} startNodeId - Optional ID of the node to start from.
     * @param {string} mode - 'EXECUTE' or 'SIMULATE'. // English Hardcode
     */
    async function _startExecutionLoop(startNodeId = null, mode = 'EXECUTE') { // English Hardcode
        const uiStore = useUiStore();
        const socketStore = useSocketStore();

        // --- CRITICAL CHECK: WebSocket Connection ---
        if (!socketStore.isConnected) {
            uiStore.showConnectEngineDialog(); // Prompt user to connect
            return; // Stop execution if not connected
        }
        // --- End Connection Check ---

        if (isExecuting.value) {
            console.warn("[WorkflowStore] Execution already in progress."); // English Log
            return;
        }

        // Check permissions and canvas state AFTER connection check
        if (!canExecute.value) {
            if (isCanvasEmpty.value) {
                uiStore.showNotification({ text: 'Cannot run an empty workflow. Add some nodes first!', color: 'warning' }); // English Hardcode
            } else if (isReadOnly.value && mode === 'EXECUTE') { // Only block EXECUTE in read-only // English Hardcode
                uiStore.showNotification({ text: 'You do not have permission to run this workflow.', color: 'warning' }); // English Hardcode
            } else if (isReadOnly.value && mode === 'SIMULATE') { // Allow SIMULATE // English Hardcode
                 console.log("[WorkflowStore] Allowing SIMULATE in read-only mode."); // English Log
            } else {
                 // General case if canExecute is false for other reasons
                 uiStore.showNotification({ text: 'Cannot execute workflow at this time.', color: 'warning' }); // English Hardcode
            }
             // Only return if NOT simulating in read-only mode
            if (!(isReadOnly.value && mode === 'SIMULATE')) { // English Hardcode
                 return;
            }
        }

        const logStore = useLogStore();
        // const componentStore = useComponentStore(); // Needed if mapping component types explicitly here

        let nodesToExecute, connectionsToExecute;
        // Use current preset name or a default for unsaved workflows
        let effectivePresetName = currentPresetName.value || 'unsaved-workflow'; // English Hardcode

        // --- Map frontend elements to backend format ---
        nodesToExecute = nodes.value.map(node => ({
            id: node.id,
            name: node.label, // Use label as name for backend
            x: node.position.x,
            y: node.position.y,
            module_id: node.data.moduleId,
            config_values: node.data.config_values || {},
            // Include color data if present
            ...(node.data.color && { data: { color: node.data.color } })
        }));
        connectionsToExecute = edges.value.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            source_port_name: edge.sourceHandle, // Map to backend key
            target_port_name: edge.targetHandle, // Map to backend key
            type: edge.type,
            animated: edge.animated,
        }));
        // --- End Mapping ---

        // --- Set execution state AFTER checks ---
        isExecuting.value = true;
        // --- End State Set ---
        isPaused.value = false;
        isStopRequested.value = false;
        logStore.clearLogs(); // Clear logs for the new run
        executionStatus.value = {}; // Clear previous node statuses
        connectionStatus.value = {}; // Clear previous connection statuses

        const newJobId = uuidv4();
        jobId.value = newJobId; // Store the new Job ID for this execution

        // Show starting notification
        const notificationText = mode === 'SIMULATE' // English Hardcode
            ? `Simulating '${effectivePresetName}'...` // English Hardcode
            : `Executing '${effectivePresetName}'...`; // English Hardcode
        uiStore.showNotification({ text: notificationText, color: 'info' }); // English Hardcode

        // Prepare payload for WebSocket message
        const payload = {
            type: 'execute_workflow', // English Hardcode
            job_id: newJobId,
            preset_name: effectivePresetName,
            workflow_data: {
                nodes: nodesToExecute,
                connections: connectionsToExecute,
                global_loop_config: globalLoopConfig.value // Include global loop config
            },
            initial_payload: {}, // Start with empty initial data
            start_node_id: startNodeId, // Optional start node ID
            mode: mode, // 'EXECUTE' or 'SIMULATE' // English Hardcode
        };

        console.log('[WorkflowStore] Preparing to send execution payload:', JSON.stringify(payload, null, 2)); // English Log

        try {
            // Send the execution request via WebSocket
            await socketStore.sendMessage(payload);
            console.log(`[WorkflowStore] ${mode} request sent for job ${newJobId}`); // English Log
        } catch (error) {
             // Handle errors if sendMessage fails (e.g., disconnected during process)
             console.error(`[WorkflowStore] Failed to send ${mode} request:`, error); // English Log
             uiStore.showNotification({ text: `Failed to start ${mode.toLowerCase()}: ${error.message || error}`, color: 'error'}); // English Hardcode
             // --- CRITICAL RESET on Send Failure ---
             isExecuting.value = false;
             jobId.value = null; // Reset Job ID
             // --- End Reset ---
        }
    }

    /**
     * Loads and immediately executes a preset by its name.
     * @param {string} presetName - The name (ID) of the preset to run.
     */
    // --- PERBAIKAN KUNCI: Logika Quick Run (executePresetByName) ---
    async function executePresetByName(presetName) {
        const uiStore = useUiStore();
        const socketStore = useSocketStore();

        // 1. Check WebSocket connection first
        if (!socketStore.isConnected) {
            uiStore.showConnectEngineDialog();
            return;
        }

        // 2. Check if already executing
        if (isExecuting.value) {
            console.warn("[WorkflowStore] Execution already in progress."); // English Log
            uiStore.showNotification({ text: 'Another workflow is already running.', color: 'warning' }); // English Hardcode
            return;
        }

        // 3. Show loading notification
        uiStore.showNotification({ text: `Loading & running '${presetName}'...`, color: 'info' }); // English Hardcode

        try {
            // 4. Load the preset via WebSocket request
            // We await the *sending* of the request, not the response here
            const loadRequestSent = await loadWorkflow(presetName);

            if (!loadRequestSent) {
                // loadWorkflow already showed an error notification
                return;
            }

            // 5. Wait for the preset data to arrive and be processed
            // We use a 'watch' that resolves a Promise when the preset is loaded
            const targetPresetName = presetName;

            await new Promise((resolve, reject) => {
                const unwatch = watch(currentPresetName, (newName) => {
                    if (newName === targetPresetName) {
                        unwatch(); // Stop watching
                        // Allow Vue Flow to render the loaded elements
                        nextTick(() => {
                            console.log(`[WorkflowStore] Quick Run: Preset '${targetPresetName}' loaded. Starting execution...`); // English Log
                            resolve(); // Resolve the promise
                        });
                    }
                });

                // Safety timeout if the 'load_preset_response' never arrives
                setTimeout(() => {
                    unwatch(); // Stop watching after timeout
                    if (!isExecuting.value && currentPresetName.value !== targetPresetName) {
                         console.error(`[WorkflowStore] Quick Run: Timeout waiting for preset '${targetPresetName}' to load.`); // English Log
                         reject(new Error(`Timeout loading data for '${targetPresetName}'. Aborted run.`)); // English Hardcode
                    } else {
                         resolve(); // Already executing or loaded, resolve okay
                    }
                }, 10000); // 10 second timeout
            });

            // 6. Execute the workflow now loaded on the canvas
            _startExecutionLoop(null, 'EXECUTE'); // English Hardcode

        } catch (error) {
            console.error(`[WorkflowStore] Quick Run failed for '${presetName}':`, error); // English Log
            uiStore.showNotification({ text: `Failed to start Quick Run: ${error.message || error}`, color: 'error'}); // English Hardcode
        }
    }
    // --- AKHIR PERBAIKAN KUNCI ---

    /**
     * Starts the execution of the current workflow on the canvas.
     * @param {string|null} startNodeId - Optional node ID to start execution from.
     */
    function executeCurrentWorkflow(startNodeId = null) {
        _startExecutionLoop(startNodeId, 'EXECUTE'); // English Hardcode
    }

    /**
     * Starts the simulation of the current workflow on the canvas.
     * @param {string|null} startNodeId - Optional node ID to start simulation from.
     */
    function simulateCurrentWorkflow(startNodeId = null) {
        _startExecutionLoop(startNodeId, 'SIMULATE'); // English Hardcode
    }

    /**
     * Updates the execution state based on status updates received via WebSocket.
     * Handles transitions between RUNNING, PAUSED, SUCCEEDED, FAILED, STOPPED.
     * @param {object} data - The status update data { job_id, status_data: { status, error?, ... } }.
     */
    function updateExecutionStatus(data) {
        const statusData = data.status_data || {};
        const receivedJobId = data.job_id;
        const jobStatus = statusData.status?.toUpperCase();

        console.log(`[WorkflowStore] Received status update for job ${receivedJobId}: ${jobStatus}`); // English Log

        // Only process updates relevant to the UI's tracked job OR terminal statuses if UI is 'stuck'
        const isCurrentJob = receivedJobId === jobId.value;
        const isTerminalStatus = ['SUCCEEDED', 'FAILED', 'STOPPED'].includes(jobStatus); // English Hardcode
        const isCurrentlyExecuting = isExecuting.value; // Store current state before modification

        if (isCurrentJob || (isTerminalStatus && isCurrentlyExecuting)) {
            // This update is relevant if:
            // 1. It's for the job the UI is currently tracking.
            // OR
            // 2. It's a terminal status (end/fail/stop) AND the UI *thinks* it's still executing.
            //    (This handles race conditions where a new job starts before the old one fully stops in the UI)

            if (jobStatus === 'RUNNING') { // English Hardcode
                isExecuting.value = true;
                isPaused.value = false;
                // If this is the start of a *new* job being tracked, update the jobId
                if (!isCurrentJob) jobId.value = receivedJobId;
                isStopRequested.value = false; // Reset stop flag on run/resume
            } else if (jobStatus === 'PAUSED') { // English Hardcode
                isPaused.value = true;
                isExecuting.value = true; // Still considered executing when paused
            } else if (isTerminalStatus) {
                // Handle end of execution
                const uiStore = useUiStore();
                 let notificationColor = 'info'; // English Hardcode
                 let notificationText = `Run finished with status: ${jobStatus}`; // English Hardcode

                if (jobStatus === 'SUCCEEDED') { // English Hardcode
                     notificationColor = 'success'; // English Hardcode
                     notificationText = `Run finished successfully.`; // English Hardcode
                } else if (jobStatus === 'FAILED') { // English Hardcode
                    notificationColor = 'error'; // English Hardcode
                    notificationText = `Run failed: ${statusData.error || 'Unknown error'}`; // English Hardcode
                } else if (jobStatus === 'STOPPED') { // English Hardcode
                    notificationColor = 'warning'; // English Hardcode
                    notificationText = `Run was stopped.`; // English Hardcode
                }

                // Show notification only if this status corresponds to the job the UI *started*
                if (isCurrentJob) {
                    uiStore.showNotification({ text: notificationText, color: notificationColor });
                } else if (isCurrentlyExecuting) {
                    // UI was stuck, but we received a terminal status from a *different* job.
                    // Show a neutral notification and force UI reset.
                    uiStore.showNotification({ text: `Forcing UI reset. Received terminal status from a different job.`, color: 'warning' }); // English Hardcode
                    console.warn(`[WorkflowStore] Force resetting UI state. Was tracking job ${jobId.value} but received terminal status for ${receivedJobId}.`); // English Log
                }

                // --- CRITICAL: Reset state AFTER handling notifications/logging ---
                isExecuting.value = false;
                isPaused.value = false;
                isStopRequested.value = false; // Reset stop flag
                jobId.value = null; // Always clear the tracked job ID when a run finishes/stops/fails
                 console.log(`[WorkflowStore] Resetting execution state due to terminal status: ${jobStatus}`); // English Log
            }
        } else {
             // Ignore status updates for jobs the UI is not currently tracking
             console.log(`[WorkflowStore] Ignoring status update for different job: ${receivedJobId} (current: ${jobId.value})`); // English Log
        }
    }

    /**
     * Updates the visual status of a single node based on execution metrics received.
     * @param {object} metric - The metric data { node_id, status, timestamp, ... }.
     */
    function updateNodeExecutionStatus(metric) {
        // Only update if the metric belongs to the currently tracked job
        if (!metric?.node_id || metric.workflow_context_id !== jobId.value) return;

        // Add or update the node's status in the executionStatus dictionary
        executionStatus.value[metric.node_id] = {
            status: metric.status,
            timestamp: metric.timestamp // Store timestamp for potential cleanup/timeout logic later
            // Optionally add duration: duration: metric.execution_time_ms
        };
    }

    /**
     * Sends a request via WebSocket to stop the currently running workflow.
     */
    async function stopCurrentWorkflow() {
        // Check if there's an active job ID to stop
        if (!jobId.value) {
            console.warn("[WorkflowStore] No active job ID to stop."); // English Log
            // If UI is stuck but no job ID, force reset the UI state
            if (isExecuting.value) {
                isExecuting.value = false;
                isPaused.value = false;
                 console.warn("[WorkflowStore] UI was stuck in executing state, forcing reset."); // English Log
            }
            return;
        }
        // Don't send stop if not actually executing
        if (!isExecuting.value) {
            console.warn("[WorkflowStore] Workflow is not currently executing, cannot stop."); // English Log
            return;
        }
        isStopRequested.value = true; // Set intent flag immediately for UI feedback
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending stop request for job: ${jobId.value}`); // English Log
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'stop_workflow', job_id: jobId.value }); // English Hardcode
            uiStore.showNotification({ text: 'Stop signal sent to workflow.', color: 'warning' }); // English Hardcode
            // DO NOT reset isExecuting here; wait for the 'STOPPED' status update from the backend
        } catch (error) {
            uiStore.showNotification({ text: `Failed to send stop signal: ${error.message || error}`, color: 'error' }); // English Hardcode
            isStopRequested.value = false; // Reset intent flag if sending failed
        }
    }

    /**
     * Sends a request via WebSocket to stop a *specific* job by ID (used from Dashboard).
     * Does not change the main execution state of the Designer view.
     */
    async function stopJobById(jobIdToStop) {
        if (!jobIdToStop) return;
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending stop request for specific job: ${jobIdToStop}`); // English Log
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'stop_workflow', job_id: jobIdToStop }); // English Hardcode
            uiStore.showNotification({ text: `Stop signal sent to job ${jobIdToStop.substring(0,8)}...`, color: 'warning' }); // English Hardcode
        } catch (error) {
            uiStore.showNotification({ text: `Failed to send stop signal: ${error.message || error}`, color: 'error' }); // English Hardcode
        }
    }

    /**
     * Sends a request via WebSocket to pause the currently running workflow.
     */
    async function pauseCurrentWorkflow() {
        if (!jobId.value) {
             console.warn("[WorkflowStore] No active job ID to pause."); // English Log
            return;
        }
        if (!isExecuting.value || isPaused.value) {
            console.warn("[WorkflowStore] Workflow not running or already paused, cannot pause."); // English Log
            return;
        }
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending pause request for job: ${jobId.value}`); // English Log
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'pause_workflow', job_id: jobId.value }); // English Hardcode
            uiStore.showNotification({ text: 'Pause signal sent.', color: 'info' }); // English Hardcode
            // Actual isPaused state update comes from the 'PAUSED' status event
        } catch (error) {
            uiStore.showNotification({ text: `Failed to pause workflow: ${error.message || error}`, color: 'error' }); // English Hardcode
        }
    }

    /**
     * Sends a request via WebSocket to resume the currently paused workflow.
     */
    async function resumeCurrentWorkflow() {
        if (!jobId.value) {
            console.warn("[WorkflowStore] No active job ID to resume."); // English Log
            return;
        }
        if (!isExecuting.value || !isPaused.value) {
            console.warn("[WorkflowStore] Workflow not paused, cannot resume."); // English Log
            return;
        }
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending resume request for job: ${jobId.value}`); // English Log
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'resume_workflow', job_id: jobId.value }); // English Hardcode
            uiStore.showNotification({ text: 'Resume signal sent.', color: 'info' }); // English Hardcode
            // Actual isPaused state update comes from the 'RUNNING' status event
        } catch (error) {
            uiStore.showNotification({ text: `Failed to resume workflow: ${error.message || error}`, color: 'error' }); // English Hardcode
        }
    }

    // --- RETURN ---
    return {
        // State
        elements, selectedNode, currentPresetName, isExecuting, jobId, executionStatus, presets, clipboard,
        isPaused, connectionStatus, globalLoopConfig, permissionLevel, error, favoritePresets,
        // Getters
        nodes, edges, isCanvasEmpty, isReadOnly, canExecute, selectedNodeHasBehavior,
        // Actions
        fetchPresets, updatePresetsList,
        loadWorkflow, updateSinglePresetData, loadSharedWorkflow,
        saveCurrentWorkflow, deletePresetAction,
        clearCanvas, applyAutoLayout,
        addNode, addEdge, setSelectedNode, clearSelectedNode, updateNodeConfig,
        removeElements, copyNode, pasteNode, duplicateNode, setNodeColor,
        // --- PENAMBAHAN KODE: Export fetchUserFavorites ---
        toggleFavorite, fetchUserFavorites,
        // --- AKHIR PENAMBAHAN KODE ---
        fetchConnectionData, updateConnectionStatus,
        executeCurrentWorkflow, simulateCurrentWorkflow, executePresetByName,
        updateExecutionStatus, updateNodeExecutionStatus,
        stopCurrentWorkflow, pauseCurrentWorkflow, resumeCurrentWorkflow, stopJobById
    };
});