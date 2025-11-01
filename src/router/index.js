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

const routes = [
    { path: '/', name: 'Lander', component: LanderView, meta: { requiresAuth: false, title: 'Flowork | Free AI Workflow Automation: Open Source Platform (with Training)', description: 'Build, train, and command AI agents with a visual, self-hosted workflow automation platform. The powerful, secure alternative to Zapier and Make.com.' } }, // English Hardcode
    { path: '/login', name: 'Login', component: LoginView, meta: { requiresAuth: false, title: 'Login - Flowork', description: 'Access your Flowork command center to manage your workflows and private engines.' } }, // English Hardcode
    { path: '/register', name: 'Register', component: RegisterView, meta: { requiresAuth: false, title: 'Sign Up for Free - Flowork', description: 'Create your free Flowork account and start building powerful AI-driven automations today.' } }, // English Hardcode
    { path: '/dmca', name: 'DMCA', component: DMCA, meta: { requiresAuth: false, title: 'DMCA Policy - Flowork' } }, // English Hardcode
    { path: '/privacy-policy', name: 'PrivacyPolicy', component: PrivacyPolicy, meta: { requiresAuth: false, title: 'Privacy Policy - Flowork' } }, // English Hardcode
    { path: '/terms-of-service', name: 'TermsOfService', component: TermsOfService, meta: { requiresAuth: false, title: 'Terms of Service - Flowork' } }, // English Hardcode
    { path: '/contact-us', name: 'ContactUs', component: ContactUs, meta: { requiresAuth: false, title: 'Contact Us - Flowork' } }, // English Hardcode
    { path: '/shared/:token', name: 'SharedWorkflow', component: Designer, meta: { requiresAuth: false, title: 'Shared Workflow - Flowork' } }, // English Hardcode

    {
      path: '/p-:slug-:lang(en|id).html', // English Hardcode
      name: 'ArticleView', // English Hardcode
      component: ArticleView,
      meta: { requiresAuth: false, title: 'Flowork Article' } // English Hardcode
    },

    {
      path: '/author/:public_address', // English Hardcode
      name: 'AuthorView', // English Hardcode
      component: ArticleListView,
      props: true,
      meta: { requiresAuth: false, title: 'Articles by Author - Flowork' } // English Hardcode
    },
    {
      path: '/category/:category_slug', // English Hardcode
      name: 'CategoryView', // English Hardcode
      component: ArticleListView,
      props: true,
      meta: { requiresAuth: false, title: 'Articles by Category - Flowork' } // English Hardcode
    },
    {
      path: '/tag/:tag_slug', // English Hardcode
      name: 'TagView', // English Hardcode
      component: ArticleListView,
      props: true,
      meta: { requiresAuth: false, title: 'Articles by Tag - Flowork' } // English Hardcode
    },
    {
      path: '/en/', // English Hardcode
      name: 'ArticleListEnglish', // English Hardcode
      component: ArticleListView,
      props: { language: 'en' }, // English Hardcode
      meta: { requiresAuth: false, title: 'Articles - Flowork' } // English Hardcode
    },
    {
      path: '/id/', // English Hardcode
      name: 'ArticleListIndonesian', // English Hardcode
      component: ArticleListView,
      props: { language: 'id' }, // English Hardcode
      meta: { requiresAuth: false, title: 'Artikel - Flowork' } // English Hardcode
    },

    { path: '/designer', name: 'Designer', component: Designer, meta: { requiresAuth: true, title: 'Designer - Flowork' } }, // English Hardcode
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true, title: 'Settings - Flowork' } }, // English Hardcode
    { path: '/about-us', name: 'AboutUs', component: AboutUs, meta: { requiresAuth: true, title: 'About Us - Flowork' } }, // English Hardcode
    { path: '/my-engines', name: 'MyEngines', component: MyEngines, meta: { requiresAuth: true, title: 'My Engines - Flowork' } }, // English Hardcode
    { path: '/news', name: 'News', component: News, meta: { requiresAuth: true, title: 'News & Updates - Flowork' } }, // English Hardcode
    { path: '/authorize-engine', name: 'AuthorizeEngine', component: AuthorizeEngine, meta: { requiresAuth: true, title: 'Authorize Engine - Flowork' } }, // English Hardcode
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, title: 'Dashboard - Flowork' } }, // English Hardcode
    { path: '/ai-trainer', name: 'AiTrainer', component: AiTrainer, meta: { requiresAuth: true, title: 'AI Trainer - Flowork' } }, // English Hardcode
    { path: '/ai-architect', name: 'AiArchitect', component: AiArchitect, meta: { requiresAuth: true, title: 'AI Architect - Flowork' } }, // English Hardcode
    { path: '/ai-center', name: 'AiCenter', component: AiCenter, meta: { requiresAuth: true, title: 'AI Center - Flowork' } }, // English Hardcode
    { path: '/core-editor', name: 'CoreEditor', component: CoreEditor, meta: { requiresAuth: true, title: 'Core Editor - Flowork' } }, // English Hardcode
    { path: '/diagnostics', name: 'Diagnostics', component: Diagnostics, meta: { requiresAuth: true, title: 'Diagnostics - Flowork' } }, // English Hardcode
    { path: '/model-factory', name: 'ModelFactory', component: ModelFactory, meta: { requiresAuth: true, title: 'Model Factory - Flowork' } }, // English Hardcode
    { path: '/module-factory', name: 'ModuleFactory', component: ModuleFactory, meta: { requiresAuth: true, title: 'Module Factory - Flowork' } }, // English Hardcode
    { path: '/prompt-manager', name: 'PromptManager', component: PromptManager, meta: { requiresAuth: true, title: 'Prompt Manager - Flowork' } }, // English Hardcode
    { path: '/quick-tools', name: 'QuickTools', component: QuickTools, meta: { requiresAuth: true, title: 'Quick Tools - Flowork' } }, // English Hardcode
    {
      path: '/my-articles', // English Hardcode
      name: 'MyArticles', // English Hardcode
      component: MyArticles,
      meta: { requiresAuth: true, title: 'My Content - Flowork' } // English Hardcode
    },
    {
      path: '/my-articles/new', // English Hardcode
      name: 'ArticleEditorNew', // English Hardcode
      component: ArticleEditor,
      meta: { requiresAuth: true, title: 'New Article - Flowork' } // English Hardcode
    },
    {
      path: '/my-articles/edit/:id', // English Hardcode
      name: 'ArticleEditorEdit', // English Hardcode
      component: ArticleEditor,
      props: true,
      meta: { requiresAuth: true, title: 'Edit Article - Flowork' } // English Hardcode
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
        if (name.startsWith('og:')) { // English Hardcode
            el.setAttribute('property', name); // English Hardcode
        } else {
            el.setAttribute('name', name); // English Hardcode
        }
        el.setAttribute('data-vue-router-controlled', ''); // English Hardcode
        document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
}

