//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\MyArticles.vue total lines 382 
//#######################################################################

<template>
  <div class="my-articles-page">
    <canvas ref="canvasEl" class="neural-canvas"></canvas>

    <v-container class="articles-container">
      <v-row justify="center">
        <v-col cols="12" md="12" lg="12">
          <div class="d-flex align-center mb-6 fade-in-up">
            <v-icon icon="mdi-file-document-multiple-outline" class="mr-4" color="cyan" size="32"></v-icon>
            <h1 class="page-title orbitron-font">{{ t('articles_my_content_title') }}</h1>
            <v-spacer></v-spacer>
            <v-btn
              color="cyan"
              variant="flat"
              :to="{ name: 'ArticleEditorNew' }"
              prepend-icon="mdi-plus-circle-outline"
              class="action-button"
            >
              {{ t('articles_new_article_btn') }}
            </v-btn>
          </div>

          <div v-if="isLoading" class="text-center py-16">
            <v-progress-circular indeterminate color="cyan" size="64"></v-progress-circular>
          </div>
          <div v-else-if="error" class="text-center text-error py-16">
             <p>Failed to load articles: {{ error.message || error }}</p>
          </div>
          <div v-else-if="myArticles.length === 0" class="text-center text-grey py-16">
            <v-icon icon="mdi-file-find-outline" size="64"></v-icon>
            <p class="mt-4 text-h6">{{ t('articles_empty_list') }}</p>
            <v-btn color="primary" variant="tonal" :to="{ name: 'ArticleEditorNew' }" class="mt-4">
              {{ t('articles_create_first_btn') }}
            </v-btn>
          </div>

          <div v-else class="masonry-grid">
            <div
              v-for="item in myArticles"
              :key="item.id"
              class="masonry-item fade-in-up"
            >
              <v-card class="article-grid-item">
                <v-card-title class="article-title">{{ item.title }}</v-card-title>
                <v-card-subtitle>{{ t(`articles.categories.${item.category.toLowerCase()}`) || item.category }}</v-card-subtitle>

                <v-card-text class="pt-4">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption text-grey-lighten-1">Status</span>
                    <v-chip size="small" :color="getDisplayStatus(item).color" variant="flat">
                      {{ getDisplayStatus(item).text }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption text-grey-lighten-1">Last Updated</span>
                    <span class="text-caption text-grey-lighten-1">{{ new Date(item.updated_at).toLocaleString() }}</span>
                  </div>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="pa-2">
                  <v-tooltip :text="t('articles.view')" location="top">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        icon="mdi-eye"
                        variant="text"
                        size="small"
                        color="grey-lighten-1"
                        :href="getPublicUrl(item)"
                        target="_blank"
                        ></v-btn>
                    </template>
                  </v-tooltip>
                  <v-spacer></v-spacer>
                  <v-tooltip :text="t('articles.edit')" location="top">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        color="cyan-lighten-2"
                        :to="`/my-articles/edit/${item.id}`"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip :text="t('articles.delete')" location="top">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <v-btn
                        v-bind="tooltipProps"
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="red-lighten-2"
                        @click.stop="handleDelete(item.id)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-card-actions>
              </v-card>
            </div> </div>
          </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useArticlesStore } from '@/store/articles';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';
import { useUiStore } from '@/store/ui';

const articleStore = useArticlesStore();
const localeStore = useLocaleStore();
const uiStore = useUiStore();
const { myArticles, isLoading, error } = storeToRefs(articleStore);
const t = localeStore.loc;

