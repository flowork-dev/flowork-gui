//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\src\views\LanderView.vue total lines 364 
//#######################################################################

<template>
  <div class="lander-page">
    <DigitalFingerprintBackground />
    <v-main>
      <v-container fluid class="pa-0">

        <section class="hero-section d-flex align-center text-center">
          <v-container class="hero-content-wrapper">
            <h1 class="hero-title orbitron-font animate-glow">Automation is the Starting Line, Not the Finish Line.</h1>
            <div class="interactive-canvas-wrapper my-8">
              <v-lazy
                :min-height="450"
                :options="{'threshold':0.5}"
                transition="fade-transition"
              >
                <LanderCanvas />
              </v-lazy>
            </div>
            <h2 class="hero-subtitle">Your Identity. Your Data. Your Engine.</h2>

            <p class="hero-description mx-auto mt-6">
              Flowork is a fully autonomous platform. Create your secure crypto-identity, design workflows, and run them on your private engine. Your data never leaves your machine.
            </p>
            <div class="mt-8">
              <v-btn to="/register" size="x-large" color="cyan" class="action-btn mx-2">
                Start Building for Free
              </v-btn>
              <v-btn
                href="http://download.flowork.cloud/"
                target="_blank"
                size="x-large"
                color="orange-darken-2"
                class="action-btn mx-2 download-btn-pulse"
                prepend-icon="mdi-download-outline"
              >
                Download Engine
              </v-btn>
            </div>
          </v-container>
        </section>

        <section id="how-it-works" class="how-it-works-section observed-section">
            <v-container>
                <h2 class="section-title orbitron-font">From Idea to Action in 3 Simple Steps</h2>
                <div class="steps-container mt-12">
                    <div class="step-card">
                        <div class="step-icon-wrapper">
                            <v-icon icon="mdi-account-key-outline" class="step-icon"></v-icon>
                            <div class="step-number">1</div>
                        </div>
                        <h3 class="step-title orbitron-font">1. Create Your Identity</h3>
                        <p class="step-description">Instead of a password, you generate a secure <strong>Private Key</strong>. This is your identity, your password, and your master key, all in one. You are the only one who holds it.</p>
                    </div>

                    <div class="step-connector"></div>

                    <div class="step-card">
                        <div class="step-icon-wrapper">
                            <v-icon icon="mdi-download-outline" class="step-icon"></v-icon>
                            <div class="step-number">2</div>
                        </div>
                        <h3 class="step-title orbitron-font">2. Download & Run Engine</h3>
                        <p class="step-description">Download the Flowork Engine installer. Run it on your local PC or private server. There is <strong>no registration step</strong>. The engine is yours and runs immediately.</p>
                    </div>

                    <div class="step-connector"></div>

                    <div class="step-card">
                        <div class="step-icon-wrapper">
                            <v-icon icon="mdi-server-network" class="step-icon"></v-icon>
                            <div class="step-number">3</div>
                        </div>
                        <h3 class="step-title orbitron-font">3. Authenticate & Run</h3>
                        <p class="step-description">When you click "Run", your GUI <strong>cryptographically signs</strong> the command. Your local Engine verifies this signature. No passwords, no tokens. Just pure, secure, decentralized execution.</p>
                        </div>
                </div>
            </v-container>
        </section>

        <section id="features" class="features-section">
          <v-container>
            <h2 class="section-title orbitron-font">Not Just Features. Your New Superpowers.</h2>
            <div v-for="(feature, index) in features" :key="feature.title" class="feature-row observed-section">
              <v-row :class="{ 'flex-row-reverse': index % 2 !== 0 }" align="center">
                <v-col cols="12" md="6">
                  <div class="feature-image-container">
                    <v-img
                      :src="getImageUrl(feature.image)"
                      :lazy-src="getImageUrl(feature.image)"
                      :alt="feature.title"
                      class="feature-image"
                      aspect-ratio="1.77"
                      cover
                    >
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="feature-content">
                    <template v-if="index === 1">
                        <h3 class="feature-title orbitron-font">Autonomous Architecture: Data Sovereignty</h3>
                    </template>
                    <template v-else>
                        <h3 class="feature-title orbitron-font">{{ feature.title }}</h3>
                    </template>

                    <template v-if="index === 1">
                        <p class="feature-description">Your workflows are saved locally using a "Flow-Chain" system. Every change is cryptographically chained to the last, ensuring your data never leaves your machine and cannot be tampered with.</p>
                    </template>
                    <template v-else>
                         <p class="feature-description">{{ feature.description }}</p>
                    </template>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-container>
        </section>

        <section id="advantage" class="advantage-section observed-section">
          <v-container>
            <h2 class="section-title orbitron-font">The Flowork Advantage</h2>
            <v-row class="mt-12">
              <v-col v-for="advantage in advantages" :key="advantage.title" cols="12" md="4">
                <div class="advantage-card">
                  <div class="advantage-card-glow"></div>
                  <div class="advantage-card-content">
                    <v-icon :icon="advantage.icon" class="advantage-icon"></v-icon>
                    <h3 class="advantage-title orbitron-font">{{ advantage.title }}</h3>
                    <template v-if="advantage.title === 'Full Control'">
                        <p class="advantage-description">Your Private Key is your identity. You own your account, not us. All data and workflows are stored and run locally on your machine, not on our servers.</p>
                    </template>
                    <template v-else>
                         <p class="advantage-description">{{ advantage.description }}</p>
                    </template>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </section>

        <section class="final-cta-section text-center observed-section">
            <v-container>
                <h2 class="section-title orbitron-font">Ready to Transform How You Work?</h2>
                <p class="final-cta-description mx-auto mt-4">
                    Every great system starts with a single node. There's no risk. Create your free account and start building the future of your automation today.
                </p>
                <v-btn size="x-large" color="cyan" class="action-btn mt-8" to="/register">
                    Create Your Free Account Now
                </v-btn>
            </v-container>
        </section>

      </v-container>
    </v-main>
    <LanderFooter />
  </div>
