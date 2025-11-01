#######################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gui\template\web\src\components\ArticleSidebar.vue
# PERBAIKAN: Menambahkan prop 'currentArticleId'.
#            Mengubah panggilan fetchRecentPosts agar menyertakan
#            'current_id' dan 'lang' sesuai algoritma baru.
#######################################################################
<template>
  <div class="sidebar-sticky-container">

    <v-card class="sidebar-widget">
      <v-card-title class="widget-title orbitron-font">Advertisement</v-card-title>
      <v-card-text class="text-center pa-4">
        <div class="ad-placeholder">
          <v-icon icon="mdi-advertisements" size="48" color="grey"></v-icon>
          <span class="text-caption text-grey">300 x 250 Banner</span>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="sidebar-widget">
      <v-card-title class="widget-title orbitron-font">Categories</v-card-title>
      <div v-if="isLoadingCategories" class="text-center pa-4">
        <v-progress-circular indeterminate color="cyan" size="small"></v-progress-circular>
      </div>
      <v-list v-else-if="categories.length > 0" density="compact" nav bg-color="transparent">
        <v-list-item
          v-for="cat in categories"
          :key="cat.category"
          :href="`/category/${cat.category}`"
          class="category-link"
          :active="cat.category === props.category"
        >
          <v-list-item-title>{{ cat.category.charAt(0).toUpperCase() + cat.category.slice(1) }}</v-list-item-title>
          <template v-slot:append>
            <v-chip size="x-small" color="cyan" variant="tonal">{{ cat.count }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
      <v-card-text v-else class="text-center text-caption text-grey">
        No categories found.
      </v-card-text>
    </v-card>

    <v-card class="sidebar-widget">
      <v-card-title class="widget-title orbitron-font">Related Posts</v-card-title>
      <v-card-text>
        <div id="recent-posts" class="d-flex flex-column" style="gap: 8px;">
          <p class="loading-placeholder">Loading related posts...</p>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="sidebar-widget">
      <v-card-title class="widget-title orbitron-font">Tags</v-card-title>
      <v-card-text>
        <div class="article-tags-widget">
            <router-link
              v-for="tag in tagList"
              :key="tag"
              :to="`/tag/${encodeURIComponent(tag.trim())}`"
              class="tag-link"
            >
              <span>
                {{ tag.trim() }}
              </span>
            </router-link>
            <p v-if="tagList.length === 0" class="text-caption text-grey">No tags for this article.</p>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';

const props = defineProps({
  category: String,
  tags: String,
  currentSlug: String,
  currentLang: String,
  // (PERBAIKAN KUNCI FITUR 4) Tambah prop baru
  currentArticleId: String
});

const categories = ref([]);
// (PENAMBAHAN KODE BUG 2) State loading untuk kategori
const isLoadingCategories = ref(false);

const tagList = computed(() => {
    return (props.tags || '').split(',').filter(t => t.trim());
});

// --- Logika Fetch Kategori (MODIFIKASI BUG 2) ---
async function fetchCategories() {
    // (PENAMBAHAN KODE BUG 2) Set loading
    isLoadingCategories.value = true;
    try {
        // (KODE ASLI)
        const response = await fetch('/api/v1/content/articles/categories/list');
        if (!response.ok) throw new Error('Failed to fetch categories'); // English Hardcode
        const data = await response.json();
        // (PENAMBAHAN KODE BUG 2) Cek jika ada error dari API
        if (data.error) throw new Error(data.error);
        categories.value = data;
        console.log('[Sidebar] Categories loaded:', data); // English Log
    } catch (error) {
        console.error('[Sidebar] Error fetching categories:', error); // English Log
    } finally {
        // (PENAMBAHAN KODE BUG 2) Selesai loading
        isLoadingCategories.value = false;
    }
}

// --- Logika Fetch Related Posts (MODIFIKASI FITUR 4) ---
async function fetchRecentPosts(category, slug, lang, currentId) { // Tambah parameter currentId
  const recentPostsDiv = document.getElementById('recent-posts');
  if (!recentPostsDiv) {
      console.error('[Sidebar] Cannot find #recent-posts element.'); // English Log
      return;
  }
  // (PERBAIKAN KUNCI FITUR 4) Validasi input tambahan
  if (!category || !lang || !currentId) {
    console.warn('[Sidebar] Missing required props for related posts fetch.'); // English Log
    recentPostsDiv.innerHTML = '<p class="text-caption text-grey">Cannot load related posts (missing data).</p>'; // English Hardcode
    return;
  }

  console.log(`[Sidebar] Starting fetchRecentPosts: category=${category}, lang=${lang}, currentId=${currentId}`); // English Log
  recentPostsDiv.innerHTML = '<p class="loading-placeholder">Loading related posts...</p>'; // English Hardcode
  try {
      // (PERBAIKAN KUNCI FITUR 4) Ubah URL API untuk menyertakan lang dan current_id
      let apiUrl = `/api/v1/content/articles/recent?category=${encodeURIComponent(category)}&lang=${encodeURIComponent(lang)}&current_id=${encodeURIComponent(currentId)}`;
      // (AKHIR PERBAIKAN KUNCI FITUR 4)

      console.log(`[Sidebar] Fetching related posts from: ${apiUrl}`); // English Log
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Failed to fetch related posts: ${response.statusText}`); // English Hardcode
      const posts = await response.json();
      console.log(`[Sidebar] Received posts data:`, posts); // English Log

      if (posts && posts.length > 0) {
          let html = '';
          posts.forEach(post => {
              // (KODE ASLI) Filtering isCurrentArticle sekarang dilakukan di backend
              const url = `/p-${post.slug}-${post.language || 'en'}.html`; // English Hardcode
              html += `<a href="${url}" class="recent-post-link">${post.title}</a>`; // English Hardcode
          });
          if (html === '') {
             recentPostsDiv.innerHTML = '<p>No other related posts found.</p>'; // English Hardcode
          } else {
             recentPostsDiv.innerHTML = html;
          }
      } else {
          recentPostsDiv.innerHTML = '<p>No related posts found.</p>'; // English Hardcode
      }
  } catch (error) {
      console.error('[Sidebar] Error fetching or processing related posts:', error); // English Log
      recentPostsDiv.innerHTML = '<p style="color: #ff5252;">Could not load related posts.</p>'; // English Hardcode
  }
}

onMounted(() => {
    fetchCategories();
    // (PERBAIKAN KUNCI FITUR 4) Panggil fetchRecentPosts saat komponen di-mount
    if (props.category && props.currentLang && props.currentArticleId) {
        // (PERBAIKAN KUNCI FITUR 4) Kirim currentArticleId
        fetchRecentPosts(props.category, props.currentSlug, props.currentLang, props.currentArticleId);
    }
});

// (PERBAIKAN KUNCI FITUR 4) Panggil ulang fetchRecentPosts jika user pindah ke artikel lain (props berubah)
watch(() => [props.category, props.currentSlug, props.currentLang, props.currentArticleId], (newValues) => {
    // (PERBAIKAN KUNCI FITUR 4) Ambil currentArticleId
    const [newCategory, newSlug, newLang, newCurrentId] = newValues;
    if (newCategory && newLang && newCurrentId) {
        // (PERBAIKAN KUNCI FITUR 4) Kirim currentArticleId
        fetchRecentPosts(newCategory, newSlug, newLang, newCurrentId);
    }
});
</script>

<style scoped>
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.sidebar-sticky-container {
  position: sticky;
  top: 80px; /* Jarak dari atas (setelah header) */
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.sidebar-widget {
  background: rgba(23, 33, 65, 0.7);
  backdrop-filter: blur(10px);
  padding: 8px;
  position: relative;
  border: 2px solid transparent;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  background-image:
    linear-gradient(rgba(23, 33, 65, 0.7), rgba(23, 33, 65, 0.7)),
    conic-gradient(from var(--angle), transparent 25%, #64ffda, #bf00ff, transparent 75%);
  animation: border-chase 4s linear infinite;
}
@keyframes border-chase {
  to { --angle: 360deg; }
}
.widget-title {
  font-family: 'Orbitron', monospace;
  color: #00f5ff;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 245, 255, 0.2);
  padding: 8px 16px 12px 16px;
  margin-bottom: 8px;
}
.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.category-link {
    transition: all 0.2s ease;
}
.category-link:hover {
    background-color: rgba(0, 245, 255, 0.1);
}
.loading-placeholder {
    color: #666;
    font-style: italic;
    font-size: 0.9rem;
}

:deep(#recent-posts .recent-post-link) {
  display: block;
  background-color: rgba(191, 0, 255, 0.1);
  color: #d1aaff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.3s ease;
  line-height: 1.4;
}
:deep(#recent-posts .recent-post-link:hover) {
  background-color: rgba(191, 0, 255, 0.2);
  color: #e6ceff;
}

.article-tags-widget {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.article-tags-widget .tag-link {
  text-decoration: none;
}
.article-tags-widget span {
  display: block;
  background-color: rgba(0, 245, 255, 0.1);
  color: #00f5ff;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  transition: background-color 0.3s ease;
}
.article-tags-widget .tag-link:hover span {
  background-color: rgba(0, 245, 255, 0.2);
}
</style>