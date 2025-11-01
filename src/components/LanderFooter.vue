#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\LanderFooter.vue
# CATATAN: PENAMBAHAN KODE. Menambahkan kolom 'Language' baru
#            dengan link ke /en/ dan /id/ sesuai permintaan.
#######################################################################
<template>
  <v-footer class="lander-footer">
    <v-container>
        <v-row>
            <v-col cols="12" md="4">
                <div class="header-logo orbitron-font" style="font-size: 1.5rem;">FLOWORK</div>
                <p class="text-caption mt-2 text-white" style="max-width: 350px;">
                  Flowork is a hybrid, self-hosted visual automation platform for building, training, and commanding AI agents. It offers a secure alternative to Zapier and Make.com for complex, data-sensitive automations.
                </p>
                </v-col>
            <v-col cols="6" md="2">
                <div class="footer-title">Product</div>
                <a href="/#features" class="footer-link">Features</a>
                <a href="/#pricing" class="footer-link">Pricing</a>
                <a href="https://docs.flowork.cloud" target="_blank" rel="noopener noreferrer" class="footer-link">Docs</a>
            </v-col>
            <v-col cols="6" md="2">
                <div class="footer-title">Community</div>
                <a href="https://t.me/FLOWORK_AUTOMATION" target="_blank" class="footer-link">Telegram</a>
                <a href="https://www.youtube.com/playlist?list=PLATUnnrT5igDXCqjBVvkmE4UKq9XASUtT" target="_blank" class="footer-link">YouTube</a>
                <a href="https://github.com/flowork-dev/flowork-platform" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
            </v-col>

            <v-col cols="6" md="2">
                <div class="footer-title">Language</div> <a href="/en/" class="footer-link">English</a> <a href="/id/" class="footer-link">Indonesia</a> </v-col>
            <v-col cols="6" md="2">
                <div class="footer-title">Company</div>
                <router-link to="/contact-us" class="footer-link">Contact Us</router-link>
                <router-link to="/privacy-policy" class="footer-link">Privacy Policy</router-link>
                <router-link to="/terms-of-service" class="footer-link">Terms of Service</router-link>
                <router-link to="/dmca" class="footer-link">DMCA</router-link>
            </v-col>
        </v-row>
        <v-divider class="my-4"></v-divider>
        <div class="text-center text-caption text-grey">
            Copyright &copy; {{ new Date().getFullYear() }} Flowork. All rights reserved.
        </div>
    </v-container>
  </v-footer>
</template>

<script setup>
// No script logic needed for this simple component
</script>

<style scoped>
.lander-footer {
  background: #0A0F1E !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 48px 0;
  z-index: 5;
}
.header-logo {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1.5rem;
  color: #f0f0f0;
}
.footer-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #f0f0f0;
}
.footer-link {
  display: block;
  color: #B0BEC5;
  text-decoration: none;
  margin-bottom: 8px;
  transition: color 0.2s ease;
}
.footer-link:hover {
  color: var(--neon-cyan);
}
.orbitron-font {
  font-family: 'Orbitron', monospace;
}
</style>