</template>

<script setup>
import LanderCanvas from '@/components/LanderCanvas.vue';
import LanderFooter from '@/components/LanderFooter.vue';
import DigitalFingerprintBackground from '@/components/DigitalFingerprintBackground.vue';
import { ref, onMounted, onUnmounted } from 'vue';

const advantages = ref([
    { icon: 'mdi-shield-check-outline', title: 'Full Control', description: "Your Private Key is your identity. You own your account, not us. All data and workflows are stored and run locally on your machine, not on our servers." }, // English Hardcode
    { icon: 'mdi-infinity', title: 'Limitless Power', description: "From simple API integrations to complex autonomous AI agents, Flowork is designed to scale with your ambition, handling the most advanced tasks with ease." }, // English Hardcode
    { icon: 'mdi-lightbulb-on-outline', title: 'Creativity without Code', description: "We believe innovators should focus on strategy, not syntax. Flowork frees you to experiment and build at the speed of your imagination." } // English Hardcode
]);

const features = ref([
    { title: 'Limitless Visual Designer', image: 'flowork_1.webp', description: "Forget complex syntax. Pour your business logic, creative processes, or wild ideas onto a digital canvas. If you can imagine it, you can build it." }, // English Hardcode
    { title: 'Hybrid Architecture: Privacy First', image: 'flowork_2.webp', description: "Your sensitive data never leaves your servers. Flowork sends only the workflow 'blueprint', while all data processing happens securely within your own fortress." }, // English Hardcode
    { title: 'Complete AI Suite at Your Fingertips', image: 'flowork_3.webp', description: "Train custom AI models on your own data (AI Trainer), automatically design complex workflows from a sentence (AI Architect), and get intelligent optimization insights (AI Co-pilot)." }, // English Hardcode
    { title: 'Build Your Autonomous AI Workforce', image: 'flowork_6.webp', description: "Use the Agent Host to create AI agents that can think, choose their own 'tools' (other nodes), and act independently to achieve the goals you set. This is the apex of intelligent automation." }, // English Hardcode
    { title: 'The Time-Travel Debugger', image: 'flowork_4.webp', description: "Never guess where an error occurred again. Go back and forth through your execution timeline. Click any connection to inspect the exact data that flowed through, as if you have a time machine for your code." }, // English Hardcode
]);

const isScrolled = ref(false);
let observer;

const getImageUrl = (name) => {
  return `/images/${name}`; // English Hardcode
};

const handleScroll = () => { isScrolled.value = window.scrollY > 20; };

const setupScrollAnimation = () => {
    observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }); }, { threshold: 0.1 });
    document.querySelectorAll('.observed-section').forEach(section => observer.observe(section));
};

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
    setupScrollAnimation();
});
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    if (observer) observer.disconnect();
});
</script>

<style scoped>
.orbitron-font { font-family: 'Orbitron', monospace; }
.lander-page {
  background-color: var(--dark-bg);
  color: #E0E0E0;
  position: relative;
  overflow: hidden;
}
section { padding: 120px 0; position: relative; z-index: 2; }

