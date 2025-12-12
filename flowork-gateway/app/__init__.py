########################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\FLOWORK\flowork-gateway\app\__init__.py
########################################################################

import logging
import os
import sys
import uuid
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token

from app.security.env_guard import guard_runtime, check_strict_env
from app.security.logging_setup import configure_logging

try:
    from .config import Config
except ImportError:
    try:
        from config import Config
    except ImportError:
        sys.exit(1)

# [FIX] Import 'db' sebagai 'gateway_db' untuk menghindari tabrakan nama dengan module 'app.db'
from .extensions import db, migrate, socketio
from .extensions import db as gateway_db

from .metrics import register_metrics
from .rl.limiter import RateLimiter
from .db.router import db_router
from .ops.drain import drain_bp, init_drain_state
from .db.pragma import init_pragma
from app.etl.exporter import start_exporter_thread
from .ops.health import bp as health_bp
from app.helpers import verify_web3_signature
from app.models import User, Subscription

limiter = RateLimiter()

def create_app(config_class=Config):
    configure_logging()
    root_logger = logging.getLogger(__name__)

    try:
        summary = guard_runtime()
        root_logger.info("Runtime guard OK.", extra={"event":"startup", **summary})
    except Exception as e:
        root_logger.critical(f"[FATAL] Guard: {e}")

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Set JWT Secret (Penting buat auto-login)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback_secret")

    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        fallback_db = f"sqlite:////app/data/gateway.db"
        app.config["SQLALCHEMY_DATABASE_URI"] = fallback_db

    app.logger = root_logger

    # [CORS FIX] Daftar tamu VVIP
    allowed_origins = [
        "https://flowork.cloud",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # [FIX] Gunakan gateway_db untuk inisialisasi
    gateway_db.init_app(app)
    migrate.init_app(app, gateway_db)

    jwt = JWTManager(app)

    with app.app_context():
        try: init_pragma(app, gateway_db)
        except Exception: pass

    register_metrics(app)
    limiter.init_app(app)
    db_router.init_app(app)
    init_drain_state(app)

    socketio.init_app(app, async_mode='gevent', cors_allowed_origins="*", path='/api/socket.io')

    # --- [MAGIC MIDDLEWARE: AUTO-LOGIN VIA SIGNATURE] ---
    @app.before_request
    def auto_exchange_signature_for_jwt():
        if request.method == 'OPTIONS': return

        auth_header = request.headers.get("Authorization")
        address = request.headers.get("X-User-Address")
        signature = request.headers.get("X-Signature")
        message = request.headers.get("X-Signed-Message")

        # Kalau user bawa Tanda Tangan tapi GAK bawa Token
        if not auth_header and address and signature and message:
            if verify_web3_signature(address, message, signature):
                # [FIX] Gunakan gateway_db (Objek), BUKAN db (Module)
                user = User.query.filter(User.public_address.ilike(address)).first()

                if not user:
                    try:
                        new_uid = str(uuid.uuid4())
                        user = User(
                            id=new_uid,
                            username=f"user_{address[:6]}",
                            email=f"{address[:8]}@local.host",
                            password_hash="portable_mode",
                            public_address=address,
                            status="active"
                        )
                        gateway_db.session.add(user) # Pake gateway_db

                        sub = Subscription(id=str(uuid.uuid4()), user_id=new_uid, tier="architect")
                        gateway_db.session.add(sub)  # Pake gateway_db

                        gateway_db.session.commit()  # Pake gateway_db
                        app.logger.info(f"[AutoAuth] Created new portable user: {address}")
                    except Exception as e:
                        gateway_db.session.rollback() # Pake gateway_db
                        app.logger.error(f"[AutoAuth] Create user failed: {e}")
                        return

                # Bikin token dadakan
                access_token = create_access_token(identity=user.id, expires_delta=datetime.timedelta(days=7))

                # Tempel token ke request
                request.environ["HTTP_AUTHORIZATION"] = f"Bearer {access_token}"

    # ----------------------------------------------------

    from . import sockets
    from .routes.auth import auth_bp
    from .routes.system import system_bp
    from .routes.cluster import cluster_bp
    from .routes.dispatch import dispatch_bp
    from .ops.chaos import chaos_bp
    from .engine.heartbeat_api import engine_hb_bp
    from .routes.proxy import proxy_bp
    from .routes.user import user_bp
    from .routes.user_state import user_state_bp
    from .routes.presets import presets_bp
    from .routes.workflow_shares import workflow_shares_bp
    from .routes.dashboard import dashboard_bp
    from .routes.agent import agent_bp
    from .routes.capsules import bp as capsules_bp
    from .routes.marketplace import marketplace_bp
    from .routes.ai_proxy import ai_proxy_bp
    from .routes.variables import variables_bp
    from .routes.components_proxy import components_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(cluster_bp)
    app.register_blueprint(dispatch_bp)
    app.register_blueprint(chaos_bp)
    app.register_blueprint(drain_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(engine_hb_bp)
    app.register_blueprint(proxy_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(user_state_bp)
    app.register_blueprint(presets_bp)
    app.register_blueprint(workflow_shares_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(capsules_bp)
    app.register_blueprint(marketplace_bp, url_prefix='/api/v1/marketplace')
    app.register_blueprint(ai_proxy_bp, url_prefix='/api/v1/ai')
    app.register_blueprint(variables_bp, url_prefix='/api/v1/variables')
    app.register_blueprint(components_bp, url_prefix='/api/v1/components')

    start_exporter_thread(app)

    @app.teardown_appcontext
    def remove_db_session(exception=None):
        gateway_db.session.remove()

    @app.errorhandler(404)
    def not_found_error(error): return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_error(error): return jsonify({"error": "Internal Server Error"}), 500

    from app.rl.limiter import init_rl_schema
    with app.app_context():
        try: init_rl_schema()
        except: pass

    app.logger.info("[Startup] Flowork Gateway initialized successfully.")
    return app