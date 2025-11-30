<template>
  <div class="gemini-layout fill-height d-flex flex-column">

    <v-navigation-drawer v-model="drawer" color="#050505" width="280" class="border-r-thin" floating>
        <div class="pa-4">
            <v-btn block rounded="xl" color="#1a1a1a" class="text-none justify-start text-grey-lighten-1 new-chat-btn mb-4" height="44" variant="tonal" @click="handleNewChat">
                <v-icon start icon="mdi-plus" color="#D4AF37"></v-icon> New chat
            </v-btn>
            <div class="text-caption font-weight-bold text-grey-darken-1 mb-2 ml-2">Recent</div>
            <div v-if="sessions.length === 0" class="text-caption text-grey-darken-2 text-center mt-4 italic">No history yet.</div>
            <v-list bg-color="transparent" density="compact" class="history-list">
                <v-hover v-for="session in sessions" :key="session.id" v-slot="{ isHovering, props }">
                    <v-list-item v-bind="props" rounded="lg" :active="currentSessionId === session.id" active-class="active-session-item" class="mb-1 history-item" @click="aiCenterStore.switchSession(session.id)">
                        <template v-slot:prepend><v-icon icon="mdi-message-outline" size="small" class="mr-3 text-grey-darken-1"></v-icon></template>
                        <v-list-item-title class="text-body-2 text-grey-lighten-2 text-truncate">{{ session.title }}</v-list-item-title>
                        <template v-slot:append>
                            <div v-if="isHovering || currentSessionId === session.id">
                                <v-menu location="end">
                                    <template v-slot:activator="{ props }"><v-btn icon v-bind="props" variant="text" density="compact" size="small" color="grey"><v-icon icon="mdi-dots-vertical" size="small"></v-icon></v-btn></template>
                                    <v-list bg-color="#2d2e30" density="compact" class="rounded-lg border-thin">
                                        <v-list-item @click.stop="aiCenterStore.deleteSession(session.id)" class="text-red-accent-2">
                                            <template v-slot:prepend><v-icon icon="mdi-delete-outline" size="small"></v-icon></template>
                                            <v-list-item-title>Delete</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </div>
                        </template>
                    </v-list-item>
                </v-hover>
            </v-list>
        </div>
        <template v-slot:append>
            <div class="pa-4 text-caption text-grey-darken-2">
                <div class="d-flex align-center mb-1"><v-icon icon="mdi-map-marker" size="x-small" class="mr-1"></v-icon> Jakarta, ID</div>
                <div class="font-mono" style="font-size: 10px;">Flowork Neural v3.5 (Gold Edition)</div>
            </div>
        </template>
    </v-navigation-drawer>

    <v-navigation-drawer v-if="isAgentMode" v-model="agentDrawer" location="right" color="#050505" width="340" class="border-l-thin" floating>
        <div class="d-flex flex-column fill-height">

            <div class="pa-4 border-b-thin bg-grey-darken-4 flex-shrink-0">
                <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold text-gold-luxury orbitron-font">AGENT COMMAND</span>
                    <v-icon icon="mdi-robot-industrial" color="#D4AF37" size="small"></v-icon>
                </div>

                <div class="mb-3">
                    <div class="text-caption text-grey-darken-1 font-weight-bold mb-1">WORKFLOW PRESET</div>
                    <v-select
                        v-model="selectedPreset"
                        :items="presets"
                        item-title="name"
                        item-value="id"
                        placeholder="No Preset Selected"
                        variant="outlined"
                        density="compact"
                        bg-color="#1a1a1a"
                        hide-details
                        class="agent-select text-caption"
                        :loading="isLoadingPresets"
                        return-object
                        clearable
                    >
                        <template v-slot:prepend-inner>
                            <v-icon icon="mdi-sitemap" size="small" color="#D4AF37"></v-icon>
                        </template>
                    </v-select>
                </div>

                <div v-if="selectedPersona" class="rounded pa-2 bg-gold-dim border-gold-subtle">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-account-tie" size="small" color="#D4AF37" class="mr-2"></v-icon>
                        <div>
                            <div class="text-caption font-weight-bold text-gold-luxury">{{ selectedPersona.name }}</div>
                            <div class="text-caption text-grey-lighten-1 text-truncate" style="font-size: 10px; max-width: 220px;">{{ selectedPersona.content }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-grow-1 d-flex flex-column" style="min-height: 0; flex-basis: 55%;">
                <div class="px-4 pt-4 pb-2">
                    <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-caption font-weight-bold text-grey-darken-1">AVAILABLE TOOLS</div>
                        <div class="d-flex align-center">
                             <v-progress-circular v-if="isStoreLoading" indeterminate size="12" width="2" color="#D4AF37" class="mr-2"></v-progress-circular>
                             <v-chip size="x-small" color="#D4AF37" variant="text">{{ filteredTools.length }} Items</v-chip>
                        </div>
                    </div>

                    <v-text-field
                        v-model="toolSearch"
                        placeholder="Search tools..."
                        variant="outlined"
                        density="compact"
                        bg-color="#1a1a1a"
                        hide-details
                        class="tool-search mb-2 text-caption"
                    >
                        <template v-slot:prepend-inner>
                            <v-icon icon="mdi-magnify" size="small" color="grey"></v-icon>
                        </template>
                    </v-text-field>
                </div>

                <div class="tools-scroll-area px-2 pb-2" style="overflow-y: auto;">
                    <div v-if="filteredTools.length === 0" class="text-center text-caption text-grey py-4">
                        {{ isStoreLoading ? 'Loading tools...' : 'No tools found.' }}
                    </div>

                    <div v-for="tool in filteredTools" :key="tool.id" class="tool-item rounded-lg mb-2 pa-2 border-thin bg-grey-darken-4">
                        <div class="d-flex align-center">
                            <div class="tool-icon rounded bg-grey-darken-3 d-flex align-center justify-center mr-3" style="width: 36px; height: 36px; overflow:hidden;">
                                <img v-if="getToolIconUrl(tool)" :src="getToolIconUrl(tool)" alt="" style="width:100%; height:100%; object-fit:cover;">
                                <v-icon v-else icon="mdi-hammer-wrench" :color="tool.is_installed ? '#D4AF37' : 'grey'" size="small"></v-icon>
                            </div>

                            <div class="flex-grow-1" style="min-width: 0;">
                                <div class="d-flex align-center">
                                    <div class="text-caption font-weight-bold text-grey-lighten-1 text-truncate mr-1">
                                        {{ tool.manifest?.name || tool.name }}
                                    </div>
                                    <v-icon
                                        :icon="isFavorite(tool.id) ? 'mdi-star' : 'mdi-star-outline'"
                                        :color="isFavorite(tool.id) ? '#D4AF37' : 'grey-darken-2'"
                                        size="x-small"
                                        class="cursor-pointer"
                                        @click.stop="toggleFavorite(tool.id)"
                                    ></v-icon>
                                </div>
                                <div class="text-caption text-grey-darken-1 text-truncate" style="font-size: 10px;">
                                    {{ tool.manifest?.description || tool.description || 'No description' }}
                                </div>
                            </div>

                            <div class="d-flex align-center">
                                <template v-if="tool.is_installed">
                                    <v-tooltip text="Share to Marketplace" location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-btn v-bind="props" icon size="x-small" variant="text" color="amber-accent-3" class="mr-1" @click="shareTool(tool)">
                                                <v-icon icon="mdi-share-variant-outline" size="small"></v-icon>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                    <v-tooltip text="Uninstall" location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-btn
                                                v-bind="props"
                                                icon
                                                size="x-small"
                                                variant="text"
                                                color="red-accent-2"
                                                :loading="componentStore.uninstallingComponentId === tool.id"
                                                @click="handleUninstall(tool)"
                                            >
                                                <v-icon icon="mdi-delete-outline" size="small"></v-icon>
                                            </v-btn>
                                        </template>
                                    </v-tooltip>
                                </template>
                                <template v-else>
                                    <v-btn
                                        size="small"
                                        variant="tonal"
                                        color="#D4AF37"
                                        class="text-caption px-2 text-gold-luxury font-weight-bold"
                                        style="height: 28px;"
                                        :loading="componentStore.installingComponentId === tool.id"
                                        @click="handleInstall(tool)"
                                    >
                                        <v-icon start icon="mdi-download" size="x-small"></v-icon> Get
                                    </v-btn>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <v-divider class="border-opacity-10"></v-divider>

            <div class="flex-grow-1 d-flex flex-column bg-black" style="min-height: 0; flex-basis: 45%;">
                <div class="px-4 py-2 border-b-thin border-opacity-10 d-flex justify-space-between align-center bg-grey-darken-4">
                    <div class="d-flex align-center">
                        <span class="text-caption font-weight-bold text-grey-darken-1 mr-2">NEURAL LOGS</span>
                        <v-chip size="x-small" color="#D4AF37" variant="text" v-if="aiCenterStore.isGenerating" class="pulsing-dot">● LIVE</v-chip>
                    </div>

                    <div class="d-flex">
                        <v-tooltip text="Copy All Logs" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="x-small" variant="text" color="grey" class="mr-1" @click="copyLogs">
                                    <v-icon icon="mdi-content-copy" size="small"></v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip text="Clear Logs" location="top">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="x-small" variant="text" color="grey" @click="clearLogs">
                                    <v-icon icon="mdi-trash-can-outline" size="small"></v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </div>
                </div>

                <div class="log-container flex-grow-1 pa-3 font-mono text-caption text-grey-lighten-2" style="overflow-y: auto; font-size: 10px; line-height: 1.4;">
                    <div v-if="agentLogs.length === 0" class="text-grey-darken-3 text-center mt-4 font-italic">System idle. Waiting for instructions...</div>
                    <div v-for="(log, i) in agentLogs" :key="i" class="mb-1 log-entry">
                        <span class="text-grey-darken-2 mr-2">[{{ log.time }}]</span>
                        <span :class="getLogColor(log.type)">{{ log.message }}</span>
                    </div>
                </div>
            </div>
        </div>
    </v-navigation-drawer>

    <v-navigation-drawer v-if="isCouncilMode" v-model="councilDrawer" location="right" color="#050505" width="340" class="border-l-thin" floating>
        <div class="d-flex flex-column fill-height">
            <div class="pa-4 border-b-thin bg-grey-darken-4 flex-shrink-0">
                <div class="d-flex align-center justify-space-between">
                    <span class="text-subtitle-2 font-weight-bold text-gold-luxury orbitron-font">COUNCIL CHAMBER</span>
                    <v-icon icon="mdi-gavel" color="#D4AF37" size="small"></v-icon>
                </div>
                <div class="text-caption text-grey-darken-1 mt-1">Select participating models for debate.</div>
            </div>

            <div class="flex-grow-1 d-flex flex-column" style="min-height: 0; flex-basis: 55%;">
                <div class="px-4 pt-3 pb-2">
                     <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-caption font-weight-bold text-grey-darken-1">COUNCIL MEMBERS</div>
                        <v-chip size="x-small" color="#D4AF37" variant="text">{{ selectedCouncilMembers.length }} Selected</v-chip>
                    </div>
                </div>

                <div class="council-scroll-area px-2 pb-2" style="overflow-y: auto;">
                    <div v-if="aiProviders.length === 0" class="text-center text-caption text-grey py-4">No AI Models Found.</div>

                    <v-list bg-color="transparent" density="compact">
                        <v-list-item v-for="model in aiProviders" :key="model.id" class="mb-1 rounded-lg border-thin bg-grey-darken-4 council-item">
                            <template v-slot:prepend>
                                <v-checkbox-btn v-model="selectedCouncilMembers" :value="model.id" density="compact" color="#D4AF37"></v-checkbox-btn>
                            </template>
                            <v-list-item-title class="text-caption font-weight-bold text-grey-lighten-2">{{ model.name }}</v-list-item-title>
                            <v-list-item-subtitle class="text-caption text-grey-darken-1" style="font-size: 9px !important;">
                                {{ model.type === 'local' ? 'Local Engine' : 'Cloud Provider' }}
                            </v-list-item-subtitle>
                            <template v-slot:append>
                                <v-icon :icon="getProviderIcon(model.type)" size="small" color="grey-darken-2"></v-icon>
                            </template>
                        </v-list-item>
                    </v-list>
                </div>
            </div>

            <v-divider class="border-opacity-10"></v-divider>

            <div class="flex-grow-1 d-flex flex-column bg-black" style="min-height: 0; flex-basis: 45%;">
                <div class="px-4 py-2 border-b-thin border-opacity-10 d-flex justify-space-between align-center bg-grey-darken-4">
                    <div class="d-flex align-center">
                        <span class="text-caption font-weight-bold text-grey-darken-1 mr-2">MEETING MINUTES</span>
                        <v-chip size="x-small" color="#D4AF37" variant="text" v-if="aiCenterStore.isGenerating" class="pulsing-dot">● DEBATING</v-chip>
                    </div>
                     <v-btn icon size="x-small" variant="text" color="grey" @click="councilLogs = []">
                        <v-icon icon="mdi-trash-can-outline" size="small"></v-icon>
                    </v-btn>
                </div>

                 <div class="council-log-container flex-grow-1 pa-3 font-mono text-caption text-grey-lighten-2" style="overflow-y: auto; font-size: 10px; line-height: 1.4;">
                    <div v-if="councilLogs.length === 0" class="text-grey-darken-3 text-center mt-4 font-italic">Council is in recess.</div>
                    <div v-for="(log, i) in councilLogs" :key="i" class="mb-2 d-flex align-start">
                         <span class="text-gold-dim mr-2 text-caption font-weight-bold" style="min-width: 60px;">[{{ log.speaker }}]</span>
                         <span class="text-grey-lighten-1">{{ log.message }}</span>
                    </div>
                </div>
            </div>

        </div>
    </v-navigation-drawer>

    <div class="header-bar px-4 py-3 d-flex align-center justify-space-between bg-glass-header flex-grow-0 flex-shrink-0">
        <div class="d-flex align-center">
            <v-app-bar-nav-icon variant="text" color="grey-lighten-1" @click="drawer = !drawer"></v-app-bar-nav-icon>
            <div class="d-flex align-center cursor-pointer ml-2 hover-opacity" @click="$router.push('/')">
                <span class="font-weight-bold text-h6 text-grey-lighten-1 orbitron-font">Flowork <span class="text-gold-luxury">AI</span></span>
                <v-chip size="x-small" color="#D4AF37" variant="outlined" class="ml-2 mt-1 font-mono d-none d-sm-flex">
                    {{ isCouncilMode ? 'COUNCIL' : (isAgentMode ? 'AGENT' : 'BETA') }}
                </v-chip>
            </div>
        </div>

        <div class="d-flex align-center gap-4">
            <div class="d-flex align-center bg-grey-darken-4 rounded-pill px-1 border-thin">
                <v-btn size="small" rounded="pill" :color="!isAgentMode && !isCouncilMode ? '#2a2b2d' : 'transparent'" variant="flat" class="text-caption" height="32" @click="setMode('chat')">
                    <v-icon start icon="mdi-chat-outline" size="small" :color="!isAgentMode && !isCouncilMode ? '#D4AF37' : 'grey'"></v-icon> Chat
                </v-btn>
                <v-btn size="small" rounded="pill" :color="isAgentMode ? '#2a2b2d' : 'transparent'" variant="flat" class="text-caption" height="32" @click="setMode('agent')">
                    <v-icon start icon="mdi-robot" size="small" :color="isAgentMode ? '#D4AF37' : 'grey'"></v-icon> Agent
                </v-btn>
                <v-btn size="small" rounded="pill" :color="isCouncilMode ? '#2a2b2d' : 'transparent'" variant="flat" class="text-caption" height="32" @click="setMode('council')">
                    <v-icon start icon="mdi-gavel" size="small" :color="isCouncilMode ? '#D4AF37' : 'grey'"></v-icon> Council
                </v-btn>
            </div>

            <div class="d-flex align-center" v-if="isAgentMode">
                 <v-menu location="bottom" transition="slide-y-transition" offset="8">
                    <template v-slot:activator="{ props }">
                        <div v-bind="props" class="model-selector-btn d-flex align-center px-3 py-2 rounded-lg cursor-pointer transition-all ml-2 border-amber-thin">
                            <v-icon icon="mdi-account-box-outline" color="#D4AF37" size="small" class="mr-2"></v-icon>
                            <span class="text-grey-lighten-1 font-weight-bold mr-2 text-body-2 text-truncate" style="max-width: 150px;">
                                {{ selectedPersona ? selectedPersona.name : 'Select Persona' }}
                            </span>
                            <v-icon icon="mdi-chevron-down" color="grey-darken-1" size="small"></v-icon>
                        </div>
                    </template>
                    <v-list bg-color="#1e1f20" density="compact" class="border-thin rounded-lg nav-menu-list mt-2" width="250">
                        <v-list-subheader class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-1">Available Personas</v-list-subheader>
                        <v-divider class="mb-2 border-opacity-10"></v-divider>
                        <div v-if="isLoadingPersonas" class="pa-2 text-center"><v-progress-circular indeterminate size="16" width="2" color="#D4AF37"></v-progress-circular></div>
                        <template v-else>
                            <v-list-item value="default" @click="selectedPersona = null" :active="!selectedPersona" active-color="#D4AF37" class="mb-1 rounded mx-2" variant="text">
                                <template v-slot:prepend><v-icon icon="mdi-robot-outline" size="small" class="mr-2"></v-icon></template>
                                <v-list-item-title class="font-mono text-caption">Default Assistant</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-for="p in personas" :key="p.id" :value="p.id" @click="selectedPersona = p" :active="selectedPersona?.id === p.id" active-color="#D4AF37" class="mb-1 rounded mx-2" variant="text">
                                <template v-slot:prepend><v-icon icon="mdi-account-tie" size="small" class="mr-2 text-gold-luxury"></v-icon></template>
                                <v-list-item-title class="font-mono text-caption">{{ p.name }}</v-list-item-title>
                            </v-list-item>
                        </template>
                    </v-list>
                </v-menu>
            </div>

            <div class="d-flex align-center flex-grow-1 justify-center ml-2" v-else-if="isCouncilMode">
                 <v-menu location="bottom" transition="slide-y-transition" offset="8">
                    <template v-slot:activator="{ props }">
                        <div v-bind="props" class="model-selector-btn d-flex align-center px-3 py-2 rounded-lg cursor-pointer transition-all border-amber-thin">
                            <v-icon icon="mdi-scale-balance" color="#D4AF37" size="small" class="mr-2"></v-icon>
                            <span class="text-grey-lighten-1 font-weight-bold mr-2 text-body-2 text-truncate" style="max-width: 200px;">
                                {{ getSelectedJudgeName() }}
                            </span>
                            <v-chip size="x-small" color="#D4AF37" variant="outlined" class="mr-2 text-caption">PRESIDING JUDGE</v-chip>
                            <v-icon icon="mdi-chevron-down" color="grey-darken-1" size="small"></v-icon>
                        </div>
                    </template>
                    <v-list bg-color="#1e1f20" density="compact" class="border-thin rounded-lg nav-menu-list mt-2" width="300">
                        <v-list-subheader class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-1">Select Presiding Judge</v-list-subheader>
                        <v-divider class="mb-2 border-opacity-10"></v-divider>
                         <div v-if="aiCenterStore.isLoadingStatus" class="pa-4 text-center"><v-progress-circular indeterminate size="20" width="2" color="#D4AF37"></v-progress-circular></div>
                        <template v-else>
                            <v-list-item v-for="provider in aiProviders" :key="provider.id" :value="provider.id" @click="selectedJudgeId = provider.id" :active="selectedJudgeId === provider.id" active-color="#D4AF37" class="mb-1 rounded mx-2" variant="text">
                                <template v-slot:prepend><v-icon :icon="getProviderIcon(provider.type)" size="small" :color="provider.status === 'ready' ? 'green-accent-3' : 'grey'" class="mr-2"></v-icon></template>
                                <v-list-item-title class="font-mono text-caption font-weight-medium">{{ provider.name }}</v-list-item-title>
                                <template v-slot:append><v-icon v-if="selectedJudgeId === provider.id" icon="mdi-gavel" color="#D4AF37" size="small"></v-icon></template>
                            </v-list-item>
                        </template>
                    </v-list>
                </v-menu>
            </div>

            <div class="d-flex align-center flex-grow-1 justify-center ml-2" v-else>
                 <v-menu location="bottom" transition="slide-y-transition" offset="8">
                    <template v-slot:activator="{ props }">
                        <div v-bind="props" class="model-selector-btn d-flex align-center px-3 py-2 rounded-lg cursor-pointer transition-all border-amber-thin">
                            <v-icon icon="mdi-shimmer" color="#D4AF37" size="small" class="mr-2"></v-icon>
                            <span class="text-grey-lighten-1 font-weight-bold mr-2 text-body-2 text-truncate" style="max-width: 200px;">{{ getSelectedModelName() }}</span>
                            <v-icon icon="mdi-chevron-down" color="grey-darken-1" size="small"></v-icon>
                        </div>
                    </template>
                    <v-list bg-color="#1e1f20" density="compact" class="border-thin rounded-lg nav-menu-list mt-2" width="300">
                        <v-list-subheader class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-1">Select Active Node</v-list-subheader>
                        <v-divider class="mb-2 border-opacity-10"></v-divider>
                        <div v-if="aiCenterStore.isLoadingStatus" class="pa-4 text-center"><v-progress-circular indeterminate size="20" width="2" color="#D4AF37"></v-progress-circular></div>
                        <template v-else>
                            <v-list-item v-for="provider in aiProviders" :key="provider.id" :value="provider.id" @click="selectedEndpointId = provider.id" :active="selectedEndpointId === provider.id" active-color="#D4AF37" class="mb-1 rounded mx-2" variant="text">
                                <template v-slot:prepend><v-icon :icon="getProviderIcon(provider.type)" size="small" :color="provider.status === 'ready' ? 'green-accent-3' : 'grey'" class="mr-2"></v-icon></template>
                                <v-list-item-title class="font-mono text-caption font-weight-medium">{{ provider.name }}</v-list-item-title>
                                <template v-slot:append><v-icon v-if="selectedEndpointId === provider.id" icon="mdi-check" color="#D4AF37" size="small"></v-icon></template>
                            </v-list-item>
                        </template>
                        <v-divider class="my-2 border-opacity-10"></v-divider>
                        <v-list-item @click="aiCenterStore.fetchAiStatus()" class="mx-2 rounded text-center"><v-list-item-title class="text-caption text-gold-luxury">Refresh List</v-list-item-title></v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </div>

        <div class="d-flex align-center">
             <v-btn v-if="isAgentMode" icon variant="text" color="grey" @click="agentDrawer = !agentDrawer">
                <v-icon icon="mdi-view-sidebar-outline"></v-icon>
             </v-btn>
             <v-btn v-if="isCouncilMode" icon variant="text" color="grey" @click="councilDrawer = !councilDrawer">
                <v-icon icon="mdi-account-group"></v-icon>
             </v-btn>

             <div v-if="!isAgentMode && !isCouncilMode" style="width: 48px;"></div>
        </div>
    </div>

    <div class="main-content d-flex flex-column flex-grow-1" style="overflow: hidden; position: relative;">

        <div class="chat-scroll-area flex-grow-1 pa-4 d-flex flex-column align-center" ref="scrollContainer" style="overflow-y: auto; height: 100%;">
            <div class="w-100" style="max-width: 800px; padding-bottom: 120px;">

                <div v-if="currentMessages.length === 0" class="empty-state text-center mt-16 fade-in px-4">
                    <div class="gemini-logo-glow mb-6 mx-auto">
                        <v-icon icon="mdi-creation" size="56" color="transparent" :class="getGradientIconClass()"></v-icon>
                    </div>
                    <h1 class="text-h4 font-weight-medium text-gold-gradient mb-2 font-secondary">
                        {{ getWelcomeTitle() }}
                    </h1>
                    <p class="text-h6 text-grey-darken-1 font-weight-light mb-10">
                        {{ getWelcomeSubtitle() }}
                    </p>
                    <div class="d-flex flex-wrap justify-center gap-3">
                        <v-card v-for="sug in getSuggestions()" :key="sug" class="suggestion-card pa-4 rounded-xl" variant="outlined" @click="promptInput = sug">
                            <div class="text-body-2 text-grey-lighten-2">{{ sug }}</div>
                        </v-card>
                    </div>
                </div>

                <div v-else class="pt-4">
                      <div v-for="(msg, index) in currentMessages" :key="index" class="mb-6 fade-in-up group">

                        <div v-if="msg.role === 'user'" class="d-flex align-start justify-end">
                             <div v-if="editingIndex === index" class="w-100 d-flex justify-end" style="max-width: 85%;">
                                <v-card color="#2a2b2d" class="w-100 rounded-xl pa-2">
                                    <v-textarea v-model="editContent" variant="plain" bg-color="transparent" auto-grow rows="1" class="px-2 text-body-1" hide-details></v-textarea>
                                    <div class="d-flex justify-end mt-2 px-2 pb-1 gap-2">
                                        <v-btn size="small" variant="text" color="grey" @click="cancelEdit">Cancel</v-btn>
                                        <v-btn size="small" color="#D4AF37" variant="tonal" @click="saveEdit(index)">Update</v-btn>
                                    </div>
                                </v-card>
                             </div>
                             <div v-else class="d-flex flex-column align-end" style="max-width: 85%;">
                                <div class="bg-user-bubble px-5 py-3 rounded-xl rounded-tr-sm text-body-1 text-white font-secondary shadow-sm">{{ msg.content }}</div>
                                <div class="d-flex mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <v-btn size="x-small" variant="text" icon="mdi-pencil" color="grey" @click="startEdit(index, msg.content)" class="mr-1"></v-btn>
                                    <v-btn size="x-small" variant="text" icon="mdi-content-copy" color="grey" @click="copyToClipboard(msg.content)" class="mr-1"></v-btn>
                                    <v-btn size="x-small" variant="text" icon="mdi-delete" color="grey-darken-1" @click="deleteMessage(index)"></v-btn>
                                </div>
                             </div>
                        </div>

                        <div v-else class="d-flex align-start">
                            <div class="ai-avatar mr-4 mt-1">
                                <div v-if="msg.isStreaming && !msg.content" class="thinking-pulse">
                                    <v-icon icon="mdi-brain" size="22" :color="getThemeColor()"></v-icon>
                                </div>
                                <v-icon v-else icon="mdi-shimmer" size="22" :color="msg.error ? 'red-accent-2' : getThemeColor()"></v-icon>
                            </div>

                            <div class="flex-grow-1" style="max-width: 95%;">
                                <div v-if="msg.error" class="text-red-accent-2 bg-red-dim pa-4 rounded-lg border-red-thin">
                                    <div class="font-weight-bold mb-1 d-flex align-center">
                                        <v-icon start icon="mdi-alert-circle" size="small" class="mr-2"></v-icon> Error
                                    </div>
                                    {{ msg.content }}
                                </div>

                                <div v-else-if="msg.isStreaming && !msg.content" class="thinking-container pa-3 rounded-lg border-thin-dashed">
                                    <div class="d-flex align-center text-caption font-mono mb-1" :class="`text-${getThemeColor(true)}`">
                                        <v-progress-circular indeterminate size="16" width="2" :color="getThemeColor(true)" class="mr-2"></v-progress-circular>
                                        <span>{{ getStatusMessage() }}</span>
                                    </div>
                                    <div class="text-grey-darken-1 text-caption font-italic">{{ msg.status || 'Connecting to Neural Engine...' }}</div>
                                </div>

                                <div v-else class="markdown-body text-grey-lighten-3">
                                    <pre class="response-text">{{ msg.content }}</pre>
                                </div>

                                <div v-if="!msg.isStreaming" class="d-flex mt-2 opacity-60 hover-opacity-100">
                                    <template v-if="msg.mediaType === 'image' || msg.mediaType === 'audio' || msg.mediaType === 'video'">
                                        <v-btn size="x-small" variant="text" icon="mdi-download" color="grey" class="mr-2" @click="downloadMedia(msg.mediaUrl, msg.mediaType)"></v-btn>
                                    </template>
                                    <template v-else>
                                        <v-btn size="x-small" variant="text" icon="mdi-content-copy" color="grey" class="mr-2" @click="copyToClipboard(msg.content)"></v-btn>
                                    </template>

                                    <v-btn v-if="!msg.error" size="x-small" variant="text"
                                        :icon="msg.liked ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                                        :color="msg.liked ? 'amber-accent-3' : 'grey'"
                                        class="mr-2"
                                        @click="toggleLike(index)">
                                    </v-btn>

                                    <v-btn size="x-small" variant="text" icon="mdi-delete-outline" color="grey" @click="deleteMessage(index)"></v-btn>
                                </div>
                            </div>
                        </div>

                      </div>
                </div>
            </div>
        </div>

        <div class="input-footer py-6 px-4 d-flex justify-center bg-gradient-footer flex-grow-0 flex-shrink-0">
            <div class="input-wrapper w-100 position-relative" style="max-width: 760px;">
                <v-textarea v-model="promptInput" :placeholder="getInputPlaceholder()" variant="solo" bg-color="#1e1f20" class="gemini-input font-body-1" hide-details auto-grow rows="1" max-rows="8" rounded="xl" @keydown.enter.prevent="handleSend">
                    <template v-slot:append-inner>
                        <v-btn :disabled="!promptInput || aiCenterStore.isGenerating" icon="mdi-send" variant="flat" :color="promptInput ? getSendBtnColor() : 'grey-darken-3'" class="ml-2 send-btn" size="small" @click="handleSend" :loading="aiCenterStore.isGenerating">
                            <v-icon :color="promptInput ? 'black' : 'grey'" icon="mdi-arrow-up"></v-icon>
                        </v-btn>
                    </template>
                </v-textarea>
                <div class="text-center text-caption text-grey-darken-2 mt-2 font-weight-medium">Flowork can make mistakes. Check important info.</div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive, computed } from 'vue';
