//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\workflow.js total lines 1271 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed, watch, nextTick } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useUiStore } from './ui';
import { useComponentStore } from './components';
import { useLogStore } from './logs';
import { useSocketStore } from './socket';
import { ethers } from 'ethers';
import { useAuthStore } from './auth';
import { useEngineStore } from './engines';
import { apiCreateShareLink, apiGetWorkflowShares, apiUpdateSharePermission, apiDeleteShare, apiResolveShareToken, apiGetUserFavorites, apiSetUserFavorites } from '@/api';
import { debounce } from '@/utils/debounce.js';


const delay = (ms) => new Promise(res => setTimeout(res, ms));


/**
 * (English Hardcode) Robust stringify for deep sorting.
 * (English Hardcode) Ensures deterministic JSON strings for signing.
 */
function stableStringify(obj) {
    const replacer = (key, value) => {
        if (value === null) {
            return null;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort() // (English Hardcode) Sort keys alphabetically
                .reduce((sorted, key) => {
                    sorted[key] = value[key];
                    return sorted;
                }, {});
        }
        return value;
    };
    try {
        const initiallySortedString = JSON.stringify(obj, replacer);
        const fullySortedObject = JSON.parse(initiallySortedString);
        return JSON.stringify(fullySortedObject, replacer, undefined);
    } catch (e) {
        console.warn("[WorkflowStore] Error during stableStringify, falling back to basic stringify:", e);
        return JSON.stringify(obj);
    }
}


