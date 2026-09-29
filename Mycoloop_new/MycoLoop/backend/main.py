from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .database import initialize_database
    from .routes import router
except ImportError:
    from database import initialize_database
    from routes import router


# ============================================================
# MYCOLOOP FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="MycoLoop API",

    description=(
        "Smart Mushroom Cultivation Monitoring "
        "and Resource Conservation API"
    ),

    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

initialize_database()


# ============================================================
# REGISTER API ROUTES
# ============================================================

app.include_router(router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "project": "MycoLoop",

        "status": "Backend Online",

        "version": "1.0.0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",

        "service": "MycoLoop Backend"
    }


# ============================================================
# API INFORMATION
# ============================================================

@app.get("/api-info")
def api_information():

    return {

        "project": "MycoLoop",

        "description": (
            "Smart mushroom cultivation "
            "monitoring and resource conservation system"
        ),

        "database": "SQLite",

        "modules": [

            "Sensor Monitoring",

            "ESP32 Hardware Data",

            "Equipment Logging",

            "Alerts",

            "Cultivation Stages",

            "Dashboard Summary"
        ],

        "documentation": "/docs"
    }


# ============================================================
# STARTUP EVENT
# ============================================================

@app.on_event("startup")
def startup_event():

    print()
    print("================================================")
    print("           MYCOLOOP BACKEND STARTED")
    print("================================================")
    print("Server   : http://127.0.0.1:8000")
    print("Docs     : http://127.0.0.1:8000/docs")
    print("Health   : http://127.0.0.1:8000/health")
    print("Database : SQLite")
    print("================================================")
    print()


# ============================================================
# SHUTDOWN EVENT
# ============================================================

@app.on_event("shutdown")
def shutdown_event():

    print()
    print("================================================")
    print("           MYCOLOOP BACKEND STOPPED")
    print("================================================")
    print()