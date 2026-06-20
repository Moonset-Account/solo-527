from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import os

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models import *
from app.auth import get_current_user_from_cookie
from app.middleware import TimingMiddleware, ApiStatusMiddleware

from app.routers import auth, treatments, verification, works, messages, customers, monitor

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, debug=settings.DEBUG)

app.add_middleware(TimingMiddleware)
app.add_middleware(ApiStatusMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

templates = Jinja2Templates(directory="app/templates")

app.include_router(auth.router)
app.include_router(treatments.router)
app.include_router(verification.router)
app.include_router(works.router)
app.include_router(messages.router)
app.include_router(customers.router)
app.include_router(monitor.router)


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    _migrate_columns()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    from app.routers.auth import init_default_users
    db = SessionLocal()
    try:
        init_default_users(db)
        _init_demo_data(db)
    finally:
        db.close()


def _migrate_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE treatment_cards ADD COLUMN IF NOT EXISTS creator_id INTEGER REFERENCES users(id)
            """))
            conn.commit()
        except Exception:
            conn.rollback()
            pass


def _init_demo_data(db):
    from app.models import Treatment, Work, Customer, TreatmentCard, ReminderRule
    from app.auth import hash_password
    from datetime import date, timedelta
    import uuid

    if db.query(Treatment).count() == 0:
        treatments_data = [
            {"name": "水光补水护理", "description": "深层补水，改善肌肤干燥缺水状态", "price": 398, "duration_minutes": 60, "total_sessions": 1, "category": "面部护理", "sort_order": 1},
            {"name": "面部紧致提升", "description": "紧致肌肤，提升面部轮廓", "price": 688, "duration_minutes": 90, "total_sessions": 1, "category": "面部护理", "sort_order": 2},
            {"name": "深层清洁护理", "description": "深层清洁毛孔，去除黑头粉刺", "price": 258, "duration_minutes": 45, "total_sessions": 1, "category": "面部护理", "sort_order": 3},
            {"name": "肩颈精油按摩", "description": "舒缓肩颈疲劳，促进血液循环", "price": 198, "duration_minutes": 45, "total_sessions": 1, "category": "身体护理", "sort_order": 4},
            {"name": "全身SPA护理", "description": "全身放松，舒缓压力", "price": 888, "duration_minutes": 120, "total_sessions": 1, "category": "身体护理", "sort_order": 5},
            {"name": "美甲套餐", "description": "手部护理+美甲", "price": 168, "duration_minutes": 60, "total_sessions": 1, "category": "美甲", "sort_order": 6},
        ]
        for t in treatments_data:
            treatment = Treatment(**t, status=TreatmentStatus.ACTIVE)
            db.add(treatment)
        db.flush()

    if db.query(Customer).count() == 0:
        customers_data = [
            {"name": "张美丽", "phone": "13800138001", "gender": "女"},
            {"name": "李芳华", "phone": "13800138002", "gender": "女"},
            {"name": "王雅婷", "phone": "13800138003", "gender": "女"},
            {"name": "陈思语", "phone": "13800138004", "gender": "女"},
        ]
        for c in customers_data:
            customer = Customer(**c)
            db.add(customer)
        db.flush()

    if db.query(TreatmentCard).count() == 0:
        treatments = db.query(Treatment).all()
        customers = db.query(Customer).all()
        if treatments and customers:
            cards_data = [
                {"card_no": "TC2025001", "customer": customers[0], "treatment": treatments[0], "total_sessions": 10, "price_paid": 3580, "purchase_days_ago": 30, "remaining": 7},
                {"card_no": "TC2025002", "customer": customers[1], "treatment": treatments[1], "total_sessions": 5, "price_paid": 3000, "purchase_days_ago": 60, "remaining": 3},
                {"card_no": "TC2025003", "customer": customers[2], "treatment": treatments[3], "total_sessions": 20, "price_paid": 3500, "purchase_days_ago": 15, "remaining": 18},
                {"card_no": "TC2025004", "customer": customers[0], "treatment": treatments[4], "total_sessions": 3, "price_paid": 2400, "purchase_days_ago": 10, "remaining": 2},
                {"card_no": "TC2025005", "customer": customers[3], "treatment": treatments[2], "total_sessions": 10, "price_paid": 2200, "purchase_days_ago": 45, "remaining": 1},
            ]
            for c in cards_data:
                purchase_date = date.today() - timedelta(days=c["purchase_days_ago"])
                expiry_date = purchase_date + timedelta(days=365)
                card = TreatmentCard(
                    card_no=c["card_no"],
                    customer_id=c["customer"].id,
                    treatment_id=c["treatment"].id,
                    total_sessions=c["total_sessions"],
                    remaining_sessions=c["remaining"],
                    purchase_date=purchase_date,
                    expiry_date=expiry_date,
                    status=TreatmentCardStatus.ACTIVE,
                    price_paid=c["price_paid"]
                )
                db.add(card)

    if db.query(Work).count() == 0:
        treatments = db.query(Treatment).all()
        if treatments:
            works_data = [
                {"title": "水光补水前后对比", "description": "一次水光护理后的显著效果，肌肤水润透亮", "treatment": treatments[0], "sort_order": 1},
                {"title": "面部提升效果展示", "description": "三次护理后面部轮廓明显提升", "treatment": treatments[1], "sort_order": 2},
                {"title": "深层清洁前后", "description": "黑头粉刺彻底清除，毛孔清爽干净", "treatment": treatments[2], "sort_order": 3},
                {"title": "肩颈按摩放松", "description": "舒缓肩颈紧张，告别僵硬酸痛", "treatment": treatments[3], "sort_order": 4},
                {"title": "全身SPA体验", "description": "全方位身心放松，焕发活力", "treatment": treatments[4], "sort_order": 5},
            ]
            for w in works_data:
                work = Work(
                    title=w["title"],
                    description=w["description"],
                    image_url=f"/static/images/work_{w['sort_order']}.jpg",
                    treatment_id=w["treatment"].id,
                    creator_id=1,
                    status=WorkStatus.PUBLISHED,
                    sort_order=w["sort_order"],
                    view_count=100 + w["sort_order"] * 20,
                    like_count=20 + w["sort_order"] * 5
                )
                db.add(work)

    if db.query(ReminderRule).count() == 0:
        rules = [
            {"name": "收银差异普通提醒", "rule_type": "cash_diff", "threshold_value": 50, "is_alert": False},
            {"name": "收银差异紧急告警", "rule_type": "cash_diff", "threshold_value": 200, "is_alert": True},
            {"name": "疗程卡到期提醒", "rule_type": "card_expiry", "threshold_value": 30, "is_alert": False},
            {"name": "疗程卡次数不足提醒", "rule_type": "low_sessions", "threshold_value": 3, "is_alert": False},
        ]
        for r in rules:
            rule = ReminderRule(**r, is_active=True)
            db.add(rule)

    db.commit()


def _get_user_from_request(request: Request):
    db = SessionLocal()
    try:
        return get_current_user_from_cookie(request, db), db
    finally:
        db.close()


@app.get("/")
async def index(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/dashboard")
async def dashboard(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/treatments")
async def treatments_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("treatments.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/treatment-cards")
async def treatment_cards_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("treatment_cards.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/verification")
async def verification_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("verification.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/payments")
async def payments_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("payments.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/works")
async def works_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("works.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/comments")
async def comments_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("comments.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/todos")
async def todos_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("todos.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/messages")
async def messages_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("messages.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/renewal-board")
async def renewal_board_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("renewal_board.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/api-status")
async def api_status_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("api_status.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/customers")
async def customers_page(request: Request):
    db = SessionLocal()
    try:
        user = get_current_user_from_cookie(request, db)
        if not user:
            return templates.TemplateResponse("login.html", {"request": request})
        return templates.TemplateResponse("customers.html", {"request": request, "user": user})
    finally:
        db.close()


@app.get("/showcase")
async def showcase_page(request: Request):
    return templates.TemplateResponse("showcase.html", {"request": request})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
