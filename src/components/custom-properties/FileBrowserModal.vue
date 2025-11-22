//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\custom-properties\FileBrowserModal.vue total lines 286 
//#######################################################################

<template>
  <v-dialog :model-value="modelValue" @update:modelValue="closeModal" max-width="800px" persistent scrollable>
    <v-card class="file-browser-card">
      <v-toolbar color="transparent" density="compact">
        <v-btn icon="mdi-home-outline" @click="fetchInitialView" title="Go to Drives/Roots"></v-btn>
        <v-btn icon="mdi-arrow-up" @click="goUp" :disabled="isRoot"></v-btn>

        <v-text-field
            v-model="currentPathDisplay"
            readonly
            label="Current Path"
            variant="solo-filled"
            density="compact"
            hide-details
            flat
            prepend-inner-icon="mdi-folder-outline"
            class="path-input"
        ></v-text-field>

        <v-spacer></v-spacer>
        <v-btn icon="mdi-refresh" @click="refreshCurrentView" :loading="isLoading" title="Refresh"></v-btn>
        <v-btn icon="mdi-close" @click="closeModal"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <v-list class="file-list" density="compact">
          <div v-if="isLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="cyan"></v-progress-circular>
          </div>
          <div v-else-if="error" class="text-center py-8 text-error">
            <v-icon>mdi-alert-circle-outline</v-icon>
            <p>{{ error }}</p>
          </div>
          <div v-else-if="items.length === 0" class="text-center py-8 text-grey">
            This directory is empty.
          </div>
          <v-list-item
            v-else
            v-for="item in items"
            :key="item.path"
            @click="handleItemClick(item)"
            class="list-item"
            :title="item.name"
            :active="selectedItem?.path === item.path"
            active-color="cyan"
          >
            <template v-slot:prepend>
              <v-icon :color="getIconColor(item)">
                {{ getIcon(item) }}
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <span class="text-caption text-grey ml-2">{{ selectedItem ? `Selected: ${selectedItem.name}` : 'Select a folder' }}</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="closeModal">Cancel</v-btn>
        <v-btn
          color="cyan"
          variant="flat"
          class="select-button"
          @click="selectCurrentFolder"
          :disabled="isLoading || !currentPath || isInitialView"
        >
          Select Current Folder
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useSocketStore } from '@/store/socket';
import { useUiStore } from '@/store/ui';

const props = defineProps({
  modelValue: Boolean, // For v-model
  initialPath: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'folder-selected']);

const socketStore = useSocketStore();
const uiStore = useUiStore();

const currentPath = ref('');
const currentPathDisplay = computed(() => currentPath.value || 'My Computer / Root Folders'); // Tampilan path
const items = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isInitialView = ref(true);
const selectedItem = ref(null); // Untuk menyorot item

const isRoot = computed(() => isInitialView.value);

const handleDrivesResponse = (data) => {
    isLoading.value = false;
    if (data.error) {
        error.value = data.error;
        items.value = [];
    } else {
        items.value = data.drives.map(drive => ({ ...drive, type: 'drive' }));
        currentPath.value = '';
        isInitialView.value = true;
    }
};

const handleDirectoryResponse = (data) => {
    if (data.path === currentPath.value) {
        isLoading.value = false;
        if (data.error) {
            error.value = data.error;
            items.value = [];
        } else {
            items.value = data.items.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1; // Folder dulu
            });
            isInitialView.value = false;
        }
    }
};

onMounted(() => {
    socketStore.emitter.on('drives-list', handleDrivesResponse);
    socketStore.emitter.on('directory-list', handleDirectoryResponse);
});

onUnmounted(() => {
    socketStore.emitter.off('drives-list', handleDrivesResponse);
    socketStore.emitter.off('directory-list', handleDirectoryResponse);
});

async function fetchInitialView() {
    isLoading.value = true;
    error.value = null;
    selectedItem.value = null; // Reset selection
    try {
        await socketStore.sendMessage({ type: 'request_drives' }); // English Hardcode
    } catch(e) {
        error.value = 'Failed to send request for drives.'; // English Hardcode
        isLoading.value = false;
    }
}