import { useAiCenterStore } from '@/store/aiCenter';
import { useUiStore } from '@/store/ui';
import { usePromptStore } from '@/store/prompts';
import { useComponentStore } from '@/store/components';
import { storeToRefs } from 'pinia';
import { getAuthHeaders, getComponentIconUrl } from '@/api';
import api from '@/api';

const aiCenterStore = useAiCenterStore();
const uiStore = useUiStore();
const promptsStore = usePromptStore();
const componentStore = useComponentStore();

const { aiProviders, sessions, currentSessionId, currentMessages } = storeToRefs(aiCenterStore);
const { prompts } = storeToRefs(promptsStore);
const { favoriteComponents, isLoading: isStoreLoading } = storeToRefs(componentStore);

const drawer = ref(true);
const promptInput = ref('');
const selectedEndpointId = ref(null);
const scrollContainer = ref(null);
const editingIndex = ref(-1);
const editContent = ref('');

const isAgentMode = ref(false);
const isCouncilMode = ref(false);
const agentDrawer = ref(true);
const councilDrawer = ref(true);

const agentLogs = ref([]);
const councilLogs = ref([]);

const selectedJudgeId = ref(null);
const selectedCouncilMembers = ref([]);

const filteredTools = computed(() => {
    let items = componentStore.tools.items.map(t => ({...t, category: 'tool'}));
    if (toolSearch.value) {
        const q = toolSearch.value.toLowerCase();
        items = items.filter(t =>
            (t.name && t.name.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.manifest?.name && t.manifest.name.toLowerCase().includes(q))
        );
    }
    return items.sort((a, b) => {
        const isFavA = favoriteComponents.value.includes(a.id);
        const isFavB = favoriteComponents.value.includes(b.id);
        if (a.is_installed && !b.is_installed) return -1;
        if (!a.is_installed && b.is_installed) return 1;
        if (isFavA && !isFavB) return -1;
        if (!isFavA && isFavB) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });
});

