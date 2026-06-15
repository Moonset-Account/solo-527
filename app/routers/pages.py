from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/schedule", response_class=HTMLResponse)
async def schedule_page(request: Request):
    return templates.TemplateResponse("schedule.html", {"request": request})


@router.get("/appointments", response_class=HTMLResponse)
async def appointments_page(request: Request):
    return templates.TemplateResponse("appointments.html", {"request": request})


@router.get("/checkin", response_class=HTMLResponse)
async def checkin_page(request: Request):
    return templates.TemplateResponse("checkin.html", {"request": request})


@router.get("/waitlist", response_class=HTMLResponse)
async def waitlist_page(request: Request):
    return templates.TemplateResponse("waitlist.html", {"request": request})


@router.get("/refunds", response_class=HTMLResponse)
async def refunds_page(request: Request):
    return templates.TemplateResponse("refunds.html", {"request": request})


@router.get("/pricing", response_class=HTMLResponse)
async def pricing_page(request: Request):
    return templates.TemplateResponse("pricing.html", {"request": request})


@router.get("/config", response_class=HTMLResponse)
async def config_page(request: Request):
    return templates.TemplateResponse("config.html", {"request": request})


@router.get("/stats", response_class=HTMLResponse)
async def stats_page(request: Request):
    return templates.TemplateResponse("stats.html", {"request": request})


@router.get("/leaves", response_class=HTMLResponse)
async def leaves_page(request: Request):
    return templates.TemplateResponse("leaves.html", {"request": request})
