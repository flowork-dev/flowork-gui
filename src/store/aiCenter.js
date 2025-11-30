//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\aiCenter.js total lines 352 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient, getGatewayUrl, getAuthHeaders } from '@/api';

export const useAiCenterStore = defineStore('aiCenter', () => {
    const aiProviders = ref([]);
    const agents = ref([]);
    const trainingJobs = ref([]);
    const isLoadingStatus = ref(false);
    const isGenerating = ref(false);
    const error = ref(null);
    const sessions = ref([]);
    const currentSessionId = ref(null);

    const currentSession = computed(() => sessions.value.find(s => s.id === currentSessionId.value) || null);
    const currentMessages = computed(() => currentSession.value ? currentSession.value.messages : []);
    const readyModels = computed(() => aiProviders.value.filter(m => m.status === 'active' || m.status === 'ready' || !m.status));

    async function fetchAiStatus() {
        isLoadingStatus.value = true;
        error.value = null;
        try {
            console.log("[AI Store] Fetching models via AI Proxy...");
            const response = await apiClient.get('/ai/models');
            const payload = response.data;
            let providers = [];
            if (Array.isArray(payload)) providers = payload;
            else if (payload && Array.isArray(payload.items)) providers = payload.items;
            else if (payload && Array.isArray(payload.models)) providers = payload.models;
            else if (payload && typeof payload === 'object') providers = Object.values(payload);

            aiProviders.value = providers.map(p => ({
                ...p,
                id: p.id || p.model_id,
                name: p.name || p.id
            }));

        } catch (e) {
            console.error("[AI Store] API Error:", e);
            error.value = 'Failed to connect to AI Engine.';
            aiProviders.value = [];
        } finally {
            isLoadingStatus.value = false;
        }
    }

    async function fetchAgents() {
        try {
            const response = await apiClient.get('/ai/agents');
            agents.value = response.data.items || [];
        } catch (e) { console.warn("[AI Store] Failed to fetch agents:", e); }
    }

    function createNewSession() {
        let defaultModel = null;
        if (readyModels.value.length > 0) {
            defaultModel = readyModels.value[0].id;
        }

        const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.value.unshift({
            id: newId,
            title: 'New Chat',
            modelId: defaultModel,
            timestamp: Date.now(),
            messages: []
        });
        currentSessionId.value = newId;
        persistSessions();
        return newId;
    }

    function switchSession(sessionId) { if (sessions.value.find(s => s.id === sessionId)) currentSessionId.value = sessionId; }

    function deleteSession(sessionId) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId);
        if (currentSessionId.value === sessionId) currentSessionId.value = sessions.value.length > 0 ? sessions.value[0].id : null;
        persistSessions();
    }

    function toggleLike(sessionId, index) {
        const session = sessions.value.find(s => s.id === sessionId);
        if (session && session.messages[index]) {
            session.messages[index].liked = !session.messages[index].liked;
            persistSessions();
        }
    }

    async function _triggerGeneration(session, fallbackModelId) {
        let modelId = session.modelId || fallbackModelId;

        if (!modelId && readyModels.value.length > 0) {
            modelId = readyModels.value[0].id;
            console.log(`[AI Store] Auto-selected model: ${modelId}`);
        }

        if (modelId) session.modelId = modelId;

        if (!modelId) {
            const errMsg = "No AI Model selected. Please select a model from the dropdown.";
            console.error(errMsg);
            session.messages.push({
                role: 'assistant',
                content: `[System] ${errMsg}`,
                error: true,
                timestamp: Date.now()
            });
            return;
        }

        session.messages.push({
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            error: false,
            isStreaming: true,
            status: 'Initializing...'
        });

        const assistantMsg = session.messages[session.messages.length - 1];

        isGenerating.value = true;
        persistSessions();

        try {
            const contextPayload = session.messages
                .filter(m => m !== assistantMsg && m.content)
                .map(m => ({ role: m.role, content: m.content }));

            const gatewayUrl = getGatewayUrl();
            const url = `${gatewayUrl}/api/v1/ai/chat/completions`;
            const headers = await getAuthHeaders(url, 'POST');

            if (modelId && typeof modelId === 'string' && modelId.startsWith('eng-')) {
                headers['X-Flowork-Engine-ID'] = modelId;
            }
            headers['Content-Type'] = 'application/json';

            let lastUserPrompt = "";
            if (contextPayload.length > 0) {
                const lastMsg = contextPayload[contextPayload.length - 1];
                if (lastMsg.role === 'user') lastUserPrompt = lastMsg.content;
            }

            const payloadData = {
                prompt: lastUserPrompt,
                messages: contextPayload,
                model: modelId,
                endpoint_id: modelId,
                stream: true,
                temperature: 0.7
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payloadData)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const jsonData = await response.json();
                assistantMsg.isStreaming = false;
                assistantMsg.status = null;

                const appendEngineId = (url) => {
                    if (!modelId) return url;
                    const sep = url.includes('?') ? '&' : '?';
                    return `${url}${sep}engine_id=${modelId}`;
                };

                if (jsonData.type === 'image' && jsonData.url) {
                      assistantMsg.mediaType = 'image';
                      assistantMsg.mediaUrl = appendEngineId(`${gatewayUrl}${jsonData.url}`);
                      assistantMsg.content = ""; // Clear text for clean image display
                } else if (jsonData.data && jsonData.data.image_path) {
                      assistantMsg.mediaType = 'image';
                      let basePath = `${gatewayUrl}/api/v1/content/preview?path=${encodeURIComponent(jsonData.data.image_path)}`;
                      assistantMsg.mediaUrl = appendEngineId(basePath);
                } else if (jsonData.error) {
                      assistantMsg.error = true;
                      assistantMsg.content = jsonData.error;
                } else {
                      assistantMsg.content = JSON.stringify(jsonData, null, 2);
                }
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let buffer = "";

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");

                    buffer = lines.pop();

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        try {
                            const json = JSON.parse(line);

                            const appendEngineId = (url) => {
                                if (!modelId) return url;
                                const sep = url.includes('?') ? '&' : '?';
                                return `${url}${sep}engine_id=${modelId}`;
                            };

                            if (json.type === 'status') {
                                assistantMsg.status = json.message;
                            }
                            else if (json.type === 'content') {
                                if (json.chunk) {
                                    assistantMsg.content += json.chunk;
                                }
                                else if (json.data) {
                                    if (json.data.type === 'image') {
                                        assistantMsg.mediaType = 'image';
                                        assistantMsg.mediaUrl = appendEngineId(`${gatewayUrl}${json.data.url}`);
                                        assistantMsg.content = "";
                                    }
                                    else if (json.data.image_path) {
                                        assistantMsg.mediaType = 'image';
                                        let basePath = `${gatewayUrl}/api/v1/content/preview?path=${encodeURIComponent(json.data.image_path)}`;
                                        assistantMsg.mediaUrl = appendEngineId(basePath);
                                    }
                                    else if (json.data.type === 'video') {
                                        assistantMsg.mediaType = 'video';
                                        assistantMsg.mediaUrl = appendEngineId(`${gatewayUrl}${json.data.url}`);
                                    }
                                    else if (json.data.type === 'audio') {
                                        assistantMsg.mediaType = 'audio';
                                        assistantMsg.mediaUrl = appendEngineId(`${gatewayUrl}${json.data.url}`);
                                    }
                                    else {
                                        assistantMsg.content += `\n\`\`\`json\n${JSON.stringify(json.data, null, 2)}\n\`\`\``;
                                    }
                                }
                            }
                            else if (json.type === 'error') {
                                assistantMsg.error = true;
                                assistantMsg.content += `\n[Error: ${json.message}]`;
                            }
                        } catch (e) {
                            if (line.trim() && !line.includes('{"type":')) {
                                assistantMsg.content += line;
                            }
                        }
                    }
                }
            }

            assistantMsg.isStreaming = false;
            assistantMsg.status = null;

        } catch (e) {
            console.error("[AI Store] Streaming Error:", e);
            assistantMsg.error = true;
            let msg = e.message || "";

            if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network error")) {
                msg = "Connection lost. The AI Model might be too heavy (OOM) or took too long to load.";
            } else if (msg.includes("504")) {
                msg = "Gateway Timeout. The AI Engine is busy or loading a large model.";
            }

            assistantMsg.content += `\n[System Error: ${msg}]`;
            assistantMsg.isStreaming = false;
            assistantMsg.status = null;
        } finally {
            isGenerating.value = false;
            persistSessions();
        }
    }

    async function sendMessage(prompt, modelId) {
        if (!prompt.trim()) return;

        if (!currentSessionId.value) {
            createNewSession();
        }

        const session = sessions.value.find(s => s.id === currentSessionId.value);
        if (!session) return;

        if (session.messages.length === 0) {
            session.title = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');
            session.modelId = modelId || session.modelId;
        }

        session.messages.push({ role: 'user', content: prompt, timestamp: Date.now() });

        await _triggerGeneration(session, modelId);
    }

    async function editMessage(sessionId, index, newContent) {
        const session = sessions.value.find(s => s.id === sessionId);
        if (!session || !session.messages[index]) return;

        session.messages[index].content = newContent;

        if (session.messages[index].role === 'user') {
            session.messages = session.messages.slice(0, index + 1);
            await _triggerGeneration(session, session.modelId);
        } else {
            persistSessions();
        }
    }

    function deleteMessage(sessionId, index) {
        const session = sessions.value.find(s => s.id === sessionId);
        if (session) {
            session.messages.splice(index, 1);
            persistSessions();
        }
    }

    function loadHistory() {
        const stored = localStorage.getItem('flowork_ai_sessions');
        if (stored) try { sessions.value = JSON.parse(stored) || []; } catch (e) {}
    }

    function persistSessions() {
        localStorage.setItem('flowork_ai_sessions', JSON.stringify(sessions.value.slice(0, 50)));
    }

    return {
        aiProviders, agents, trainingJobs, isLoadingStatus, isGenerating,
        sessions, currentSessionId, error, currentSession, currentMessages, readyModels,
        fetchAiStatus, fetchAgents, createNewSession, switchSession,
        deleteSession, sendMessage, editMessage, deleteMessage, loadHistory, toggleLike
    };
});