const toolSearch = ref('');
const activeTools = computed(() => filteredTools.value.filter(t => t.is_installed).map(t => t.id));

const agentSuggestions = ref([
    "Research the latest AI trends and summarize",
    "Check my unread emails and draft replies",
    "Scrape competitor prices from these URLs",
    "Analyze this CSV file and generate a chart"
]);

const councilSuggestions = ref([
    "Debate: Rust vs C++ for System Programming",
    "Analyze this architecture: Microservices vs Monolith",
    "Solve this complex SQL deadlock scenario",
    "Reach consensus on optimal Kafka configuration"
]);

const personas = ref([]);
const selectedPersona = ref(null);
const isLoadingPersonas = ref(false);

const presets = ref([]);
const selectedPreset = ref(null);
const isLoadingPresets = ref(false);

const secureImages = reactive(new Map());
const imageStates = reactive({});
const secureAudio = reactive(new Map());
const audioStates = reactive({});

const suggestions = ref(["Explain Quantum Computing", "Generate Cyberpunk City Image", "Write a Python script for CSV", "Debug this SQL query"]);

watch(currentMessages, (newMessages) => {
    if (aiCenterStore.isGenerating || editingIndex.value === -1) scrollToBottom();

    newMessages.forEach(msg => {
        if (msg.mediaType === 'image' && msg.mediaUrl) {
            if (!secureImages.has(msg.mediaUrl) && imageStates[msg.mediaUrl] !== 'loading' && imageStates[msg.mediaUrl] !== 'error') {
                loadSecureImage(msg);
            }
        }
        if (msg.mediaType === 'audio' && msg.mediaUrl) {
            if (!secureAudio.has(msg.mediaUrl) && audioStates[msg.mediaUrl] !== 'loading' && audioStates[msg.mediaUrl] !== 'error') {
                loadSecureAudio(msg);
            }
        }
    });
}, { deep: true });

