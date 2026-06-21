from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["pages"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@router.get("/submit", response_class=HTMLResponse)
async def submit_page(request: Request):
    return templates.TemplateResponse("submit_order.html", {"request": request})


@router.get("/dispatch", response_class=HTMLResponse)
async def dispatch_page(request: Request):
    return templates.TemplateResponse("dispatch.html", {"request": request})


@router.get("/technicians", response_class=HTMLResponse)
async def technicians_page(request: Request):
    return templates.TemplateResponse("technicians.html", {"request": request})


@router.get("/technicians/{tech_id}", response_class=HTMLResponse)
async def technician_detail_page(request: Request, tech_id: int):
    return templates.TemplateResponse("technician_detail.html", {"request": request, "tech_id": tech_id})


@router.get("/orders/{order_id}", response_class=HTMLResponse)
async def order_detail_page(request: Request, order_id: int):
    return templates.TemplateResponse("order_detail.html", {"request": request, "order_id": order_id})


@router.get("/reports", response_class=HTMLResponse)
async def reports_page(request: Request):
    return templates.TemplateResponse("reports.html", {"request": request})


@router.get("/logs", response_class=HTMLResponse)
async def logs_page(request: Request):
    return templates.TemplateResponse("logs.html", {"request": request})
