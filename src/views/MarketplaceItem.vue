<template>
  <div class="item-detail-page">
    <NeuralCanvasBackground />
    <v-container class="page-container">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">

          <v-btn
            :to="{ name: 'Marketplace' }"
            prepend-icon="mdi-arrow-left"
            variant="text"
            class="mb-4"
          >
            Back to Marketplace
          </v-btn>

          <div v-if="itemType !== 'capsule'">
            <div v-if="isLoadingDetail" class="text-center py-16">
              <v-progress-circular indeterminate color="cyan" size="64"></v-progress-circular>
              <p class="mt-4 text-grey-lighten-1">Loading item detail...</p>
            </div>

            <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
              {{ error }}
            </v-alert>

            <v-card v-else-if="selectedItem" class="item-card" variant="flat">
              <v-card-title class="item-title orbitron-font">
                {{ selectedItem.name }}
              </v-card-title>
              <v-card-subtitle>
                Published by {{ formatAuthor(selectedItem.author) }}
              </v-card-subtitle>

              <v-card-text>
                <p class="item-description mt-4">
                  {{ selectedItem.desc || 'No description provided.' }}
                </p>

                <v-divider class="my-6"></v-divider>

                <div class="action-box">
                  <div class="price-display">
                    <span class="price-label">{{ selectedItem.price > 0 ? 'Price:' : 'Cost:' }}</span>
                    <span class="price-value orbitron-font">{{ selectedItem.price > 0 ? `$${selectedItem.price}` : 'Free' }}</span>
                  </div>
                  <v-btn
                    v-if="selectedItem.type === 'preset'"
                    color="cyan"
                    variant="flat"
                    class="action-button"
                    @click="handleImportPreset"
                    prepend-icon="mdi-import"
                  >
                    Import to My Designer
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <div v-else>
            <div v-if="isLoadingCapsuleDetail" class="text-center py-16">
              <v-progress-circular indeterminate color="blue-lighten-2" size="64"></v-progress-circular>
              <p class="mt-4 text-grey-lighten-1">Loading Local Capsule detail...</p>
            </div>

            <v-alert v-else-if="capsuleError" type="error" variant="tonal" class="mt-4">
              {{ capsuleError }}
            </v-alert>

            <v-card v-else-if="selectedCapsule" class="item-card" variant="flat">
              <v-card-title class="item-title orbitron-font">
                <v-icon icon="mdi-vector-link" class="mr-3"></v-icon>
                {{ selectedCapsule.capsule_id }}
              </v-card-title>
              <v-card-subtitle>
                Role: <span class="text-yellow-darken-2">{{ selectedCapsule.fac_template.role }}</span>
              </v-card-subtitle>

              <v-card-text>
                <div class="action-box">
                  <div>
                    <span class="price-label">Budget:</span>
                    <span class="price-value orbitron-font text-blue-lighten-2">
                      <v-icon icon="mdi-gas-cylinder" class="mr-1"></v-icon>
                      {{ selectedCapsule.fac_template.budget_gas }} G
                    </span>
                  </div>
                  <div>
                    <v-btn
                      color="grey-darken-2"
                      variant="flat"
                      class="action-button-dark"
                      @click="handleRemixCapsule"
                      prepend-icon="mdi-mix-shuffle"
                    >
                      Remix
                    </v-btn>
                    <v-btn
                      color="blue-darken-1"
                      variant="flat"
                      class="action-button-dark ml-2"
                      @click="handleInstallCapsule"
                      prepend-icon="mdi-download"
                    >
                      Install
                    </v-btn>
                  </div>
                </div>

                <v-divider class="my-6"></v-divider>

                <v-row>
                  <v-col cols="12" md="6">
                    <h3 class="detail-header orbitron-font">Documentation</h3>
                    <v-sheet class="detail-box" elevation="0">
                      <pre class="item-description">{{ selectedCapsule.docs || 'No documentation provided.' }}</pre>
                    </v-sheet>

                    <h3 class="detail-header orbitron-font mt-4">Timeline Sample</h3>
                    <v-sheet class="detail-box" elevation="0">
                      <ul v-if="selectedCapsule.timeline_sample && selectedCapsule.timeline_sample.length > 0">
                        <li v-for="(event, i) in selectedCapsule.timeline_sample" :key="i" class="mb-1">
                          <span class="text-green-lighten-2">[{{ event.type }}]</span>
                          <span class="text-grey-lighten-1 ml-2">{{ event.msg }}</span>
                        </li>
                      </ul>
                      <span v-else class="text-grey-darken-1">No timeline sample provided.</span>
                    </v-sheet>
                  </v-col>

                  <v-col cols="12" md="6">
                    <h3 class="detail-header orbitron-font">Capabilities</h3>
                    <v-sheet class="detail-box" elevation="0">
                       <ul v-if="selectedCapsule.fac_template.capabilities && selectedCapsule.fac_template.capabilities.length > 0">
                        <li v-for="(cap, i) in selectedCapsule.fac_template.capabilities" :key="i" class="mb-3">
                          <div class="font-weight-bold text-blue-lighten-3">{{ cap.name }}</div>
                          <div class="text-caption text-grey-lighten-1 pl-2">
                            <span class="text-grey-lighten-2">Scope:</span> {{ JSON.stringify(cap.scope) }}
                          </div>
                          <div v-if="cap.description" class="text-caption text-grey-lighten-1 pl-2 font-italic">
                            "{{ cap.description }}"
                          </div>
                        </li>
                      </ul>
                       <span v-else class="text-grey-darken-1">No capabilities defined.</span>
                    </v-sheet>
                  </v-col>
                </v-row>

              </v-card-text>
            </v-card>
          </div>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
