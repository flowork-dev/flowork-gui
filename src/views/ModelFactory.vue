#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\ModelFactory.vue
# REVISI: Menghapus style color hardcode, mengandalkan global style
#######################################################################
<template>
  <div v-if="authStore.hasPermission('ai_local_models')" class="placeholder-view">
    <v-icon icon="mdi-factory" size="64"></v-icon>
    <h1 class="mt-4">Model Factory</h1>
    <p>Halaman untuk mengonversi model AI ke format GGUF.</p>
  </div>
  <div v-else class="placeholder-view">
    <v-icon icon="mdi-lock-outline" size="64"></v-icon>
    <h1 class="mt-4">Feature Locked</h1>
    <p>The 'Model Factory' for converting local AI models requires the 'Creator' tier or above.</p>
    <v-btn to="/pricing" color="yellow-darken-2" variant="flat" class="mt-4">Upgrade Plan</v-btn>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth';
const authStore = useAuthStore();
</script>

<style scoped>
.placeholder-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  /* color: #6c757d; <-- Dihapus */
  text-align: center;
}
</style>