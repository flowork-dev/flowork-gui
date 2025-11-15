//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\router\index.js total lines 205 
//#######################################################################

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const Designer = () => import('@/views/Designer.vue');
const LanderView = () => import('@/views/LanderView.vue');
const LoginView = () => import('@/views/LoginView.vue');
const RegisterView = () => import('@/views/RegisterView.vue');
const Settings = () => import('@/views/Settings.vue');
const AboutUs = () => import('@/views/AboutUs.vue');
const MyEngines = () => import('@/views/MyEngines.vue');
const News = () => import('@/views/News.vue');
const Dashboard = () => import('@/views/Dashboard.vue');
const AiTrainer = () => import('@/views/AiTrainer.vue');
const AiArchitect = () => import('@/views/AiArchitect.vue');
const AiCenter = () => import('@/views/AiCenter.vue');
const CoreEditor = () => import('@/views/CoreEditor.vue');
const Diagnostics = () => import('@/views/Diagnostics.vue');
const ModelFactory = () => import('@/views/ModelFactory.vue');
const ModuleFactory = () => import('@/views/ModuleFactory.vue');
const PromptManager = () => import('@/views/PromptManager.vue');
const DMCA = () => import('@/views/DMCA.vue');
const PrivacyPolicy = () => import('@/views/PrivacyPolicy.vue');
const TermsOfService = () => import('@/views/TermsOfService.vue');
const ContactUs = () => import('@/views/ContactUs.vue');
const AuthorizeEngine = () => import('@/views/AuthorizeEngine.vue');
const MyArticles = () => import('@/views/MyArticles.vue');
const ArticleEditor = () => import('@/views/ArticleEditor.vue');
const ArticleView = () => import('@/views/ArticleView.vue');
const ArticleListView = () => import('@/views/ArticleListView.vue');
const QuickTools = () => import('@/views/QuickTools.vue');
const Marketplace = () => import('@/views/Marketplace.vue');
const MarketplaceItem = () => import('@/views/MarketplaceItem.vue');
const ProfileView = () => import('@/views/ProfileView.vue');

