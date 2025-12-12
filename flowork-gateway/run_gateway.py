########################################################################
# WEBSITE https://flowork.cloud
# File NAME : run_gateway.py (AUTO SEED EDITION)
########################################################################

import gevent.monkey
gevent.monkey.patch_all()
print("[BOOT] gevent monkey_patch applied.")

import os
import sys
import secrets
import uuid
from werkzeug.security import generate_password_hash

# [PORTABLE FIX] Inject path
base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from dotenv import load_dotenv

# [ENV FIX] Load Env dari Root atau Local
env_path = os.environ.get('ENV_FILE_PATH')
if not env_path or not os.path.exists(env_path):
    # Cek parent dir (Root C:\FLOWORK\.env)
    root_env = os.path.join(os.path.dirname(base_dir), '.env')
    if os.path.exists(root_env):
        env_path = root_env
    else:
        env_path = os.path.join(base_dir, '.env')

if env_path and os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"[BOOT] Config loaded from: {env_path}")
else:
    print("[BOOT] Using Environment Variables.")

# [SECURITY] Auto-Fix Weak Keys
for key in ["JWT_SECRET_KEY", "GW_JWT_SECRET", "SECRET_KEY"]:
    if len(os.getenv(key, "")) < 64:
        print(f"[SECURITY] Injecting weak key fix for {key}...")
        os.environ[key] = secrets.token_urlsafe(64)

try:
    from app import create_app, extensions
    from app.extensions import socketio, db
    from app.config import Config
    # [CRITICAL] Import Models biar SQLAlchemy sadar ada tabel yg harus dibuat
    from app import models
    from app.models import User, RegisteredEngine, Subscription, Plan
except ImportError as e:
    print(f"[FATAL] Import Error: {e}")
    sys.exit(1)

application = create_app(config_class=Config)

def seed_portable_data():
    """Fungsi sakti buat mendaftarkan Admin & Engine otomatis."""
    try:
        # 1. Ambil Kredensial dari .env (yang dibuat portable_setup.py)
        admin_user = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        admin_pass = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin")
        engine_id = os.getenv("FLOWORK_ENGINE_ID")
        engine_token = os.getenv("FLOWORK_ENGINE_TOKEN")

        if not engine_id or not engine_token:
            print("[SEED] ⚠️ Engine ID/Token not found in .env. Skipping seed.")
            return

        # 2. Cek/Bikin User Admin
        user = User.query.filter_by(username=admin_user).first()
        if not user:
            print(f"[SEED] Creating Admin User: {admin_user}...")
            user = User(
                id=str(uuid.uuid4()),
                username=admin_user,
                email="admin@local.host",
                password_hash=generate_password_hash(admin_pass),
                status="active",
                public_address="0xLocalAdmin"
            )
            db.session.add(user)
            db.session.flush()

            # Kasih Subscription Gratis
            sub = Subscription(id=str(uuid.uuid4()), user_id=user.id, tier="architect")
            db.session.add(sub)

        # 3. Cek/Bikin Engine
        engine = RegisteredEngine.query.filter_by(id=engine_id).first()
        token_hash = generate_password_hash(engine_token)

        if not engine:
            print(f"[SEED] Registering Engine: {engine_id}...")
            engine = RegisteredEngine(
                id=engine_id,
                user_id=user.id,
                name="Portable Engine",
                engine_token_hash=token_hash,
                status="online"
            )
            db.session.add(engine)
        else:
            # Update token biar sinkron sama .env
            engine.engine_token_hash = token_hash

        db.session.commit()
        print("[SEED] ✅ Database seeded successfully!")

    except Exception as e:
        db.session.rollback()
        print(f"[SEED] ❌ Error seeding database: {e}")

# --- AUTO-INIT DATABASE ---
with application.app_context():
    try:
        # 1. Bikin Tabel (Create Tables)
        db.create_all()
        # 2. Isi Data Awal (Seed Data)
        seed_portable_data()
    except Exception as e:
        print(f"[BOOT] Database Init Failed: {e}")

if __name__ == '__main__':
    host = os.environ.get('FLASK_RUN_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_RUN_PORT', 8000))

    print(f"[BOOT] Gateway listening at http://{host}:{port}")

    socketio.run(
        application,
        host=host,
        port=port,
        debug=False,
        use_reloader=False,
        allow_unsafe_werkzeug=True,
        log_output=True
    )