// (English Hardcode) ADDED R9: computed
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMarketplaceStore } from '@/store/marketplace';
import { useWorkflowStore } from '@/store/workflow';
import { useUiStore } from '@/store/ui';
import { storeToRefs } from 'pinia';
import NeuralCanvasBackground from '@/components/NeuralCanvasBackground.vue';

const route = useRoute();
const router = useRouter();
const marketplaceStore = useMarketplaceStore();
const workflowStore = useWorkflowStore();
const uiStore = useUiStore();

// (English Hardcode) Get OLD and NEW state
const { selectedItem, isLoadingDetail, error, selectedCapsule, isLoadingCapsuleDetail, capsuleError } = storeToRefs(marketplaceStore);

// (English Hardcode) ADDED R9: Compute item type from route
const itemType = computed(() => route.query.type);

function formatAuthor(address) {
  if (!address) return 'Anonymous';
  if (address.startsWith('0x') && address.length === 42) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  return address;
}

// (English Hardcode) This is the ORIGINAL function for cloud presets
async function handleImportPreset() {
  if (!selectedItem.value || !selectedItem.value.data) {
    uiStore.showNotification({ text: 'Error: No workflow data found in this item.', color: 'error' });
    return;
  }

  try {
    // (English Hardcode) The data from cloud is expected to be a string
    const workflowData = JSON.parse(selectedItem.value.data);
    const newPresetName = `Imported - ${selectedItem.value.name}`;

    workflowStore.updateSinglePresetData(newPresetName, workflowData);
    workflowStore.permissionLevel.value = 'edit'; // (English Hardcode) Ensure it's editable
    workflowStore.currentPresetName.value = newPresetName; // (English Hardcode) Set the name

    uiStore.showNotification({ text: `Workflow '${newPresetName}' imported successfully!`, color: 'success' });
    router.push({ name: 'Designer' }); // (English Hardcode) Go to Designer

  } catch (e) {
    console.error('[MarketStore] Failed to parse or import preset data:', e);
    uiStore.showNotification({ text: `Import failed: ${e.message}`, color: 'error' });
  }
}

// (English Hardcode) --- ADDED R9: Functions for Local Capsules ---
async function handleInstallCapsule() {
  if (!selectedCapsule.value) return;
  // (English Hardcode) We are "installing" the full JSON payload we just fetched
  const success = await marketplaceStore.installCapsule(selectedCapsule.value);
  if (success) {
    router.push({ name: 'Marketplace' });
  }
}

async function handleRemixCapsule() {
  if (!selectedCapsule.value) return;
  const newId = prompt("Enter a new, unique ID for your remixed capsule:", `${selectedCapsule.value.capsule_id}-remix`);
  if (!newId) return;

  // (English Hardcode) For now, just a blank patch. A real UI would ask for changes.
  const patch = {
    docs: (selectedCapsule.value.docs || "") + "\n\n(English Hardcode) Remixed from " + selectedCapsule.value.capsule_id,
    fac_template: {
      // (English Hardcode) Example: increase budget
      budget_gas: (selectedCapsule.value.fac_template.budget_gas || 100) * 2
    }
  };

  const remixed = await marketplaceStore.remixCapsule(selectedCapsule.value.capsule_id, newId, patch);
  if (remixed) {
    // (English Hardcode) Go to the new capsule's detail page
    router.push(`/marketplace/item/${remixed.capsule_id}?type=capsule`);
  }
}


onMounted(() => {
  const itemId = route.params.id;
  // (English Hardcode) MODIFIED R9: Check type and call correct fetcher
  if (itemType.value === 'capsule') {
    marketplaceStore.fetchCapsuleDetails(itemId);
  } else {
    marketplaceStore.fetchItemDetail(itemId);
  }
});
</script>

<style scoped>
/* (English Hardcode) Rule #5: High contrast text */
.item-detail-page {
  height: 100%;
  overflow-y: auto;
  padding: 48px 0;
  position: relative;
  z-index: 1;
}
.page-container {
  max-width: 900px;
  position: relative;
  z-index: 2;
}
.orbitron-font {
  font-family: 'Orbitron', monospace;
  color: #f0f0f0;
}
.item-card {
  background: rgba(30, 30, 47, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  animation: card-glow-animation 5s infinite alternate;
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
.item-title {
  font-size: 2.25rem;
  line-height: 1.2;
  color: var(--text-primary); /* (English Hardcode) Rule #5 */
  padding: 0 !important;
  word-break: break-word;
}
.v-card-subtitle {
  color: var(--text-secondary); /* (English Hardcode) Rule #5 */
}
.item-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary); /* (English Hardcode) Rule #5 */
  white-space: pre-wrap; /* (English Hardcode) Keep this for docs */
}
.action-box {
  background-color: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.1);
}
.price-label {
  color: var(--text-secondary); /* (English Hardcode) Rule #5 */
  font-size: 1rem;
}
.price-value {
  color: var(--text-primary); /* (English Hardcode) Rule #5 */
  font-size: 2rem;
  margin-left: 12px;
}
.action-button {
  font-weight: bold;
  color: #000 !important; /* (English Hardcode) Rule #5 */
}

/* (English Hardcode) --- ADDED R9 --- */
.action-button-dark {
  font-weight: bold;
  color: #FFF !important; /* (English Hardcode) Rule #5 */
}
.detail-header {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.detail-box {
  background-color: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-family: 'Roboto Mono', monospace;
}
pre.item-description {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
}
</style>