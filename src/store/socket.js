import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import { useWorkflowStore } from './workflow';
import { useEngineStore } from './engines';
import { useUiStore } from './ui';
import { useLogStore } from './logs';
import { useComponentStore } from './components';
import { useAiCenterStore } from './aiCenter';
import { useDatasetStore } from './datasets';
import { useTrainingStore } from './training';
import { usePromptStore } from './prompts';
import { useSettingsStore } from './settings';
import { useVariablesStore } from './variables';
import { ethers } from 'ethers';
import mitt from 'mitt';
const emitter = mitt();

export const useSocketStore = defineStore('socket', () => {
    // --- STATE ---
    const socket = ref(null);
    const isConnected = ref(false);
    const isConnecting = ref(false);
    const connectionError = ref(null);
    const currentEngineStatus = ref({});
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let expectedEngineId = null;

    // --- Helper Otentikasi ---
    async function getSignedAuthPayload() {
        const authStore = useAuthStore();
        if (!authStore.privateKey) throw new Error("Private key not found for signing."); // English Hardcode
        const wallet = new ethers.Wallet(authStore.privateKey);
        const messageToSign = `Flowork GUI-to-Engine Authentication: ${Date.now()}`; // English Hardcode
        const signature = await wallet.signMessage(messageToSign);
        return {
            address: wallet.address,
            message: messageToSign,
            signature: signature
        };
    }

    // --- FUNGSI KONEKSI ---
    function connect() {
        const authStore = useAuthStore();
        const engineStore = useEngineStore();
        const uiStore = useUiStore();

        if (!authStore.isAuthenticated) {
            console.log("[SocketStore] Connect skipped: Not authenticated."); // English Hardcode
            return;
        }

        const selectedEngineId = engineStore.selectedEngineId;
        if (!selectedEngineId) {
            console.error('[SocketStore] Cannot connect: No engine selected.'); // English Hardcode
            isConnecting.value = false;
            isConnected.value = false;
            connectionError.value = 'No engine selected.'; // English Hardcode
            return;
        }

        if (isConnected.value || isConnecting.value) {
            if (isConnected.value && expectedEngineId && expectedEngineId !== selectedEngineId) {
                console.log(`[SocketStore] Already connected, but to the wrong engine (${expectedEngineId}). Disconnecting first...`); // English Hardcode
                disconnect(false);
            } else {
                console.log(`[SocketStore] Connect skipped: Already connected (${isConnected.value}) to ${expectedEngineId} or connecting (${isConnecting.value}).`); // English Hardcode
                return;
            }
        }

        isConnecting.value = true;
        connectionError.value = null;
        expectedEngineId = selectedEngineId;

        const baseUrl = import.meta.env.VITE_LOCAL_ENGINE_WS_URL;
        if (!baseUrl) {
            console.error("[SocketStore] CRITICAL: VITE_LOCAL_ENGINE_WS_URL is not set in .env or .env.production!"); // English Hardcode
            uiStore.showNotification({ text: 'WebSocket URL configuration is missing.', color: 'error' }); // English Hardcode
            isConnecting.value = false;
            connectionError.value = 'WebSocket URL config missing.'; // English Hardcode
            return;
        }
        const connectUrl = `${baseUrl}?engineId=${selectedEngineId}`; // English Hardcode
        console.log(`[SocketStore] Attempting to connect to: ${connectUrl} (Attempt ${reconnectAttempts + 1})`); // English Hardcode

        try {
            socket.value = new WebSocket(connectUrl);
        } catch (error) {
            console.error('[SocketStore] WebSocket constructor failed:', error); // English Hardcode
            isConnecting.value = false;
            handleConnectionError(error, selectedEngineId);
            return;
        }

        socket.value.onopen = () => {
            if (selectedEngineId !== expectedEngineId) {
                 console.warn(`[SocketStore] Connected, but expected engine changed to ${selectedEngineId} during connection. Disconnecting old socket.`); // English Hardcode
                 socket.value?.close(1000, "Switching engine target"); // English Hardcode
                 return;
            }
            console.log(`[SocketStore] WebSocket connected successfully to engine ${selectedEngineId}.`); // English Hardcode
            isConnected.value = true;
            isConnecting.value = false;
            connectionError.value = null;
            reconnectAttempts = 0;
            const engineName = engineStore.allAvailableEngines.find(e => e.id === selectedEngineId)?.name || selectedEngineId.substring(0,8)+'...';
            uiStore.showNotification({ text: `Connected to Engine: ${engineName}`, color: 'success' }); // English Hardcode
            uiStore.hideConnectEngineDialog();

            console.log(`[SocketStore] Connection to ${selectedEngineId} open. Fetching all initial data...`); // English Hardcode
            sendMessage({ type: 'request_settings' }); // English Hardcode
            sendMessage({ type: 'request_variables' }); // English Hardcode
            sendMessage({ type: 'request_presets_list' }); // English Hardcode
            sendMessage({ type: 'request_prompts_list' }); // English Hardcode
            sendMessage({ type: 'request_datasets_list' }); // English Hardcode
            sendMessage({ type: 'request_local_models' }); // English Hardcode

            const componentStore = useComponentStore();
            componentStore.fetchComponentsForType('modules', { reset: true }); // English Hardcode
            componentStore.fetchComponentsForType('plugins', { reset: true }); // English Hardcode
            componentStore.fetchComponentsForType('tools', { reset: true }); // English Hardcode
            componentStore.fetchComponentsForType('triggers', { reset: true }); // English Hardcode
        };

        socket.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                const uiStore = useUiStore();
                const workflowStore = useWorkflowStore();
                const logStore = useLogStore();
                const componentStore = useComponentStore();
                const settingsStore = useSettingsStore();
                const variablesStore = useVariablesStore();
                const aiCenterStore = useAiCenterStore();
                const datasetStore = useDatasetStore();
                const trainingStore = useTrainingStore();
                const promptStore = usePromptStore();


                if (data.error) {
                    console.error(`[Local Engine Error] Type: ${data.type || 'N/A'}, Path: ${data.path || 'N/A'} - ${data.error}`); // English Hardcode
                    uiStore.showNotification({ text: `Engine Error: ${data.error}`, color: 'error' }); // English Hardcode
                    if (data.error.includes("not authorized for engine")) { // English Hardcode
                        connectionError.value = `Authorization failed for this engine.`; // English Hardcode
                    }
                    if (data.type?.includes('_response') && data.component_type) {
                        const stateMap = { modules: componentStore.modules, plugins: componentStore.plugins, tools: componentStore.tools, triggers: componentStore.triggers };
                        const stateRef = stateMap[data.component_type];
                        if (stateRef && stateRef.value) stateRef.value.isLoading = false;
                    }
                    if (data.type === 'drives_list_response' || data.type === 'directory_list_response') { // English Hardcode
                        emitter.emit(data.type.replace('_response', '-error'), data); // English Hardcode
                    }
                    if (data.type === 'ai_status_response') aiCenterStore.setAiStatus([]);
                    if (data.type === 'ai_playground_response') aiCenterStore.setPlaygroundResult({ error: data.error });
                    if (data.type === 'datasets_list_response') datasetStore.setDatasetsList([]);
                    if (data.type === 'dataset_data_response') datasetStore.setDatasetData([]);
                    if (data.type === 'local_models_response') trainingStore.setLocalModels([]);
                    if (data.type === 'training_job_status_response') trainingStore.setTrainingJobStatus([]);
                    if (data.type === 'prompts_list_response') promptStore.setPromptsList([]);

                    return;
                }

                switch (data.type) {
                    case 'presets_list_response': // English Hardcode
                        workflowStore.updatePresetsList(data.presets, data.favorites);
                        break;
                    case 'load_preset_response': // English Hardcode
                        workflowStore.updateSinglePresetData(data.name, data.workflow_data);
                        break;
                    case 'components_list_response': // English Hardcode
                        componentStore.updateComponentsList(data.component_type, data.components);
                        break;
                    case 'component_install_status': // English Hardcode
                        console.log('[SocketStore] Received component_install_status:', data); // English Log
                        componentStore.handleInstallStatusUpdate(data);
                        break;
                    case 'log': // English Hardcode
                        logStore.addExecutionLog(data);
                        break;
                    case 'workflow_status_update': // English Hardcode
                        workflowStore.updateExecutionStatus(data);
                        break;
                    case 'SHOW_DEBUG_POPUP': // English Hardcode
                        if (data.title !== undefined && data.content !== undefined) {
                            uiStore.showDataViewer({ title: data.title, payload: data.content });
                        } else {
                             console.error('[SocketStore] Invalid SHOW_DEBUG_POPUP data:', data); // English Log
                             uiStore.showNotification({text: 'Received invalid debug data.', color: 'error'}); // English Hardcode
                        }
                        break;
                    case 'NODE_EXECUTION_METRIC': // English Hardcode
                        workflowStore.updateNodeExecutionStatus(data);
                        logStore.updateTimelineEntry(data);
                        break;
                    case 'CONNECTION_STATUS_UPDATE': // English Hardcode
                        workflowStore.updateConnectionStatus(data);
                        break;
                    case 'settings_response': // English Hardcode
                        settingsStore.settings = data.settings;
                        settingsStore.isLoading = false;
                        uiStore.loadUiPreferences(data.settings);
                        break;
                    case 'variables_response': // English Hardcode
                        variablesStore.variables = data.variables;
                        variablesStore.isLoading = false;
                        break;
                    case 'drives_list_response': // English Hardcode
                        emitter.emit('drives-list', data); // English Hardcode
                        break;
                    case 'directory_list_response': // English Hardcode
                        emitter.emit('directory-list', data); // English Hardcode
                        break;
                    case 'engine_status_update': // English Hardcode
                        if (data.engineId === expectedEngineId) {
                            currentEngineStatus.value = data;
                        } else {
                            console.warn(`Ignoring status update from unexpected engine: ${data.engineId} (expected: ${expectedEngineId})`); // English Log
                        }
                        break;
                    case 'ai_status_response': // English Hardcode
                        aiCenterStore.setAiStatus(data.providers);
                        break;
                    case 'ai_playground_response': // English Hardcode
                        aiCenterStore.setPlaygroundResult(data.result);
                        break;
                    case 'datasets_list_response': // English Hardcode
                        datasetStore.setDatasetsList(data.datasets);
                        break;
                    case 'dataset_data_response': // English Hardcode
                        datasetStore.setDatasetData(data.data);
                        break;
                    case 'local_models_response': // English Hardcode
                        trainingStore.setLocalModels(data.models);
                        break;
                    case 'training_job_status_response': // English Hardcode
                        trainingStore.setTrainingJobStatus(data.status);
                        break;
                    case 'training_job_status_update': // English Hardcode
                        trainingStore.addTrainingJobStatus(data.status);
                        break;
                    case 'prompts_list_response': // English Hardcode
                        promptStore.setPromptsList(data.prompts);
                        break;
                    default:
                        if (data.status) {
                             console.debug(`[Local Engine Status - ${data.type || 'Generic'}]: ${data.status}`); // English Hardcode
                        } else {
                            console.warn("[SocketStore] Received unknown message type:", data.type, data); // English Hardcode
                        }
                }
            } catch (e) {
                console.error("[SocketStore] Error processing received message:", e, "Raw data:", event.data); // English Hardcode
            }
        };

        socket.value.onclose = (event) => {
            if (!socket.value || event.target !== socket.value) return;

            const closedEngineId = expectedEngineId;
            const engineName = engineStore.allAvailableEngines.find(e => e.id === closedEngineId)?.name || closedEngineId?.substring(0,8)+'...';
            console.warn(`[SocketStore] WebSocket closed for engine ${engineName}. Code: ${event.code}, Reason: ${event.reason}`); // English Hardcode
            isConnected.value = false;
            isConnecting.value = false;
            if (event.code !== 1000 || (event.reason !== "User disconnected" && event.reason !== "Switching engine target")) { // English Hardcode
                connectionError.value = `Disconnected: ${event.reason || 'Connection lost'} (Code: ${event.code})`; // English Hardcode
            } else {
                connectionError.value = null;
            }
            socket.value = null;
            expectedEngineId = null;
            currentEngineStatus.value = {};

            if (event.code !== 1000 || (event.reason !== "User disconnected" && event.reason !== "Switching engine target")) { // English Hardcode
                handleConnectionError(new Error(`WebSocket closed unexpectedly: ${event.code}`), closedEngineId);
            } else {
                reconnectAttempts = 0;
                if (event.reason !== "Switching engine target") { // English Hardcode
                     uiStore.showNotification({ text: `Disconnected from Engine: ${engineName}`, color: 'warning' }); // English Hardcode
                }
            }
        };

        socket.value.onerror = (errorEvent) => {
            const errorSocket = errorEvent.target;
            if (!socket.value || errorSocket !== socket.value) return;

            const erroredEngineId = expectedEngineId;
            const engineName = engineStore.allAvailableEngines.find(e => e.id === erroredEngineId)?.name || erroredEngineId?.substring(0,8)+'...';
            console.error(`[SocketStore] WebSocket error for engine ${engineName}:`, errorEvent); // English Hardcode
            isConnected.value = false;
            isConnecting.value = false;
            connectionError.value = 'Connection Error. Engine might be offline or unreachable.'; // English Hardcode

            if (socket.value && socket.value.readyState !== WebSocket.CLOSED) {
                socket.value.close(1011, "WebSocket error occurred"); // English Hardcode
            }
            socket.value = null;
            expectedEngineId = null;
            currentEngineStatus.value = {};

            handleConnectionError(new Error('WebSocket connection error'), erroredEngineId); // English Hardcode
        };
    }

    function handleConnectionError(error, engineIdWithError) {
        reconnectAttempts++;
        const uiStore = useUiStore();
        const engineStore = useEngineStore();
        const engineName = engineStore.allAvailableEngines.find(e => e.id === engineIdWithError)?.name || engineIdWithError?.substring(0,8)+'...';

        connectionError.value = `Connection failed to ${engineName}. ${error.message || 'Check engine status.'}`; // English Hardcode

        if (reconnectAttempts <= maxReconnectAttempts) {
            const delay = Math.min(30000, (2 ** reconnectAttempts) * 1000);
            console.log(`[SocketStore] Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} to ${engineName} in ${delay / 1000}s...`); // English Hardcode
            setTimeout(() => {
                if (engineStore.selectedEngineId === engineIdWithError) {
                    connect();
                } else {
                    console.log(`[SocketStore] Reconnect to ${engineName} aborted, user selected a different engine (${engineStore.selectedEngineId}).`); // English Hardcode
                    reconnectAttempts = 0;
                }
            }, delay);
        } else {
            console.error(`[SocketStore] Max reconnect attempts reached for ${engineName}. Giving up.`); // English Hardcode
            connectionError.value = `Failed to connect to ${engineName} after multiple attempts.`; // English Hardcode
        }
    }

    function disconnect(resetReconnect = true) {
        if (socket.value) {
            const engineStore = useEngineStore();
            const disconnectingEngineId = expectedEngineId;
            const engineName = engineStore.allAvailableEngines.find(e => e.id === disconnectingEngineId)?.name || disconnectingEngineId?.substring(0,8)+'...';
            console.log(`[SocketStore] Disconnecting from ${engineName}...`); // English Hardcode
            isConnected.value = false;
            isConnecting.value = false;
            connectionError.value = null;

            if (resetReconnect) {
                reconnectAttempts = maxReconnectAttempts + 1;
            }
            const oldOnClose = socket.value.onclose;
            socket.value.onclose = null;
            socket.value.close(1000, "User disconnected"); // English Hardcode
            socket.value = null;
            expectedEngineId = null;
            currentEngineStatus.value = {};
        }
    }

    function switchEngine(newEngineId) {
        const engineStore = useEngineStore();
        if (newEngineId && (newEngineId !== expectedEngineId || !isConnected.value)) {
            console.log(`[SocketStore] Switching engine connection target to ${newEngineId}`); // English HardCode
            disconnect(false);

            engineStore.selectedEngineId = newEngineId;
            localStorage.setItem('flowork_selected_engine_id', newEngineId); // English Hardcode

            connectionError.value = null;
            reconnectAttempts = 0;
            currentEngineStatus.value = {};

            setTimeout(() => connect(), 50);

        } else if (!newEngineId) {
             console.log("[SocketStore] SwitchEngine called with null ID. Disconnecting."); // English Hardcode
             disconnect(true);
        }
         else {
            console.log(`[SocketStore] SwitchEngine skipped: Already targeting or connected to ${newEngineId}`); // English Hardcode
        }
    }

    async function sendMessage(payload) {
        if (!isConnected.value || !socket.value || socket.value.readyState !== WebSocket.OPEN) {
            const uiStore = useUiStore();
            const errorMsg = `Attempted to send '${payload.type}' while disconnected.`; // English Hardcode
            console.warn(`[SocketStore] ${errorMsg}`); // English Log

            if (payload.type !== 'request_components_list') { // English Hardcode
                 connectionError.value = connectionError.value || 'Not connected to engine.'; // English Hardcode
                 if (!connectionError.value.includes('Auth Failed')) { // English Hardcode
                    uiStore.showConnectEngineDialog();
                 }
            }
            throw new Error(errorMsg);
        }
        try {
            const authPayload = await getSignedAuthPayload();
            const fullMessage = {
                auth: authPayload,
                payload: payload
            };
            if (payload.type !== 'request_components_list') { // English Hardcode
                console.log(`[SocketStore] Sending message type: ${payload.type}`); // English Log
            }
            socket.value.send(JSON.stringify(fullMessage));
        } catch (e) {
            console.error('[SocketStore] Failed to sign and send message:', e); // English Hardcode
            const uiStore = useUiStore();
            uiStore.showNotification({ text: `Message signing error: ${e.message}`, color: 'error' }); // English Hardcode
            connectionError.value = `Message signing error: ${e.message}`; // English Hardcode
            throw e;
        }
    }

    return {
        isConnected,
        isConnecting,
        connectionError,
        currentEngineStatus,
        connect,
        disconnect,
        sendMessage,
        switchEngine,
        emitter
    };
});