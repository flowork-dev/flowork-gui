//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\store\logs.js total lines 54 
//#######################################################################

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useComponentStore } from './components';

export const useLogStore = defineStore('logs', () => {
    const timelineEntries = ref([]);
    const executionLogs = ref([]);
    const componentStore = useComponentStore();

    const detailedTimeline = computed(() => {
        return timelineEntries.value.map(entry => {
            const component = componentStore.findComponentById(entry.module_id);
            return {
                ...entry,
                node_name: component?.name || entry.node_name,
            };
        }).sort((a, b) => a.timestamp - b.timestamp);
    });


    function updateTimelineEntry(log) {
        const existingEntryIndex = timelineEntries.value.findIndex(e => e.node_id === log.node_id);

        if (existingEntryIndex > -1) {
            timelineEntries.value[existingEntryIndex] = { ...timelineEntries.value[existingEntryIndex], ...log };
        } else {
            timelineEntries.value.push(log);
        }
    }

    function addExecutionLog(log) {
        executionLogs.value.push(log);
    }

    function clearLogs() {
        timelineEntries.value = [];
        executionLogs.value = [];
    }

    return {
        timelineEntries,
        detailedTimeline,
        executionLogs,
        updateTimelineEntry,
        addExecutionLog,
        clearLogs,
    };
});
