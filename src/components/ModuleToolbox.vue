<template>
  <v-card class="toolbox-card">
    <v-card-title class="pa-4 pb-0">
      <v-text-field
        v-model="search"
        :placeholder="localization.search_modules_placeholder"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        density="compact"
        variant="solo-filled"
      ></v-text-field>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text class="pa-0">
      <v-expansion-panels variant="accordion" multiple>
        <v-expansion-panel
          v-for="category in filteredCategories"
          :key="category.id"
          :title="category.name"
        >
          <v-expansion-panel-text class="pa-0">
            <v-list dense>
              <v-list-item
                v-for="item in category.items"
                :key="item.id"
                class="draggable-item"
                :data-module-id="item.id"
                draggable="true"
                @dragstart="onDragStart($event, item)"
                @dragend="onDragEnd"
              >
                <template v-slot:prepend>
                  <v-icon
                    :color="item.is_premium ? 'yellow' : 'blue'"
                  >mdi-puzzle</v-icon>
                </template>
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip
                    v-if="item.is_premium"
                    color="yellow"
                    label
                    density="compact"
                  >Premium</v-chip>
                  <v-chip
                    v-else
                    color="blue"
                    label
                    density="compact"
                  >Free</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const search = ref('');
const modules = ref([]);
const plugins = ref([]);
const widgets = ref([]);

const localization = ref({
  search_modules_placeholder: 'Search modules...',
  modules_category_name: 'Modules',
  plugins_category_name: 'Plugins',
  widgets_category_name: 'Widgets'
});

const onDragStart = (event, item) => {
  console.log('Drag started for item:', item.id);
  event.dataTransfer.setData('application/json', JSON.stringify({ type: 'module', id: item.id }));
  event.dataTransfer.effectAllowed = 'move';
};

const onDragEnd = () => {
  console.log('Drag ended.');
};

const fetchComponents = async () => {
  try {
    const [modulesRes, pluginsRes, widgetsRes] = await Promise.all([
      axios.get('/api/v1/modules'),
      axios.get('/api/v1/plugins'),
      axios.get('/api/v1/widgets')
    ]);
    modules.value = modulesRes.data;
    plugins.value = pluginsRes.data;
    widgets.value = widgetsRes.data;
  } catch (error) {
    console.error('Error fetching components:', error);
  }
};

onMounted(() => {
  fetchComponents();
});

const componentCategories = computed(() => {
  return [
    { id: 'modules', name: localization.value.modules_category_name, items: modules.value },
    { id: 'plugins', name: localization.value.plugins_category_name, items: plugins.value },
    { id: 'widgets', name: localization.value.widgets_category_name, items: widgets.value }
  ];
});

const filteredCategories = computed(() => {
  if (!search.value) {
    return componentCategories.value;
  }
  const searchText = search.value.toLowerCase();
  return componentCategories.value.map(category => {
    const filteredItems = category.items.filter(item =>
      item.name.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText)
    );
    return { ...category, items: filteredItems };
  }).filter(category => category.items.length > 0);
});
</script>

<style scoped>
.toolbox-card {
  height: 100%;
  max-width: 350px;
  background-color: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.draggable-item {
  cursor: grab;
}

.draggable-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>