function updateLinkTag(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`); // English Hardcode
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel); // English Hardcode
        el.setAttribute('data-vue-router-controlled', ''); // English Hardcode
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

router.beforeEach((to, from, next) => {
    const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);
    const nearestWithMeta = to.matched.slice().reverse().find(r => r.meta && r.meta.description);

    const defaultTitle = 'Flowork | Free AI Workflow Automation: Open Source Platform (with Training)'; // English Hardcode
    const defaultDesc = 'Build, train, and command AI agents with a visual, self-hosted workflow automation platform. The powerful, secure alternative to Zapier and Make.com.'; // English Hardcode
    const title = nearestWithTitle ? nearestWithTitle.meta.title : defaultTitle;
    const description = nearestWithMeta ? nearestWithMeta.meta.description : defaultDesc;
    const fullUrl = `https://flowork.cloud${to.path}`; // English Hardcode

    document.title = title;
    updateMetaTag('description', description); // English Hardcode
    updateMetaTag('og:title', title); // English Hardcode
    updateMetaTag('og:description', description); // English Hardcode
    updateMetaTag('og:url', fullUrl); // English Hardcode
    updateLinkTag('canonical', fullUrl); // English Hardcode

    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        return next({ name: 'Login', query: { redirect: to.fullPath } }); // English Hardcode
    }

    if (isAuthenticated && ['Lander', 'Login', 'Register'].includes(to.name)) { // English Hardcode
        return next({ name: 'Designer' }); // English Hardcode
    }

    next();
});

export default router;