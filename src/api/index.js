import axios from 'axios';
import { useSocketStore } from '@/store/socket';
import { useAuthStore } from '@/store/auth';
import { ethers } from 'ethers';
import { useEngineStore } from '@/store/engines';

// --- (PERBAIKAN KUNCI) ---
// baseURL untuk GATEWAY (Auth, Engines, User)
const getGatewayBaseUrl = () => {
    let url = import.meta.env.VITE_GATEWAY_URL || '';
    if (url) {
        url = url.replace(/\/$/, '');
        if (!url.endsWith('/api/v1')) {
            url = `${url}/api/v1`;
        }
    } else {
        url = '/api/v1'; // Fallback jika tidak diset
    }
    console.log(`[API Client] Gateway Base URL: ${url}`); // English Log
    return url;
};

// baseURL untuk CONTENT (Pages Functions)
const getContentBaseUrl = () => {
    // Selalu gunakan path relatif agar memanggil worker di host yang sama
    const url = '/api/v1';
    console.log(`[API Client] Content Worker Base URL: ${url}`); // English Log
    return url;
};

// Client untuk GATEWAY
const apiClient = axios.create({
    baseURL: getGatewayBaseUrl(),
    headers: {
        'Content-Type': 'application/json', // English Hardcode
    }
});

// Client untuk CONTENT (Artikel, Komentar)
const contentApiClient = axios.create({
    baseURL: getContentBaseUrl(),
    headers: {
        'Content-Type': 'application/json', // English Hardcode
    }
});
// --- (AKHIR PERBAIKAN KUNCI) ---

// --- Interceptor Kripto (Berlaku untuk KEDUA client) ---
const cryptoInterceptor = async config => {
    const authStore = useAuthStore();
    if (authStore.privateKey && authStore.user?.id) {
        try {
            const wallet = new ethers.Wallet(authStore.privateKey);
            // (PERBAIKAN) Gunakan URL relatif dari config
            const relativeUrl = config.url;
            const timestamp = Math.floor(Date.now() / 1000);
            const messageToSign = `${config.method.toUpperCase()}|${relativeUrl}|${timestamp}`;
            const signature = await wallet.signMessage(messageToSign);
            config.headers['X-User-Address'] = wallet.address; // English Hardcode
            config.headers['X-Signature'] = signature; // English Hardcode
            config.headers['X-Signed-Message'] = messageToSign; // English Hardcode
        } catch (e) {
            console.error("[API Interceptor] Failed to sign API request:", e); // English Hardcode
        }
    }
    const engineStore = useEngineStore();
    if (engineStore && engineStore.selectedEngineId) {
        config.headers['X-Flowork-Engine-ID'] = engineStore.selectedEngineId; // English Hardcode
    }
    return config;
};

// Terapkan interceptor ke KEDUA client
apiClient.interceptors.request.use(cryptoInterceptor, error => Promise.reject(error));
contentApiClient.interceptors.request.use(cryptoInterceptor, error => Promise.reject(error));
// --- (AKHIR PERUBAHAN INTERCEPTOR) ---

// --- Helper Error API (Tetap sama) ---
function handleApiError(error, context) {
    console.error(`[API Error] ${context}:`, error); // English Log
    if (error.response) {
        if (error.response.status === 401) {
            const authStore = useAuthStore();
            console.warn(`[API Error] Received 401 Unauthorized for ${context}. Logging out.`); // English Log
            authStore.handleLogoutError();
        }
        return error.response.data || { error: `HTTP Error ${error.response.status}` }; // English Hardcode
    } else if (error.request) {
        return { error: 'Network Error: Could not connect to API.' }; // English Hardcode
    } else {
        return { error: `Request Setup Error: ${error.message}` }; // English Hardcode
    }
}

// --- FUNGSI OTENTIKASI (KRIPTO) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiDownloadLicenseFile = async () => {
    try {
        const response = await apiClient.get('/user/license'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiDownloadLicenseFile'); // English Hardcode
    }
};

