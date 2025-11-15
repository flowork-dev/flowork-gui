//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\locale.js total lines 89 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getLocalizationDictionary } from '@/api';
import enLocale from '@/locales/en.json';
import idLocale from '@/locales/id.json';

const staticDictionary = {
    'en': enLocale,
    'id': idLocale
};

export const useLocaleStore = defineStore('locale', () => {
    const currentLang = ref(localStorage.getItem('flowork_lang') || 'en');
    const dictionary = ref({});
    const isDictionaryLoaded = ref(false);

    const loc = computed(() => {
        return (key, params = {}) => {
            if (!key) return '';
            const cleanKey = key.startsWith('loc.') ? key.substring(4) : key;
            let text = dictionary.value[cleanKey] || key;
            for (const [paramKey, paramValue] of Object.entries(params)) {
                 text = text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
            }
            return text;
        };
    });

    function setLanguage(lang) {
        currentLang.value = lang;
        localStorage.setItem('flowork_lang', lang);
        console.log(`[STORE] Language set to: ${lang}. Refetching dictionary...`);
        fetchDictionary(true);
    }

    async function fetchDictionary(force = false) {
        if (!isDictionaryLoaded.value || force) {
            console.log(`[STORE] Applying initial static fallback for: ${currentLang.value}`);
            dictionary.value = staticDictionary[currentLang.value] || staticDictionary['en'];
            isDictionaryLoaded.value = true;
        }

        console.log(`[STORE] Fetching API dictionary for lang: ${currentLang.value}...`);
        try {
            const data = await getLocalizationDictionary(currentLang.value);
            if (data.error) throw new Error(data.error);
            dictionary.value = data;
            isDictionaryLoaded.value = true;
            console.log('[STORE] API dictionary loaded successfully.');
        } catch (error) {
            console.error(`[STORE] Failed to load dictionary for ${currentLang.value} from API. Falling back to 'en' (API).`, error);
            try {
                const dataEn = await getLocalizationDictionary('en');
                if (dataEn.error) throw new Error(dataEn.error);
                dictionary.value = dataEn;
                currentLang.value = 'en';
                isDictionaryLoaded.value = true;
                console.warn("[STORE] API fallback to 'en' loaded successfully.");

            } catch (e_api) {
                 console.error("[STORE] CRITICAL: Failed to load 'en' dictionary from API. Falling back to STATIC JSON.", e_api);
                 const langKey = currentLang.value || 'en';
                 dictionary.value = staticDictionary[langKey] || staticDictionary['en'];

                 if (dictionary.value) {
                    console.log(`[STORE] STATIC dictionary '${langKey}' loaded successfully as last fallback.`);
                    isDictionaryLoaded.value = true;
                 } else {
                    console.error("[STORE] FATAL: Failed to load static dictionary files.", e_api);
                    dictionary.value = {};
                 }
            }
        }
    }

    return {
        loc,
        setLanguage,
        fetchDictionary,
        currentLang,
        isDictionaryLoaded
    };
});
