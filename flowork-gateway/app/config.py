########################################################################
# WEBSITE https://flowork.cloud
# File NAME : C:\Users\User\Music\OPEN SOURCE MODE\FLOWORK\flowork-gateway\app\config.py total lines 40
########################################################################

import os
from pathlib import Path

# --- [PORTABLE FIX] LOGIKA DETEKSI PATH CERDAS ---
# 1. Cek apakah kita ada di dalam struktur portable (C:\FLOWORK\flowork-gateway)
#    Maka folder data ada di C:\FLOWORK\data (naik 2 level dari config.py)
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE.parent.parent.parent # Naik ke C:\FLOWORK
PORTABLE_DATA = PROJECT_ROOT / "data"

if PORTABLE_DATA.exists() and PORTABLE_DATA.is_dir():
    # Jika folder data portable ditemukan, gunakan itu!
    DATA_DIR = PORTABLE_DATA
    # print(f"[Config] Using Portable Data Dir: {DATA_DIR}")
else:
    # Fallback ke logika lama (Docker / Default)
    DATA_DIR = Path("/app/data")
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        DATA_DIR = Path(".")

_DEFAULT_DB_URL = os.environ.get("DATABASE_URL")
if not _DEFAULT_DB_URL:
    # Pastikan pakai path yang sudah dibenerin di atas
    _DEFAULT_DB_URL = f"sqlite:///{DATA_DIR / 'gateway.db'}"

class Config:
    SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev_dummy_secret_do_not_use_in_prod")

    DATABASE_URL = _DEFAULT_DB_URL
    SQLALCHEMY_DATABASE_URI = _DEFAULT_DB_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    JSON_SORT_KEYS = False
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    DATABASE_URL = "sqlite:///:memory:"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"