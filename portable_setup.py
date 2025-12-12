import os
import secrets
import sys
import shutil
import time
import json
import re
import uuid
from pathlib import Path

# --- KONFIGURASI PATH (WINDOWS FRIENDLY) ---
ROOT_DIR = Path(__file__).parent.resolve()
DATA_DIR = ROOT_DIR / "data"
LOGS_DIR = DATA_DIR / "logs"

# Path Spesifik Service
CORE_DIR = ROOT_DIR / "flowork-core"
GATEWAY_DIR = ROOT_DIR / "flowork-gateway"
GUI_WEB_DIR = ROOT_DIR / "flowork-gui-lite" / "template" / "web"

# Fix Path buat SQLAlchemy (Ganti backslash jadi slash)
ABS_DATA_DIR = str(DATA_DIR).replace("\\", "/")

def gen_secret(length=48): return secrets.token_hex(length)
def gen_urlsafe(length=32): return secrets.token_urlsafe(length)

def migrate_and_cut_data(filename):
    """Fitur CUT & PASTE: Pindahkan file database nyasar ke folder data utama."""
    target_path = DATA_DIR / filename

    # Daftar lokasi yang sering jadi tempat nyasar
    possible_sources = [
        CORE_DIR / "data" / filename,
        GATEWAY_DIR / "data" / filename,
        GATEWAY_DIR / "instance" / filename,
        CORE_DIR / filename,
    ]

    for src in possible_sources:
        if src.exists():
            print(f"[MIGRATE] Menemukan data di: {src}")
            if target_path.exists():
                print(f"[MIGRATE] ⚠️ Target sudah ada. Backup dulu...")
                ts = int(time.time())
                try: shutil.move(str(target_path), str(target_path) + f".bak.{ts}")
                except: pass

            print(f"[MIGRATE] 🚚 Memindahkan ke {target_path}...")
            try:
                # Pastikan folder tujuan ada
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(src), str(target_path))

                # Pindahkan file pendamping (-wal, -shm)
                src_wal = src.with_name(src.name + "-wal")
                if src_wal.exists(): shutil.move(str(src_wal), str(target_path) + "-wal")

                src_shm = src.with_name(src.name + "-shm")
                if src_shm.exists(): shutil.move(str(src_shm), str(target_path) + "-shm")

                # Hapus folder sisa jika kosong
                if src.parent.name == "data" and not any(src.parent.iterdir()):
                    try: src.parent.rmdir()
                    except: pass
            except Exception as e:
                print(f"[ERROR] Gagal migrasi: {e}")

