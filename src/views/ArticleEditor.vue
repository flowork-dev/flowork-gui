#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\ArticleEditor.vue
# REVISI:
# 1. Mengubah warna teks '.slug-preview' dan '.captcha-question'
#    agar lebih kontras (terang).
#######################################################################
<template>
  <div class="article-editor-page">
    <canvas ref="canvasEl" class="neural-canvas"></canvas>

    <v-container class="article-editor-container">

      <div class="d-flex align-center mb-4 fade-in-up" style="animation-delay: 0.1s;">
        <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'MyArticles' }" class="mr-2" :title="t('common.back')"></v-btn>
        <h1 class="page-title">
          {{ t(mode === 'create' ? 'articles_create_title' : 'articles_edit_title') }}
        </h1>
      </div>

      <v-form @submit.prevent="saveArticle('pending')">
        <v-row justify="center">
          <v-col cols="12" lg="10"> <v-card class="form-card fade-in-up" flat style="animation-delay: 0.2s;">
              <v-card-title class="sidebar-title">{{ t('articles_section_content') }}</v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="article.title"
                  :label="t('articles_field_title')"
                  variant="outlined"
                  class="mb-4"
                  :rules="[rules.required]"
                  autofocus
                  @update:modelValue="onTitleChange"
                ></v-text-field>

                <v-text-field
                  v-model="article.slug"
                  :label="t('articles_field_slug')"
                  variant="outlined"
                  class="mb-2"
                  :rules="[rules.required]"
                  @update:modelValue="onSlugChange"
                  :hint="t('articles_field_slug_hint')"
                  persistent-hint
                ></v-text-field>

                <div class="slug-preview mb-4">
                  Slug: <span>{{ article.full_slug_preview }}</span>
                </div>
              </v-card-text>
              <v-divider></v-divider>

              <v-card-text class="pa-0 editor-card-text">
                <v-skeleton-loader v-if="articlesStore.isLoading && mode === 'edit'" type="image, article"></v-skeleton-loader>

                <div v-show="!(articlesStore.isLoading && mode === 'edit')">
                  <v-md-editor
                    v-model="article.content"
                    height="600px"
                    left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link code | save"
                    :disabled-menus="['image']"
                    :placeholder="t('articles_field_content_hint')"
                    @save="saveArticle('draft')"
                    :lang="localeStore.currentLang === 'id' ? 'id-ID' : 'en-US'"
                  ></v-md-editor>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="form-card mt-4 fade-in-up" flat style="animation-delay: 0.3s;">
              <v-card-title class="sidebar-title">{{ t('articles_section_seo') }}</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="article.meta_description"
                  :label="t('articles_field_meta_description')"
                  variant="outlined"
                  rows="3"
                  counter="160"
                  :hint="t('articles_field_meta_description_hint')"
                  persistent-hint
                  class="mb-4"
                ></v-textarea>
                <v-text-field
                  v-model="article.keywords"
                  :label="t('articles_field_keywords')"
                  variant="outlined"
                  :hint="t('articles_field_keywords_hint')"
                  persistent-hint
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="article.tags"
                  :label="t('articles_field_tags')"
                  variant="outlined"
                  :hint="t('articles_field_tags_hint')"
                  persistent-hint
                ></v-text-field>
              </v-card-text>
            </v-card>

            <v-card class="form-card mt-4 fade-in-up" flat style="animation-delay: 0.4s;">
              <v-card-title class="sidebar-title">{{ t('articles_section_publishing') }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="article.category"
                      :label="t('articles_field_category')"
                      :items="categoryOptions"
                      variant="outlined"
                      class="mb-4"
                      hide-details
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                     <label class="v-label text-caption mb-2">{{ t('articles_field_visibility') }}</label>
                    <v-radio-group v-model="article.visibility" hide-details class="radio-group-dense">
                      <v-radio v-for="item in visibilityOptions" :key="item.value" :label="item.title" :value="item.value" color="cyan"></v-radio>
                    </v-radio-group>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <label class="v-label text-caption mb-2">{{ t('common.language') }}</label>
                    <v-radio-group v-model="article.language" hide-details class="radio-group-dense">
                      <v-radio v-for="item in languageOptions" :key="item.value" :label="item.title" :value="item.value" color="cyan"></v-radio>
                    </v-radio-group>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-text-field
                      v-model="article.publish_at"
                      :label="t('articles_field_schedule')"
                      type="datetime-local"
                      variant="outlined"
                      :hint="t('articles_field_schedule_hint')"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card v-if="article.category === 'marketplace'" class="form-card mt-4 fade-in-up" flat style="animation-delay: 0.5s;">
              <v-card-title class="sidebar-title">{{ t('articles_section_marketplace') }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="article.price"
                      :label="t('articles_field_price')"
                      type="number"
                      prefix="$"
                      variant="outlined"
                      class="mb-md-0 mb-4"
                      :hint="t('articles_field_price_hint')"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="article.product_url"
                      :label="t('articles_field_product_url')"
                      variant="outlined"
                      placeholder="https://lemonsqueezy.com/..."
                      :hint="t('articles_field_product_url_hint')"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card class="form-card mt-4 fade-in-up" flat style="animation-delay: 0.6s;">
              <v-card-title class="sidebar-title">{{ t('common.actions') }}</v-card-title>
               <v-card-text>
                 <div class="captcha-wrapper">
                  <span class="captcha-question">{{ t('articles_field_captcha') }}: {{ captcha.q }} = ?</span>
                  <v-text-field
                    v-model="form.captcha"
                    label="Answer"
                    variant="outlined"
                    density="compact"
                    class="captcha-input"
                    :rules="[rules.required]"
                    required
                  ></v-text-field>
                 </div>
               </v-card-text>
               <v-card-actions class="pa-4">
                <v-btn
                  @click="saveArticle('draft')"
                  :loading="articlesStore.isLoading"
                  variant="text"
                  size="large"
                >
                  {{ t('articles_save_draft_btn') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  @click="saveArticle('pending')"
                  :loading="articlesStore.isLoading"
                  variant="outlined"
                  size="large"
                >
                  {{ t('articles.statuses.pending') }}
                </v-btn>

                <v-btn
                  @click="handlePrimaryAction"
                  :loading="articlesStore.isLoading"
                  color="cyan"
                  variant="flat"
                  size="large"
                  class="action-button"
                >
                  {{ t(primaryButtonTextKey) }}
                </v-btn>
                </v-card-actions>
            </v-card>

          </v-col>
        </v-row>
      </v-form>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useArticlesStore } from '@/store/articles';
import { useUiStore } from '@/store/ui';
import { useLocaleStore } from '@/store/locale';
import { storeToRefs } from 'pinia';

const localeStore = useLocaleStore();
const { loc } = storeToRefs(localeStore);
const t = loc;

const route = useRoute();
const router = useRouter();
const articlesStore = useArticlesStore();
const uiStore = useUiStore();
const { currentArticle, isLoading } = storeToRefs(articlesStore);

const mode = ref('create'); // English Hardcode
const isEditMode = computed(() => mode.value === 'edit'); // English Hardcode

const categoryOptions = computed(() => [
  { value: 'tutorial', title: t.value('articles.categories.tutorial') }, // English Hardcode
  { value: 'news', title: t.value('articles.categories.news') }, // English Hardcode
  { value: 'documentation', title: t.value('articles.categories.documentation') }, // English Hardcode
  { value: 'marketplace', title: t.value('articles.categories.marketplace') }, // English Hardcode
  { value: 'other', title: t.value('articles.categories.other') }, // English Hardcode
]);
const visibilityOptions = computed(() => [
  { value: 'public', title: t.value('articles_visibility_public') }, // English Hardcode
  { value: 'login_only', title: t.value('articles_visibility_login') }, // English Hardcode
]);
const languageOptions = computed(() => [
  { value: 'en', title: t.value('articles_lang_en') }, // English Hardcode
  { value: 'id', title: t.value('articles_lang_id') }, // English Hardcode
]);

const form = ref({ captcha: '' });
const captcha = ref({ q: '', realAnswer: 0 });

const rules = {
  required: value => !!value || t.value('validation_required'),
};

const article = ref({
  id: null,
  title: '',
  slug: '',
  category: 'tutorial', // English Hardcode
  language: 'en', // English Hardcode
  visibility: 'public', // English Hardcode
  content: '',
  publish_at: null,
  status: 'pending', // English Hardcode
  price: null,
  product_url: null,
  meta_description: null,
  keywords: null,
  tags: null,
  full_slug_preview: '/fs-default-slug-en.html' // English Hardcode
});

const primaryButtonTextKey = computed(() => {
  if (article.value.publish_at && new Date(article.value.publish_at) > new Date()) {
    return 'articles_schedule_btn'; // English Hardcode
  }
  return 'articles_publish_btn'; // English Hardcode
});

function handlePrimaryAction() {
  if (article.value.publish_at && new Date(article.value.publish_at) > new Date()) {
    saveArticle('scheduled'); // English Hardcode
  } else {
    saveArticle('published'); // English Hardcode
  }
}

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .substring(0, 70);
}

function onTitleChange(newTitle) {
  if (mode.value === 'create' || !article.value.slug) { // English Hardcode
    article.value.slug = slugify(newTitle);
  }
  updateSlugPreview();
}

function onSlugChange(newSlug) {
  article.value.slug = slugify(newSlug);
  updateSlugPreview();
}

function updateSlugPreview() {
  const lang = article.value.language || 'en'; // English Hardcode
  const slug = article.value.slug || '';
  article.value.full_slug_preview = `/fs-${slug}-${lang}.html`; // English Hardcode
}

watch(() => article.value.category, updateSlugPreview);
watch(() => article.value.language, updateSlugPreview);

function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 5) + 1;
  captcha.value.q = `${num1} + ${num2}`;
  captcha.value.realAnswer = num1 + num2;
  form.value.captcha = '';
}

