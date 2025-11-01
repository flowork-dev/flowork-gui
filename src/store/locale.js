import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getLocalizationDictionary } from '@/api';

export const useLocaleStore = defineStore('locale', () => {
    // --- STATE ---
    const currentLang = ref(localStorage.getItem('flowork_lang') || 'en'); // English Hardcode
    const dictionary = ref({});
    const isDictionaryLoaded = ref(false);

    // --- GETTERS (computed) ---
    const loc = computed(() => {
        return (key, params = {}) => {
            if (!key) return '';
            const cleanKey = key.startsWith('loc.') ? key.substring(4) : key; // English Hardcode
            let text = dictionary.value[cleanKey] || key; // Jika key tidak ada, tampilkan key itu sendiri
            for (const [paramKey, paramValue] of Object.entries(params)) {
                 text = text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
            }
            return text;
        };
    });

    // --- ACTIONS ---
    function setLanguage(lang) {
        currentLang.value = lang;
        localStorage.setItem('flowork_lang', lang); // English Hardcode
        console.log(`[STORE] Language set to: ${lang}. Refetching dictionary...`); // English Log
        fetchDictionary(true); // Paksa muat ulang kamus
    }

    async function fetchDictionary(force = false) {
        if (isDictionaryLoaded.value && !force) return;

        console.log(`[STORE] Fetching API dictionary for lang: ${currentLang.value}...`); // English Log
        try {
            const data = await getLocalizationDictionary(currentLang.value);
            if (data.error) throw new Error(data.error);
            dictionary.value = data;
            isDictionaryLoaded.value = true;
            console.log('[STORE] API dictionary loaded successfully.'); // English Log
        } catch (error) {
            console.error(`[STORE] Failed to load dictionary for ${currentLang.value}. Falling back to 'en'.`, error); // English Log
            // Fallback ke bahasa Inggris jika bahasa yang dipilih gagal dimuat
            try {
                const dataEn = await getLocalizationDictionary('en'); // English Hardcode
                if (dataEn.error) throw new Error(dataEn.error);
                dictionary.value = dataEn;
                currentLang.value = 'en'; // English Hardcode
                isDictionaryLoaded.value = true;
            } catch (e_api) {
                 console.error("[STORE] CRITICAL: Failed to load 'en' dictionary from API.", e_api); // English Log
                 dictionary.value = {};
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