const routes = [
    { path: '/', name: 'Lander', component: LanderView, meta: { requiresAuth: false, title: 'Flowork | Free AI Workflow Automation: Open Source Platform (with Training)', description: 'Build, train, and command AI agents with a visual, self-hosted workflow automation platform. The powerful, secure alternative to Zapier and Make.com.' } },
    { path: '/login', name: 'Login', component: LoginView, meta: { requiresAuth: false, title: 'Login - Flowork', description: 'Access your Flowork command center to manage your workflows and private engines.' } },
    { path: '/register', name: 'Register', component: RegisterView, meta: { requiresAuth: false, title: 'Sign Up for Free - Flowork', description: 'Create your free Flowork account and start building powerful AI-driven automations today.' } },
    { path: '/dmca', name: 'DMCA', component: DMCA, meta: { requiresAuth: false, title: 'DMCA Policy - Flowork' } },
    { path: '/privacy-policy', name: 'PrivacyPolicy', component: PrivacyPolicy, meta: { requiresAuth: false, title: 'Privacy Policy - Flowork' }, alias: '/privacy' },
    { path: '/terms-of-service', name: 'TermsOfService', component: TermsOfService, meta: { requiresAuth: false, title: 'Terms of Service - Flowork' }, alias: '/terms' },
    { path: '/contact-us', name: 'ContactUs', component: ContactUs, meta: { requiresAuth: false, title: 'Contact Us - Flowork' }, alias: '/contact' },
    { path: '/shared/:token', name: 'SharedWorkflow', component: Designer, meta: { requiresAuth: false, title: 'Shared Workflow - Flowork' } },

    {
      path: '/p-:slug-:lang(en|id).html',
      name: 'ArticleView',
      component: ArticleView,
      meta: { requiresAuth: false, title: 'Flowork Article' }
    },
    {
      path: '/profile/:identifier',
      name: 'ProfileView',
      component: ProfileView,
      props: true,
      meta: { requiresAuth: false, title: 'User Profile - Flowork' }
    },
    {
      path: '/category/:category_slug',
      name: 'CategoryView',
      component: ArticleListView,
      props: true,
      meta: { requiresAuth: false, title: 'Articles by Category - Flowork' }
    },
    {
      path: '/tag/:tag_slug',
      name: 'TagView',
      component: ArticleListView,
      props: true,
      meta: { requiresAuth: false, title: 'Articles by Tag - Flowork' }
    },
    {
      path: '/en/',
      name: 'ArticleListEnglish',
      component: ArticleListView,
      props: { language: 'en' },
      meta: { requiresAuth: false, title: 'Articles - Flowork' }
    },
    {
      path: '/id/',
      name: 'ArticleListIndonesian',
      component: ArticleListView,
      props: { language: 'id' },
      meta: { requiresAuth: false, title: 'Artikel - Flowork' }
    },

    { path: '/designer', name: 'Designer', component: Designer, meta: { requiresAuth: true, title: 'Designer - Flowork' } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true, title: 'Settings - Flowork' } },
    { path: '/about-us', name: 'AboutUs', component: AboutUs, meta: { requiresAuth: false, title: 'About Us - Flowork' }, alias: '/about' },
    { path: '/my-engines', name: 'MyEngines', component: MyEngines, meta: { requiresAuth: true, title: 'My Engines - Flowork' } },
    { path: '/news', name: 'News', component: News, meta: { requiresAuth: false, title: 'News & Updates - Flowork' } },
    { path: '/authorize-engine', name: 'AuthorizeEngine', component: AuthorizeEngine, meta: { requiresAuth: true, title: 'Authorize Engine - Flowork' } },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, title: 'Dashboard - Flowork' } },
    { path: '/ai-trainer', name: 'AiTrainer', component: AiTrainer, meta: { requiresAuth: true, title: 'AI Trainer - Flowork' } },
    { path: '/ai-architect', name: 'AiArchitect', component: AiArchitect, meta: { requiresAuth: true, title: 'AI Architect - Flowork' } },
    { path: '/ai-center', name: 'AiCenter', component: AiCenter, meta: { requiresAuth: true, title: 'AI Center - Flowork' } },
    { path: '/core-editor', name: 'CoreEditor', component: CoreEditor, meta: { requiresAuth: true, title: 'Core Editor - Flowork' } },
    { path: '/diagnostics', name: 'Diagnostics', component: Diagnostics, meta: { requiresAuth: true, title: 'Diagnostics - Flowork' } },
    { path: '/model-factory', name: 'ModelFactory', component: ModelFactory, meta: { requiresAuth: true, title: 'Model Factory - Flowork' } },
    { path: '/module-factory', name: 'ModuleFactory', component: ModuleFactory, meta: { requiresAuth: true, title: 'Module Factory - Flowork' } },
    { path: '/prompt-manager', name: 'PromptManager', component: PromptManager, meta: { requiresAuth: true, title: 'Prompt Manager - Flowork' } },
    { path: '/quick-tools', name: 'QuickTools', component: QuickTools, meta: { requiresAuth: true, title: 'Quick Tools - Flowork' } },
    {
      path: '/my-articles',
      name: 'MyArticles',
      component: MyArticles,
      meta: { requiresAuth: true, title: 'My Content - Flowork' }
    },
    {
      path: '/my-articles/new',
      name: 'ArticleEditorNew',
      component: ArticleEditor,
      meta: { requiresAuth: true, title: 'New Article - Flowork' }
    },
    {
      path: '/my-articles/edit/:id',
      name: 'ArticleEditorEdit',
      component: ArticleEditor,
      props: true,
      meta: { requiresAuth: true, title: 'Edit Article - Flowork' }
    },
    {
        path: '/marketplace',
        name: 'Marketplace',
        component: Marketplace,
        meta: { requiresAuth: false, title: 'Marketplace - Flowork' }
    },
    {
        path: '/marketplace/item/:id',
        name: 'MarketplaceItem',
        component: MarketplaceItem,
        props: true,
        meta: { requiresAuth: false, title: 'Marketplace Item - Flowork' }
    }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function updateMetaTag(name, content) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) {
            el.setAttribute('property', name);
        } else {
            el.setAttribute('name', name);
        }
        el.setAttribute('data-vue-router-controlled', '');
        document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
}

function updateLinkTag(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        el.setAttribute('data-vue-router-controlled', '');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

router.beforeEach((to, from, next) => {
    const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);
    const nearestWithMeta = to.matched.slice().reverse().find(r => r.meta && r.meta.description);

    const defaultTitle = 'Flowork | Free AI Workflow Automation: Open Source Platform (with Training)';
    const defaultDesc = 'Build, train, and command AI agents with a visual, self-hosted workflow automation platform. The powerful, secure alternative to Zapier and Make.com.';
    const title = nearestWithTitle ? nearestWithTitle.meta.title : defaultTitle;
    const description = nearestWithMeta ? nearestWithMeta.meta.description : defaultDesc;
    const fullUrl = `https://flowork.cloud${to.path}`;

    document.title = title;
    updateMetaTag('description', description);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', fullUrl);
    updateLinkTag('canonical', fullUrl);

    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        return next({ name: 'Login', query: { redirect: to.fullPath } });
    }

    if (isAuthenticated && ['Lander', 'Login', 'Register'].includes(to.name)) {
        return next({ name: 'Designer' });
    }

    next();
});

export default router;
