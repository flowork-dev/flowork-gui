import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useComponentStore } from './components';

export const useLogStore = defineStore('logs', () => {
    // --- STATE ---
    // COMMENT: [PERBAIKAN] Ini untuk data Debugger Timeline
    const timelineEntries = ref([]);
    // COMMENT: [PENAMBAHAN] Ini untuk panel log mentah
    const executionLogs = ref([]);
    const componentStore = useComponentStore();

    // --- GETTERS ---
    // COMMENT: [PERBAIKAN] Getter ini khusus untuk Debugger Timeline
    const detailedTimeline = computed(() => {
        return timelineEntries.value.map(entry => {
            const component = componentStore.findComponentById(entry.module_id);
            return {
                ...entry,
                node_name: component?.name || entry.node_name,
            };
        }).sort((a, b) => a.timestamp - b.timestamp);
    });

    // --- ACTIONS ---

    // COMMENT: [PERBAIKAN] Aksi ini hanya untuk mengupdate data di Debugger Timeline
    function updateTimelineEntry(log) {
        const existingEntryIndex = timelineEntries.value.findIndex(e => e.node_id === log.node_id);

        if (existingEntryIndex > -1) {
            timelineEntries.value[existingEntryIndex] = { ...timelineEntries.value[existingEntryIndex], ...log };
        } else {
            timelineEntries.value.push(log);
        }
    }

    // COMMENT: [PENAMBAHAN] Aksi baru untuk menambahkan log mentah ke panel
    function addExecutionLog(log) {
        executionLogs.value.push(log);
    }

    function clearLogs() {
        timelineEntries.value = [];
        executionLogs.value = []; // Juga bersihkan log mentah
    }

    // --- RETURN ---
    return {
        timelineEntries,
        detailedTimeline,
        executionLogs, // Export state baru
        updateTimelineEntry,
        addExecutionLog, // Export aksi baru
        clearLogs,
    };
});