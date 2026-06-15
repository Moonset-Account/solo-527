import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import (
    User, ConsultantProfile, Apartment, Appointment,
    Deposit, ContractRisk, DictType, DictItem, SystemConfig,
    ChangeLog, VacancyHistory
)
from app.services.auth import get_password_hash


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("正在初始化数据库...")

        if db.query(User).count() > 0:
            print("数据库已存在数据，跳过初始化")
            return

        print("创建用户账号...")
        admin = User(
            username="admin",
            full_name="系统管理员",
            email="admin@qinghe.com",
            phone="13800000001",
            role="admin",
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin)

        consultant1 = User(
            username="consultant",
            full_name="张顾问",
            email="zhang@qinghe.com",
            phone="13800000002",
            role="consultant",
            hashed_password=get_password_hash("123456"),
            is_active=True
        )
        db.add(consultant1)

        consultant2 = User(
            username="consultant2",
            full_name="李顾问",
            email="li@qinghe.com",
            phone="13800000003",
            role="consultant",
            hashed_password=get_password_hash("123456"),
            is_active=True
        )
        db.add(consultant2)

        cs = User(
            username="cs01",
            full_name="王客服",
            email="cs01@qinghe.com",
            phone="13800000004",
            role="customer_service",
            hashed_password=get_password_hash("123456"),
            is_active=True
        )
        db.add(cs)

        tenant1 = User(
            username="tenant01",
            full_name="陈小明",
            email="chen@example.com",
            phone="13900000001",
            role="tenant",
            hashed_password=get_password_hash("123456"),
            is_active=True
        )
        db.add(tenant1)

        tenant2 = User(
            username="tenant02",
            full_name="刘小姐",
            email="liu@example.com",
            phone="13900000002",
            role="tenant",
            hashed_password=get_password_hash("123456"),
            is_active=True
        )
        db.add(tenant2)

        db.flush()

        print("创建顾问资料...")
        cp1 = ConsultantProfile(
            user_id=consultant1.id,
            employee_no="EMP001",
            department="销售一部",
            position="高级置业顾问",
            max_appointments_per_day=5,
            description="3年房产经验，擅长朝阳区房源"
        )
        cp2 = ConsultantProfile(
            user_id=consultant2.id,
            employee_no="EMP002",
            department="销售二部",
            position="置业顾问",
            max_appointments_per_day=4,
            description="2年房产经验，熟悉海淀片区"
        )
        db.add_all([cp1, cp2])

        print("创建房源数据...")
        apartments_data = [
            {"apartment_no": "A-1001", "building": "1栋", "floor": 10, "room_no": "1001", "area": 45.0, "bedrooms": 1, "living_rooms": 1, "bathrooms": 1, "orientation": "南", "floor_level": "中楼层", "decoration": "精装修", "monthly_rent": 3200, "deposit_months": 1.0, "status": "vacant", "address": "朝阳区青年路88号", "description": "朝南一居室，采光好，拎包入住", "facilities": "空调,洗衣机,冰箱,热水器,WiFi", "tags": "近地铁,朝南,拎包入住"},
            {"apartment_no": "A-1205", "building": "1栋", "floor": 12, "room_no": "1205", "area": 68.0, "bedrooms": 2, "living_rooms": 1, "bathrooms": 1, "orientation": "东南", "floor_level": "高楼层", "decoration": "精装修", "monthly_rent": 5200, "deposit_months": 1.5, "status": "occupied", "address": "朝阳区青年路88号", "description": "东南向两居室，视野开阔", "facilities": "空调,洗衣机,冰箱,热水器,WiFi,沙发,电视", "tags": "两居室,高楼层,采光好"},
            {"apartment_no": "B-0503", "building": "2栋", "floor": 5, "room_no": "0503", "area": 35.0, "bedrooms": 1, "living_rooms": 1, "bathrooms": 1, "orientation": "东", "floor_level": "低楼层", "decoration": "简装", "monthly_rent": 2500, "deposit_months": 1.0, "status": "vacant", "address": "朝阳区青年路88号", "description": "朝东一居室，经济实惠", "facilities": "空调,洗衣机,热水器,WiFi", "tags": "经济型,近地铁"},
            {"apartment_no": "B-0808", "building": "2栋", "floor": 8, "room_no": "0808", "area": 85.0, "bedrooms": 2, "living_rooms": 2, "bathrooms": 1, "orientation": "南北", "floor_level": "中楼层", "decoration": "豪华装修", "monthly_rent": 6800, "deposit_months": 2.0, "status": "reserved", "address": "朝阳区青年路88号", "description": "南北通透两居两卫，豪华装修", "facilities": "中央空调,洗衣机,冰箱,热水器,WiFi,沙发,电视,洗碗机", "tags": "豪华,南北通透,两卫"},
            {"apartment_no": "C-0302", "building": "3栋", "floor": 3, "room_no": "0302", "area": 55.0, "bedrooms": 1, "living_rooms": 1, "bathrooms": 1, "orientation": "南", "floor_level": "低楼层", "decoration": "精装修", "monthly_rent": 3800, "deposit_months": 1.0, "status": "vacant", "address": "海淀区中关村大街66号", "description": "南向大一居，带阳台", "facilities": "空调,洗衣机,冰箱,热水器,WiFi,阳台", "tags": "带阳台,近地铁,精装修"},
            {"apartment_no": "C-1501", "building": "3栋", "floor": 15, "room_no": "1501", "area": 110.0, "bedrooms": 3, "living_rooms": 2, "bathrooms": 2, "orientation": "南北", "floor_level": "高楼层", "decoration": "豪华装修", "monthly_rent": 8500, "deposit_months": 2.0, "status": "occupied", "address": "海淀区中关村大街66号", "description": "顶层三居室，视野极佳", "facilities": "中央空调,洗衣机,冰箱,热水器,WiFi,沙发,电视,洗碗机,烤箱", "tags": "三居室,顶层,豪华"},
            {"apartment_no": "D-0706", "building": "4栋", "floor": 7, "room_no": "0706", "area": 42.0, "bedrooms": 1, "living_rooms": 1, "bathrooms": 1, "orientation": "西", "floor_level": "中楼层", "decoration": "简装", "monthly_rent": 2800, "deposit_months": 1.0, "status": "maintenance", "address": "西城区西单北大街50号", "description": "西向一居室，维护中", "facilities": "空调,热水器", "tags": "维护中"},
            {"apartment_no": "D-0910", "building": "4栋", "floor": 9, "room_no": "0910", "area": 58.0, "bedrooms": 2, "living_rooms": 1, "bathrooms": 1, "orientation": "南", "floor_level": "高楼层", "decoration": "精装修", "monthly_rent": 4600, "deposit_months": 1.5, "status": "vacant", "address": "西城区西单北大街50号", "description": "南向两居室，采光充足", "facilities": "空调,洗衣机,冰箱,热水器,WiFi", "tags": "两居室,采光好,近地铁"},
            {"apartment_no": "E-0201", "building": "5栋", "floor": 2, "room_no": "0201", "area": 75.0, "bedrooms": 2, "living_rooms": 1, "bathrooms": 1, "orientation": "南北", "floor_level": "低楼层", "decoration": "精装修", "monthly_rent": 5500, "deposit_months": 1.5, "status": "decorating", "address": "丰台区方庄路30号", "description": "装修中，南北两居室", "facilities": "", "tags": "装修中,新装修"},
            {"apartment_no": "E-1108", "building": "5栋", "floor": 11, "room_no": "1108", "area": 95.0, "bedrooms": 3, "living_rooms": 2, "bathrooms": 2, "orientation": "南", "floor_level": "高楼层", "decoration": "精装修", "monthly_rent": 7200, "deposit_months": 2.0, "status": "occupied", "address": "丰台区方庄路30号", "description": "三居两卫，适合家庭居住", "facilities": "空调,洗衣机,冰箱,热水器,WiFi,沙发,电视", "tags": "三居室,家庭"},
        ]

        apartments = []
        for data in apartments_data:
            apt = Apartment(**data)
            db.add(apt)
            apartments.append(apt)
        db.flush()

        print("创建预约记录...")
        today = date.today()
        appointments_data = [
            {"apartment_id": apartments[0].id, "tenant_id": tenant1.id, "consultant_id": consultant1.id, "appointment_date": today + timedelta(days=1), "appointment_time": "10:00", "status": "confirmed", "tenant_name": "陈小明", "tenant_phone": "13900000001", "source_channel": "线上官网", "demand_description": "想找朝南一居室，预算3000左右", "remark": "客户希望尽快入住"},
            {"apartment_id": apartments[2].id, "tenant_id": tenant2.id, "consultant_id": None, "appointment_date": today + timedelta(days=2), "appointment_time": "14:00", "status": "pending", "tenant_name": "刘小姐", "tenant_phone": "13900000002", "source_channel": "朋友推荐", "demand_description": "预算2500以内，短期租住", "remark": ""},
            {"apartment_id": apartments[4].id, "tenant_id": None, "consultant_id": consultant2.id, "appointment_date": today, "appointment_time": "15:00", "status": "completed", "tenant_name": "王先生", "tenant_phone": "13900000003", "source_channel": "58同城", "demand_description": "中关村附近工作，需要一居室", "remark": "客户已看房，考虑中"},
            {"apartment_id": apartments[7].id, "tenant_id": tenant1.id, "consultant_id": consultant1.id, "appointment_date": today - timedelta(days=1), "appointment_time": "11:00", "status": "cancelled", "tenant_name": "陈小明", "tenant_phone": "13900000001", "source_channel": "链家", "demand_description": "换工作地点，需要换房", "cancel_reason": "客户临时有事", "remark": ""},
            {"apartment_id": apartments[1].id, "tenant_id": tenant2.id, "consultant_id": consultant2.id, "appointment_date": today + timedelta(days=3), "appointment_time": "09:00", "status": "confirmed", "tenant_name": "刘小姐", "tenant_phone": "13900000002", "source_channel": "贝壳找房", "demand_description": "两居室，和朋友合租", "remark": "客户对装修要求较高"},
        ]

        for data in appointments_data:
            apt = Appointment(**data)
            db.add(apt)
        db.flush()

        print("创建押金记录...")
        deposits_data = [
            {"apartment_id": apartments[1].id, "tenant_name": "赵先生", "tenant_phone": "13911110001", "id_card": "110101199001011234", "contract_no": "HT2024001", "amount": 7800, "status": "paid", "pay_date": today - timedelta(days=30), "remark": "押一付一"},
            {"apartment_id": apartments[5].id, "tenant_name": "李女士", "tenant_phone": "13911110002", "id_card": "110101199205012345", "contract_no": "HT2024002", "amount": 17000, "status": "paid", "pay_date": today - timedelta(days=60), "remark": "押二付三"},
            {"apartment_id": apartments[9].id, "tenant_name": "张先生一家", "tenant_phone": "13911110003", "id_card": "110101198803033456", "contract_no": "HT2024003", "amount": 14400, "status": "paid", "pay_date": today - timedelta(days=15), "remark": "家庭租住，签一年"},
            {"apartment_id": apartments[0].id, "tenant_name": "孙小姐", "tenant_phone": "13911110004", "id_card": "110101199512124567", "contract_no": "HT2023015", "amount": 3200, "status": "refunded", "pay_date": today - timedelta(days=90), "refund_date": today - timedelta(days=5), "refund_amount": 3200, "remark": "合同到期，全额退还"},
        ]

        for data in deposits_data:
            dep = Deposit(**data)
            db.add(dep)

        print("创建合同风险记录...")
        risks_data = [
            {"apartment_id": apartments[1].id, "tenant_name": "赵先生", "tenant_phone": "13911110001", "risk_type": "payment_delay", "risk_level": "medium", "description": "本月租金已逾期3天未缴纳，电话联系不上", "status": "pending", "created_by_id": cs.id},
            {"apartment_id": apartments[5].id, "tenant_name": "李女士", "tenant_phone": "13911110002", "risk_type": "noise", "risk_level": "low", "description": "邻居投诉周末晚上噪音扰民", "status": "resolved", "created_by_id": cs.id, "handled_by_id": cs.id, "handle_result": "已与租客沟通，租客表示会注意", "handle_reason": "租客朋友周末来访，已提醒"},
            {"apartment_id": apartments[9].id, "tenant_name": "张先生", "tenant_phone": "13911110003", "risk_type": "damage", "risk_level": "high", "description": "退租检查发现地板有多处划痕，墙面有涂鸦", "status": "processing", "created_by_id": cs.id, "handled_by_id": cs.id},
            {"tenant_name": "匿名投诉", "risk_type": "contract_violation", "risk_level": "high", "description": "租客涉嫌转租，违反合同条款", "status": "pending", "created_by_id": cs.id},
        ]

        for data in risks_data:
            risk = ContractRisk(**data)
            risk.risk_no = f"RISK{today.strftime('%Y%m%d')}{str(risks_data.index(data)+1).zfill(4)}"
            if "resolved" in data.get("status", ""):
                risk.closed_at = None
            db.add(risk)

        print("创建字典类型...")
        dict_types = [
            {"dict_code": "apartment_status", "dict_name": "房源状态", "description": "房源的状态枚举", "is_system": True},
            {"dict_code": "appointment_status", "dict_name": "预约状态", "description": "看房预约的状态", "is_system": True},
            {"dict_code": "appointment_source", "dict_name": "预约来源", "description": "客户预约的来源渠道"},
            {"dict_code": "risk_type", "dict_name": "风险类型", "description": "合同风险类型", "is_system": True},
            {"dict_code": "risk_level", "dict_name": "风险等级", "description": "风险严重程度", "is_system": True},
            {"dict_code": "deposit_status", "dict_name": "押金状态", "description": "押金状态枚举", "is_system": True},
            {"dict_code": "decoration_type", "dict_name": "装修类型", "description": "房源装修类型"},
            {"dict_code": "orientation", "dict_name": "朝向", "description": "房屋朝向枚举"},
        ]

        dict_type_objs = []
        for dt in dict_types:
            obj = DictType(**dt)
            db.add(obj)
            dict_type_objs.append(obj)
        db.flush()

        print("创建字典项...")
        dict_items_map = {
            "apartment_status": [
                {"item_label": "空置", "item_value": "vacant", "sort_order": 1, "is_default": True},
                {"item_label": "已租", "item_value": "occupied", "sort_order": 2},
                {"item_label": "已订", "item_value": "reserved", "sort_order": 3},
                {"item_label": "维护中", "item_value": "maintenance", "sort_order": 4},
                {"item_label": "装修中", "item_value": "decorating", "sort_order": 5},
            ],
            "appointment_status": [
                {"item_label": "待分配", "item_value": "pending", "sort_order": 1, "is_default": True},
                {"item_label": "已确认", "item_value": "confirmed", "sort_order": 2},
                {"item_label": "已完成", "item_value": "completed", "sort_order": 3},
                {"item_label": "已取消", "item_value": "cancelled", "sort_order": 4},
                {"item_label": "未到访", "item_value": "no_show", "sort_order": 5},
            ],
            "appointment_source": [
                {"item_label": "线上官网", "item_value": "online", "sort_order": 1},
                {"item_label": "朋友推荐", "item_value": "referral", "sort_order": 2},
                {"item_label": "58同城", "item_value": "58", "sort_order": 3},
                {"item_label": "贝壳找房", "item_value": "beike", "sort_order": 4},
                {"item_label": "链家", "item_value": "lianjia", "sort_order": 5},
                {"item_label": "其他", "item_value": "other", "sort_order": 99},
            ],
            "risk_type": [
                {"item_label": "租金逾期", "item_value": "payment_delay", "sort_order": 1},
                {"item_label": "合同违约", "item_value": "contract_violation", "sort_order": 2},
                {"item_label": "物品损坏", "item_value": "damage", "sort_order": 3},
                {"item_label": "噪音扰民", "item_value": "noise", "sort_order": 4},
                {"item_label": "其他", "item_value": "other", "sort_order": 99},
            ],
            "risk_level": [
                {"item_label": "低", "item_value": "low", "sort_order": 1},
                {"item_label": "中", "item_value": "medium", "sort_order": 2, "is_default": True},
                {"item_label": "高", "item_value": "high", "sort_order": 3},
                {"item_label": "严重", "item_value": "critical", "sort_order": 4},
            ],
            "deposit_status": [
                {"item_label": "已缴纳", "item_value": "paid", "sort_order": 1, "is_default": True},
                {"item_label": "已退还", "item_value": "refunded", "sort_order": 2},
                {"item_label": "已扣除", "item_value": "deducted", "sort_order": 3},
                {"item_label": "部分退还", "item_value": "partial_refunded", "sort_order": 4},
            ],
            "decoration_type": [
                {"item_label": "简装", "item_value": "简装", "sort_order": 1},
                {"item_label": "精装修", "item_value": "精装修", "sort_order": 2},
                {"item_label": "豪华装修", "item_value": "豪华装修", "sort_order": 3},
            ],
            "orientation": [
                {"item_label": "东", "item_value": "东", "sort_order": 1},
                {"item_label": "南", "item_value": "南", "sort_order": 2},
                {"item_label": "西", "item_value": "西", "sort_order": 3},
                {"item_label": "北", "item_value": "北", "sort_order": 4},
                {"item_label": "东南", "item_value": "东南", "sort_order": 5},
                {"item_label": "南北", "item_value": "南北", "sort_order": 6},
            ],
        }

        for dt in dict_type_objs:
            items = dict_items_map.get(dt.dict_code, [])
            for item_data in items:
                item = DictItem(dict_type_id=dt.id, **item_data)
                db.add(item)

        print("创建系统配置...")
        configs = [
            {"config_key": "appointment_reminder_hours", "config_value": "24", "config_name": "预约提醒提前小时数", "config_group": "reminder", "value_type": "number", "remark": "预约前多少小时发送提醒"},
            {"config_key": "vacancy_rate_warning", "config_value": "30", "config_name": "空置率告警阈值", "config_group": "threshold", "value_type": "number", "remark": "空置率超过该值时触发告警(%)"},
            {"config_key": "max_appointments_per_consultant", "config_value": "5", "config_name": "顾问每日最大预约数", "config_group": "appointment", "value_type": "number", "remark": "每个顾问每天最多可分配的预约数量"},
            {"config_key": "rent_overdue_days", "config_value": "3", "config_name": "租金逾期天数阈值", "config_group": "threshold", "value_type": "number", "remark": "租金逾期多少天触发风险"},
            {"config_key": "auto_assign_consultant", "config_value": "false", "config_name": "自动分配顾问", "config_group": "appointment", "value_type": "boolean", "remark": "是否开启预约自动分配顾问"},
            {"config_key": "reminder_frequency", "config_value": "daily", "config_name": "提醒频率", "config_group": "reminder", "value_type": "string", "remark": "系统提醒推送频率"},
            {"config_key": "site_title", "config_value": "青禾租赁服务台", "config_name": "站点名称", "config_group": "display", "value_type": "string", "remark": "网站标题显示名称"},
            {"config_key": "deposit_refund_days", "config_value": "7", "config_name": "押金退还周期", "config_group": "threshold", "value_type": "number", "remark": "退租后多少天内退还押金(工作日)"},
        ]

        for cfg in configs:
            db.add(SystemConfig(**cfg))

        print("创建空置历史记录...")
        for apt in apartments[:3]:
            vh = VacancyHistory(
                apartment_id=apt.id,
                from_status="occupied",
                to_status="vacant",
                change_date=today - timedelta(days=15),
                days_vacant=15,
                remark="合同到期，转为空置"
            )
            db.add(vh)

        print("提交数据...")
        db.commit()
        print("数据库初始化完成！")
        print("\n演示账号：")
        print("  管理员: admin / admin123")
        print("  顾问张: consultant / 123456")
        print("  顾问李: consultant2 / 123456")
        print("  客服: cs01 / 123456")
        print("  租客陈: tenant01 / 123456")
        print("  租客刘: tenant02 / 123456")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