watch(aiProviders, (newVal) => {
    if (newVal && newVal.length > 0) {
        if (!selectedEndpointId.value) selectedEndpointId.value = newVal[0].id;
        if (!selectedJudgeId.value) selectedJudgeId.value = newVal[0].id;
    }
});

watch(prompts, (newPrompts) => {
    if (newPrompts) {
        personas.value = newPrompts.map(p => ({ id: p.id, name: p.name, content: p.content }));
    }
}, { deep: true, immediate: true });

function setMode(mode) {
    if (mode === 'chat') {
        isAgentMode.value = false;
        isCouncilMode.value = false;
    } else if (mode === 'agent') {
        isAgentMode.value = true;
        isCouncilMode.value = false;
        toggleAgentMode();
    } else if (mode === 'council') {
        isAgentMode.value = false;
        isCouncilMode.value = true;
        toggleCouncilMode();
    }
}

function toggleAgentMode() {
    agentDrawer.value = true;
    fetchPersonas();
    fetchPresets();
    componentStore.fetchAllComponents();
    componentStore.fetchUserFavorites();
    uiStore.showNotification({ text: 'Agent Mode Activated.', color: 'black bg-gold' });
}

function toggleCouncilMode() {
    councilDrawer.value = true;
    if (selectedCouncilMembers.value.length === 0 && aiProviders.value.length > 0) {
        selectedCouncilMembers.value = aiProviders.value.slice(0, 3).map(p => p.id);
    }
    uiStore.showNotification({ text: 'Neural Council Convened.', color: 'black bg-gold' });
}