async function saveArticle(desiredStatus) {
  if (!desiredStatus) {
    desiredStatus = 'draft'; // English Hardcode
  }
  if (['published', 'scheduled', 'pending'].includes(desiredStatus)) { // English Hardcode
    if (parseInt(form.value.captcha, 10) !== captcha.value.realAnswer) {
      uiStore.showNotification({ text: t.value('articles.captchaInvalid'), color: 'error' });
      generateCaptcha();
      return;
    }
  }

  if (desiredStatus === 'published') { // English Hardcode
    article.value.publish_at = null;
  }

  article.value.status = desiredStatus;

  const result = await articlesStore.saveArticle(
      article.value,
      mode.value
  );

  if (result.success) {
      if (desiredStatus !== 'draft') { // English Hardcode
        generateCaptcha();
      }
  }
}

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
            particles.push(new Particle(x, y, size, 'rgba(0, 245, 255, 0.3)', speedX, speedY)); // English Hardcode
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
  generateCaptcha();
  if (route.params.id) {
    mode.value = 'edit'; // English Hardcode
    articlesStore.loadArticleForEdit(route.params.id);
  } else {
    mode.value = 'create'; // English Hardcode
    article.value = {
      id: null, title: '', slug: '', category: 'tutorial', language: 'en', // English Hardcode
      visibility: 'public', content: '# Start writing...', publish_at: null, status: 'pending', // English Hardcode
      price: null, product_url: null,
      meta_description: null, keywords: null, tags: null,
      full_slug_preview: '/fs-en.html' // English Hardcode
    };
    updateSlugPreview();
  }
});

