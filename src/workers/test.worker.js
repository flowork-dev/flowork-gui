// src/workers/test.worker.js
self.onmessage = e => { console.log('Message received from main script:', e.data); self.postMessage('Hello from worker'); };