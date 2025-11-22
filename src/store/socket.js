//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\socket.js total lines 632 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useUiStore } from './ui';
import { useLogStore } from './logs';
import { useWorkflowStore } from './workflow';
import { useComponentStore } from './components';
import { useEngineStore } from './engines';
import { useVariablesStore } from './variables';
import { useSettingsStore } from './settings';
import { usePromptStore } from './prompts';
import { useTrainingStore } from './training';
import { ethers } from 'ethers';

const useAgentStore = defineStore('agent', () => {
    const currentSessionId = ref(null);
    const currentWsToken = ref(null);
    const currentPhase = ref('idle');
    const conversation = ref([]);
    const isStreaming = ref(false);

    function startSession(sessionId, wsToken) {
        currentSessionId.value = sessionId;
        currentWsToken.value = wsToken;
        currentPhase.value = 'queued';
        conversation.value = [];
        isStreaming.value = false;
    }

    function addUserMessage(text) {
        conversation.value.push({ type: 'user', content: text });
    }

    function addAgentChunk(chunk) {
        isStreaming.value = true;
        if (conversation.value.length > 0 && conversation.value[conversation.value.length - 1].type === 'agent') {
            conversation.value[conversation.value.length - 1].content += chunk;
        } else {
            conversation.value.push({ type: 'agent', content: chunk });
        }
    }

    function setPhase(phase) {
        currentPhase.value = phase;
        if (phase === 'running') isStreaming.value = false;
        if (phase === 'done' || phase === 'error' || phase === 'cancelled') isStreaming.value = false;
    }

    function setDone(outcome) {
        setPhase('done');
    }

    function setError(code, message) {
        setPhase('error');
        conversation.value.push({ type: 'error', content: `[${code}] ${message}` });
    }

    function reset() {
        currentSessionId.value = null;
        currentWsToken.value = null;
        currentPhase.value = 'idle';
        conversation.value = [];
        isStreaming.value = false;
    }

    return {
        currentSessionId,
        currentWsToken,
        currentPhase,
        conversation,
        isStreaming,
        startSession,
        addUserMessage,
        addAgentChunk,
        setPhase,
        setDone,
        setError,
        reset,
    };
});


const CURRENT_PAYLOAD_VERSION = 2;

const getGatewayUrl = () => {
    let url = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8000').replace(/\/$/, '');
    console.log(`[SocketStore] Using Gateway URL: ${url}`);
    return url;
};

const _getAuthHeaders = async () => {
    const authStore = useAuthStore();
    if (!authStore.privateKey || !authStore.user?.id) {
        throw new Error("User not authenticated");
    }
    try {
        const wallet = new ethers.Wallet(authStore.privateKey);
        const timestamp = Math.floor(Date.now() / 1000);
        const messageToSign = `flowork_socket_auth|${wallet.address}|${timestamp}`;
        const signature = await wallet.signMessage(messageToSign);
        return {
            'X-User-Address': wallet.address,
            'X-Signed-Message': messageToSign,
            'X-Signature': signature,
            'X-Payload-Version': CURRENT_PAYLOAD_VERSION
        };
    } catch (error) {
        console.error('[SocketStore] Failed to generate auth headers:', error);
        throw error;
    }
};