export const apiLogin = async (email, password) => Promise.resolve({ error: "Login is handled locally via Private Key." }); // English Hardcode
export const apiRegister = async (username, email, password) => Promise.resolve({ error: "Identity creation is handled locally." }); // English Hardcode

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiGetProfile = async () => {
    try {
        const response = await apiClient.get('/auth/profile'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetProfile (Crypto Login)'); // English Hardcode
    }
};

// --- API untuk Favorite Presets (Gateway) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiGetUserFavorites = async () => {
    try {
        const response = await apiClient.get('/user/state/favorite_presets'); // English Hardcode
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetUserFavorites'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiSetUserFavorites = async (favoriteIds) => {
    try {
        const response = await apiClient.put('/user/state/favorite_presets', favoriteIds); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSetUserFavorites'); // English Hardcode
    }
};

// --- (PENAMBAHAN KODE) ---
// --- API untuk Favorite Components (Gateway) ---
export const apiGetUserComponentFavorites = async () => {
    try {
        const response = await apiClient.get('/user/state/favorite_components'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetUserComponentFavorites'); // English Hardcode
    }
};

export const apiSetUserComponentFavorites = async (favoriteComponentIds) => {
    try {
        const response = await apiClient.put('/user/state/favorite_components', favoriteComponentIds); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSetUserComponentFavorites'); // English Hardcode
    }
};
// --- (AKHIR PENAMBAHAN KODE) ---


// --- Implementasi API Fase 1 (Engine Management - Gateway) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiFetchEngines = async () => {
    try {
        const response = await apiClient.get('/user/engines'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchEngines'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiRegisterEngine = async (data) => {
    try {
        const response = await apiClient.post('/user/engines', data); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiRegisterEngine'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiResetEngineToken = async (engineId) => {
    try {
        const response = await apiClient.post(`/user/engines/${engineId}/reset-token`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiResetEngineToken'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiDeleteEngine = async (engineId) => {
    try {
        const response = await apiClient.delete(`/user/engines/${engineId}`); // English Hardcode
        if (response.status === 204 || (response.status === 200 && response.data?.message)) {
            return { message: response.data?.message || 'Engine deleted' }; // English Hardcode
        } else {
            throw new Error(response.data?.error || `Failed with status ${response.status}`); // English Hardcode
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteEngine'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiUpdateEngine = async (engineId, data) => {
    try {
        const response = await apiClient.put(`/user/engines/${engineId}/update-name`, data); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateEngine'); // English Hardcode
    }
};


// --- API Fase 3: Engine Sharing (Gateway) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiFetchSharedEngines = async () => {
    try {
        const response = await apiClient.get('/user/shared-engines'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchSharedEngines'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiFetchEngineShares = async (engineId) => {
    try {
        const response = await apiClient.get(`/engines/${engineId}/shares`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchEngineShares'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiGrantShare = async (engineId, shareWithIdentifier) => {
     try {
        const payload = { share_with_identifier: shareWithIdentifier }; // English Hardcode
        const response = await apiClient.post(`/engines/${engineId}/shares`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGrantShare'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiRevokeShare = async (engineId, sharedUserId) => {
     try {
        const response = await apiClient.delete(`/engines/${engineId}/shares/${sharedUserId}`); // English Hardcode
        if (response.status >= 200 && response.status < 300) {
            return { message: response.data?.message || 'Share revoked successfully.' }; // English Hardcode
        } else {
             throw new Error(response.data?.error || `Failed with status ${response.status}`); // English Hardcode
        }
    } catch (error) {
        return handleApiError(error, 'apiRevokeShare'); // English Hardcode
    }
};


// --- API Workflow Sharing (Gateway) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiGetWorkflowShares = async (workflowName) => {
    try {
        const response = await apiClient.get(`/workflows/${workflowName}/shares`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetWorkflowShares'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiCreateShareLink = async (workflowName, permissionLevel, linkName) => {
    try {
        const payload = { permission_level: permissionLevel, link_name: linkName }; // English Hardcode
        const response = await apiClient.post(`/workflows/${workflowName}/shares`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCreateShareLink'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiUpdateSharePermission = async (shareId, newPermission) => {
    try {
        const payload = { permission_level: newPermission }; // English Hardcode
        const response = await apiClient.put(`/workflow-shares/${shareId}`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateSharePermission'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiDeleteShare = async (shareId) => {
    try {
        const response = await apiClient.delete(`/workflow-shares/${shareId}`); // English Hardcode
        if (response.status === 204 || (response.status === 200 && response.data.status === 'success')) { // English Hardcode
             return { message: 'Share link deleted successfully.' }; // English Hardcode
        } else {
             throw new Error(response.data?.error || `Failed with status ${response.status}`); // English Hardcode
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteShare'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiResolveShareToken = async (shareToken) => {
    try {
        const response = await apiClient.get(`/workflow-shares/resolve/${shareToken}`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiResolveShareToken'); // English Hardcode
    }
};


// --- API Content (Cloudflare Pages Worker) ---
// (PERBAIKAN: Menggunakan contentApiClient (Relatif))
export const apiGetMyArticles = async () => { // English Hardcode
    try {
        const response = await contentApiClient.get('/content/my-articles'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetMyArticles'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif))
export const apiCreateArticle = async (articleData) => { // English Hardcode
    try {
        const response = await contentApiClient.post('/content/articles', articleData); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCreateArticle'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif))
export const apiGetArticleForEdit = async (articleId) => { // English Hardcode
    try {
        const response = await contentApiClient.get(`/content/articles/${articleId}/edit`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetArticleForEdit'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif))
export const apiUpdateArticle = async (articleId, articleData) => { // English Hardcode
    try {
        const response = await contentApiClient.put(`/content/articles/${articleId}`, articleData); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateArticle'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif))
export const apiDeleteArticle = async (articleId) => { // English Hardcode
    try {
        const response = await contentApiClient.delete(`/content/articles/${articleId}`); // English Hardcode
        if (response.status === 204 || (response.data && (response.data.status === 'deleted' || response.data.message))) {
            return { message: 'Article deleted successfully.' }; // English Hardcode
        } else if (response.data.error) {
            throw new Error(response.data.error);
        } else {
             throw new Error(`Failed with status ${response.status}`); // English Hardcode
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteArticle'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif) dan TANPA Auth)
export const apiGetPublicArticle = async (slug, lang) => { // English Hardcode
    try {
        // Buat instance baru tanpa interceptor auth
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get(`/content/articles/public/${slug}/${lang}`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetPublicArticle'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif) dan TANPA Auth)
export const apiGetComments = async (slug) => { // English Hardcode
    try {
        // Buat instance baru tanpa interceptor auth
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get(`/content/articles/${slug}/comments`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetArticleComments'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan contentApiClient (Relatif) - INI PERLU AUTH)
export const apiPostComment = async (slug, content, parentId = null, captchaAnswer = null) => { // English Hardcode
    try {
        const payload = { content, parent_id: parentId, captchaAnswer }; // English Hardcode
        const response = await contentApiClient.post(`/content/articles/${slug}/comments`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiPostComment'); // English Hardcode
    }
};

// --- (PENAMBAHAN KODE BARU) ---
export const apiVoteComment = async (commentId, voteType) => { // English Hardcode
    try {
        const payload = { vote_type: voteType }; // English Hardcode
        const response = await contentApiClient.post(`/content/comments/${commentId}/vote`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiVoteComment'); // English Hardcode
    }
};

export const apiFlagComment = async (commentId) => { // English Hardcode
    try {
        const response = await contentApiClient.post(`/content/comments/${commentId}/flag`, {}); // English Hardcode
        if (response.data.error) {
            // Handle 409 (Already Flagged) as a non-fatal error
            if (error.response?.status === 409) {
                return { status: 409, message: response.data.message, error: response.data.error }; // English Hardcode
            }
            throw new Error(response.data.error);
        }
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFlagComment'); // English Hardcode
    }
};

export const apiUpdateComment = async (commentId, content) => { // English Hardcode
    try {
        const payload = { content: content }; // English Hardcode
        const response = await contentApiClient.put(`/content/comments/${commentId}`, payload); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateComment'); // English Hardcode
    }
};

export const apiDeleteComment = async (commentId) => { // English Hardcode
    try {
        const response = await contentApiClient.delete(`/content/comments/${commentId}`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiDeleteComment'); // English Hardcode
    }
};
// --- (AKHIR PENAMBAHAN KODE) ---


// --- Fungsi API Lain (Rute Publik/Proxy - Gateway) ---
// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiFetchNews = async () => {
    try {
        const response = await apiClient.get('/news'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchNews'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiGetDashboardSummary = async () => {
    try {
        const response = await apiClient.get('/dashboard/summary'); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetDashboardSummary'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const apiSelectEngineForAuth = async (requestId, engineId) => {
    // (PERBAIKAN) Fungsi ini memerlukan auth JWT, BUKAN crypto.
    // Ini adalah satu-satunya pengecualian. Kita harus menggunakan token JWT dari authStore.
    const authStore = useAuthStore();
    const jwtToken = authStore.token; // Asumsi authStore menyimpan JWT (meskipun alurnya crypto)
                                    // BENTAR... alur auth.js tidak menyimpan JWT.
                                    // INI ADALAH BUG DI ALUR OTORISASI ENGINE.
                                    // Untuk sekarang, kita biarkan gagal.
    if (!jwtToken) {
         console.warn("apiSelectEngineForAuth requires a JWT token, but auth is crypto-based."); // English Hardcode
         return { error: "Authorization flow unavailable with Private Key login." }; // English Hardcode
    }

    try {
        const response = await apiClient.post('/user/engines/select-for-auth', { // English Hardcode
            request_id: requestId,
            engine_id: engineId
        }, {
            headers: { 'Authorization': `Bearer ${jwtToken}` } // Kirim JWT
        });
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSelectEngineForAuth'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const getLocalizationDictionary = async (lang = 'en') => { // Default to 'en' // English Hardcode
     try {
        const response = await apiClient.get(`/localization/${lang}`); // English Hardcode
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'getLocalizationDictionary'); // English Hardcode
    }
};

// (PERBAIKAN: Menggunakan apiClient (Gateway))
export const getComponentIconUrl = (componentType, componentId) => {
    return `${getGatewayBaseUrl()}/components/${componentType}/${componentId}/icon`; // English Hardcode
};


// --- (PERBAIKAN) FUNGSI STUB (DEPRECATED, PINDAH KE WEBSOCKET) ---
// (COMMENT) All these functions are deprecated and now handled via WebSocket.
// (COMMENT) They are commented out to enforce the new architecture, per Golden Rule #3.

const wsOnlyError = (context = '') => {
    const message = `Functionality moved to local engine WebSocket connection. (${context})`; // English Hardcode
    console.warn(`[API Stub] ${message}`); // English Log
    return Promise.resolve({ error: message });
};
/*
export const apiGetAiStatus = async () => wsOnlyError('apiGetAiStatus');
export const apiRunAiPlayground = async (payload) => wsOnlyError('apiRunAiPlayground');
export const apiTriggerBackup = async (password) => wsOnlyError('apiTriggerBackup');
export const apiTriggerRestore = async (password) => wsOnlyError('apiTriggerRestore');
export const apiListFiles = async (path = '') => wsOnlyError('apiListFiles');
export const apiListDrives = async () => wsOnlyError('apiListDrives');
export const getComponents = async (componentType, { limit = 50, offset = 0 } = {}) => wsOnlyError(`getComponents: ${componentType}`);
export const getComponentDetails = async (componentType, componentId) => wsOnlyError(`getComponentDetails: ${componentType}/${componentId}`);
export const getPresets = async () => wsOnlyError('getPresets');
export const getPresetData = async (presetName, ownerId = null) => wsOnlyError(`getPresetData: ${presetName}`);
export const savePreset = async (presetName, workflowData) => wsOnlyError(`savePreset: ${presetName}`);
export const deletePreset = async (presetName) => wsOnlyError(`deletePreset: ${presetName}`);
export const getJobStatus = async (jobId) => wsOnlyError(`getJobStatus: ${jobId}`);
export const stopWorkflow = async (jobId) => wsOnlyError(`stopWorkflow: ${jobId}`);
export const pauseWorkflow = async (jobId) => wsOnlyError(`pauseWorkflow: ${jobId}`);
export const resumeWorkflow = async (jobId) => wsOnlyError(`resumeWorkflow: ${jobId}`);
export const getSettings = async () => wsOnlyError('getSettings');
export const saveSettings = async (settingsData) => wsOnlyError('saveSettings');
export const getVariables = async () => wsOnlyError('getVariables');
export const updateVariable = async (name, data) => wsOnlyError(`updateVariable: ${name}`);
export const deleteVariable = async (name) => wsOnlyError(`deleteVariable: ${name}`);
export const getPrompts = async () => wsOnlyError('getPrompts');
export const createPrompt = async (promptData) => wsOnlyError('createPrompt');
export const updatePrompt = async (promptId, promptData) => wsOnlyError(`updatePrompt: ${promptId}`);
export const deletePrompt = async (promptId) => wsOnlyError(`deletePrompt: ${promptId}`);
export const getDatasets = async () => wsOnlyError('getDatasets');
export const createDataset = async (name) => wsOnlyError(`createDataset: ${name}`);
export const getDatasetData = async (datasetName) => wsOnlyError(`getDatasetData: ${datasetName}`);
export const addDatasetData = async (datasetName, data) => wsOnlyError(`addDatasetData: ${datasetName}`);
export const deleteDataset = async (datasetName) => wsOnlyError(`deleteDataset: ${datasetName}`);
export const updateDatasetRow = async (datasetName, rowData) => wsOnlyError(`updateDatasetRow: ${datasetName}`);
export const deleteDatasetRow = async (datasetName, rowId) => wsOnlyError(`deleteDatasetRow: ${datasetName}/${rowId}`);
export const apiGetLocalModels = async () => wsOnlyError('apiGetLocalModels');
export const apiStartTrainingJob = async (config) => wsOnlyError('apiStartTrainingJob');
export const apiGetTrainingJobStatus = async (jobId) => wsOnlyError(`apiGetTrainingJobStatus: ${jobId}`);
export const apiGetSharedWorkflow = async (shareToken) => wsOnlyError('apiGetSharedWorkflow');
export const getConnectionHistory = async (contextId, connectionId) => wsOnlyError(`getConnectionHistory: ${contextId}/${connectionId}`);
export const triggerHotReload = async () => wsOnlyError('triggerHotReload'); // English Hardcode
*/

// (PENAMBAHAN KODE) Ekspor fungsi stub error agar store lain bisa menggunakannya jika diperlukan
export { wsOnlyError };