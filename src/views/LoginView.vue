<template>
  <AuthLayout
    title="UNLOCK IDENTITY"
    switchText="Don't have an identity? Create one"
    switchLink="/register"
  >
    <template #form-fields>
      <v-form @submit.prevent="handleLogin">
        <v-textarea
          label="Import Private Key or Mnemonic"
          name="privateKey"
          prepend-inner-icon="mdi-key-outline"
          type="password"
          variant="outlined"
          v-model="privateKeyOrMnemonic"
          class="neon-input mb-4"
          rows="3"
          :rules="[rules.required]"
          placeholder="Enter your 12-word recovery phrase or your 0x... private key"
        ></v-textarea>


        <v-alert
          v-if="authStore.error || sessionExpired"
          type="error"
          density="compact"
          class="mt-4"
          variant="tonal"
        >
          {{ authStore.error || 'Your session has expired. Please login again.' }}
        </v-alert>
      </v-form>

      </template>
    <template #actions>
      <v-btn
        color="cyan"
        large
        block
        @click="handleLogin"
        :loading="authStore.isLoading"
        class="neon-submit-btn"
      >
        Unlock Identity & Connect
      </v-btn>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import AuthLayout from '@/components/AuthLayout.vue';
import { useRoute } from 'vue-router'; // Import useRoute

const privateKeyOrMnemonic = ref('');
const authStore = useAuthStore();
const route = useRoute(); // Dapatkan route

const rules = {
  required: value => !!value || 'This field is required.', // English Hardcode
};

// Cek apakah ada query param 'session=expired' (meskipun tidak relevan untuk crypto)
const sessionExpired = computed(() => route.query.session === 'expired');

const handleLogin = async () => {
  if (privateKeyOrMnemonic.value) {
    // (PERUBAHAN KUNCI) Kita hanya panggil aksi import.
    // Navigasi halaman sekarang diurus oleh handleLoginSuccess di dalam authStore.
    await authStore.importIdentity(privateKeyOrMnemonic.value);
  }
};

onMounted(() => {
    // Bersihkan error lama saat komponen dimuat
    authStore.error = null;
});
</script>