async function fetchPersonas() {
    if (personas.value.length > 0) return;
    isLoadingPersonas.value = true;
    try {
        await promptsStore.fetchPrompts();
    } catch (e) {
        console.error("Failed to fetch personas", e);
    } finally {
        isLoadingPersonas.value = false;
    }
}

async function fetchPresets() {
    if (presets.value.length > 0) return;
    isLoadingPresets.value = true;
    try {
        const response = await api.get('/presets');
        presets.value = response.data || [];
    } catch (e) {
        console.error("Failed to fetch presets", e);
        presets.value = [{ id: 'p1', name: 'Email Automation Flow' }, { id: 'p2', name: 'Data Scraper Pipeline' }];
    } finally {
        isLoadingPresets.value = false;
    }
}

function getHeaderTitleColor() {
    return 'text-gold-luxury';
}

function getHeaderChipColor() {
    return '#D4AF37';
}

function getGradientIconClass() {
    return 'gradient-icon-gold';
}

function getWelcomeTitle() {
    if (isCouncilMode.value) return `All Rise for Judge ${getSelectedJudgeName()}.`;
    if (isAgentMode.value) return selectedPersona.value ? `Hello, I am ${selectedPersona.value.name}.` : 'Agent Command Center';
    return 'Hello, Architect.';
}