async function fetchItems(path) {
  if (!path) {
      fetchInitialView();
      return;
  }
  isLoading.value = true;
  error.value = null;
  currentPath.value = path; // Set path yang diminta SEKARANG
  selectedItem.value = null; // Reset selection
  try {
    await socketStore.sendMessage({ type: 'request_directory_list', path: path }); // English Hardcode
  } catch(e) {
    error.value = 'Failed to send request for directory list.'; // English Hardcode
    isLoading.value = false;
  }
}

function refreshCurrentView() {
    if (isInitialView.value) {
        fetchInitialView();
    } else {
        fetchItems(currentPath.value);
    }
}

function handleItemClick(item) {
    selectedItem.value = item; // Sorot item yang diklik
    if (item.type === 'directory' || item.type === 'drive') {
        fetchItems(item.path);
    } else {
        uiStore.showNotification({ text: `Selected file: ${item.name}`, color: 'info' }); // English Hardcode
    }
}

function goUp() {
    if (isRoot.value) return;
    const pathParts = currentPath.value.replace(/\\/g, '/').split('/').filter(Boolean);
    if (pathParts.length <= 1) { // Jika di root drive (C:/) atau /
        fetchInitialView();
    } else {
        const parentPath = currentPath.value.substring(0, currentPath.value.replace(/\\/g, '/').lastIndexOf('/')) || '/'; // Handle root linux
        fetchItems(parentPath);
    }
}

function selectCurrentFolder() {
  if (!isInitialView.value && currentPath.value) {
      emit('folder-selected', currentPath.value);
      closeModal();
  } else {
      uiStore.showNotification({ text: 'Please navigate into a specific folder first.', color: 'warning' }); // English Hardcode
  }
}

function closeModal() {
  emit('update:modelValue', false);
  items.value = [];
  currentPath.value = '';
  isLoading.value = false;
  error.value = null;
  isInitialView.value = true;
  selectedItem.value = null;
}

const getIcon = (item) => {
    const baseName = item.name.split(/[/\\]/).pop().toLowerCase();
    if (item.type === 'drive') return 'mdi-harddisk';
    if (baseName === 'desktop') return 'mdi-desktop-mac';
    if (baseName === 'documents') return 'mdi-file-document-outline';
    if (baseName === 'downloads') return 'mdi-download-outline';
    if (baseName === 'pictures') return 'mdi-image-outline';
    if (baseName === 'music') return 'mdi-music-note-outline';
    if (baseName === 'videos') return 'mdi-video-outline';
    if (item.type === 'directory') return 'mdi-folder-outline';
    if (baseName.endsWith('.txt')) return 'mdi-file-document-outline';
    if (baseName.endsWith('.png') || baseName.endsWith('.jpg')) return 'mdi-file-image-outline';
    if (baseName.endsWith('.mp4') || baseName.endsWith('.mov')) return 'mdi-file-video-outline';
    return 'mdi-file-outline';
};

const getIconColor = (item) => {
    if (item.type === 'drive') return 'grey';
    if (item.type === 'directory') return 'cyan';
    return 'grey-lighten-1';
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.initialPath && props.initialPath !== '/') {
        fetchItems(props.initialPath);
    } else {
        fetchInitialView();
    }
  }
});

</script>

<style scoped>
.file-browser-card {
  background-color: #2a2a4a;
  border: 1px solid rgba(0, 245, 255, 0.3);
  display: flex;
  flex-direction: column;
  height: 80vh; /* Make dialog taller */
}
.path-input {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}
.file-list {
  background-color: transparent;
  flex-grow: 1; /* Allow list to take available space */
  overflow-y: auto; /* Enable scrolling for the list only */
}
.list-item {
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.list-item:hover {
  background-color: rgba(0, 245, 255, 0.1);
}
.select-button {
  font-weight: bold;
  color: #000 !important;
}
</style>
