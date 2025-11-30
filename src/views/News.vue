//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\News.vue total lines 214 
//#######################################################################

<template>
  <div class="news-page">
    <NeuralCanvasBackground />
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="11" lg="10">
          <h1 class="main-title orbitron-font text-center mb-8">FLOWORK News & Updates</h1>

          <div v-if="isLoading" class="text-center py-16">
            <v-progress-circular indeterminate color="cyan" size="64"></v-progress-circular>
            <p class="mt-4 text-grey-lighten-1">Fetching latest transmissions...</p>
          </div>

          <div v-else-if="error" class="text-center py-16">
            <v-icon icon="mdi-access-point-network-off" size="64" color="error"></v-icon>
            <p class="mt-4 text-error">Failed to load news feed.</p>
            <p class="text-grey-lighten-2">{{ error }}</p>
          </div>

          <v-row v-else>
            <v-col
              v-for="(article, index) in paginatedArticles"
              :key="article.link"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card
                class="article-card"
                variant="flat"
                :href="article.link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-img
                  :src="article.imageUrl || '/images/default-news-bg.jpg'"
                  class="card-image"
                  aspect-ratio="16/9"
                  cover
                >
                  <div class="tech-overlay"></div>
                  <div class="image-overlay d-flex flex-column justify-end">
                    <div class="pa-4">
                      <div class="text-caption text-grey-lighten-2 mb-2">{{ formatDate(article.pubDate) }}</div>
                      <h2 class="article-title-overlay orbitron-font">
                          {{ article.title }}
                      </h2>
                    </div>
                  </div>
                </v-img>

                <v-card-actions class="px-4 pb-3 pt-2">
                  <v-spacer></v-spacer>
                  <v-btn variant="outlined" class="read-more-btn" color="cyan" append-icon="mdi-arrow-right">
                    Read More
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>

          <v-row justify="center" v-if="totalPages > 1" class="mt-8">
            <v-col cols="auto">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                rounded="circle"
                @update:modelValue="newsStore.setPage"
              ></v-pagination>
            </v-col>
          </v-row>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useNewsStore } from '@/store/news';
import { storeToRefs } from 'pinia';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';
import { format } from 'date-fns';

const newsStore = useNewsStore();
const { isLoading, error, paginatedArticles, totalPages } = storeToRefs(newsStore);

const currentPage = computed({
  get: () => newsStore.currentPage,
  set: (value) => newsStore.setPage(value)
});


function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return `Published on: ${new Date(dateString).toLocaleDateString('en-US', options)}`;
    } catch (e) {
        return dateString;
    }
}

onMounted(() => {
  newsStore.fetchNews();
});
</script>

<style scoped>
.news-page {
  /* (PERBAIKAN KUNCI 2) Menggunakan style dari dashboard agar background terlihat */
  height: 100%;
  overflow-y: auto;
  padding: 48px 0;
  position: relative;
  z-index: 1;
}
.main-title {
  color: #f0f0f0;
  text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan);
  position: relative;
  z-index: 2;
}
.article-card {
  background: rgba(30, 30, 47, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2; /* Kartu di atas background */
}
.article-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: var(--neon-cyan);
  box-shadow: 0 10px 40px rgba(0, 245, 255, 0.2);
}
.card-image {
  position: relative;
  transition: transform 0.4s ease;
}
.article-card:hover .card-image {
    transform: scale(1.05);
}
.tech-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px);
  background-size: 100% 3px;
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(12, 12, 20, 1) 20%, rgba(0, 0, 0, 0.1) 100%);
  z-index: 2;
  transition: background 0.4s ease;
}
.article-card:hover .image-overlay {
    background: linear-gradient(to top, rgba(12, 12, 20, 1) 30%, rgba(0, 0, 0, 0.0) 100%);
}
.article-title-overlay {
  font-size: 1.25rem;
  line-height: 1.4;
  color: #fff;
  text-shadow: 0 2px 5px rgba(0,0,0,0.8);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
.v-card-actions {
    margin-top: auto;
}
.read-more-btn .v-icon {
  transition: transform 0.3s ease-in-out;
}
.read-more-btn:hover .v-icon {
  transform: translateX(5px);
}
.orbitron-font {
    font-family: 'Orbitron', monospace;
}
/* (PENAMBAHAN KODE) Style untuk background canvas */
.neural-canvas {
  position: absolute; /* absolute agar mengikuti scroll */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.5;
}
</style>
