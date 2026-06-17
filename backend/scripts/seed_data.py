import sys
import os
from datetime import datetime, timedelta, date
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app import models


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("数据库表已重建")


def seed_data():
    db = SessionLocal()
    try:
        user = models.User(
            username="admin",
            full_name="张工",
            role="technician",
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        )
        db.add(user)
        db.flush()
        print("用户创建完成")

        plot_names = [
            ("A-01", "一号大棚", 5.2, "solar_greenhouse", "东区1号"),
            ("A-02", "二号大棚", 4.8, "solar_greenhouse", "东区2号"),
            ("B-01", "三号大棚", 6.0, "multi_span", "西区1号"),
            ("B-02", "四号大棚", 5.5, "plastic_tunnel", "西区2号"),
            ("C-01", "五号大棚", 3.8, "glass_greenhouse", "南区1号"),
        ]
        plots = []
        for code, name, area, gh_type, location in plot_names:
            plot = models.Plot(
                name=name,
                code=code,
                area=area,
                greenhouse_type=gh_type,
                location=location,
                status="active",
                description=f"{name}生产大棚",
            )
            db.add(plot)
            plots.append(plot)
        db.flush()
        print("地块创建完成")

        varieties_data = [
            ("TOM-001", "番茄-粉丽人", "solanaceous", 90, 18, 28, 60, 80, 1.5, "粉果番茄，口感佳"),
            ("CUC-001", "黄瓜-津优1号", "cucurbit", 60, 20, 30, 70, 90, 2.0, "密刺黄瓜，产量高"),
            ("PEP-001", "青椒-苏椒5号", "solanaceous", 80, 20, 28, 65, 85, 0.8, "薄皮青椒，辣味适中"),
            ("EGG-001", "茄子-紫妃", "solanaceous", 85, 22, 30, 60, 80, 1.2, "紫皮长茄，肉质细嫩"),
            ("LET-001", "生菜-意大利耐抽薹", "leafy", 45, 15, 22, 70, 85, 0.3, "散叶生菜，口感脆嫩"),
        ]
        varieties = []
        for code, name, cat, days, tmin, tmax, hmin, hmax, ey, desc in varieties_data:
            v = models.Variety(
                name=name,
                code=code,
                category=cat,
                growth_cycle_days=days,
                optimal_temp_min=tmin,
                optimal_temp_max=tmax,
                optimal_humidity_min=hmin,
                optimal_humidity_max=hmax,
                expected_yield=ey,
                description=desc,
            )
            db.add(v)
            varieties.append(v)
        db.flush()
        print("品种创建完成")

        batches_data = [
            ("B2025001", 0, 0, -30, 60, "growing", 2000, 2500, None, "定植顺利，长势良好", "正常生长中"),
            ("B2025002", 1, 1, -20, 40, "growing", 1500, 2800, None, "瓜苗整齐", "初花期"),
            ("B2025003", 2, 2, -45, 35, "harvesting", 3000, 2200, 1800, "开始采收", "已采收两批"),
            ("B2025004", 0, 3, -15, 70, "growing", 1800, 2000, None, "幼苗期", "刚移栽"),
            ("B2025005", 3, 4, -10, 35, "growing", 5000, 1400, None, "生长正常", "莲座期"),
            ("B2024012", 1, 0, -100, -10, "harvested", 2200, 3000, 2850, "产量达标", "已清园"),
            ("B2024013", 2, 1, -120, -60, "harvested", 1600, 3500, 3200, "高产批次", "已结束"),
        ]
        batches = []
        for bn, pi, vi, pdo, ehdo, status, pq, py, ay, remark, pres in batches_data:
            plant_date = date.today() + timedelta(days=pdo)
            expected = date.today() + timedelta(days=ehdo)
            actual = expected if status == "harvested" else None
            batch = models.Batch(
                batch_no=bn,
                plot_id=plots[pi].id,
                variety_id=varieties[vi].id,
                plant_date=plant_date,
                expected_harvest_date=expected,
                actual_harvest_date=actual,
                status=status,
                planting_quantity=pq,
                predicted_yield=py,
                actual_yield=ay,
                remark=remark,
                process_result=pres,
            )
            db.add(batch)
            batches.append(batch)
        db.flush()
        print("批次创建完成")

        for i, plot in enumerate(plots):
            base_temp = 22 + random.uniform(-2, 2)
            base_hum = 70 + random.uniform(-5, 5)
            for h in range(48):
                record_time = datetime.now() - timedelta(hours=48 - h)
                temp_variation = 3 * ((h % 24) - 12) / 12
                temp = round(base_temp + temp_variation + random.uniform(-0.5, 0.5), 1)
                hum = round(base_hum + random.uniform(-3, 3), 1)

                if i == 0 and h < 5:
                    temp = round(base_temp + 6 + random.uniform(-0.5, 0.5), 1)

                env = models.EnvironmentData(
                    plot_id=plot.id,
                    temperature=temp,
                    humidity=hum,
                    soil_moisture=round(45 + random.uniform(-10, 10), 1),
                    light_intensity=round(8000 + random.uniform(-3000, 5000), 0),
                    co2_concentration=round(500 + random.uniform(-100, 150), 0),
                    record_time=record_time,
                )
                db.add(env)
        db.flush()
        print("环境数据创建完成")

        alert_types = [
            ("temperature_high", "danger", "temperature", "温度过高警报"),
            ("humidity_low", "warning", "humidity", "湿度偏低提醒"),
            ("temperature_high", "warning", "temperature", "温度偏高提醒"),
        ]
        for i, (atype, level, metric, msg) in enumerate(alert_types):
            alert = models.EnvironmentAlert(
                plot_id=plots[i % 3].id,
                alert_type=atype,
                alert_level=level,
                metric=metric,
                current_value=35.5 if "temperature" in atype else 55.0,
                threshold_min=18 if "temperature" in atype else 60,
                threshold_max=28 if "temperature" in atype else 85,
                message=msg,
                is_handled=(i == 2),
                handled_by=user.id if i == 2 else None,
                handled_at=datetime.now() - timedelta(hours=2) if i == 2 else None,
            )
            db.add(alert)
        db.flush()
        print("环境提醒创建完成")

        order_statuses = ["pending", "processing", "completed", "pending"]
        for i in range(6):
            order = models.SortingOrder(
                order_no=f"SO2025{str(i+1).zfill(4)}",
                batch_id=batches[i % len(batches)].id,
                quantity=round(random.uniform(50, 500), 1),
                unit="kg",
                quality_level=["grade1", "grade2", "grade3"][i % 3],
                target_market=["北京新发地", "上海江桥", "广州江南", "深圳海吉星"][i % 4],
                status=order_statuses[i % len(order_statuses)],
                handler_id=user.id,
                scheduled_time=datetime.now() + timedelta(days=i - 1),
                completed_time=datetime.now() - timedelta(hours=2) if i % 3 == 2 else None,
                remark=f"第{i+1}批分拣订单",
            )
            db.add(order)
        db.flush()
        print("分拣订单创建完成")

        machines = [
            ("东方红-LX804", "tillage", "王师傅", "耕地作业"),
            ("精量播种机", "seeding", "李师傅", "播种作业"),
            ("喷灌系统", "irrigation", "赵师傅", "灌溉施肥"),
            ("植保无人机", "plant_protection", "孙师傅", "病虫害防治"),
            ("采摘运输车", "transport", "周师傅", "采收运输"),
        ]
        for i, (mname, mtype, oper, purpose) in enumerate(machines):
            res = models.MachineReservation(
                reservation_no=f"MR2025{str(i+1).zfill(4)}",
                machine_name=mname,
                machine_type=mtype,
                applicant="张工",
                plot_id=plots[i % len(plots)].id,
                purpose=purpose,
                start_time=datetime.now() + timedelta(days=i, hours=8),
                end_time=datetime.now() + timedelta(days=i, hours=12),
                status=["pending", "confirmed", "processing", "completed", "pending"][i],
                operator=oper,
                remark=f"第{i+1}号预约",
            )
            db.add(res)
        db.flush()
        print("农机预约创建完成")

        record_types = [
            ("planting", "定植作业", "完成番茄定植，株距30cm，行距60cm"),
            ("watering", "浇水灌溉", "滴灌2小时，土壤湿度提升至65%"),
            ("fertilizing", "施肥作业", "施用复合肥20kg/亩，随滴灌冲施"),
            ("pest_control", "病虫害防治", "喷施吡虫啉防治蚜虫，浓度2000倍"),
            ("pruning", "整枝打杈", "摘除侧枝，保留主蔓结果"),
            ("inspection", "日常巡查", "整体长势良好，少量蚜虫已防治"),
            ("harvesting", "采收记录", "采收番茄300kg，一级果220kg"),
            ("environment", "环境调控", "开通风口降温，温度由32℃降至26℃"),
        ]
        for i, (rtype, title, content) in enumerate(record_types):
            batch_idx = i % len(batches)
            record = models.FarmRecord(
                record_no=f"FR2025{str(i+1).zfill(4)}",
                batch_id=batches[batch_idx].id,
                record_type=rtype,
                title=title,
                content=content,
                operator_id=user.id,
                record_time=datetime.now() - timedelta(days=i, hours=random.randint(1, 10)),
                weather=["sunny", "cloudy", "sunny", "overcast", "sunny"][i % 5],
                materials_used="复合肥20kg/亩" if rtype == "fertilizing" else "",
            )
            db.add(record)
        db.flush()
        print("农事记录创建完成")

        todo_titles = [
            ("检查A-01大棚高温异常", "high", "environment", "今天18:00前"),
            ("B2025001批次整枝打杈", "medium", "daily_check", "明天上午"),
            ("采购病虫害防治药剂", "low", "other", "本周内"),
            ("B2025002批次施肥", "medium", "daily_check", "后天"),
            ("农机保养维护", "medium", "equipment", "3天后"),
            ("B2025003批次采收计划", "high", "harvest_prep", "2天后"),
            ("新批次育苗准备", "low", "other", "下周"),
        ]
        for i, (title, priority, cat, due_desc) in enumerate(todo_titles):
            due_hours = [6, 24, 72, 48, 96, 36, 168]
            todo = models.TodoItem(
                title=title,
                description=f"{title} - {due_desc}完成",
                priority=priority,
                category=cat,
                related_type="batch" if "batch" in title.lower() or "B2025" in title else "",
                related_id=batches[i % len(batches)].id if "B" in title else None,
                due_time=datetime.now() + timedelta(hours=due_hours[i]),
                is_completed=(i == 6),
                completed_at=datetime.now() - timedelta(hours=5) if i == 6 else None,
                assignee="张工",
            )
            db.add(todo)
        db.flush()
        print("待办事项创建完成")

        db.commit()
        print("所有数据初始化完成！")

    except Exception as e:
        db.rollback()
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_data()
