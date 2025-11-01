<template>
  <div class="community-links-container" :class="{ 'is-hidden': isHidden }">
    <v-tooltip text="Support the Project" location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          component="a"
          href="https://www.paypal.com/paypalme/TeetahDev"
          target="_blank"
          rel="noopener noreferrer"
          icon="mdi-heart"
          color="yellow-darken-2"
          size="large"
          elevation="8"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="View on GitHub" location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          component="a"
          href="https://github.com/FLOWORK-gif/FLOWORK"
          target="_blank"
          rel="noopener noreferrer"
          icon="mdi-github"
          color="grey-darken-3"
          size="large"
          elevation="8"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="Watch Tutorials on YouTube" location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          component="a"
          href="https://www.youtube.com/playlist?list=PLATUnnrT5igDXCqjBVvkmE4UKq9XASUtT"
          target="_blank"
          rel="noopener noreferrer"
          icon="mdi-youtube"
          color="red"
          size="large"
          elevation="8"
        ></v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="Join Telegram Community" location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          component="a"
          href="https://t.me/FLOWORK_AUTOMATION"
          target="_blank"
          rel="noopener noreferrer"
          icon="mdi-send"
          color="blue-lighten-1"
          size="large"
          elevation="8"
        ></v-btn>
      </template>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';

const uiStore = useUiStore();
const { activeRightPanel } = storeToRefs(uiStore);

const isHidden = computed(() => !!activeRightPanel.value);
</script>

<style scoped>
.community-links-container {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.community-links-container.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(100%);
}
</style>