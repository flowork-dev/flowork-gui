#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\ModuleFactory.vue
# REVISI: Menghapus style color hardcode, mengandalkan global style
#######################################################################
<template>
  <div v-if="authStore.hasPermission('module_generator')" class="placeholder-view">
    <v-icon icon="mdi-toy-brick-plus-outline" size="64"></v-icon>
    <h1 class="mt-4">Modul Factory</h1>
    <p>Halaman untuk membuat modul baru dengan bantuan AI.</p>
  </div>
  <div v-else class="placeholder-view">
    <v-icon icon="mdi-lock-outline" size="64"></v-icon>
    <h1 class="mt-4">Feature Locked</h1>
    <p>The 'Module Factory' for AI-assisted module creation requires the 'Architect' tier.</p>
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