//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\aiCenter.js total lines 155 
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
    const readyModels = computed(() => aiProviders.value.filter(m => m.status === 'active' || m.status === 'ready'));

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
            aiProviders.value = providers;
            console.log(`[AI Store] Loaded ${providers.length} models.`);
        } catch (e) {
            console.error("[AI Store] API Error:", e);
            error.value = e.response?.data?.detail || e.response?.data?.error || 'Failed to connect to AI Engine.';
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

    async function startTrainingJob(datasetId, config) {
        try {
            const response = await apiClient.post(`/ai/training/start/${datasetId}`, config);
            return response.data;
        } catch (e) { console.error("[AI Store] Training failed:", e); throw e; }
    }

    function createNewSession() {
        const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.value.unshift({ id: newId, title: 'New Chat', modelId: null, timestamp: Date.now(), messages: [] });
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

    async function sendMessage(prompt, modelId) {
        if (!prompt.trim()) return;
        if (!currentSessionId.value) createNewSession();
        const session = sessions.value.find(s => s.id === currentSessionId.value);
        if (!session) return;
        if (session.messages.length === 0) {
            session.title = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');
            session.modelId = modelId;
        }
        session.messages.push({ role: 'user', content: prompt, timestamp: Date.now() });

        const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now(), error: false, isStreaming: true };
        session.messages.push(assistantMsg);
        isGenerating.value = true;
        persistSessions();

        try {
            const contextPayload = session.messages.filter(m => m !== assistantMsg).map(m => ({ role: m.role, content: m.content }));
            const gatewayUrl = getGatewayUrl();
            const url = `${gatewayUrl}/api/v1/ai/chat/completions`;

            const headers = await getAuthHeaders(url, 'POST');
            if (modelId && typeof modelId === 'string' && modelId.startsWith('eng-')) headers['X-Flowork-Engine-ID'] = modelId;
            headers['Content-Type'] = 'application/json';

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ prompt, messages: contextPayload, model: modelId, stream: true, temperature: 0.7 })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let isFirstChunk = true;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    let chunk = decoder.decode(value, { stream: true });

                    if (isFirstChunk) {
                        chunk = chunk.replace(/ {20,}/g, "");
                        chunk = chunk.trimStart();
                        if (chunk.includes("Flowork AI")) chunk += "\n\n";

                        if (chunk.length === 0) continue;
                        isFirstChunk = false;
                    }
                    assistantMsg.content += chunk;
                }
            }
            assistantMsg.isStreaming = false;
        } catch (e) {
            console.error("[AI Store] Streaming Error:", e);
            assistantMsg.error = true;
            assistantMsg.content += `\n[System Error: ${e.message}]`;
            assistantMsg.isStreaming = false;
        } finally {
            isGenerating.value = false;
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

    return { aiProviders, agents, trainingJobs, isLoadingStatus, isGenerating, sessions, currentSessionId, error, currentSession, currentMessages, readyModels, fetchAiStatus, fetchAgents, startTrainingJob, createNewSession, switchSession, deleteSession, sendMessage, loadHistory };
});
