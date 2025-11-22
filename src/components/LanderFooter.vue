//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\LanderFooter.vue total lines 144 
//#######################################################################

<template>
  <v-footer class="lander-footer">
    <v-container class="text-center">
      <v-row justify="center" class="my-4">
        <v_col cols="12">
          <div class="logo-title-footer">FLOWORK</div>
          <div classs="sub-text">Automate. Integrate. Accelerate.</div>
        </v_col>
      </v-row>

      <v-row justify="center" class="my-4 social-links">
        <v-btn
          v-for="link in links.community"
          :key="link.title"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          icon
          variant="text"
          class="mx-2"
          :title="link.title"
        >
          <v-icon :icon="link.icon" size="large"></v-icon>
        </v-btn>
      </v-row>

      <v-row justify="center" class="my-4 legal-links">
        <v-btn
          v-for="link in links.legal"
          :key="link.title"
          :to="link.to"
          variant="text"
          class="mx-2"
          size="small"
        >
          {{ link.title }}
        </v-btn>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <v-row justify="center">
        <v-col cols="12">
          <p class="copyright-text">
            &copy; {{ new Date().getFullYear() }} FLOWORK. All rights reserved.
          </P>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
import { ref } from 'vue';

const links = ref({
  community: [
    {
      title: 'GitHub',
      icon: 'mdi-github',
      href: 'https://github.com/flowork-dev'
    },
    {
      title: 'Discord',
      icon: 'mdi-discord',
      href: 'https://discord.gg/Gv7h5fWZY'
    },
    {
      title: 'Telegram',
      icon: 'mdi-telegram',
      href: 'https://t.me/FLOWORK_AUTOMATION'
    },
    {
      title: 'YouTube',
      icon: 'mdi-youtube',
      href: 'https://www.youtube.com/playlist?list=PLATUnnrT5igDXCqjBVvkmE4UKq9XASUtT'
    }
  ],
  legal: [
    { title: 'Home', to: '/' },
    { title: 'About', to: '/about' },
    { title: 'Contact', to: '/contact' },
    { title: 'Terms of Service', to: '/terms' },
    { title: 'Privacy Policy', to: '/privacy' },
    { title: 'DMCA', to: '/dmca' },
  ]
});
</script>

<style scoped>
.lander-footer {
  background-color: #0A0F1E;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-glow-soft);
  padding-top: 32px;
  padding-bottom: 32px;
}

.logo-title-footer {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 2rem;
  color: var(--neon-cyan);
  letter-spacing: 1px;
}

.sub-text {
  font-size: 1rem;
  color: var(--text-secondary);
}

.social-links .v-btn {
  color: var(--text-secondary);
  transition: color 0.3s ease, transform 0.3s ease;
}

.social-links .v-btn:hover {
  color: var(--neon-cyan);
  transform: scale(1.1);
}

.legal-links .v-btn {
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: none;
  font-weight: 400;
}

.legal-links .v-btn:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.copyright-text {
  font-size: 0.8rem;
  color: var(--text-disabled);
}
</style>