watch(currentArticle, (newVal) => {
  if (isEditMode.value && newVal) {
    article.value = {
        ...article.value,
        ...newVal
    };
    updateSlugPreview();
  }
}, { deep: true });
</script>

<style scoped>
.neural-canvas {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; opacity: 0.5;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
.article-editor-page {
  padding-bottom: 96px;
}
.articles-container {
  padding-top: 24px;
}
.page-title { font-family: 'Orbitron', monospace; color: #FFFFFF; text-shadow: 0 0 10px rgba(0, 245, 255, 0.5); }
.form-card {
  background-color: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(0, 245, 255, 0.1);
  color: #FFFFFF;
  backdrop-filter: blur(10px);
}
.sidebar-title { font-family: 'Orbitron', monospace; color: #00f5ff; font-size: 1rem; font-weight: bold; border-bottom: 1px solid rgba(0, 245, 255, 0.2); padding-bottom: 8px; margin-bottom: 16px; }
.sidebar-subtitle {
    font-family: 'Orbitron', monospace;
    font-size: 0.9rem;
    font-weight: 500;
    color: #e0e0e0;
    margin-top: 16px;
    margin-bottom: 12px;
}
.slug-preview {
  color: var(--text-secondary); /* Menggunakan warna dari App.vue override */
  font-family: monospace; background: rgba(0, 0, 0, 0.2); padding: 4px 8px; border-radius: 4px;
}
.slug-preview span { color: #E0E0E0; font-weight: bold; }
.action-button { font-weight: bold; color: #000 !important; }
.orbitron-font { font-family: 'Orbitron', monospace; }
:deep(.v-text-field .v-label) { color: var(--text-secondary) !important; opacity: 1 !important; }
:deep(.v-text-field input) { color: #FFFFFF !important; }
:deep(.v-textarea textarea) { color: #FFFFFF !important; }
:deep(.v-select .v-select__selection-text) { color: #FFFFFF !important; }

.radio-group-dense :deep(.v-selection-control-group) {
  flex-direction: column;
  align-items: flex-start;
}
:deep(.v-radio .v-label) {
  font-size: 0.9rem;
  color: #E0E0E0;
}
.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: rgba(0,0,0,0.2);
  padding: 12px;
  border-radius: 8px;
  flex-wrap: wrap;
}
.captcha-question {
  font-family: 'Orbitron', monospace;
  color: var(--text-secondary); /* Menggunakan warna dari App.vue override */
}
.captcha-input {
  max-width: 120px;
}

.editor-card-text {
  padding: 0 !important;
}
:deep(.v-md-editor) {
  border: none !important;
  border-radius: 4px;
  overflow: hidden;
  background-color: #0A0F1E;
}
:deep(.v-md-editor__toolbar) {
  background-color: #161625 !important;
  color: #E0E0E0 !important;
  border-bottom: 1px solid rgba(0, 245, 255, 0.2) !important;
}
:deep(.v-md-editor__toolbar-item) {
  color: #E0E0E0 !important;
}
:deep(.v-md-editor__toolbar-item--active) {
  color: #00f5ff !important;
  background-color: rgba(0, 245, 255, 0.1) !important;
}
:deep(.v-md-editor__editor-wrapper) {
  background-color: #0A0F1E !important;
}
:deep(.v-md-editor__content-editor) {
  color: #E0E0E0 !important;
}
:deep(.v-md-editor__preview-wrapper) {
  background-color: #161625 !important;
}
:deep(.vuepress-markdown-body) {
  color: #E0E0E0 !important;
  background-color: #161625 !important;
}
:deep(.vuepress-markdown-body h1),
:deep(.vuepress-markdown-body h2),
:deep(.vuepress-markdown-body h3) {
  color: #FFFFFF !important;
  border-bottom-color: rgba(255, 255, 255, 0.1) !important;
}
:deep(.vuepress-markdown-body code) {
  color: #ffeb3b !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
}
:deep(.vuepress-markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.2) !important;
}
:deep(.v-md-editor__modal) {
  background-color: #2a2a4a !important;
  color: #E0E0E0 !important;
}
:deep(.v-md-editor__modal-header) {
  border-bottom: 1px solid rgba(0, 245, 255, 0.2) !important;
}
:deep(.v-md-editor__modal-input) {
  color: #E0E0E0 !important;
  border: 1px solid rgba(0, 245, 255, 0.2) !important;
  background-color: #161625 !important;
}
</style>