def main():
    print("==================================================")
    print("   FLOWORK PORTABLE SETUP (V19 - GUI ENFORCER)   ")
    print("==================================================")
    print(f"[SETUP] Root Directory: {ROOT_DIR}")

    # 1. SETUP STRUKTUR FOLDER
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "etl_outbox").mkdir(exist_ok=True)
    (ROOT_DIR / "capsules").mkdir(exist_ok=True)
    (ROOT_DIR / "repos").mkdir(exist_ok=True)

    # 2. BERSIH-BERSIH (Hapus Config Zombie & .env.production)
    print("\n[PHASE 1] Cleaning Zombie Configs...")

    # Hapus .env di subfolder service (biar mereka baca punya Root)
    for sub in [CORE_DIR, GATEWAY_DIR]:
        zombie = sub / ".env"
        if zombie.exists():
            try: os.remove(zombie)
            except: pass

    # Hapus .env.production di GUI (INI PENTING BANGET)
    gui_prod_env = GUI_WEB_DIR / ".env.production"
    if gui_prod_env.exists():
        print(f"[CLEAN] Menghapus file pengganggu GUI: {gui_prod_env}")
        try: os.remove(gui_prod_env)
        except: pass

    # 3. MIGRASI DATA
    migrate_and_cut_data("flowork_core.db")
    migrate_and_cut_data("gateway.db")

    # 4. LOAD / GENERATE IDENTITAS
    # Kita baca .env root yang lama dulu biar key gak ganti-ganti
    root_env_path = ROOT_DIR / ".env"
    config = {}

    if root_env_path.exists():
        try:
            with open(root_env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line and not line.strip().startswith("#"):
                        k, v = line.strip().split("=", 1)
                        config[k] = v
        except: pass

    # Isi default kalau belum ada
    if "FLOWORK_ENGINE_ID" not in config: config["FLOWORK_ENGINE_ID"] = f"eng-{uuid.uuid4()}"
    if "FLOWORK_ENGINE_TOKEN" not in config: config["FLOWORK_ENGINE_TOKEN"] = f"fk-eng-{gen_urlsafe(64)}"

    for key in ["JWT_SECRET_KEY", "GATEWAY_SECRET_TOKEN", "SECRET_KEY", "ADMIN_TOKEN", "FAC_SIGNING_KEY"]:
        if key not in config: config[key] = gen_secret(64)

    config.setdefault("DEFAULT_ADMIN_USERNAME", "admin")
    config.setdefault("ADMIN_DEFAULT_PASSWORD", gen_urlsafe(16))

    # Cek Key File untuk GUI Login
    key_file_path = DATA_DIR / "DO_NOT_DELETE_private_key.txt"
    if "ENGINE_OWNER_PRIVATE_KEY" not in config:
        if key_file_path.exists():
            try:
                content = key_file_path.read_text()
                match = re.search(r"(0x[a-fA-F0-9]{64})", content)
                if match: config["ENGINE_OWNER_PRIVATE_KEY"] = match.group(1)
            except: pass

        if "ENGINE_OWNER_PRIVATE_KEY" not in config:
            config["ENGINE_OWNER_PRIVATE_KEY"] = "0x" + gen_secret(32)

    # 5. TULIS ROOT .ENV (MASTER CONFIG)
    # Database dipaksa Absolute Path
    final_env = f"""# --- FLOWORK MASTER CONFIG (V19) ---
FLOWORK_ENV=production
LOG_LEVEL=INFO
STRICT_ENV=false

# NETWORK (FORCE LOCALHOST)
FLASK_RUN_PORT=8000
FLASK_RUN_HOST=127.0.0.1
GATEWAY_API_URL=http://127.0.0.1:8000
FLOWORK_INTERNAL_API_URL=http://127.0.0.1:8001
FLOWORK_CORE_URL=http://127.0.0.1:8001
PUBLIC_BASE_URL=http://127.0.0.1:8000
GW_ALLOWED_ORIGINS=*

# IDENTITY
FLOWORK_ENGINE_ID={config['FLOWORK_ENGINE_ID']}
FLOWORK_ENGINE_TOKEN={config['FLOWORK_ENGINE_TOKEN']}

# SECURITY
JWT_SECRET_KEY={config['JWT_SECRET_KEY']}
GW_JWT_SECRET={config['JWT_SECRET_KEY']}
SECRET_KEY={config['SECRET_KEY']}
GATEWAY_SECRET_TOKEN={config['GATEWAY_SECRET_TOKEN']}
FLOWORK_INTERNAL_API_KEY={config['GATEWAY_SECRET_TOKEN']}
ADMIN_TOKEN={config['ADMIN_TOKEN']}
MOMOD_ADMIN_TOKEN={config['ADMIN_TOKEN']}
ENGINE_OWNER_PRIVATE_KEY={config['ENGINE_OWNER_PRIVATE_KEY']}
FAC_SIGNING_KEY={config['FAC_SIGNING_KEY']}

# ADMIN
DEFAULT_ADMIN_USERNAME={config['DEFAULT_ADMIN_USERNAME']}
ADMIN_DEFAULT_PASSWORD={config['ADMIN_DEFAULT_PASSWORD']}

# DATABASES (ABSOLUTE PATHS)
DATABASE_URL=sqlite:///{ABS_DATA_DIR}/gateway.db
CORE_DATABASE_URL=sqlite:///{ABS_DATA_DIR}/flowork_core.db
SQLALCHEMY_DATABASE_URI=sqlite:///{ABS_DATA_DIR}/gateway.db
"""
    with open(root_env_path, "w", encoding="utf-8") as f: f.write(final_env)
    print(f"[SUCCESS] Root .env generated.")

    # 6. TULIS GUI .ENV (INJEKSI VITE)
    # Ini file yang akan dibaca saat 'npm run build'
    gui_env_content = f"""VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GATEWAY_URL=http://127.0.0.1:8000
VITE_SOCKET_URL=http://127.0.0.1:8000
"""
    try:
        GUI_WEB_DIR.mkdir(parents=True, exist_ok=True)
        gui_env_path = GUI_WEB_DIR / ".env"
        with open(gui_env_path, "w", encoding="utf-8") as f:
            f.write(gui_env_content)
        print(f"[SUCCESS] GUI .env updated at {gui_env_path}")
        print("          Isi: VITE_GATEWAY_URL=http://127.0.0.1:8000")
    except Exception as e:
        print(f"[ERROR] Gagal tulis GUI .env: {e}")

    # 7. EXPORT CREDENTIALS
    cred_content = f"""!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! YOUR LOGIN PRIVATE KEY (PORTABLE)
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

{config['ENGINE_OWNER_PRIVATE_KEY']}

---------------------------------------------------
ADMIN USER : {config['DEFAULT_ADMIN_USERNAME']}
ADMIN PASS : {config['ADMIN_DEFAULT_PASSWORD']}
ENGINE ID  : {config['FLOWORK_ENGINE_ID']}
---------------------------------------------------
DO NOT SHARE THIS FILE.
"""
    with open(key_file_path, "w") as f: f.write(cred_content)

    print("\n[DONE] Konfigurasi Selesai. Silakan REBUILD GUI untuk menerapkan perubahan.")

if __name__ == "__main__":
    main()