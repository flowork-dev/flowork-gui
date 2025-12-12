import os
import sys
import time
import subprocess
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

# --- KONFIGURASI PORT ---
PORT_GATEWAY = 8000
PORT_CORE = 8001
PORT_GUI = 3000

# Path Helper
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CORE_DIR = os.path.join(ROOT_DIR, "flowork-core")
GATEWAY_DIR = os.path.join(ROOT_DIR, "flowork-gateway")
GUI_DIST_DIR = os.path.join(ROOT_DIR, "flowork-gui-lite", "template", "web", "dist")

# --- [SPA HANDLER] OTAK BARU SERVER GUI ---
class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set direktori kerja ke folder dist
        super().__init__(*args, directory=GUI_DIST_DIR, **kwargs)

    def do_GET(self):
        # 1. Cek apakah ini request API? (Harusnya gak lewat sini, tapi buat jaga-jaga)
        if self.path.startswith('/api'):
            self.send_error(404, "API Request sent to GUI Server")
            return

        # 2. Dapatkan path fisik file di disk
        # translate_path otomatis menggabungkan folder dist dengan URL yang diminta
        path = self.translate_path(self.path)

        # 3. Logika SPA (Single Page Application)
        # Kalau filenya ADA dan itu FILE (bukan folder), sajikan normal.
        if os.path.exists(path) and os.path.isfile(path):
            super().do_GET()
        else:
            # 4. Kalau GAK ADA (misal /dashboard, /login), jangan 404!
            # Sajikan index.html biar Vue Router yang ambil alih.
            self.path = '/index.html'
            super().do_GET()

    def end_headers(self):
        # Tambahin header biar browser gak nyimpen cache bandel
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        pass # Silent log biar console bersih

def run_gateway():
    print(f"[LAUNCHER] 🚀 Starting Gateway on Port {PORT_GATEWAY}...")
    env = os.environ.copy()
    env["FLASK_RUN_PORT"] = str(PORT_GATEWAY)
    env["FLASK_RUN_HOST"] = "127.0.0.1"

    cmd = [sys.executable, "run_gateway.py"]
    subprocess.run(cmd, cwd=GATEWAY_DIR, env=env)

def run_core():
    print(f"[LAUNCHER] 🧠 Starting Core on Port {PORT_CORE}...")
    env = os.environ.copy()
    env["UVICORN_PORT"] = str(PORT_CORE)

    cmd = [sys.executable, "run_server.py"]
    subprocess.run(cmd, cwd=CORE_DIR, env=env)

def run_gui_server():
    # Cek Folder Build
    if not os.path.exists(GUI_DIST_DIR):
        print(f"[LAUNCHER] ❌ GUI Build not found at {GUI_DIST_DIR}")
        print(f"[LAUNCHER] ⚠️ Please run START.bat (V15+) again to build GUI.")
        return

    print(f"[LAUNCHER] 🎨 Serving GUI (SPA Mode) on Port {PORT_GUI}...")

    try:
        # Pake handler sakti kita
        httpd = HTTPServer(('127.0.0.1', PORT_GUI), SPAHandler)
        httpd.serve_forever()
    except OSError as e:
        print(f"[LAUNCHER] ❌ GUI Port {PORT_GUI} in use. GUI might not load.")

def main():
    print("===================================================")
    print("   FLOWORK PORTABLE ENGINE - ORCHESTRATOR v4.0   ")
    print("===================================================")

    # 1. Jalankan Thread
    t_core = threading.Thread(target=run_core, daemon=True)
    t_gateway = threading.Thread(target=run_gateway, daemon=True)
    t_gui = threading.Thread(target=run_gui_server, daemon=True)

    t_core.start()
    time.sleep(2)
    t_gateway.start()
    t_gui.start()

    # 2. Buka Browser
    print("[LAUNCHER] 🌍 Opening Browser...")
    time.sleep(5)
    webbrowser.open(f"http://127.0.0.1:{PORT_GUI}")

    # 3. Keep Alive Loop
    try:
        while True:
            time.sleep(1)
            if not t_core.is_alive():
                print("[LAUNCHER] 💀 Core died! Shutting down...")
                break
            if not t_gateway.is_alive():
                print("[LAUNCHER] 💀 Gateway died! Shutting down...")
                break
    except KeyboardInterrupt:
        print("\n[LAUNCHER] Stopping Flowork...")

if __name__ == "__main__":
    main()