.observed-section { opacity: 0; transform: translateY(50px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
.observed-section.is-visible { opacity: 1; transform: translateY(0); }
.hero-section {
  min-height: 100vh;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.hero-content-wrapper {
    position: relative;
    z-index: 2;
}
.interactive-canvas-wrapper {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
.hero-title { font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.2; }
.hero-subtitle { font-size: clamp(1.2rem, 2vw, 1.5rem); color: #B0BEC5; margin-top: 1rem; }
.hero-description { max-width: 650px; color: #B0BEC5; }
.action-btn { font-weight: bold; }
.animate-glow { animation: text-glow 3s ease-in-out infinite alternate; }
@keyframes text-glow {
  from { text-shadow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan); }
  to { text-shadow: 0 0 20px var(--neon-cyan), 0 0 40px var(--neon-purple); }
}
.advantage-section, .how-it-works-section { background-color: rgba(10, 15, 30, 0.8); }
.advantage-card { text-align: center; padding: 32px; border-radius: 16px; background-color: var(--card-bg); border: 1px solid var(--card-border); transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; transform-style: preserve-3d; }
.advantage-card:hover { transform: translateY(-10px) perspective(1000px) rotateX(5deg) rotateY(-5deg); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.advantage-icon { font-size: 48px; color: var(--neon-cyan); margin-bottom: 24px; text-shadow: 0 0 15px var(--neon-cyan); }
.advantage-title { font-size: 1.2rem; margin-bottom: 16px; color: #f0f0f0; }
.advantage-description { color: #B0BEC5; font-size: 0.9rem; }
.steps-container {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    gap: 32px;
    position: relative;
}
.step-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    max-width: 320px;
    flex-basis: 30%;
    position: relative;
}
.step-icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px auto;
    background: linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(191, 0, 255, 0.1));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--neon-cyan);
    position: relative;
}
.step-icon {
    font-size: 40px;
    color: var(--neon-cyan);
}
.step-number {
    position: absolute;
    top: -10px;
    left: -10px;
    background-color: var(--neon-cyan);
    color: #010c03;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-family: 'Orbitron', monospace;
    border: 2px solid var(--dark-bg);
}
.step-title { font-size: 1.2rem; margin-bottom: 12px; color: #f0f0f0; }
.step-description { color: #B0BEC5; font-size: 0.9rem; line-height: 1.6; }
.step-description strong { color: #fff; font-weight: 600; }
.step-connector { flex-grow: 1; height: 2px; background: repeating-linear-gradient(90deg, var(--neon-purple), var(--neon-purple) 10px, transparent 10px, transparent 20px); margin-top: 40px; }
.features-section { background-color: var(--dark-bg); }
.feature-row { margin-bottom: 120px; }
.feature-image-container { border-radius: 16px; overflow: hidden; border: 1px solid var(--card-border); box-shadow: 0 0 40px rgba(191, 0, 255, 0.15); }
.feature-image { width: 100%; display: block; }
.feature-title { font-size: 2rem; color: #f0f0f0; margin-bottom: 16px; }
.final-cta-section { background: radial-gradient(circle, rgba(16, 25, 62, 0.8) 0%, var(--dark-bg) 70%); }
.final-cta-description { max-width: 650px; color: #B0BEC5; }
.footer-link { display: block; color: #B0BEC5; text-decoration: none; margin-bottom: 8px; transition: color 0.2s ease; }
.lander-footer .text-caption {
  color: #9E9E9E !important;
}
.footer-title { font-weight: bold; margin-bottom: 12px; color: #f0f0f0; }
.footer-link:hover { color: var(--neon-cyan); }

.download-btn-pulse {
    animation: pulse-animation 2.5s infinite;
    box-shadow: 0 0 0 0 rgba(255, 111, 0, 0.7);
    color: #000 !important;
    font-weight: bold;
}

@keyframes pulse-animation {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 111, 0, 0.7);
    }
    70% {
        transform: scale(1.05);
        box-shadow: 0 0 10px 20px rgba(255, 111, 0, 0);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 111, 0, 0);
    }
}


@media (max-width: 960px) {
    .steps-container {
        flex-direction: column;
        align-items: center;
    }
    .step-connector {
        width: 2px;
        height: 50px;
        margin-top: 0;
        margin-bottom: 0;
        background: repeating-linear-gradient(180deg, var(--neon-purple), var(--neon-purple) 10px, transparent 10px, transparent 20px);
    }
}
</style>
