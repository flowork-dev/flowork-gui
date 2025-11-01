<template>
  <div class="folder-pair-list">
    <div class="list-header">
      <label class="v-label text-caption">{{ label }}</label>
      <v-btn @click="addPair" size="x-small" color="cyan" variant="tonal" prepend-icon="mdi-plus-circle">
        Add Pair
      </v-btn>
    </div>
    <div class="pairs-container">
      <div v-if="localPairs.length === 0" class="empty-list text-center text-caption text-grey pa-4">
        No folder pairs defined. Click 'Add Pair' to start.
      </div>
      <div v-for="(pair, index) in localPairs" :key="index" class="pair-item">
        <div class="pair-inputs">
          <v-text-field
            v-model="pair.source"
            @update:modelValue="updatePair(index, 'source', $event)"
            label="Source Folder"
            variant="outlined"
            density="compact"
            class="mr-2"
            hide-details
          >
            <template #append-inner>
              <v-icon @click="openFileBrowser(index, 'source')" color="cyan" class="cursor-pointer">mdi-folder-search-outline</v-icon>
            </template>
          </v-text-field>
          <v-text-field
            v-model="pair.output"
            @update:modelValue="updatePair(index, 'output', $event)"
            label="Output Folder"
            variant="outlined"
            density="compact"
            hide-details
          >
             <template #append-inner>
               <v-icon @click="openFileBrowser(index, 'output')" color="cyan" class="cursor-pointer">mdi-folder-search-outline</v-icon>
            </template>
          </v-text-field>
        </div>
        <v-btn @click="removePair(index)" icon="mdi-close" size="x-small" variant="text" color="red" title="Remove Pair"></v-btn>
      </div>
    </div>
     <div class="v-messages__message text-caption" style="padding-top: 4px;">{{ hint }}</div>

    <FileBrowserModal
        v-model="isModalOpen"
        :initial-path="initialModalPath"
        @folder-selected="onFolderSelected"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
// (PENAMBAHAN KODE) Import komponen modal yang baru
import FileBrowserModal from './FileBrowserModal.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: String,
  hint: String,
});

const emit = defineEmits(['update:modelValue']);

// Lokal state untuk pasangan folder
const localPairs = ref([]);

// (PENAMBAHAN KODE) State untuk mengelola modal
const isModalOpen = ref(false);
const initialModalPath = ref('');
const editingIndex = ref(null); // Index pasangan yang sedang diedit
const editingKey = ref(null); // 'source' atau 'output'

// Sinkronkan state lokal dengan prop modelValue
watch(() => props.modelValue, (newValue) => {
  // Gunakan deep copy untuk menghindari mutasi prop secara langsung
  localPairs.value = JSON.parse(JSON.stringify(newValue || []));
}, { deep: true, immediate: true }); // immediate: true agar dijalankan saat inisialisasi

// Fungsi untuk menambah pasangan folder baru
function addPair() {
  const newPairs = [...localPairs.value]; // Buat salinan array
  newPairs.push({ source: '', output: '' });
  // Emit event update dengan data baru
  emit('update:modelValue', newPairs);
}

// Fungsi untuk menghapus pasangan folder berdasarkan index
function removePair(index) {
  const newPairs = [...localPairs.value]; // Buat salinan
  newPairs.splice(index, 1); // Hapus item
  emit('update:modelValue', newPairs);
}

// Fungsi untuk mengupdate nilai source atau output pada index tertentu
function updatePair(index, key, value) {
  const newPairs = [...localPairs.value]; // Buat salinan
  if (newPairs[index]) {
    newPairs[index][key] = value;
    emit('update:modelValue', newPairs);
  }
}

// Fungsi untuk membuka modal browser file
function openFileBrowser(index, key) {
    editingIndex.value = index;
    editingKey.value = key;
    // Set path awal modal berdasarkan nilai saat ini di text field
    initialModalPath.value = localPairs.value[index]?.[key] || '';
    isModalOpen.value = true;
}

// Fungsi yang dipanggil saat folder dipilih dari modal
function onFolderSelected(selectedPath) {
    if (editingIndex.value !== null && editingKey.value !== null) {
        // Update nilai pada index dan key yang benar
        updatePair(editingIndex.value, editingKey.value, selectedPath);
    }
    // Reset state modal setelah selesai
    isModalOpen.value = false;
    editingIndex.value = null;
    editingKey.value = null;
    initialModalPath.value = ''; // Reset path awal juga
}

</script>

<style scoped>
.folder-pair-list {
  margin-bottom: 16px;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.pairs-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pair-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pair-inputs {
  display: flex;
  flex-grow: 1;
}
/* Style untuk ikon folder agar terlihat seperti tombol */
.cursor-pointer {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
}
.cursor-pointer:hover {
    opacity: 1;
}
</style>