function getWelcomeSubtitle() {
    if (isCouncilMode.value) return 'Convene the Neural Council for complex problem solving.';
    if (isAgentMode.value) return 'Assign tasks to your digital workers.';
    return 'What would you like to build or simulate today?';
}

function getSuggestions() {
    if (isCouncilMode.value) return councilSuggestions.value;
    if (isAgentMode.value) return agentSuggestions.value;
    return suggestions.value;
}

function getThemeColor(darker = false) {
    // Unified Gold Theme - More metallic/subtle
    return darker ? '#D4AF37' : '#E5C550';
}

function getSendBtnColor() {
    return '#D4AF37';
}

function getStatusMessage() {
    if (isCouncilMode.value) return 'COUNCIL DELIBERATING...';
    if (isAgentMode.value) return 'EXECUTING WORKFLOW...';
    return 'REASONING...';
}

function getInputPlaceholder() {
    if (isCouncilMode.value) return 'Present your case to the Council...';
    if (isAgentMode.value) return 'Instruct your agent (e.g. Check my emails...)';
    return 'Enter a prompt here...';
}

function handleInstall(tool) { componentStore.installComponent('tools', tool.id); }
function handleUninstall(tool) { componentStore.uninstallComponent('tools', tool.id); }
function shareTool(tool) { uiStore.showNotification({ text: `Shared '${tool.name}' to Marketplace (Simulated)`, color: 'cyan' }); }
function toggleFavorite(toolId) { componentStore.toggleFavorite(toolId); }
function isFavorite(toolId) { return favoriteComponents.value.includes(toolId); }
function getToolIconUrl(tool) {
    if (tool.manifest && tool.manifest.icon) return tool.manifest.icon;
    return getComponentIconUrl('tools', tool.id);
}

function clearLogs() {
    if (isCouncilMode.value) councilLogs.value = [];
    else agentLogs.value = [];
    uiStore.showNotification({ text: 'Logs cleared.', color: 'info' });
}

