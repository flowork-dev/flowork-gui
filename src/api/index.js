//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\api\index.js total lines 691 
//#######################################################################

import axios from 'axios';
import { useSocketStore } from '@/store/socket';
import { useAuthStore } from '@/store/auth';
import { ethers } from 'ethers';
import { useEngineStore } from '@/store/engines';
import { useGatewayStore } from '@/store/gateway';

const CURRENT_PAYLOAD_VERSION = 2;

const getContentBaseUrl = () => {
    const url = '/api/v1';
    return url;
};


const apiClient = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    }
});

const contentApiClient = axios.create({
    baseURL: getContentBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    }
});

const dynamicUrlInterceptor = (config) => {
    const gatewayStore = useGatewayStore();
    const currentGatewayUrl = gatewayStore.gatewayUrl || 'https://api.flowork.cloud';
    const newBaseUrl = `${currentGatewayUrl}/api/v1`;

    if (config.url.startsWith('/api/v1')) {
        config.baseURL = currentGatewayUrl;
    } else {
        config.baseURL = newBaseUrl;
    }

    return config;
};

const cryptoInterceptor = async config => {
    const authStore = useAuthStore();
    if (authStore.privateKey && authStore.user?.id) {
        try {
            const wallet = new ethers.Wallet(authStore.privateKey);
            let relativeUrl = config.url;
            if (config.baseURL && relativeUrl.startsWith(config.baseURL)) {
                 relativeUrl = relativeUrl.substring(config.baseURL.length);
            }
            if (relativeUrl.startsWith('/api/v1')) {
                relativeUrl = relativeUrl.substring(7);
            }
            if (!relativeUrl.startsWith('/')) {
                relativeUrl = '/' + relativeUrl;
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const method = config.method ? config.method.toUpperCase() : 'GET';
            const messageToSign = `flowork_api_auth|${wallet.address}|${timestamp}`;

            const signature = await wallet.signMessage(messageToSign);
            config.headers['X-User-Address'] = wallet.address;
            config.headers['X-Signature'] = signature;
            config.headers['X-Signed-Message'] = messageToSign;
            config.headers['X-Payload-Version'] = CURRENT_PAYLOAD_VERSION;
        } catch (e) {
            console.error("[API Interceptor] Failed to sign API request:", e);
        }
    }
    const engineStore = useEngineStore();
    if (engineStore && engineStore.selectedEngineId) {
        config.headers['X-Flowork-Engine-ID'] = engineStore.selectedEngineId;
    }
    return config;
};

apiClient.interceptors.request.use(dynamicUrlInterceptor, error => Promise.reject(error));
apiClient.interceptors.request.use(cryptoInterceptor, error => Promise.reject(error));
contentApiClient.interceptors.request.use(cryptoInterceptor, error => Promise.reject(error));

function handleApiError(error, context) {
    console.error(`[API Error] ${context}:`, error);
    if (error.response) {
        if (error.response.status === 401) {
            const authStore = useAuthStore();
            console.warn(`[API Error] Received 401 Unauthorized for ${context}. Logging out.`);
            authStore.handleLogoutError();
        }
        if (error.response.status === 404) {
            console.warn(`[API Error] 404 Not Found for ${context}. URL may be incorrect.`);
            return error.response.data || { error: `HTTP Error 404: Not Found` };
        }
        return error.response.data || { error: `HTTP Error ${error.response.status}` };
    } else if (error.request) {
        return { error: 'Network Error: Could not connect to API.' };
    } else {
        return { error: `Request Setup Error: ${error.message}` };
    }
}

export const apiDownloadLicenseFile = async () => {
    try {
        const response = await apiClient.get('/user/license');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiDownloadLicenseFile');
    }
};

export const apiLogin = async (email, password) => Promise.resolve({ error: "Login is handled locally via Private Key." });
export const apiRegister = async (username, email, password) => Promise.resolve({ error: "Identity creation is handled locally." });

export const apiGetProfile = async () => {
    try {
        console.warn("apiGetProfile (/api/v1/auth/profile) is deprecated.");
        return Promise.resolve({ error: "apiGetProfile is deprecated" });
    } catch (error) {
        return handleApiError(error, 'apiGetProfile (Crypto Login)');
    }
};

export const apiGetUserFavorites = async () => {
    try {
        const response = await apiClient.get('/user/state/favorite_presets');
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetUserFavorites');
    }
};

export const apiSetUserFavorites = async (favoriteIds) => {
    try {
        const response = await apiClient.put('/user/state/favorite_presets', favoriteIds);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSetUserFavorites');
    }
};


export const apiGetUserComponentFavorites = async () => {
    try {
        const response = await apiClient.get('/user/state/favorite_components');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetUserComponentFavorites');
    }
};

export const apiSetUserComponentFavorites = async (favoriteComponentIds) => {
    try {
        const response = await apiClient.put('/user/state/favorite_components', favoriteComponentIds);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSetUserComponentFavorites');
    }
};

export const apiFetchEngines = async () => {
    try {
        const response = await apiClient.get('/user/engines');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchEngines');
    }
};


export const apiRegisterEngine = async (data) => {
    try {
        const response = await apiClient.post('/user/engines', data);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiRegisterEngine');
    }
};


export const apiResetEngineToken = async (engineId) => {
    try {
        const response = await apiClient.post(`/user/engines/${engineId}/reset-token`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiResetEngineToken');
    }
};


export const apiDeleteEngine = async (engineId) => {
    try {
        const response = await apiClient.delete(`/user/engines/${engineId}`);
        if (response.status === 204 || (response.status === 200 && response.data?.message)) {
            return { message: response.data?.message || 'Engine deleted' };
        } else {
            throw new Error(response.data?.error || `Failed with status ${response.status}`);
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteEngine');
    }
};


export const apiUpdateEngine = async (engineId, data) => {
    try {
        const response = await apiClient.put(`/user/engines/${engineId}/update-name`, data);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateEngine');
    }
};


export const apiFetchSharedEngines = async () => {
    try {
        const response = await apiClient.get('/user/shared-engines');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchSharedEngines');
    }
};


export const apiFetchEngineShares = async (engineId) => {
    try {
        const response = await apiClient.get(`/engines/${engineId}/shares`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFetchEngineShares');
    }
};


export const apiGrantShare = async (engineId, shareWithIdentifier) => {
     try {
        const payload = { share_with_identifier: shareWithIdentifier };
        const response = await apiClient.post(`/engines/${engineId}/shares`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGrantShare');
    }
};


export const apiRevokeShare = async (engineId, sharedUserId) => {
     try {
        const response = await apiClient.delete(`/engines/${engineId}/shares/${sharedUserId}`);
        if (response.status >= 200 && response.status < 300) {
            return { message: response.data?.message || 'Share revoked successfully.' };
        } else {
             throw new Error(response.data?.error || `Failed with status ${response.status}`);
        }
    } catch (error) {
        return handleApiError(error, 'apiRevokeShare');
    }
};

export const apiGetWorkflowShares = async (workflowName) => {
    try {
        const response = await apiClient.get(`/workflows/${workflowName}/shares`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetWorkflowShares');
    }
};

export const apiCreateShareLink = async (workflowName, permissionLevel, linkName) => {
    try {
        const payload = { permission_level: permissionLevel, link_name: linkName };
        const response = await apiClient.post(`/workflows/${workflowName}/shares`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCreateShareLink');
    }
};

export const apiUpdateSharePermission = async (shareId, newPermission) => {
    try {
        const payload = { permission_level: newPermission };
        const response = await apiClient.put(`/workflow-shares/${shareId}`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateSharePermission');
    }
};

export const apiDeleteShare = async (shareId) => {
    try {
        const response = await apiClient.delete(`/workflow-shares/${shareId}`);
        if (response.status === 204 || (response.status === 200 && response.data.status === 'success')) {
             return { message: 'Share link deleted successfully.' };
        } else {
             throw new Error(response.data?.error || `Failed with status ${response.status}`);
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteShare');
    }
};

export const apiResolveShareToken = async (shareToken) => {
    try {
        const response = await apiClient.get(`/workflow-shares/resolve/${shareToken}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiResolveShareToken');
    }
};
export const apiGetMyArticles = async () => {
    try {
        const response = await contentApiClient.get('/content/my-articles');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetMyArticles');
    }
};

export const apiCreateArticle = async (articleData) => {
    try {
        const response = await contentApiClient.post('/content/articles', articleData);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCreateArticle');
    }
};

export const apiGetArticleForEdit = async (articleId) => {
    try {
        const response = await contentApiClient.get(`/content/articles/${articleId}/edit`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetArticleForEdit');
    }
};

export const apiUpdateArticle = async (articleId, articleData) => {
    try {
        const response = await contentApiClient.put(`/content/articles/${articleId}`, articleData);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateArticle');
    }
};

export const apiDeleteArticle = async (articleId) => {
    try {
        const response = await contentApiClient.delete(`/content/articles/${articleId}`);
        if (response.status === 204 || (response.data && (response.data.status === 'deleted' || response.data.message))) {
            return { message: 'Article deleted successfully.' };
        } else if (response.data.error) {
            throw new Error(response.data.error);
        } else {
             throw new Error(`Failed with status ${response.status}`);
        }
    } catch (error) {
        return handleApiError(error, 'apiDeleteArticle');
    }
};

export const apiGetPublicArticle = async (slug, lang) => {
    try {
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get(`/content/articles/public/${slug}/${lang}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetPublicArticle');
    }
};

export const apiGetComments = async (slug) => {
    try {
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get(`/content/articles/${slug}/comments`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetArticleComments');
    }
};

export const apiPostComment = async (slug, content, parentId = null, captchaAnswer = null) => {
    try {
        const payload = { content, parent_id: parentId, captchaAnswer };
        const response = await contentApiClient.post(`/content/articles/${slug}/comments`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiPostComment');
    }
};

export const apiVoteComment = async (commentId, voteType) => {
    try {
        const payload = { vote_type: voteType };
        const response = await contentApiClient.post(`/content/comments/${commentId}/vote`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiVoteComment');
    }
};

export const apiFlagComment = async (commentId) => {
    try {
        const response = await contentApiClient.post(`/content/comments/${commentId}/flag`, {});
        if (response.data.error) {
            if (error.response?.status === 409) {
                return { status: 409, message: response.data.message, error: response.data.error };
            }
            throw new Error(response.data.error);
        }
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiFlagComment');
    }
};

export const apiUpdateComment = async (commentId, content) => {
    try {
        const payload = { content: content };
        const response = await contentApiClient.put(`/content/comments/${commentId}`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateComment');
    }
};

export const apiDeleteComment = async (commentId) => {
    try {
        const response = await contentApiClient.delete(`/content/comments/${commentId}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiDeleteComment');
    }
};

export const apiGetCloudProfile = async () => {
    try {
        const response = await contentApiClient.get('/users/me');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
         return handleApiError(error, 'apiGetCloudProfile');
    }
};

export const apiUpdateCloudProfile = async (profileData) => {
    try {
        const response = await contentApiClient.put('/users/me', profileData);
       if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiUpdateCloudProfile');
    }
};

export const apiGetMarketplaceItems = async (filters = {}) => {
    try {
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get('/marketplace/list', { params: filters });
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetMarketplaceItems');
    }
};

export const apiGetMarketplaceItemDetail = async (id) => {
    try {
        const publicContentClient = axios.create({ baseURL: getContentBaseUrl() });
        const response = await publicContentClient.get(`/marketplace/${id}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetMarketplaceItemDetail');
    }
};

export const apiPublishMarketplaceItem = async (itemData) => {
    try {
        const response = await contentApiClient.post('/marketplace/publish', itemData);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiPublishMarketplaceItem');
    }
};

export const apiGetPublicProfile = async (identifier) => {
    try {
       const response = await apiClient.get(`/user/public/${identifier}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetPublicProfile');
    }
};


export const apiFetchNews = async () => {
    try {
        return Promise.resolve([]);
    } catch (error) {
        return handleApiError(error, 'apiFetchNews');
    }
};

export const apiGetDashboardSummary = async () => {
    try {
        const response = await apiClient.get('/dashboard/summary');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetDashboardSummary');
    }
};

export const apiSelectEngineForAuth = async (requestId, engineId) => {
    try {
        const response = await apiClient.post('/user/engines/select-for-auth', {
            request_id: requestId,
            engine_id: engineId
        }
        );
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiSelectEngineForAuth');
    }
};

export const getLocalizationDictionary = async (lang = 'en') => { // Default to 'en'
     try {
        return Promise.resolve({});
    } catch (error) {
        return handleApiError(error, 'getLocalizationDictionary');
    }
};

export const getComponentIconUrl = (componentType, componentId) => {
    const gatewayStore = useGatewayStore();
    const currentGatewayUrl = gatewayStore.gatewayUrl || window.location.origin;
    const baseUrl = `${currentGatewayUrl}/api/v1`;
    return `${baseUrl}/components/${componentType}/${componentId}/icon`;
};


const wsOnlyError = (context = '') => {
    const message = `Functionality moved to local engine WebSocket connection. (${context})`;
    console.warn(`[API Stub] ${message}`);
    return Promise.resolve({ error: message });
};
export { wsOnlyError };

export const apiStartSession = async (engine_id, intent, episode_id = null) => {
    try {
        const payload = { engine_id, intent };
        if (episode_id) {
            payload.episode_id = episode_id;
        }
        const response = await apiClient.post('/sessions', payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiStartSession');
    }
};

export const apiCancelSession = async (session_id) => {
    try {
        const response = await apiClient.post(`/sessions/${session_id}/cancel`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCancelSession');
    }
};

export const apiGetEpisodes = async (engine_id) => {
    try {
        const response = await apiClient.get('/episodes', { params: { engine_id } });
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetEpisodes');
    }
};

export const apiCreateEpisode = async (engine_id, title = "New Chat") => {
    try {
        const response = await apiClient.post('/episodes', { engine_id, title });
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiCreateEpisode');
    }
};

export const apiShareEngine = async (engine_id, user_id, role = 'reader') => {
    try {
        const payload = { user_id, role };
        const response = await apiClient.post(`/user/engines/${engine_id}/share`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiShareEngine');
    }
};

export const apiListCapsules = async () => {
    try {
        const response = await apiClient.get('/capsules');
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiListCapsules');
    }
};

export const apiGetCapsule = async (capsuleId) => {
    try {
        const response = await apiClient.get(`/capsules/${capsuleId}`);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiGetCapsule');
    }
};

export const apiInstallCapsule = async (capsulePayload) => {
    try {
        const response = await apiClient.post('/capsules', capsulePayload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiInstallCapsule');
    }
};

export const apiRemixCapsule = async (baseCapsuleId, newCapsuleId, patch) => {
    try {
        const payload = { new_capsule_id: newCapsuleId, patch: patch };
        const response = await apiClient.post(`/capsules/${baseCapsuleId}/remix`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiRemixCapsule');
    }
};

export const apiPreviewCapsuleFac = async (capsuleId, user, engine) => {
    try {
        const payload = { user, engine };
        const response = await apiClient.post(`/capsules/${capsuleId}/fac-preview`, payload);
        if (response.data.error) throw new Error(response.data.error);
        return response.data;
    } catch (error) {
        return handleApiError(error, 'apiPreviewCapsuleFac');
    }
};

export { apiClient };
