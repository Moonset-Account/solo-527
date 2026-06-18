from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.database import init_db
from app.redis_client import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_redis()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

from app.routers import dashboard, alarms, tariff, revenue, statistics, dictionary, reminder

app.include_router(dashboard.router)
app.include_router(alarms.router)
app.include_router(tariff.router)
app.include_router(revenue.router)
app.include_router(statistics.router)
app.include_router(dictionary.router)
app.include_router(reminder.router)
