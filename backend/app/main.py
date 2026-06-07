from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers.analytics import router
from app.seed import seed_data

Base.metadata.create_all(bind=engine)

app = FastAPI(title="酒店客房清洁效率看板", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