export const useWorkflowStore = defineStore('workflow', () => {
    const elements = ref([]);
    const selectedNode = ref(null);
    const currentPresetName = ref(null);
    const isExecuting = ref(false);
    const isPaused = ref(false);
    const jobId = ref(null);
    const executionStatus = ref({});
    const connectionStatus = ref({});
    const presets = ref([]);
    const favoritePresets = ref([]);
    const clipboard = ref(null);
    const globalLoopConfig = ref({
        isEnabled: false,
        iterations: 1,
        isDelayEnabled: false,
        delayType: 'static', // 'static' or 'random_range'
        delayStatic: 1,
        delayRandomMin: 1,
        delayRandomMax: 5
    });
    const isStopRequested = ref(false);
    const permissionLevel = ref('edit');
    const error = ref(null);
    const isModified = ref(false);
    const isLoadingPresets = ref(false);

    const nodes = computed(() => elements.value.filter(el => 'position' in el));
    const edges = computed(() => elements.value.filter(el => 'source' in el));
    const isCanvasEmpty = computed(() => nodes.value.length === 0);
    const isReadOnly = computed(() => permissionLevel.value === 'view');

    const canExecute = computed(() => {
        const hasPermission = permissionLevel.value === 'view-run' || permissionLevel.value === 'edit' || permissionLevel.value === 'view-edit-run';
        return hasPermission && !isCanvasEmpty.value;
    });

    const selectedNodeHasBehavior = computed(() => (behaviorName) => {
        if (!selectedNode.value?.data?.manifest?.behaviors) {
            return false;
        }
        return selectedNode.value.data.manifest.behaviors.includes(behaviorName);
    });
    const getWorkflowForPublishing = computed(() => {
        return {
            nodes: nodes.value.map(node => ({
                id: node.id,
                name: node.label,
                x: node.position.x,
                y: node.position.y,
                module_id: node.data.moduleId,
                config_values: node.data.config_values || {},
                ...(node.data.color && { data: { color: node.data.color } })
            })),
            connections: edges.value.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                source_port_name: edge.sourceHandle,
                target_port_name: edge.targetHandle,
                type: edge.type,
                animated: edge.animated,
            })),
            global_loop_config: globalLoopConfig.value
        };
    });
    async function fetchUserFavorites() {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) return;
        try {
            console.log("[WorkflowStore] Fetching user favorite presets from Gateway...");
            const favorites = await apiGetUserFavorites();
            if (favorites.error) throw new Error(favorites.error);
            favoritePresets.value = favorites;
            console.log(`[WorkflowStore] User favorites loaded: ${favorites.length} items.`);
        } catch (error) {
            console.error("[WorkflowStore] Failed to fetch user favorites:", error);
            favoritePresets.value = [];
        }
    }

    const saveFavoritesDebounced = debounce(async () => {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) return;
        try {
            console.log("[WorkflowStore] Debounced save: Sending updated favorites to Gateway...");
            await apiSetUserFavorites(favoritePresets.value);
            console.log("[WorkflowStore] Debounced save: Favorites successfully saved to Gateway.");
        } catch (error) {
            console.error("[WorkflowStore] Debounced save: Failed to save favorites:", error);
            const uiStore = useUiStore();
            uiStore.showNotification({ text: `Error saving favorites: ${error.error || error.message}`, color: 'error'});
        }
    }, 1500);

    /**
     * (English Hardcode) Toggles a preset's favorite status locally and triggers a debounced save to the backend.
     * @param {string} presetName - (English Hardcode) The name (ID) of the preset to toggle.
     */
    function toggleFavorite(presetName) {
        const index = favoritePresets.value.indexOf(presetName);
        if (index > -1) {
            favoritePresets.value.splice(index, 1);
        } else {
            favoritePresets.value.push(presetName);
        }

        saveFavoritesDebounced();
    }

    function applyChanges(changes) {
        if (isReadOnly.value) return;

        let tempElements = [...elements.value];
        let selectionChanged = false;

        changes.forEach(change => {
            const index = tempElements.findIndex(el => el.id === change.id);

            if (change.type === 'remove' && index !== -1) {
                if (selectedNode.value && selectedNode.value.id === change.id) {
                    selectionChanged = true;
                }
                tempElements.splice(index, 1);
                isModified.value = true;
            } else if (change.type === 'position' && change.position && index !== -1) {
                tempElements[index].position = change.position;
                isModified.value = true;
            }
        });

        elements.value = tempElements;

        if (selectionChanged) {
            clearSelectedNode();
        }
    }

    /**
     * (English Hardcode) Requests the data history for a specific connection from the backend via WebSocket.
     * @param {string} connectionId - (English Hardcode) The ID of the edge/connection.
     */
    async function fetchConnectionData(connectionId) {
        const uiStore = useUiStore();
        const currentJobId = jobId.value;

        if (!currentJobId) {
            console.warn("[WorkflowStore] Cannot fetch connection history, no active or recent job ID stored.");
            uiStore.showDataViewer({
                title: `Data for ${connectionId.substring(0,8)}...`,
                error: "Workflow has not been run in this session.",
                details: "Run the workflow at least once to see connection data."
            });
            return;
        }

        try {
            const socketStore = useSocketStore();
            await socketStore.sendMessage({
                type: 'request_connection_history',
                job_id: currentJobId,
                connection_id: connectionId
            });
            console.log(`[WorkflowStore] Requested history for connection ${connectionId} (Job: ${currentJobId})`);
        } catch (error) {
            console.error(`[WorkflowStore] Failed to request history for connection ${connectionId}:`, error);
            uiStore.showDataViewer({
                title: `Data for ${connectionId.substring(0,8)}...`,
                error: "No history data found for this connection in the last run.",
                details: error.message
            });
        }
    }
    function updateConnectionStatus(data) {
        if (!data?.connection_id) return;
        connectionStatus.value[data.connection_id] = {
            status: data.status,
            timestamp: Date.now()
        };
    }

    /**
     * (English Hardcode) Sets the background color data for a specific node.
     * (English Hardcode) Respects read-only mode.
     */
    function setNodeColor({ nodeId, color }) {
      if (isReadOnly.value) return;
      const node = elements.value.find(el => el.id === nodeId);
      if (node) {
        if (!node.data) node.data = {};
        node.data.color = color;
        isModified.value = true;
      }
    }

    function removeElements(elementsToRemove) {
      if (isReadOnly.value) return;
      const idsToRemove = new Set(elementsToRemove.map(el => el.id));
      elements.value = elements.value.filter(el => !idsToRemove.has(el.id));
      if (selectedNode.value && idsToRemove.has(selectedNode.value.id)) {
          clearSelectedNode();
      }
      isModified.value = true;
    }

    /**
     * (English Hardcode) Copies a node's data to the internal clipboard.
     */
    function copyNode(node) {
        clipboard.value = JSON.parse(JSON.stringify(node));
        console.log('[WorkflowStore] Node copied to clipboard:', node.id);
    }

    /**
     * (English Hardcode) Pastes the node from the clipboard onto the canvas at the specified coordinates.
     * (English Hardcode) Respects read-only mode.
     */
    function pasteNode({ x, y }) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot paste: Workflow is read-only.', color: 'warning' });
            return;
        }
        if (!clipboard.value) {
            console.warn('[WorkflowStore] Clipboard is empty.');
            return;
        }

        const nodeDataToPaste = JSON.parse(JSON.stringify(clipboard.value.data));
        const componentStore = useComponentStore();
        const component = componentStore.findComponentById(nodeDataToPaste.moduleId);

        if (!component) {
            console.error(`[WorkflowStore] Component not found for pasted node: ${nodeDataToPaste.moduleId}. Cannot paste.`);
            uiStore.showNotification({ text: `Cannot paste: Component '${nodeDataToPaste.moduleId}' not found.`, color: 'error' });
            return;
        }

        const defaultConfig = (component.manifest?.properties || []).reduce((acc, prop) => {
            if (prop.default !== undefined) {
              let defaultValue = prop.default;
              if (prop.type === 'integer' || prop.type === 'float') {
                  defaultValue = Number(defaultValue);
              } else if (prop.type === 'boolean') {
                  defaultValue = String(defaultValue).toLowerCase() === 'true';
              } else if (prop.type === 'list' && !Array.isArray(defaultValue)) {
                  defaultValue = [];
              }
              acc[prop.id] = defaultValue;
            }
            return acc;
        }, {});

        const newNode = {
            id: uuidv4(),
            type: 'default',
            label: clipboard.value.label,
            position: { x, y },
            data: {
              moduleId: nodeDataToPaste.moduleId,
              componentType: nodeDataToPaste.componentType,
              config_values: { ...defaultConfig, ...(nodeDataToPaste.config_values || {}) },
              color: nodeDataToPaste.color,
            },
        };
        elements.value = [...elements.value, newNode];
        console.log('[WorkflowStore] Node pasted from clipboard:', newNode.id);
        isModified.value = true;
    }

    function duplicateNode(node) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot duplicate: Workflow is read-only.', color: 'warning' });
            return;
        }
        const { x, y } = node.position;
        const offset = 40; // (English Hardcode) Offset for the duplicated node
        copyNode(node); // (English Hardcode) Copy the original node
        pasteNode({ x: x + offset, y: y + offset }); // (English Hardcode) Paste it nearby
    }

    /**
     * (English Hardcode) Requests the list of available presets from the connected Core Engine via WebSocket.
     */
    async function fetchPresets() {
        isLoadingPresets.value = true; // (English Hardcode) Set loading true
        try {
            console.log("[WorkflowStore] Requesting presets list from local engine via WebSocket...");
            const socketStore = useSocketStore();
            if (socketStore.isConnected) {
                await socketStore.sendMessage({ type: 'request_presets_list' });
            } else {
                console.warn("[WorkflowStore] Cannot fetch presets, socket not connected.");
                isLoadingPresets.value = false; // (English Hardcode) Set false on error
            }
        } catch (error) {
            console.error("[WorkflowStore] Failed to send preset list request via WebSocket:", error);
            presets.value = []; // (English Hardcode) Reset list on send failure
            const uiStore = useUiStore();
            uiStore.showNotification({ text: 'Failed to request preset list.', color: 'error' });
            isLoadingPresets.value = false; // (English Hardcode) Set false on error
        }
    }

    /**
     * (English Hardcode) Updates the local list of presets based on data received from the backend.
     * (English Hardcode) Called by the WebSocket message handler.
     * @param {Array} presetList - (English Hardcode) Array of { name: string } from the backend.
     */
    function updatePresetsList(presetList) {
        console.log(`[WorkflowStore] Received ${presetList.length} presets from engine.`);
        presets.value = presetList.map(p => ({
             id: p.name, // (English Hardcode) Use original name (with hyphens/underscores) as the unique ID
             name: p.name // (English Hardcode) Keep original name for display consistency
        }));
        isLoadingPresets.value = false; // (English Hardcode) Set false on success
    }

    /**
     * (English Hardcode) Called by socket.js when the fetch fails (e.g., engine offline).
     */
    function handleFetchError(errorMessage) {
        console.warn(`[WorkflowStore] Fetch presets failed: ${errorMessage}`);
        isLoadingPresets.value = false;
        error.value = errorMessage;
    }

    /**
     * (English Hardcode) Adds a new node to the canvas based on component data dragged from the toolbox.
     * (English Hardcode) Respects read-only mode.
     */
    function addNode(component) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
             uiStore.showNotification({ text: 'Cannot add node: Workflow is read-only.', color: 'warning' });
            return;
        }
        if (!component?.moduleId) {
            console.error('[WorkflowStore] addNode called without valid component data.');
            return;
        }

        const componentStore = useComponentStore();
        const fullComponentData = componentStore.findComponentById(component.moduleId);

        if (!fullComponentData) {
            console.error(`[WorkflowStore] Component with ID ${component.moduleId} not found in componentStore.`);
            uiStore.showNotification({ text: `Failed to add node: Component ${component.moduleId} not found.`, color: 'error'});
            return;
        }

        const defaultConfig = (fullComponentData.manifest?.properties || []).reduce((acc, prop) => {
            if (prop.default !== undefined) {
                let defaultValue = prop.default;
                if (prop.type === 'integer' || prop.type === 'float') {
                    defaultValue = Number(defaultValue);
                } else if (prop.type === 'boolean') {
                    defaultValue = String(defaultValue).toLowerCase() === 'true';
                } else if (prop.type === 'list' && !Array.isArray(defaultValue)) {
                    defaultValue = [];
                }
                acc[prop.id] = defaultValue;
            }
            return acc;
        }, {});

        const newNode = {
            id: uuidv4(), // (English Hardcode) Generate unique ID
            type: 'default', // (English Hardcode) Use 'default' type for CustomNode
            label: fullComponentData.name, // (English Hardcode) Use name from component store
            position: { x: component.x, y: component.y }, // (English Hardcode) Position from drop event
            data: {
                moduleId: fullComponentData.id, // (English Hardcode) Store the module ID
                componentType: fullComponentData.componentType, // (English Hardcode) Store the type (modules, plugins, etc.)
                config_values: defaultConfig, // (English Hardcode) Apply default config
            }
        };

        elements.value = [...elements.value, newNode];
        console.log(`[WorkflowStore] Added node: ${newNode.id} (${newNode.label})`);
        isModified.value = true;
    }

    /**
     * (English Hardcode) Adds a new edge (connection) between two nodes on the canvas.
     * (English Hardcode) Respects read-only mode.
     */
    function addEdge(connectionData) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
            uiStore.showNotification({ text: 'Cannot add connection: Workflow is read-only.', color: 'warning' });
            return;
        }
        const newEdge = {
            id: `edge-${uuidv4()}`, // (English Hardcode) Generate unique ID
            type: 'default', // (English Hardcode) Use default edge type
            animated: true, // (English Hardcode) Make edges animated by default
            source: connectionData.source, // (English Hardcode) Source node ID
            target: connectionData.target, // (English Hardcode) Target node ID
            sourceHandle: connectionData.sourceHandle, // (English Hardcode) Source port name (handle ID)
            targetHandle: connectionData.targetHandle, // (English Hardcode) Target port name (handle ID)
        };
        elements.value = [...elements.value, newEdge];
        console.log(`[WorkflowStore] Added edge from ${newEdge.source} to ${newEdge.target}`);
        isModified.value = true;
    }

    /**
     * (English Hardcode) Sets the currently selected node.
     */
    function setSelectedNode(node) {
        if (selectedNode.value?.id !== node.id) {
            selectedNode.value = node;
            console.log(`[WorkflowStore] Node selected: ${node.id}`);
        }
    }

    /**
     * (English Hardcode) Clears the currently selected node.
     */
    function clearSelectedNode() {
        if (selectedNode.value) {
            console.log(`[WorkflowStore] Node deselected: ${selectedNode.value.id}`);
            selectedNode.value = null;
        }
    }

    /**
     * (English Hardcode) Updates a specific configuration value for a node.
     * (English Hardcode) Respects read-only mode.
     */
    function updateNodeConfig({ nodeId, key, value }) {
        if (isReadOnly.value) return; // (English Hardcode) Do nothing if read-only
        const nodeIndex = elements.value.findIndex(el => el.id === nodeId && 'position' in el);
        if (nodeIndex !== -1) {
            if (!elements.value[nodeIndex].data.config_values) {
                elements.value[nodeIndex].data.config_values = {};
            }
            elements.value[nodeIndex].data.config_values[key] = value;
            console.log(`[WorkflowStore] Updated config '${key}' for node ${nodeId}`);
            isModified.value = true;
        } else {
             console.warn(`[WorkflowStore] Attempted to update config for non-existent node: ${nodeId}`);
        }
    }

    /**
     * (English Hardcode) Sends a request to the backend via WebSocket to load a specific preset's data.
     * (English Hardcode) Also fetches component lists if they seem empty.
     * @param {string} presetName - (English Hardcode) The name (ID) of the preset to load.
     * @param {string|null} ownerId - (English Hardcode) The public address of the owner (for shared presets), null otherwise.
     * @returns {Promise<boolean>} (English Hardcode) True if the request was sent, false otherwise.
     */
    async function loadWorkflow(presetName, ownerId = null) {
        if (!presetName) return false; // (English Hardcode) Exit if no name provided

        const uiStore = useUiStore();
        const socketStore = useSocketStore(); // (English Hardcode) Get socket store instance

        try {
            console.log(`[WorkflowStore] Requesting workflow '${presetName}' data (Owner: ${ownerId || 'Self'}) from local engine...`);

            const componentStore = useComponentStore();
             if (componentStore.modules.items.length === 0 ||
                 componentStore.plugins.items.length === 0 ||
                 componentStore.tools.items.length === 0 ||
                 componentStore.triggers.items.length === 0)
             {
                 console.log("[WorkflowStore] Component lists seem empty, ensuring they are fetched before loading preset...");
                 await Promise.all([
                     componentStore.fetchComponentsForType('modules', { reset: true }),
                     componentStore.fetchComponentsForType('plugins', { reset: true }),
                     componentStore.fetchComponentsForType('tools', { reset: true }),
                     componentStore.fetchComponentsForType('triggers', { reset: true })
                 ]);
                 await delay(200);
             }


            if (socketStore.isConnected) {
                await socketStore.sendMessage({
                    type: 'load_preset',
                    name: presetName,
                    owner_id: ownerId // (English Hardcode) Send the owner ID (null if loading own preset)
                });
                return true; // (English Hardcode) Indicate request was successfully sent
            } else {
                 console.error(`[WorkflowStore] Cannot load workflow '${presetName}', socket not connected.`);
                 uiStore.showConnectEngineDialog(); // (English Hardcode) Prompt user to connect
                 throw new Error("Socket not connected");
            }

        } catch (error) {
            console.error(`[WorkflowStore] Failed to send load request for workflow ${presetName}:`, error);
            uiStore.showNotification({ text: `Error loading workflow: ${error.message || error}`, color: 'error'});
            clearCanvas(); // (English Hardcode) Clear canvas on load error
            return false; // (English Hardcode) Indicate failure
        }
    }

    /**
     * (English Hardcode) Updates the canvas and store state when preset data is received from the backend.
     * (English Hardcode) Called by the WebSocket message handler.
     * @param {string} presetName - (English Hardcode) The name of the preset received.
     * @param {object|null} presetData - (English Hardcode) The workflow data (nodes, connections, config) or null if not found.
     */
     function updateSinglePresetData(presetName, presetData) {
        if (!presetData) {
             console.warn(`[WorkflowStore] Received empty data for preset '${presetName}'. Clearing canvas.`);
             clearCanvas(); // (English Hardcode) Clear canvas if data is null/empty
             currentPresetName.value = presetName; // (English Hardcode) Still set the name so user knows what failed
             const uiStore = useUiStore();
             uiStore.showNotification({ text: `Could not load data for '${presetName}'. It might be empty or corrupted.`, color: 'warning'});
             return;
        }
        console.log(`[WorkflowStore] Received data for preset '${presetName}'. Updating canvas...`);
        const componentStore = useComponentStore();

        const newNodes = (presetData.nodes || []).map(node => {
            const component = componentStore.findComponentById(node.module_id);
            if (!component) {
                console.warn(`[WorkflowStore] Component '${node.module_id}' for node '${node.name || node.id}' not found during preset load. Node may not function correctly.`);
            }
            const nodeConfig = node.config_values || {};

            const manifestProps = component?.manifest?.properties || [];
            manifestProps.forEach(prop => {
                if (!(prop.id in nodeConfig) && prop.default !== undefined) {
                    let defaultValue = prop.default;
                     if (prop.type === 'integer' || prop.type === 'float') {
                         defaultValue = Number(defaultValue);
                     } else if (prop.type === 'boolean') {
                         defaultValue = String(defaultValue).toLowerCase() === 'true';
                     } else if (prop.type === 'list' && !Array.isArray(defaultValue)) {
                         defaultValue = []; // (English Hardcode) Ensure list defaults are arrays
                     }
                    nodeConfig[prop.id] = defaultValue;
                }
            });


            return {
                id: node.id || uuidv4(), // (English Hardcode) Ensure node has an ID
                type: 'default', // (English Hardcode) Always use 'default' for CustomNode
                label: node.name || component?.name || node.module_id, // (English Hardcode) Use best available name
                position: { x: node.x || 0, y: node.y || 0 }, // (English Hardcode) Ensure position exists
                data: {
                    moduleId: node.module_id,
                    componentType: component ? component.componentType : 'modules', // (English Hardcode) Store component type ('modules', 'plugins', etc.)
                    config_values: nodeConfig,
                    color: node.data?.color, // (English Hardcode) Preserve custom color if set
                }
            }
        });

        const newConnections = (presetData.connections || []).map(conn => ({
            id: conn.id || `edge-${uuidv4()}`, // (English Hardcode) Ensure edge has an ID
            type: conn.type || 'default', // (English Hardcode) Default edge type
            animated: conn.animated !== undefined ? conn.animated : true, // (English Hardcode) Default to animated
            source: conn.source || conn.from, // (English Hardcode) Handle legacy 'from' key
            target: conn.target || conn.to, // (English Hardcode) Handle legacy 'to' key
            sourceHandle: conn.source_port_name || conn.sourceHandle || null, // (English Hardcode) Handle legacy names and map to sourceHandle
            targetHandle: conn.target_port_name || conn.targetHandle || null, // (English Hardcode) Handle legacy names and map to targetHandle
        }));

        executionStatus.value = {};
        connectionStatus.value = {};
        jobId.value = null;
        isExecuting.value = false;
        isPaused.value = false;
        isStopRequested.value = false;
        isModified.value = false; // (English Hardcode) Loading a preset resets modification status

        elements.value = [...newNodes, ...newConnections];

        if (!permissionLevel.value.startsWith('view')) {
             currentPresetName.value = presetName;
        }

        if (presetData.global_loop_config) {
            globalLoopConfig.value = { ...globalLoopConfig.value, ...presetData.global_loop_config };
        } else {
            globalLoopConfig.value = {
                isEnabled: false, iterations: 1, isDelayEnabled: false,
                delayType: 'static', delayStatic: 1, delayRandomMin: 1, delayRandomMax: 5
            };
        }

        clearSelectedNode(); // (English Hardcode) Deselect any previously selected node
        console.log(`[WorkflowStore] Workflow '${presetName}' loaded and rendered successfully.`);

    }

    /**
     * (English Hardcode) Loads a workflow shared via a token. Fetches details from Gateway,
     * (English Hardcode) checks core for preset existence, connects to owner's engine (if possible),
     * (English Hardcode) and loads the preset data. Sets permission level.
     * @param {string} token - (English Hardcode) The share token from the URL.
     * @returns {Promise<boolean>} (English Hardcode) True if successful, false otherwise.
     */
    async function loadSharedWorkflow(token) {
        error.value = null; // (English Hardcode) Reset error state
        const uiStore = useUiStore();
        uiStore.showNotification({ text: 'Loading shared workflow...', color: 'info' });
        try {
            const shareDetails = await apiResolveShareToken(token);
            if (shareDetails.error) throw new Error(shareDetails.error);

            const { preset_name: presetName, owner_id: ownerPublicAddress, permission_level: sharedPermission, workflow_name: sharedName } = shareDetails;

            const componentStore = useComponentStore();
             await Promise.all([
                 componentStore.fetchComponentsForType('modules', { reset: true }),
                 componentStore.fetchComponentsForType('plugins', { reset: true }),
                 componentStore.fetchComponentsForType('tools', { reset: true }),
                 componentStore.fetchComponentsForType('triggers', { reset: true })
             ]);
            await delay(200); // (English Hardcode) Small delay for reactivity

            const socketStore = useSocketStore();
            const engineStore = useEngineStore();

            const ownerEngine = engineStore.allAvailableEngines.find(e =>
                e.isOwner === false && // (English Hardcode) Must be a shared engine
                e.owner?.public_address?.toLowerCase() === ownerPublicAddress?.toLowerCase() &&
                e.status === 'online'
            );
            let targetEngineId = null;

            if (ownerEngine) {
                targetEngineId = ownerEngine.id;
                console.log(`[WorkflowStore] Found owner's online engine for shared workflow: ${targetEngineId}`);
            } else {
                targetEngineId = engineStore.selectedEngineId;
                if (targetEngineId) {
                     console.log(`[WorkflowStore] Owner engine not found/offline. Falling back to user's active engine: ${targetEngineId}`);
                } else {
                     throw new Error("No active engine (yours or the owner's) is available to load the shared workflow.");
                }
            }

            socketStore.switchEngine(targetEngineId);

            await new Promise(resolve => setTimeout(resolve, 1500)); // (English Hardcode) Crude wait

            if (!socketStore.isConnected) {
                 throw new Error(`Failed to connect to the required engine (${targetEngineId.substring(0,8)}...).`);
            }

            const loadSuccess = await loadWorkflow(presetName, ownerPublicAddress); // (English Hardcode) Pass owner's public address
            if (!loadSuccess) {
                 throw new Error(`Engine connected, but failed to load preset '${presetName}' from it.`);
            }

            permissionLevel.value = sharedPermission || 'view'; // (English Hardcode) Default to 'view'
            currentPresetName.value = `Shared: ${sharedName || presetName}`; // (English Hardcode) Set display name

            uiStore.showNotification({ text: `Shared workflow loaded (${permissionLevel.value} mode).`, color: 'success' });
            return true;
        } catch (e) {
            error.value = e.error || e.message || 'Failed to load shared workflow.';
            uiStore.showNotification({ text: error.value, color: 'error'});
            clearCanvas(); // (English Hardcode) Clear canvas on error
            return false;
        }
    }

    /**
     * (English Hardcode) Sanitizes a string to be used as part of a filename.
     * (English Hardcode) Removes illegal characters and replaces spaces.
     */
    function sanitizeForFilename(name) {
        if (!name || typeof name !== 'string') return 'untitled_workflow';
        return name
            .trim()
            .replace(/[<>:"/\\|?*]/g, '') // (English Hardcode) Remove illegal filename characters
            .replace(/\s+/g, '-') // (English Hardcode) Replace spaces with hyphens
            .replace(/-+/g, '-') // (English Hardcode) Collapse multiple hyphens
            .substring(0, 50); // (English Hardcode) Limit length for safety
    }

    /**
     * (English Hardcode) Saves the current workflow state to the backend as a preset via WebSocket.
     * (English Hardcode) Signs the workflow data using the user's private key.
     * (English Hardcode) Respects read-only mode.
     * @param {string} newPresetName - (English Hardcode) The desired name for the preset.
     * @returns {Promise<boolean>} (English Hardcode) True if the save request was sent successfully, false otherwise.
     */
    async function saveCurrentWorkflow(newPresetName) {
        if (isReadOnly.value) {
            const uiStore = useUiStore();
            uiStore.showNotification({ text: 'You do not have permission to save this workflow.', color: 'warning' });
            return false;
        }
        const uiStore = useUiStore();
        const socketStore = useSocketStore();
        const authStore = useAuthStore();

        if (!socketStore.isConnected) {
             uiStore.showConnectEngineDialog(); // (English Hardcode) Prompt to connect if disconnected
             return false;
        }

        if (!authStore.privateKey) {
             uiStore.showNotification({ text: 'Error: Private key not found. Cannot sign and save workflow.', color: 'error' });
            return false;
        }

        try {
            const sanitizedNameForRequest = sanitizeForFilename(newPresetName);
            if (!sanitizedNameForRequest) {
                uiStore.showNotification({ text: 'Invalid preset name.', color: 'error' });
                return false;
            }

            const workflowData = {
                nodes: elements.value.filter(el => 'position' in el).map(node => ({
                    id: node.id,
                    name: node.label, // (English Hardcode) Use label as name
                    x: node.position.x,
                    y: node.position.y,
                    module_id: node.data.moduleId,
                    config_values: node.data.config_values || {},
                    ...(node.data.color && { data: { color: node.data.color } })
                })),
                connections: elements.value.filter(el => 'source' in el).map(edge => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    source_port_name: edge.sourceHandle,
                    target_port_name: edge.targetHandle,
                    type: edge.type,
                    animated: edge.animated,
                })),
                 global_loop_config: globalLoopConfig.value
            };

            const wallet = new ethers.Wallet(authStore.privateKey);
            const unsignedDataBlock = {
                "workflow_data": workflowData
            };
            const messageToSign = stableStringify(unsignedDataBlock);
            const dataSignature = await wallet.signMessage(messageToSign);

            const payload = {
                type: 'save_preset',
                name: sanitizedNameForRequest,
                workflow_data: workflowData,
                signature: dataSignature
            };

            console.log('[WorkflowStore] Preparing to send save payload:', JSON.stringify(payload, null, 2));

            await socketStore.sendMessage(payload);

            currentPresetName.value = newPresetName;
            isModified.value = false; // (English Hardcode) Saved, so it's no longer "modified"
            uiStore.showNotification({ text: `Workflow '${newPresetName}' save request sent.`, color: 'success' });
            await fetchPresets();
            return true; // (English Hardcode) Indicate success

        } catch (error) {
            console.error(`[WorkflowStore] Failed to save workflow as ${newPresetName}:`, error);
            uiStore.showNotification({ text: `Error saving workflow: ${error.message || error}`, color: 'error' });
            return false; // (English Hardcode) Indicate failure
        }
    }

    /**
     * (English Hardcode) Sends a request to delete a preset via WebSocket.
     * (English Hardcode) Respects read-only mode.
     * @param {string} presetName - (English Hardcode) The name (ID) of the preset to delete.
     * @returns {Promise<boolean>} (English Hardcode) True if the delete request was sent successfully, false otherwise.
     */
    async function deletePresetAction(presetName) {
        const uiStore = useUiStore();
        if (isReadOnly.value) {
             uiStore.showNotification({ text: 'Cannot delete: Workflow is read-only.', color: 'warning' });
             return false;
        }
        const socketStore = useSocketStore();

        if (!socketStore.isConnected) {
             uiStore.showConnectEngineDialog();
             return false;
        }

        try {
             const presetToDelete = presets.value.find(p => p.id === presetName);
             if (!presetToDelete) throw new Error("Preset not found in local list.");

            await socketStore.sendMessage({ type: 'delete_preset', name: presetToDelete.id });

            if (currentPresetName.value === presetName) {
                clearCanvas();
            }

            uiStore.showNotification({ text: `Preset '${presetName}' delete request sent.`, color: 'info' });
            await fetchPresets();
            return true; // (English Hardcode) Indicate success
        } catch (error) {
            console.error(`[WorkflowStore] Failed to delete preset ${presetName}:`, error);
            uiStore.showNotification({ text: `Error deleting preset: ${error.message || error}`, color: 'error' });
            return false; // (English Hardcode) Indicate failure
        }
    }

    /**
     * (English Hardcode) Clears all elements from the canvas and resets related state.
     */
    function clearCanvas() {
        elements.value = [];
        selectedNode.value = null;
        currentPresetName.value = null;
        executionStatus.value = {};
        connectionStatus.value = {};
        permissionLevel.value = 'edit';
        jobId.value = null;
        isExecuting.value = false;
        isPaused.value = false;
        isStopRequested.value = false;
        isModified.value = false;
        globalLoopConfig.value = {
            isEnabled: false, iterations: 1, isDelayEnabled: false,
            delayType: 'static', delayStatic: 1, delayRandomMin: 1, delayRandomMax: 5
        };
        console.log("[WorkflowStore] Canvas cleared.");
    }

    /**
     * (English Hardcode) Applies new node positions calculated by the auto-layout worker.
     * (English Hardcode) Respects read-only mode.
     */
    function applyAutoLayout(updatedNodes) {
        if (isReadOnly.value) return; // (English Hardcode) Don't apply layout in read-only mode
        if (!Array.isArray(updatedNodes)) {
             console.warn("[WorkflowStore] applyAutoLayout received invalid data:", updatedNodes);
            return;
        }
        const nodeMap = new Map(updatedNodes.map(n => [n.id, n.position]));

        const newElements = elements.value.map(el => {
            if ('position' in el && nodeMap.has(el.id)) {
                return { ...el, position: nodeMap.get(el.id) };
            }
            return el;
        });

        elements.value = newElements;
        isModified.value = true;
        console.log("[WorkflowStore] Applied auto-layout positions.");
    }

    /**
     * (English Hardcode) Internal function to initiate workflow execution or simulation via WebSocket.
     * @param {string|null} startNodeId - (English Hardcode) Optional ID of the node to start from.
     * @param {string} mode - (English Hardcode) 'EXECUTE' or 'SIMULATE'.
     */
    async function _startExecutionLoop(startNodeId = null, mode = 'EXECUTE') {
        const uiStore = useUiStore();
        const socketStore = useSocketStore();

        if (!socketStore.isConnected) {
            uiStore.showConnectEngineDialog(); // (English Hardcode) Prompt user to connect
            return; // (English Hardcode) Stop execution if not connected
        }

        if (isExecuting.value) {
            console.warn("[WorkflowStore] Execution already in progress.");
            return;
        }

        if (!canExecute.value) {
            if (isCanvasEmpty.value) {
                uiStore.showNotification({ text: 'Cannot run an empty workflow. Add some nodes first!', color: 'warning' });
            } else if (isReadOnly.value && mode === 'EXECUTE') {
                uiStore.showNotification({ text: 'You do not have permission to run this workflow.', color: 'warning' });
            } else if (isReadOnly.value && mode === 'SIMULATE') {
                 console.log("[WorkflowStore] Allowing SIMULATE in read-only mode.");
            } else {
                 uiStore.showNotification({ text: 'Cannot execute workflow at this time.', color: 'warning' });
            }
            if (!(isReadOnly.value && mode === 'SIMULATE')) {
                 return;
            }
        }

        const logStore = useLogStore();

        let nodesToExecute, connectionsToExecute;
        let effectivePresetName = currentPresetName.value || 'unsaved-workflow';

        nodesToExecute = nodes.value.map(node => ({
            id: node.id,
            name: node.label,
            x: node.position.x,
            y: node.position.y,
            module_id: node.data.moduleId,
            config_values: node.data.config_values || {},
            ...(node.data.color && { data: { color: node.data.color } })
        }));
        connectionsToExecute = edges.value.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            source_port_name: edge.sourceHandle,
            target_port_name: edge.targetHandle,
            type: edge.type,
            animated: edge.animated,
        }));

        isExecuting.value = true;
        isPaused.value = false;
        isStopRequested.value = false;
        logStore.clearLogs();
        executionStatus.value = {};
        connectionStatus.value = {};

        const newJobId = uuidv4();
        jobId.value = newJobId;

        const notificationText = mode === 'SIMULATE'
            ? `Simulating '${effectivePresetName}'...`
            : `Executing '${effectivePresetName}'...`;
        uiStore.showNotification({ text: notificationText, color: 'info' });

        const payload = {
            type: 'execute_workflow',
            job_id: newJobId,
            preset_name: effectivePresetName,
            workflow_data: {
                nodes: nodesToExecute,
                connections: connectionsToExecute,
                global_loop_config: globalLoopConfig.value
            },
            initial_payload: {},
            start_node_id: startNodeId,
            mode: mode,
        };

        console.log('[WorkflowStore] Preparing to send execution payload:', JSON.stringify(payload, null, 2));

        try {
            await socketStore.sendMessage(payload);
            console.log(`[WorkflowStore] ${mode} request sent for job ${newJobId}`);
        } catch (error) {
             console.error(`[WorkflowStore] Failed to send ${mode} request:`, error);
             uiStore.showNotification({ text: `Failed to start ${mode.toLowerCase()}: ${error.message || error}`, color: 'error'});
             isExecuting.value = false;
             jobId.value = null; // (English Hardcode) Reset Job ID
        }
    }

    /**
     * (English Hardcode) Loads and immediately executes a preset by its name.
     * @param {string} presetName - (English Hardcode) The name (ID) of the preset to run.
     */
    async function executePresetByName(presetName) {
        const uiStore = useUiStore();
        const socketStore = useSocketStore();

        if (!socketStore.isConnected) {
            uiStore.showConnectEngineDialog();
            return;
        }

        if (isExecuting.value) {
            console.warn("[WorkflowStore] Execution already in progress.");
            uiStore.showNotification({ text: 'Another workflow is already running.', color: 'warning' });
            return;
        }

        uiStore.showNotification({ text: `Loading & running '${presetName}'...`, color: 'info' });

        try {
            const loadRequestSent = await loadWorkflow(presetName);

            if (!loadRequestSent) {
                return;
            }

            const targetPresetName = presetName;

            await new Promise((resolve, reject) => {
                const unwatch = watch(currentPresetName, (newName) => {
                    if (newName === targetPresetName) {
                        unwatch(); // (English Hardcode) Stop watching
                        nextTick(() => {
                            console.log(`[WorkflowStore] Quick Run: Preset '${targetPresetName}' loaded. Starting execution...`);
                            resolve(); // (English Hardcode) Resolve the promise
                        });
                    }
                });

                setTimeout(() => {
                    unwatch();
                    if (!isExecuting.value && currentPresetName.value !== targetPresetName) {
                         console.error(`[WorkflowStore] Quick Run: Timeout waiting for preset '${targetPresetName}' to load.`);
                         reject(new Error(`Timeout loading data for '${targetPresetName}'. Aborted run.`));
                    } else {
                         resolve();
                    }
                }, 10000);
            });

            _startExecutionLoop(null, 'EXECUTE');

        } catch (error) {
            console.error(`[WorkflowStore] Quick Run failed for '${presetName}':`, error);
            uiStore.showNotification({ text: `Failed to start Quick Run: ${error.message || error}`, color: 'error'});
        }
    }

    /**
     * (English Hardcode) Starts the execution of the current workflow on the canvas.
     * @param {string|null} startNodeId - (English Hardcode) Optional node ID to start execution from.
     */
    function executeCurrentWorkflow(startNodeId = null) {
        _startExecutionLoop(startNodeId, 'EXECUTE');
    }

    /**
     * (English Hardcode) Starts the simulation of the current workflow on the canvas.
     * @param {string|null} startNodeId - (English Hardcode) Optional node ID to start simulation from.
     */
    function simulateCurrentWorkflow(startNodeId = null) {
        _startExecutionLoop(startNodeId, 'SIMULATE');
    }

    /**
     * (English Hardcode) Updates the execution state based on status updates received via WebSocket.
     * (English Hardcode) Handles transitions between RUNNING, PAUSED, SUCCEEDED, FAILED, STOPPED.
     * @param {object} data - (English Hardcode) The status update data { job_id, status_data: { status, error?, ... } }.
     */
    function updateExecutionStatus(data) {
        const statusData = data.status_data || {};
        const receivedJobId = data.job_id;
        const jobStatus = statusData.status?.toUpperCase();

        console.log(`[WorkflowStore] Received status update for job ${receivedJobId}: ${jobStatus}`);

        const isCurrentJob = receivedJobId === jobId.value;
        const isTerminalStatus = ['SUCCEEDED', 'FAILED', 'STOPPED'].includes(jobStatus);
        const isCurrentlyExecuting = isExecuting.value; // (English Hardcode) Store current state before modification

        if (isCurrentJob || (isTerminalStatus && isCurrentlyExecuting)) {

            if (jobStatus === 'RUNNING') {
                isExecuting.value = true;
                isPaused.value = false;
                if (!isCurrentJob) jobId.value = receivedJobId;
                isStopRequested.value = false; // (English Hardcode) Reset stop flag on run/resume
            } else if (jobStatus === 'PAUSED') {
                isPaused.value = true;
                isExecuting.value = true; // (English Hardcode) Still considered executing when paused
            } else if (isTerminalStatus) {
                const uiStore = useUiStore();
                 let notificationColor = 'info';
                 let notificationText = `Run finished with status: ${jobStatus}`;

                if (jobStatus === 'SUCCEEDED') {
                     notificationColor = 'success';
                     notificationText = `Run finished successfully.`;
                } else if (jobStatus === 'FAILED') {
                    notificationColor = 'error';
                    notificationText = `Run failed: ${statusData.error || 'Unknown error'}`;
                } else if (jobStatus === 'STOPPED') {
                    notificationColor = 'warning';
                    notificationText = `Run was stopped.`;
                }

                if (isCurrentJob) {
                    uiStore.showNotification({ text: notificationText, color: notificationColor });
                } else if (isCurrentlyExecuting) {
                    uiStore.showNotification({ text: `Forcing UI reset. Received terminal status from a different job.`, color: 'warning' });
                    console.warn(`[WorkflowStore] Force resetting UI state. Was tracking job ${jobId.value} but received terminal status for ${receivedJobId}.`);
                }

                isExecuting.value = false;
                isPaused.value = false;
                isStopRequested.value = false;
                jobId.value = null;
                 console.log(`[WorkflowStore] Resetting execution state due to terminal status: ${jobStatus}`);
            }
        } else {
             console.log(`[WorkflowStore] Ignoring status update for different job: ${receivedJobId} (current: ${jobId.value})`);
        }
    }

    /**
     * (English Hardcode) Updates the visual status of a single node based on execution metrics received.
     * @param {object} metric - (English Hardcode) The metric data { node_id, status, timestamp, ... }.
     */
    function updateNodeExecutionStatus(metric) {
        if (!metric?.node_id || metric.workflow_context_id !== jobId.value) return;

        executionStatus.value[metric.node_id] = {
            status: metric.status,
            timestamp: metric.timestamp
        };
    }

    /**
     * (English Hardcode) Sends a request via WebSocket to stop the currently running workflow.
     */
    async function stopCurrentWorkflow() {
        if (!jobId.value) {
            console.warn("[WorkflowStore] No active job ID to stop.");
            if (isExecuting.value) {
                isExecuting.value = false;
                isPaused.value = false;
                 console.warn("[WorkflowStore] UI was stuck in executing state, forcing reset.");
            }
            return;
        }
        if (!isExecuting.value) {
            console.warn("[WorkflowStore] Workflow is not currently executing, cannot stop.");
            return;
        }
        isStopRequested.value = true;
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending stop request for job: ${jobId.value}`);
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'stop_workflow', job_id: jobId.value });
            uiStore.showNotification({ text: 'Stop signal sent to workflow.', color: 'warning' });
        } catch (error) {
            uiStore.showNotification({ text: `Failed to send stop signal: ${error.message || error}`, color: 'error' });
            isStopRequested.value = false;
        }
    }

    /**
     * (English Hardcode) Sends a request via WebSocket to stop a *specific* job by ID (used from Dashboard).
     * (English Hardcode) Does not change the main execution state of the Designer view.
     */
    async function stopJobById(jobIdToStop) {
        if (!jobIdToStop) return;
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending stop request for specific job: ${jobIdToStop}`);
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'stop_workflow', job_id: jobIdToStop });
            uiStore.showNotification({ text: `Stop signal sent to job ${jobIdToStop.substring(0,8)}...`, color: 'warning' });
        } catch (error) {
            uiStore.showNotification({ text: `Failed to send stop signal: ${error.message || error}`, color: 'error' });
        }
    }

    /**
     * (English Hardcode) Sends a request via WebSocket to pause the currently running workflow.
     */
    async function pauseCurrentWorkflow() {
        if (!jobId.value) {
             console.warn("[WorkflowStore] No active job ID to pause.");
            return;
        }
        if (!isExecuting.value || isPaused.value) {
            console.warn("[WorkflowStore] Workflow not running or already paused, cannot pause.");
            return;
        }
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending pause request for job: ${jobId.value}`);
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'pause_workflow', job_id: jobId.value });
            uiStore.showNotification({ text: 'Pause signal sent.', color: 'info' });
        } catch (error) {
            uiStore.showNotification({ text: `Failed to pause workflow: ${error.message || error}`, color: 'error' });
        }
    }

    /**
     * (English Hardcode) Sends a request via WebSocket to resume the currently paused workflow.
     */
    async function resumeCurrentWorkflow() {
        if (!jobId.value) {
            console.warn("[WorkflowStore] No active job ID to resume.");
            return;
        }
        if (!isExecuting.value || !isPaused.value) {
            console.warn("[WorkflowStore] Workflow not paused, cannot resume.");
            return;
        }
        const uiStore = useUiStore();
        try {
            console.log(`[WorkflowStore] Sending resume request for job: ${jobId.value}`);
            const socketStore = useSocketStore();
            await socketStore.sendMessage({ type: 'resume_workflow', job_id: jobId.value });
            uiStore.showNotification({ text: 'Resume signal sent.', color: 'info' });
        } catch (error) {
            uiStore.showNotification({ text: `Failed to resume workflow: ${error.message || error}`, color: 'error' });
        }
    }

    return {
        elements, selectedNode, currentPresetName, isExecuting, jobId, executionStatus, presets, clipboard,
        isPaused, connectionStatus, globalLoopConfig, permissionLevel, error, favoritePresets,
        isModified,
        nodes, edges, isCanvasEmpty, isReadOnly, canExecute, selectedNodeHasBehavior,
        getWorkflowForPublishing,
        fetchPresets, updatePresetsList,
        loadWorkflow, updateSinglePresetData, loadSharedWorkflow,
        saveCurrentWorkflow, deletePresetAction,
        clearCanvas, applyAutoLayout,
        addNode, addEdge, setSelectedNode, clearSelectedNode, updateNodeConfig,
        removeElements, copyNode, pasteNode, duplicateNode, setNodeColor,
        toggleFavorite, fetchUserFavorites,
        fetchConnectionData, updateConnectionStatus,
        executeCurrentWorkflow, simulateCurrentWorkflow, executePresetByName,
        updateExecutionStatus, updateNodeExecutionStatus,
        stopCurrentWorkflow, pauseCurrentWorkflow, resumeCurrentWorkflow, stopJobById,
        applyChanges,
        isLoadingPresets,
        handleFetchError,
    };
});
