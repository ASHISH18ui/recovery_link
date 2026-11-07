from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db import Base, engine
from app.api import auth, discharges, patients, checkins, dashboard, alerts, notifications, audit, appointments, reports, settings as settings_api

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and auto-seed if database is empty
    Base.metadata.create_all(bind=engine)
    from app.db import SessionLocal
    from app.models.models import Hospital
    db = SessionLocal()
    try:
        if not db.query(Hospital).first():
            print("Database empty on startup. Auto-seeding demo data...")
            from seed import seed_database
            seed_database(drop_existing=False)
            print("Auto-seeding completed.")
        else:
            print("Database contains existing records. Skipping auto-seed.")
    except Exception as e:
        print(f"Startup auto-seed check encountered an issue: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AfterCare: Post-Discharge Patient Recovery Monitoring Platform for Hospitals. "
                "Core principle: THE AI SUMMARISES AND FLAGS; THE CLINICIAN DECIDES. "
                "The AI must never diagnose, prescribe, or give medical advice to patients.",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.cors_origins if settings.cors_origins else ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
api_v1_router = FastAPI()
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(discharges.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(checkins.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "disclaimer": "AI-generated summary. Clinician review required.",
        "notice": "Illustrative workflow; clinical instructions must be customised and approved by the hospital."
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to AfterCare API",
        "docs": "/docs",
        "health": "/health"
    }

