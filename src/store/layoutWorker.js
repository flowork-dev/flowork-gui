import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkflowStore } from './workflow';
import { useUiStore } from './ui';

export const useLayoutWorkerStore = defineStore('layoutWorker', () => {
    const worker = ref(null);
    const isWorking = ref(false);

    function initWorker() {
        if (window.Worker) {
            if (worker.value) {
                // Hentikan worker lama jika ada untuk mencegah memory leak
                worker.value.terminate();
            }

            // (KOMENTAR) Kode lama yang menyebabkan error MIME type
            // worker.value = new Worker('../workers/layout.worker.js', { type: 'module' });

            // (PENAMBAHAN KODE) Cara baru yang benar untuk Vite.
            // Ini memberitahu Vite untuk membungkus worker dengan benar saat development.
            worker.value = new Worker(new URL('../workers/layout.worker.js', import.meta.url), { type: 'module' });


            // Siapkan pendengar untuk pesan dari worker
            worker.value.onmessage = (event) => {
                const uiStore = useUiStore();
                const workflowStore = useWorkflowStore();

                const { type, nodes } = event.data;

                if (type === 'LAYOUT_COMPLETE') {
                    console.log('[Main Thread] Menerima layout baru dari worker.');
                    workflowStore.applyAutoLayout(nodes);
                    uiStore.showNotification({ text: 'Auto-layout applied successfully!', color: 'success' });
                }
                isWorking.value = false;
            };

            // Tangani error dari worker
            worker.value.onerror = (error) => {
                console.error('[Worker Error]', error);
                const uiStore = useUiStore();
                uiStore.showNotification({ text: `Layout worker error: ${error.message}`, color: 'error' });
                isWorking.value = false;
            };
        } else {
            console.error('Web Workers are not supported in this browser.');
            alert('Your browser does not support Web Workers, this feature will be unavailable.');
        }
    }

    function runAutoLayout() {
        if (!worker.value) {
            initWorker();
        }

        if (isWorking.value) {
            console.warn('Layout worker is already busy.');
            return;
        }

        const workflowStore = useWorkflowStore();
        const uiStore = useUiStore();

        if (workflowStore.nodes.length === 0) {
            uiStore.showNotification({ text: 'Canvas is empty, nothing to layout.', color: 'info' });
            return;
        }

        isWorking.value = true;
        uiStore.showNotification({ text: 'Calculating optimal layout in background...', color: 'info' });

        // Kirim data nodes ke worker. Kita kirim salinan bersih (deep copy).
        const nodesToProcess = JSON.parse(JSON.stringify(workflowStore.nodes));
        worker.value.postMessage({
            nodes: nodesToProcess
        });
    }

    return {
        isWorking,
        initWorker,
        runAutoLayout
    };
});