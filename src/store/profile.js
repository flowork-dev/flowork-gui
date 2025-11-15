//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\profile.js total lines 89 
//#######################################################################

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGetCloudProfile, apiUpdateCloudProfile, apiGetProfile } from '@/api';
import { useUiStore } from './ui';
import { useAuthStore } from './auth';

export const useProfileStore = defineStore('profile', () => {
    const profile = ref(null);
    const isLoading = ref(false);
    const error = ref(null);


    /**
     * (English Hardcode) Fetches the full user profile from the cloud (me.js)
     * and stores it locally.
     */
    async function fetchProfile() {
        const authStore = useAuthStore();
        if (!authStore.isAuthenticated) {
            console.warn('[ProfileStore] Aborted fetch: User not authenticated.');
            return;
        }

        isLoading.value = true;
        error.value = null;
        try {
            const profileData = await apiGetProfile();

            if (profileData.error) throw new Error(profileData.error);
            profile.value = profileData;
            console.log('[ProfileStore] Cloud profile loaded:', profileData); // English Log
        } catch (e) {
            error.value = e.message || 'Failed to fetch cloud profile.';
            console.error(`[ProfileStore] ${error.value}`); // English Log
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * (English Hardcode) Saves the user's profile data to the cloud (me.js).
     * @param {object} updatedData - { name, bio, avatar }
     */
    async function saveProfile(updatedData) {
        const uiStore = useUiStore();
        isLoading.value = true;
        error.value = null;
        try {
            const result = await apiUpdateCloudProfile(updatedData);
            if (result.error) throw new Error(result.error);

            profile.value = { ...profile.value, ...updatedData };
            uiStore.showNotification({ text: 'Profile updated successfully!', color: 'success' });
            const authStore = useAuthStore();
            if (authStore.user && updatedData.name) {
                 authStore.user.username = updatedData.name;
                 localStorage.setItem('flowork_user_identity', JSON.stringify(authStore.user));
            }

            return true;
        } catch (e) {
            error.value = e.message || 'Failed to save profile.';
            console.error(`[ProfileStore] ${error.value}`); // English Log
            uiStore.showNotification({ text: `Error: ${error.value}`, color: 'error' });
            return false;
        } finally {
            isLoading.value = false;
        }
    }
    function clearProfile() {
        profile.value = null;
        error.value = null;
    }

    return {
        profile,
        isLoading,
        error,
        fetchProfile,
        saveProfile,
        clearProfile
    };
});
