<template>
  <v-dialog
    v-model="uiStore.isDataViewerVisible"
    @update:model-value="handleClose"
    max-width="800px"
    scrollable
  >
    <v-card class="data-viewer-card">
      <v-card-title class="panel-title">
        <v-icon icon="mdi-code-json" class="mr-2"></v-icon>
        {{ viewerTitle }}
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="handleClose"></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="data-content">
        <pre><code>{{ formattedContent }}</code></pre>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/store/ui';

const uiStore = useUiStore();

// COMMENT: [PENAMBAHAN SAYA] Computed property baru untuk judul yang dinamis
const viewerTitle = computed(() => {
    return uiStore.dataViewerContent?.title || 'Connection Data Viewer';
});

const formattedContent = computed(() => {
  try {
    // COMMENT: [PERBAIKAN] Logika diubah agar lebih pintar.
    // Dia akan coba cari `payload`. Kalo nggak ada, dia akan tampilkan seluruh `content`.
    // Kalo itu juga nggak ada, baru tampilkan seluruh objek data.
    const dataToShow = uiStore.dataViewerContent?.payload ?? uiStore.dataViewerContent?.content ?? uiStore.dataViewerContent;
    // COMMENT: [PENAMBAHAN] Cek jika data yang mau ditampilkan itu string JSON, kita parse dulu biar rapi.
    if (typeof dataToShow === 'string') {
        try {
            return JSON.stringify(JSON.parse(dataToShow), null, 2);
        } catch (e) {
            return dataToShow; // Kalo bukan JSON, tampilkan apa adanya.
        }
    }
    return JSON.stringify(dataToShow, null, 2);
  } catch (e) {
    return "Error parsing data.";
  }
});

function handleClose() {
  uiStore.hideDataViewer();
}
</script>

<style scoped>
.data-viewer-card {
  background-color: #1e1e2f;
  border: 1px solid var(--neon-cyan);
}

.panel-title {
  color: var(--neon-cyan);
  font-family: 'Orbitron', monospace;
}

.data-content {
  background-color: #161625;
  color: #e0e0e0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>