const canvasEl = ref(null);
let animationFrameId = null;
const setupCanvasAnimation = () => {
    const canvas = canvasEl.value; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const resizeCanvas = () => { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor(x, y, size, color, speedX, speedY) { this.x = x; this.y = y; this.size = size; this.color = color; this.speedX = speedX; this.speedY = speedY; }
        update() { if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX; if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY; this.x += this.speedX; this.y += this.speedY; }
        draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    function init() {
        particles = []; let numberOfParticles = (canvas.height * canvas.width) / 15000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1; let x = Math.random() * (innerWidth - size * 4) + size * 2; let y = Math.random() * (innerHeight - size * 4) + size * 2;
            let speedX = (Math.random() * 0.3) - 0.15; let speedY = (Math.random() * 0.3) - 0.15;
            particles.push(new Particle(x, y, size, 'rgba(0, 245, 255, 0.3)', speedX, speedY));
        }
    }
    function connect() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                if (distance < (canvas.width / 8) * (canvas.height / 8)) {
                    opacityValue = 1 - (distance / 25000);
                    ctx.strokeStyle = `rgba(191, 0, 255, ${opacityValue * 0.3})`; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke();
                }
            }
        }
    }
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
    }
    init(); animate();
    onUnmounted(() => {
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
};

onMounted(() => {
  setupCanvasAnimation();
  if (typeof t !== 'function') {
    localeStore.fetchDictionary().then(() => {
        articleStore.fetchMyArticles();
    });
  } else {
    articleStore.fetchMyArticles();
  }
});

function getDisplayStatus(item) {
    let statusKey = item.status.toLowerCase();
    let color = 'grey-darken-1';

    if (statusKey === 'pending' && item.publish_at && new Date(item.publish_at) > new Date()) {
        statusKey = 'scheduled';
    }

    switch (statusKey) {
        case 'published': color = 'success'; break;
        case 'pending': color = 'warning'; break;
        case 'scheduled': color = 'blue-lighten-2'; break;
        case 'draft': color = 'info'; break;
        case 'hidden': color = 'grey'; break;
    }

    const text = t(`articles.statuses.${statusKey}`) || item.status;

    return { text, color };
}

function getCategoryColor(category) {
  switch (category) {
    case 'tutorial': return 'blue-darken-1';
    case 'news': return 'green-darken-1';
    case 'documentation': return 'purple-darken-1';
    case 'marketplace': return 'orange-darken-1';
    default: return 'grey-darken-1';
  }
}

async function handleDelete(articleId) {
    const articleToDelete = myArticles.value.find(art => art.id === articleId);
    const title = articleToDelete ? articleToDelete.title : 'this article';

    const confirmMessage = t('articles_delete_confirm', { title: title });
    if (confirm(confirmMessage)) {
        await articleStore.deleteArticle(articleId);
    }
}

function getPublicUrl(item) {
  const lang = item.language || 'en';
  return `/p-${item.slug}-${lang}.html`;
}
</script>

<style scoped>
/* (KODE ASLI) */
.neural-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.5;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.my-articles-page {
  height: 100%;
  overflow-y: auto;
  /* (PERBAIKAN KUNCI) Menghapus padding-top dan padding-bottom */
  /* padding-top: 48px; */
  /* padding-bottom: 48px; */
}
.articles-container {
  /* (PERBAIKAN KUNCI) Ganti max-width dari 1200px ke 1600px */
  max-width: 1600px;
}

/* (KODE ASLI) */
.orbitron-font {
  font-family: 'Orbitron', monospace;
  color: #f0f0f0;
}
.page-title {
  color: #FFFFFF;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
}
.action-button {
  font-weight: bold;
  color: #000 !important;
}

/* (KODE ASLI) Style untuk Masonry Grid & Kartu Menyala */
.masonry-grid {
  column-gap: 16px;
  /* (PERBAIKAN KUNCI) Tambahkan kolom untuk layar lebih besar */
  column-count: 2;
}
@media (min-width: 1280px) {
  .masonry-grid {
    column-count: 3;
  }
}
/* (PERBAIKAN KUNCI) Tambahkan breakpoint xl (1920px) */
@media (min-width: 1920px) {
  .masonry-grid {
    column-count: 4;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
}

.article-grid-item {
  background: rgba(30, 30, 47, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  animation: card-glow-animation 5s infinite alternate;
}

.article-grid-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 245, 255, 0.1),
    transparent
  );
  transform: skewX(-25deg);
  animation: card-shine 8s infinite linear;
}

.article-grid-item:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 245, 255, 0.3);
  box-shadow: 0 10px 30px rgba(0, 245, 255, 0.1);
}

@keyframes card-glow-animation {
  from {
    border-color: rgba(0, 245, 255, 0.2);
    box-shadow: 0 0 15px rgba(0, 245, 255, 0.1);
  }
  to {
    border-color: rgba(191, 0, 255, 0.2);
    box-shadow: 0 0 25px rgba(191, 0, 255, 0.15);
  }
}

@keyframes card-shine {
  from {
    left: -100%;
  }
  to {
    left: 100%;
  }
}

.article-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.3;
  font-size: 1.1rem;
  margin-bottom: 4px;
}
.article-grid-item .v-card-text {
  flex-grow: 1;
}
.article-grid-item .v-card-actions {
  background-color: rgba(0,0,0,0.2);
}
</style>
