#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\LanderHeader.vue
# REVISI: Menghapus prop 'app' dari v-app-bar.
#######################################################################
<template>
  <v-app-bar color="transparent" flat class="lander-header" :class="{ 'is-scrolled': isScrolled }" height="70">
    <v-container class="d-flex align-center pa-0">
      <div class="header-logo orbitron-font">
        <v-icon icon="mdi-share-variant-outline" class="mr-2"></v-icon>
        FLOWORK
      </div>
      <v-spacer></v-spacer>

      <div class="d-none d-md-flex align-center" style="gap: 4px;">
        <v-tooltip text="Home" location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  :to="{ name: 'Lander' }"
                  icon
                  variant="text"
                  class="header-link"
                >
                    <v-icon color="grey-lighten-1">mdi-home-outline</v-icon>
                </v-btn>
            </template>
        </v-tooltip>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" class="header-link" append-icon="mdi-chevron-down">
              <v-icon start color="grey-lighten-1">mdi-translate</v-icon>
              Language
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item href="/en/">
              <v-list-item-title>English</v-list-item-title>
            </v-list-item>
            <v-list-item href="/id/">
              <v-list-item-title>Indonesia</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-tooltip text="GitHub" location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  href="https://github.com/flowork-dev/flowork-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon
                  variant="text"
                  class="header-link"
                >
                    <v-icon color="grey-lighten-1">mdi-github</v-icon>
                </v-btn>
            </template>
        </v-tooltip>

        <v-tooltip text="Telegram" location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  href="https://t.me/FLOWORK_AUTOMATION"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon
                  variant="text"
                  class="header-link"
                >
                    <v-icon color="grey-lighten-1">mdi-send</v-icon>
                    </v-btn>
            </template>
        </v-tooltip>

        <v-tooltip text="YouTube" location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  href="https://www.youtube.com/playlist?list=PLATUnnrT5igDXCqjBVvkmE4UKq9XASUtT"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon
                  variant="text"
                  class="header-link"
                >
                    <v-icon color="grey-lighten-1">mdi-youtube</v-icon>
                </v-btn>
            </template>
        </v-tooltip>

        <v-tooltip text="Docs" location="bottom">
            <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  href="https://docs.flowork.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon
                  variant="text"
                  class="header-link"
                >
                  <v-icon color="grey-lighten-1">mdi-book-open-page-variant-outline</v-icon>
                </v-btn>
            </template>
        </v-tooltip>

        <v-btn
          href="http://download.flowork.cloud/"
          target="_blank"
          rel="noopener noreferrer"
          class="header-btn-download ml-3"
          variant="flat"
        >
          Download Now Free
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <template v-if="!authStore.isAuthenticated">
        <v-btn to="/login" variant="outlined" color="white" class="header-btn mx-2">Login</v-btn>
        <v-btn to="/register" variant="flat" color="cyan" class="header-btn header-btn-primary">
          Sign Up Free
        </v-btn>
      </template>
      <template v-else>
        <v-btn :to="{ name: 'Designer' }" variant="flat" color="cyan" class="header-btn header-btn-primary">
          Go to App
        </v-btn>
      </template>

    </v-container>
  </v-app-bar>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/store/auth';
const authStore = useAuthStore();

const isScrolled = ref(false);
const handleScroll = () => { isScrolled.value = window.scrollY > 20; };

onMounted(() => { window.addEventListener('scroll', handleScroll); });
onUnmounted(() => { window.removeEventListener('scroll', handleScroll); });
</script>

<style scoped>
.lander-header {
  transition: background-color 0.3s ease;
  z-index: 1000 !important;
  /* Tambahkan posisi fixed agar selalu di atas */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
.lander-header.is-scrolled {
  background: rgba(10, 15, 30, 0.8) !important;
  backdrop-filter: blur(10px);
}
.header-logo {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1.5rem;
  color: var(--text-primary);
  position: relative;
  animation: glitch 5s ease-in-out infinite alternate;
  text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan);
}
.header-link {
  font-weight: 600;
  color: var(--text-secondary) !important;
}
.header-link .v-icon {
    color: var(--text-secondary) !important;
}
.header-btn-primary {
  color: #010c03 !important;
  font-weight: bold;
}
.orbitron-font {
  font-family: 'Orbitron', monospace;
}
.header-btn-download {
  font-weight: bold;
  font-size: 0.8rem;
  color: #000 !important;
  background-color: var(--neon-orange);
  border-radius: 20px;
}
.header-btn-download:hover {
  background-color: #f57c00;
}
.header-btn {
    border-radius: 20px;
}

@keyframes glitch {
  0% { text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); transform: skew(0deg); }
  5% { text-shadow: -2px 0 5px var(--neon-purple), 2px 0 5px var(--neon-cyan); transform: skew(-2deg); }
  10% { text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); transform: skew(0deg); }
  80% { text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); transform: skew(0deg); }
  85% { text-shadow: 2px 0 5px var(--neon-purple), -2px 0 5px var(--neon-cyan); transform: skew(1deg); }
  90% { text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); transform: skew(0deg); }
  100% { text-shadow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan); transform: skew(0deg); }
}
</style>