export const useSocketStore = defineStore('socket', () => {
    const socket = ref(null);
    const isConnecting = ref(false);
    const connectionError = ref(null);
    const resolvedGatewayUrl = ref(null);
    const isGracePeriod = ref(true);

    const currentEngineStatus = ref({
        isBusy: false,
        cpuPercent: null,
        memoryPercent: null
    });
    const isConnected = computed(() => socket.value?.connected || false);
    const isDevEngine = computed(() => {
        const engineStore = useEngineStore();
        return engineStore.selectedEngine?.isDev || false;
    });

    async function connect() {
        if (socket.value?.connected) {
            console.log("[SocketStore] Already connected. Skipping.");
            return;
        }
        if (isConnecting.value) {
             console.log("[SocketStore] Connection already in progress.");
             return;
        }

        const authStore = useAuthStore();
        const engineStore = useEngineStore();

        if (!authStore.isAuthenticated) {
            console.warn("[SocketStore] Connection attempt aborted: User not authenticated.");
            isGracePeriod.value = false;
            return;
        }

        isConnecting.value = true;
        isGracePeriod.value = true;

        setTimeout(() => {
            if (!isConnected.value) {
                isGracePeriod.value = false;
            }
        }, 3000);

        connectionError.value = null;

        const gatewayUrl = getGatewayUrl();
        resolvedGatewayUrl.value = gatewayUrl;

        let authHeaders;
        try {
            authHeaders = await _getAuthHeaders();
        } catch (error) {
            connectionError.value = `Auth Failed: ${error.message}`;
            isConnecting.value = false;
            isGracePeriod.value = false;
            authStore.logout();
            return;
        }

        const socketPath = "/api/socket.io";
        const socketNamespace = "/gui-socket";
        const socketUrl = gatewayUrl + socketNamespace;
        console.log(`[SocketStore] Connecting directly to namespace: ${socketUrl} (Path: ${socketPath})`);

        let targetEngineId = engineStore.selectedEngineId;
        if (!targetEngineId) {
            targetEngineId = localStorage.getItem('flowork_selected_engine_id');
        }

        const queryParams = {};
        if (targetEngineId) {
            queryParams.engine_id = targetEngineId;
            console.log(`[SocketStore] Binding connection to Engine ID: ${targetEngineId}`);
        }

        try {
            const newSocket = io(socketUrl, {
                path: socketPath,
                transports: ['websocket'],
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 500,
                reconnectionDelayMax: 2000,
                timeout: 10000,
                auth: {
                    headers: authHeaders
                },
                query: queryParams
            });

            socket.value = newSocket;

            registerEventHandlers();

            console.log("[SocketStore] Listeners attached. Initiating connection...");
            socket.value.connect();

        } catch (error) {
            console.error("[SocketStore] Failed to initialize socket.io client:", error);
            connectionError.value = `Connection Init Failed: ${error.message}`;
            isConnecting.value = false;
            isGracePeriod.value = false;
        }
    }


    function disconnect() {
        if (socket.value) {
            console.log("[SocketStore] Disconnecting socket...");
            socket.value.disconnect();
            socket.value = null;
        }
        isConnecting.value = false;
        connectionError.value = null;
        resolvedGatewayUrl.value = null;
        currentEngineStatus.value = { isBusy: false, cpuPercent: null, memoryPercent: null };
        isGracePeriod.value = false;

        const agentStore = useAgentStore();
        agentStore.reset();
    }

    async function sendMessage(payload) {
        if (!isConnected.value || !socket.value) {
            console.error("[SocketStore] Cannot send message: Socket not connected.", payload);
            const uiStore = useUiStore();
            uiStore.showConnectEngineDialog();
            throw new Error("Socket not connected");
        }

        const eventName = payload.type;
        if (!eventName) {
            console.error("[SocketStore] Cannot send message: Payload has no 'type' (event name).", payload);
            return;
        }

        const engineStore = useEngineStore();
        if (!payload.target_engine_id && engineStore.selectedEngineId) {
            payload.target_engine_id = engineStore.selectedEngineId;
        }

        const versionedPayload = {
            v: CURRENT_PAYLOAD_VERSION,
            payload: {
                ...payload,
            }
        };

        try {
            console.log(`[SocketStore] Sending Event '${eventName}'`, versionedPayload);
            socket.value.emit(eventName, versionedPayload);
        } catch (error) {
            console.error(`[SocketStore] Error emitting socket event '${eventName}':`, error);
        }
    }

    async function joinAgentSession(sessionId, wsToken) {
        if (!isConnected.value || !socket.value) {
            console.error("[SocketStore] Cannot join session: Socket not connected.");
            return;
        }

        const agentStore = useAgentStore();
        agentStore.startSession(sessionId, wsToken);

        const payload = {
            session_id: sessionId,
            ws_token: wsToken
        };

        console.log(`[SocketStore] Emitting 'gui:join' for session ${sessionId}`);
        socket.value.emit('gui:join', payload, (ack) => {
            if (ack.ok) {
                console.log(`[SocketStore] Successfully joined session room ${sessionId}`);
            } else {
                console.error(`[SocketStore] Failed to join session room: ${ack.error}`);
                agentStore.setError('JOIN_FAILED', ack.error);
            }
        });
    }

    async function sendAgentInput(input) {
        const agentStore = useAgentStore();
        const sessionId = agentStore.currentSessionId;

        if (!isConnected.value || !socket.value) {
            console.error("[SocketStore] Cannot send input: Socket not connected.");
            return;
        }
        if (!sessionId) {
            console.error("[SocketStore] Cannot send input: Not in a session.");
            return;
        }

        let payload;
        if (typeof input === 'string') {
            payload = { session_id: sessionId, text: input };
            agentStore.addUserMessage(input);
        } else {
            payload = { session_id: sessionId, tool: input };
        }

        console.log(`[SocketStore] Emitting 'gui:input' for session ${sessionId}`);
        socket.value.emit('gui:input', payload);
    }


    function switchEngine(newEngineId) {
        console.log(`[SocketStore] Switching to engine: ${newEngineId}`);
        const engineStore = useEngineStore();
        if (isConnected.value || socket.value) {
            socket.value.disconnect();
            socket.value = null;
        }

        engineStore.setSelectedEngineId(newEngineId);

        setTimeout(() => {
            connect();
        }, 100);
    }

    function registerEventHandlers() {
        if (!socket.value) return;

        const uiStore = useUiStore();
        const logStore = useLogStore();
        const workflowStore = useWorkflowStore();
        const componentStore = useComponentStore();
        const engineStore = useEngineStore();
        const variableStore = useVariablesStore();
        const settingsStore = useSettingsStore();
        const promptStore = usePromptStore();
        const trainingStore = useTrainingStore();
        const agentStore = useAgentStore();

        socket.value.on('connect', () => {
            isConnecting.value = false;
            isGracePeriod.value = false;
            connectionError.value = null;
            console.log(`[SocketStore] Successfully connected to NAMESPACE /gui-socket. SID: ${socket.value.id}`);
            uiStore.showNotification({ text: `Connected to Flowork Gateway`, color: 'success', timeout: 2000 });

            console.log("[SocketStore] Connected! Triggering full data hydration...");

            settingsStore.fetchSettings();
            workflowStore.fetchPresets();
            variableStore.fetchVariables();
            componentStore.forceRefetchAllComponents();
            workflowStore.fetchUserFavorites();
            componentStore.fetchUserFavorites();
            promptStore.fetchPrompts();
            trainingStore.fetchLocalModels();
            trainingStore.fetchTrainingJobStatus(null);
        });

        socket.value.on('connect_error', (error) => {
            console.error('[SocketStore] NAMESPACE Connection Error:', error.message);
            if (!isGracePeriod.value) {
                 connectionError.value = `Connection Failed: ${error.message}`;
            }
            isConnecting.value = false;
        });

        socket.value.on('disconnect', (reason) => {
            console.warn(`[SocketStore] Disconnected from NAMESPACE: ${reason}`);
            agentStore.setError('DISCONNECTED', reason);
        });

        socket.value.on('error', (data) => {
            const message = data?.payload?.message || data?.message || "Unknown error";
            console.error('[SocketStore] Received error from Gateway:', message);
            uiStore.showNotification({ text: `Error: ${message}`, color: 'error' });
        });

        socket.value.on('initial_engine_statuses', (statuses) => {
            console.log("[SocketStore] Received initial engine statuses:", statuses);
            engineStore.syncEngineStatuses(statuses);
        });

        socket.value.on('engine_status_update', (data) => {
            engineStore.updateEngineStatus(data);
            if (data.engine_id === engineStore.selectedEngineId) {
                currentEngineStatus.value.isBusy = data.vitals?.is_busy || false;
                currentEngineStatus.value.cpuPercent = data.vitals?.cpu_percent || null;
                currentEngineStatus.value.memoryPercent = data.vitals?.memory_percent || null;
            }
        });

        socket.value.on('engine_vitals_update', (data) => {
            if (data.engine_id) {
                engineStore.updateEngineVitals(data);
            }
            currentEngineStatus.value.isBusy = data.vitals?.is_busy || false;
            currentEngineStatus.value.cpuPercent = data.vitals?.cpu_percent || null;
            currentEngineStatus.value.memoryPercent = data.vitals?.memory_percent || null;
        });

        socket.value.on('response_presets_list', (data) => {
            const payload = data.payload || data;
            if (payload.error) {
                console.error("[SocketStore] Error fetching presets:", payload.error);
            } else {
                workflowStore.updatePresetsList(payload.presets, payload.favorites);
            }
        });

        socket.value.on('response_load_preset', (data) => {
            const payload = data.payload || data;
            if (payload.error) {
                console.error(`[SocketStore] Error loading preset '${payload.name}':`, payload.error);
                uiStore.showNotification({ text: `Error loading '${payload.name}': ${payload.error}`, color: 'error' });
                workflowStore.handleFetchError(payload.error);
            } else {
                workflowStore.updateSinglePresetData(payload.name, payload.workflow_data);
            }
        });

        socket.value.on('response_variables', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                variableStore.variables = payload.variables;
                variableStore.isLoading = false;
            }
        });

        socket.value.on('response_component_list', (data) => {
            const payload = data.payload || data;
            if (payload.error) {
                console.error(`[SocketStore] Error fetching components for ${payload.component_type}:`, payload.error);
            } else {
                componentStore.updateComponentsList(payload.component_type, payload.components);
            }
        });

        socket.value.on('settings_response', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                settingsStore.settings = payload.settings;
                uiStore.loadUiPreferences(payload.settings);
            }
            settingsStore.isLoading = false;
        });

        socket.value.on('response_prompts_list', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                promptStore.setPromptsList(payload.prompts);
            }
            promptStore.isLoading = false;
        });

        socket.value.on('response_local_models', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                trainingStore.setLocalModels(payload.models);
            }
            trainingStore.isLoadingModels = false;
        });

        socket.value.on('response_training_job_status', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                trainingStore.setTrainingJobStatus(payload.jobs);
            }
            trainingStore.isLoadingJobs = false;
        });

        socket.value.on('add_training_job_status', (data) => {
            const payload = data.payload || data;
            if (payload.job) {
                trainingStore.addTrainingJobStatus(payload.job);
            }
        });

        socket.value.on('response_datasets_list', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                const datasetStore = (async () => (await import('./datasets')).useDatasetStore())();
                datasetStore.setDatasetsList(payload.datasets);
            }
        });

        socket.value.on('response_dataset_data', (data) => {
            const payload = data.payload || data;
            if (!payload.error) {
                const datasetStore = (async () => (await import('./datasets')).useDatasetStore())();
                datasetStore.setDatasetData(payload.data);
            }
        });

        socket.value.on('component_install_status', (data) => {
            const payload = data.payload || data;
            componentStore.handleInstallStatusUpdate(payload);
        });


        socket.value.on('WORKFLOW_EXECUTION_UPDATE', (data) => {
            const payload = data.payload || data;
            workflowStore.updateExecutionStatus(payload);
        });

        socket.value.on('NODE_METRIC_UPDATE', (data) => {
            const payload = data.payload || data;
            workflowStore.updateNodeExecutionStatus(payload.metric);
            logStore.updateTimelineEntry(payload.metric);
        });

        socket.value.on('CONNECTION_METRIC_UPDATE', (data) => {
            const payload = data.payload || data;
            workflowStore.updateConnectionStatus(payload.metric);
        });

        socket.value.on('WORKFLOW_LOG_ENTRY', (data) => {
            const payload = data.payload || data;

            logStore.addExecutionLog(payload);

            if (payload.node_id) {
                const node = workflowStore.nodes.find(n => n.id === payload.node_id);
                let status = 'RUNNING';
                const lvl = (payload.level || '').toUpperCase();
                if (lvl.includes('SUCCESS')) status = 'SUCCESS';
                if (lvl.includes('ERROR') || lvl.includes('FAIL')) status = 'FAILED';

                logStore.updateTimelineEntry({
                    node_id: payload.node_id,
                    module_id: node ? node.data.moduleId : payload.source, // Fallback to source if node lookup fails
                    status: status,
                    timestamp: payload.ts ? new Date(payload.ts).getTime() / 1000 : Date.now() / 1000,
                    execution_time_ms: null
                });
            }
        });


        socket.value.on('SHOW_DEBUG_POPUP', (data) => {
            const payload = data.payload || data;
            uiStore.showDataViewer(payload);
        });

        socket.value.on('CONNECTION_DATA_RESPONSE', (data) => {
            const payload = data.payload || data;
            if (payload.error) {
                uiStore.showDataViewer({
                    title: `Data for ${payload.connection_id?.substring(0,8)}...`,
                    error: `No data found.`,
                    content: payload.error
                });
            } else {
                uiStore.showDataViewer({
                    title: `Data History for ${payload.connection_id?.substring(0,8)}... (Job: ${payload.job_id?.substring(0,8)})`,
                    payload: payload.history
                });
            }
        });


        socket.value.on('agent:status', (data) => {
            if (data.session_id === agentStore.currentSessionId) {
                agentStore.setPhase(data.phase);
            }
        });

        socket.value.on('agent:token', (data) => {
            if (data.session_id === agentStore.currentSessionId) {
                agentStore.addAgentChunk(data.chunk);
            }
        });

        socket.value.on('agent:tool', (data) => {
            if (data.session_id === agentStore.currentSessionId) {
                agentStore.addAgentChunk(`\n\n**Tool Call: \`${data.name}\`**\n\`\`\`json\n${JSON.stringify(data.args, null, 2)}\n\`\`\`\n`);
            }
        });

        socket.value.on('agent:done', (data) => {
            if (data.session_id === agentStore.currentSessionId) {
                agentStore.setDone(data.outcome);
            }
        });

        socket.value.on('agent:error', (data) => {
            if (data.session_id === agentStore.currentSessionId) {
                agentStore.setError(data.code, data.message);
            }
        });

    }

    return {
        socket,
        isConnected,
        isConnecting,
        connectionError,
        resolvedGatewayUrl,
        currentEngineStatus,
        isDevEngine,
        isGracePeriod,
        connect,
        disconnect,
        sendMessage,
        switchEngine,
        joinAgentSession,
        sendAgentInput,
        useAgentStore
    };
});
