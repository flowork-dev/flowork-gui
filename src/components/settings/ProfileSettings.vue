<template>
  <div>
    <h2 class="section-title">Public Cloud Profile</h2>
    <p class="section-description">
      This information is stored on the Flowork cloud server and is visible to other users (e.g., on the Marketplace or in comments).
    </p>

    <v-skeleton-loader
      v-if="profileStore.isLoading && !profileStore.profile"
      type="list-item-two-line, list-item-two-line"
    ></v-skeleton-loader>

    <v-form v-else-if="localProfile" @submit.prevent="handleSave">
      <SettingsField
        label="Public Username"
        hint="Must be 3-20 characters (letters, numbers, underscore)."
      >
        <v-text-field
          v-model="localProfile.name"
          variant="outlined"
          density="compact"
          hide-details="auto"
          placeholder="Your unique username"
          :rules="[usernameRule]"
          :error-messages="profileStore.error && profileStore.error.includes('Username') ? profileStore.error : ''"
          class="hacker-input"
        ></v-text-field>
      </SettingsField>

      <SettingsField
        label="Bio / Tagline"
        hint="A short description about yourself (max 160 characters)."
      >
        <v-textarea
          v-model="localProfile.bio"
          variant="outlined"
          density="compact"
          rows="3"
          counter="160"
          maxlength="160"
          hide-details="auto"
          placeholder="AI Automation Enthusiast | Building the future..."
          class="hacker-input"
        ></v-textarea>
      </SettingsField>

      <SettingsField
        label="Public Address"
        hint="This is your unique, non-changeable ID (Wallet Address)."
      >
        <v-text-field
          :model-value="localProfile.addr"
          variant="outlined"
          density="compact"
          hide-details
          readonly
          disabled
          class="hacker-input"
        ></v-text-field>
      </SettingsField>

      <v-btn
        color="cyan"
        @click="handleSave"
        :loading="profileStore.isLoading"
        :disabled="!isFormValid"
        class="mt-4 save-button"
      >
        Save Profile
      </v-btn>
    </v-form>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useProfileStore } from '@/store/profile';
import SettingsField from '@/components/settings/SettingsField.vue';

const profileStore = useProfileStore();

const localProfile = ref(null);

const usernameRule = (value) => {
  if (!value) return true;
  return /^[a-zA-Z0-9_]{3,20}$/.test(value) || 'Must be 3-20 alphanumeric characters or underscore.';
};

const isFormValid = computed(() => {
    if (!localProfile.value || !localProfile.value.name) return true;
    return usernameRule(localProfile.value.name) === true;
});

watch(() => profileStore.profile, (newProfile) => {
  if (newProfile) {
    localProfile.value = JSON.parse(JSON.stringify(newProfile));
  } else {
    localProfile.value = { name: '', bio: '', addr: '' };
  }
}, { immediate: true, deep: true });

function handleSave() {
  if (localProfile.value && isFormValid.value) {
    profileStore.saveProfile({
      name: localProfile.value.name,
      bio: localProfile.value.bio,
      avatar: localProfile.value.avatar,
    });
  }
}
</script>

<style scoped>
.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: #f0f0f0;
}
.section-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 32px;
}
.save-button {
  font-weight: bold;
  color: #000 !important;
}

.hacker-input :deep(.v-field) {
    background-color: rgba(42, 42, 74, 0.7) !important;
    color: var(--text-primary) !important;
}
.hacker-input :deep(.v-field__outline) {
    border-color: rgba(100, 255, 218, 0.3) !important;
}
.hacker-input :deep(.v-field--active .v-field__outline) {
    border-color: var(--neon-cyan) !important;
    border-width: 1px !important;
}
.hacker-input :deep(input),
.hacker-input :deep(textarea) {
    color: var(--text-primary) !important;
}
.hacker-input :deep(.v-label) {
    color: var(--text-secondary) !important;
    opacity: 1 !important;
}
.hacker-input :deep(.v-field--active .v-label) {
    color: var(--neon-cyan) !important;
}
.hacker-input :deep(input[disabled]) {
    color: var(--text-secondary) !important;
}
</style>
