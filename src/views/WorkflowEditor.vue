<template>
  <DefaultLayout>
    <template #toolbox>
      <Toolbox />
    </template>
    <template #main-content>
      <WorkflowCanvas />
    </template>
    <template #properties-panel>
      <NodeProperties />
    </template>
  </DefaultLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import Toolbox from '@/components/Toolbox.vue';
import WorkflowCanvas from '@/components/WorkflowCanvas.vue';
import NodeProperties from '@/components/NodeProperties.vue';
import { useComponentStore } from '@/store/components';

const componentStore = useComponentStore();

onMounted(() => {
  componentStore.fetchAllComponents();
});
</script>