function copyLogs() {
    const logs = isCouncilMode.value ? councilLogs.value : agentLogs.value;
    const text = logs.map(l => isCouncilMode.value ? `[${l.speaker}] ${l.message}` : `[${l.time}] ${l.message}`).join('\n');
    copyToClipboard(text);
}

function getLogColor(type) {
    if (type === 'info') return 'text-grey';
    if (type === 'success') return 'text-gold-luxury';
    if (type === 'error') return 'text-red-accent-2';
    return 'text-grey';
}

function addLog(message, type='info') {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    agentLogs.value.push({ time, message, type });
    nextTick(() => {
        const logContainer = document.querySelector('.log-container');
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    });
}

function addCouncilLog(speaker, message) {
    councilLogs.value.push({ speaker, message });
     nextTick(() => {
        const logContainer = document.querySelector('.council-log-container');
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    });
}

function scrollToBottom() {
    nextTick(() => {
        if (scrollContainer.value) {
            scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
        }
    });
}

async function loadSecureImage(msg, force = false) {
    if (!msg.mediaUrl) return;
    if (force) { imageStates[msg.mediaUrl] = 'loading'; }
    else if (imageStates[msg.mediaUrl] === 'loaded' || imageStates[msg.mediaUrl] === 'loading') { return; }
    imageStates[msg.mediaUrl] = 'loading';
    try {
        const headers = await getAuthHeaders(msg.mediaUrl, 'GET');
        const urlObj = new URL(msg.mediaUrl);
        const engineId = urlObj.searchParams.get('engine_id');
        if (engineId) headers['X-Flowork-Engine-ID'] = engineId;
        const response = await fetch(msg.mediaUrl, { method: 'GET', headers: headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        secureImages.set(msg.mediaUrl, URL.createObjectURL(blob));
        imageStates[msg.mediaUrl] = 'loaded';
    } catch (e) {
        console.error("[Flowork Image] Critical Error:", e);
        imageStates[msg.mediaUrl] = 'error';
        secureImages.delete(msg.mediaUrl);
    }
}

async function loadSecureAudio(msg, force = false) {
    if (!msg.mediaUrl) return;
    if (force) { audioStates[msg.mediaUrl] = 'loading'; }
    else if (audioStates[msg.mediaUrl] === 'loaded' || audioStates[msg.mediaUrl] === 'loading') { return; }
    audioStates[msg.mediaUrl] = 'loading';
    try {
        const headers = await getAuthHeaders(msg.mediaUrl, 'GET');
        const urlObj = new URL(msg.mediaUrl);
        const engineId = urlObj.searchParams.get('engine_id');
        if (engineId) headers['X-Flowork-Engine-ID'] = engineId;
        const response = await fetch(msg.mediaUrl, { method: 'GET', headers: headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const wavBlob = new Blob([blob], { type: 'audio/wav' });
        secureAudio.set(msg.mediaUrl, URL.createObjectURL(wavBlob));
        audioStates[msg.mediaUrl] = 'loaded';
    } catch (e) {
        console.error("[Flowork Audio] Load Error:", e);
        audioStates[msg.mediaUrl] = 'error';
        secureAudio.delete(msg.mediaUrl);
    }
}

async function downloadMedia(url, type) {
    if (!url) return;
    uiStore.showNotification({ text: 'Preparing download...', color: 'info' });
    try {
        let objectUrl = secureImages.get(url) || secureAudio.get(url);
        if (!objectUrl) {
            const headers = await getAuthHeaders(url, 'GET');
            const urlObj = new URL(url);
            const engineId = urlObj.searchParams.get('engine_id');
            if (engineId) headers['X-Flowork-Engine-ID'] = engineId;
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            objectUrl = URL.createObjectURL(blob);
        }
        let ext = type === 'image' ? 'png' : type === 'audio' ? 'wav' : 'mp4';
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `flowork_${type}_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error("Download Error:", e);
        uiStore.showNotification({ text: 'Download Failed. Check console.', color: 'error' });
    }
}

function toggleLike(index) { aiCenterStore.toggleLike(currentSessionId.value, index); }

function getSelectedModelName() {
    if (!selectedEndpointId.value) return 'Select Model';
    const model = aiProviders.value.find(p => p.id === selectedEndpointId.value);
    return model ? model.name : 'Unknown Model';
}

function getSelectedJudgeName() {
    if (!selectedJudgeId.value) return 'Select Judge';
    const model = aiProviders.value.find(p => p.id === selectedJudgeId.value);
    return model ? model.name : 'Unknown Judge';
}

function getProviderIcon(type) {
    if (type === 'local') return 'mdi-server-network';
    if (type === 'provider') return 'mdi-cloud-outline';
    return 'mdi-brain';
}

function handleSend(e) {
    if (e && e.shiftKey) return;

    if (isCouncilMode.value) {
        if (promptInput.value) {
            if (!selectedJudgeId.value) {
                 uiStore.showNotification({ text: 'Please select a Presiding Judge!', color: 'warning' });
                 return;
            }
             if (selectedCouncilMembers.value.length < 2) {
                 uiStore.showNotification({ text: 'A Council needs at least 2 members + Judge!', color: 'warning' });
                 return;
            }

            addCouncilLog('USER', promptInput.value);
            addCouncilLog('SYSTEM', 'Convening Neural Council...');

            const councilPayload = {
                is_council: true,
                judge_id: selectedJudgeId.value,
                members: selectedCouncilMembers.value,
                topic: promptInput.value
            };

            aiCenterStore.sendMessage(promptInput.value, selectedJudgeId.value, councilPayload);
            promptInput.value = '';
            scrollToBottom();
        }
        return;
    }

    if (isAgentMode.value) {
        if (promptInput.value) {
            addLog(`Received instruction: "${promptInput.value.substring(0, 20)}..."`, 'info');
            if (selectedPersona.value) addLog(`Injecting Persona: ${selectedPersona.value.name}`, 'success');
            if (selectedPreset.value) addLog(`Using Workflow Preset: ${selectedPreset.value.name}`, 'success');
            addLog(`Dispatching to Agent Executor...`, 'info');

            const agentPayload = {
                is_agent: true,
                tools: activeTools.value,
                system_prompt: selectedPersona.value ? selectedPersona.value.content : null,
                preset_id: selectedPreset.value ? selectedPreset.value.id : null
            };

            aiCenterStore.sendMessage(promptInput.value, selectedEndpointId.value, agentPayload);
            promptInput.value = '';
            scrollToBottom();
        }
        return;
    }

    if (promptInput.value && selectedEndpointId.value) {
        aiCenterStore.sendMessage(promptInput.value, selectedEndpointId.value);
        promptInput.value = '';
        scrollToBottom();
    } else if (!selectedEndpointId.value) {
        if(aiProviders.value.length > 0) {
            selectedEndpointId.value = aiProviders.value[0].id;
             aiCenterStore.sendMessage(promptInput.value, selectedEndpointId.value);
             promptInput.value = '';
             scrollToBottom();
        } else {
             uiStore.showNotification({ text: 'Please select an Active Node first!', color: 'warning' });
        }
    }
}

function startEdit(index, content) { editingIndex.value = index; editContent.value = content; }
function cancelEdit() { editingIndex.value = -1; editContent.value = ''; }
function saveEdit(index) {
    if (!editContent.value.trim()) return;
    aiCenterStore.editMessage(currentSessionId.value, index, editContent.value);
    editingIndex.value = -1;
}
function deleteMessage(index) {
    aiCenterStore.deleteMessage(currentSessionId.value, index);
}
function handleNewChat() { aiCenterStore.createNewSession(); promptInput.value = ''; }
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    uiStore.showNotification({ text: 'Copied!', color: 'success' });
}

onMounted(async () => {
    await aiCenterStore.fetchAiStatus();
    aiCenterStore.loadHistory();
    if (aiProviders.value.length > 0 && !selectedEndpointId.value) selectedEndpointId.value = aiProviders.value[0].id;
    if (!currentSessionId.value && sessions.value.length > 0) aiCenterStore.switchSession(sessions.value[0].id);

    if (currentMessages.value) {
        currentMessages.value.forEach(msg => {
            if (msg.mediaType === 'image') loadSecureImage(msg);
            if (msg.mediaType === 'audio') loadSecureAudio(msg);
        });
    }
});
</script>

<style scoped>
.gemini-layout { background-color: #000; color: #e3e3e3; height: 100vh; overflow: hidden; }
.orbitron-font { font-family: 'Orbitron', sans-serif; letter-spacing: 1px; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
.font-secondary { font-family: 'Google Sans', 'Inter', sans-serif; }
.bg-glass-header { background-color: #050505; border-bottom: 1px solid rgba(212, 175, 55, 0.05); }
.new-chat-btn:hover { background-color: #333435 !important; color: white !important; border: 1px solid #D4AF37; }
.history-item:hover { background-color: #2d2e30; }
.active-session-item {
    background-color: transparent !important;
    border-left: 2px solid #D4AF37; /* Elegant left border */
}
.model-selector-btn { transition: all 0.2s ease; }
.model-selector-btn:hover { background-color: #1e1f20; }

.main-content { min-height: 0; height: 100%; }
.chat-scroll-area { overflow-y: auto; scroll-behavior: smooth; flex: 1 1 auto; height: 100%; }
.chat-scroll-area::-webkit-scrollbar { width: 8px; }
.chat-scroll-area::-webkit-scrollbar-track { background: transparent; }
.chat-scroll-area::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

.empty-state { max-width: 600px; margin: 0 auto; }
.gradient-icon-gold { background: linear-gradient(45deg, #D4AF37 0%, #F0E68C 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gold-gradient { background: linear-gradient(90deg, #D4AF37, #E5C550); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gold-luxury { color: #D4AF37 !important; }
.text-gold-dim { color: rgba(212, 175, 55, 0.6) !important; }

.suggestion-card { background-color: #151515; border-color: rgba(212, 175, 55, 0.1); cursor: pointer; transition: background 0.2s; width: 180px; height: 100px; display: flex; align-items: start; }
.suggestion-card:hover { background-color: #2a2b2d; border-color: #D4AF37; }
.bg-user-bubble { background-color: #151515; border: 1px solid rgba(212, 175, 55, 0.08); }
.response-text { white-space: pre-wrap; word-break: break-word; font-family: 'Roboto', sans-serif; font-size: 1rem; line-height: 1.6; }
.markdown-body pre { background: #1e1f20; padding: 12px; border-radius: 8px; overflow-x: auto; margin-top: 10px; border: 1px solid rgba(255, 255, 255, 0.1); }
.bg-gradient-footer { background: linear-gradient(to top, #000 80%, rgba(0,0,0,0) 100%); }
.gemini-input :deep(.v-field) { border-radius: 28px !important; background-color: #1e1f20 !important; box-shadow: 0 0 10px rgba(0,0,0,0.5) !important; border: 1px solid rgba(212, 175, 55, 0.1); }
.gemini-input :deep(.v-field--focused) { border-color: #D4AF37 !important; box-shadow: 0 0 15px rgba(212, 175, 55, 0.1) !important; }
.gemini-input :deep(textarea) { color: #e3e3e3 !important; padding-top: 14px; }
.send-btn { transition: transform 0.2s; }
.send-btn:hover { transform: scale(1.1); }
.fade-in { animation: fadeIn 0.5s ease-out; }
.fade-in-up { animation: fadeInUp 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.hover-opacity:hover { opacity: 0.8; }
.bg-red-dim { background: rgba(255,82,82,0.1); }
.border-red-thin { border: 1px solid rgba(255,82,82,0.3); }
.group:hover .group-hover\:opacity-100 { opacity: 1 !important; }
.transition-opacity { transition: opacity 0.2s ease-in-out; }
.thinking-container { background: rgba(212, 175, 55, 0.01); border: 1px dashed rgba(212, 175, 55, 0.15); }
.thinking-pulse { animation: brainPulse 2s infinite ease-in-out; }
@keyframes brainPulse {
    0% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 0px rgba(212, 175, 55, 0)); }
    50% { transform: scale(1.1); opacity: 1; filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3)); }
    100% { transform: scale(1); opacity: 0.7; filter: drop-shadow(0 0 0px rgba(212, 175, 55, 0)); }
}
.border-thin-dashed { border-style: dashed !important; border-width: 1px !important; }
.bg-gold-dim { background: rgba(212, 175, 55, 0.03); }
.border-gold-thin { border: 1px solid rgba(212, 175, 55, 0.1); }
.border-gold-subtle { border: 1px solid rgba(212, 175, 55, 0.08); }
.border-amber-thin { border: 1px solid rgba(212, 175, 55, 0.15); }
.tool-item { transition: background-color 0.2s; }
.tool-item:hover { background-color: #252525 !important; }
.pulsing-dot { animation: pulseGreen 2s infinite; }
@keyframes pulseGreen { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.agent-select :deep(.v-field) { border-radius: 8px; border-color: rgba(212, 175, 55, 0.1); }
.cursor-pointer { cursor: pointer; }
.council-item:hover { background-color: #252525 !important; }
</style>