import asyncio
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import select

from app.database import async_session, init_db
from app.models import (
    PowerStation,
    Equipment,
    Alarm,
    AlarmResponse,
    ElectricityPrice,
    SubsidyRule,
    RevenueRecord,
    EnergyConsumption,
    Dictionary,
    DictionaryVersion,
    Reminder,
    ReminderVersion,
)


async def seed():
    await init_db()

    async with async_session() as db:
        result = await db.execute(select(PowerStation).limit(1))
        if result.scalar_one_or_none():
            print("Data already exists, skipping seed.")
            return

        station1 = PowerStation(
            name="华东光伏电站A",
            capacity_kw=5000.0,
            location="江苏省南京市江宁区",
        )
        station2 = PowerStation(
            name="华北光伏电站B",
            capacity_kw=8000.0,
            location="河北省石家庄市鹿泉区",
        )
        db.add_all([station1, station2])
        await db.flush()

        equip1 = Equipment(station_id=station1.id, name="1号逆变器", device_type="inverter", model="SUN2000-100KTL", status="normal")
        equip2 = Equipment(station_id=station1.id, name="2号逆变器", device_type="inverter", model="SUN2000-100KTL", status="fault")
        equip3 = Equipment(station_id=station2.id, name="1号变压器", device_type="transformer", model="S11-630/10", status="normal")
        equip4 = Equipment(station_id=station2.id, name="气象站", device_type="meter", model="WS-500", status="normal")
        db.add_all([equip1, equip2, equip3, equip4])
        await db.flush()

        alarm1 = Alarm(
            equipment_id=equip2.id,
            station_id=station1.id,
            alarm_type="overtemperature",
            severity="major",
            status="acknowledged",
            description="2号逆变器温度过高，超过85°C",
        )
        alarm2 = Alarm(
            equipment_id=equip3.id,
            station_id=station2.id,
            alarm_type="strategy_failure",
            severity="critical",
            status="pending",
            description="最大功率点跟踪策略失效，发电效率降低40%",
        )
        db.add_all([alarm1, alarm2])
        await db.flush()

        resp1 = AlarmResponse(
            alarm_id=alarm1.id,
            responder_id="张工",
            action="acknowledged",
            response_duration_seconds=300,
            notes="已确认告警，安排现场检查",
        )
        db.add(resp1)
        await db.flush()

        today = date.today()
        prices = [
            ElectricityPrice(station_id=station1.id, period_type="sharp_peak", price_per_kwh=1.2, effective_date=today - timedelta(days=90), created_by="管理员"),
            ElectricityPrice(station_id=station1.id, period_type="peak", price_per_kwh=0.95, effective_date=today - timedelta(days=90), created_by="管理员"),
            ElectricityPrice(station_id=station1.id, period_type="flat", price_per_kwh=0.65, effective_date=today - timedelta(days=90), created_by="管理员"),
            ElectricityPrice(station_id=station1.id, period_type="valley", price_per_kwh=0.35, effective_date=today - timedelta(days=90), created_by="管理员"),
            ElectricityPrice(station_id=station2.id, period_type="sharp_peak", price_per_kwh=1.15, effective_date=today - timedelta(days=60), created_by="管理员"),
            ElectricityPrice(station_id=station2.id, period_type="peak", price_per_kwh=0.90, effective_date=today - timedelta(days=60), created_by="管理员"),
            ElectricityPrice(station_id=station2.id, period_type="flat", price_per_kwh=0.60, effective_date=today - timedelta(days=60), created_by="管理员"),
            ElectricityPrice(station_id=station2.id, period_type="valley", price_per_kwh=0.30, effective_date=today - timedelta(days=60), created_by="管理员"),
        ]
        db.add_all(prices)

        subsidies = [
            SubsidyRule(station_id=station1.id, rule_name="国家度电补贴", subsidy_type="national", rate_per_kwh=0.08, effective_date=today - timedelta(days=180), created_by="管理员"),
            SubsidyRule(station_id=station1.id, rule_name="省级补贴", subsidy_type="provincial", rate_per_kwh=0.05, effective_date=today - timedelta(days=180), created_by="管理员"),
            SubsidyRule(station_id=station2.id, rule_name="国家度电补贴", subsidy_type="national", rate_per_kwh=0.08, effective_date=today - timedelta(days=120), created_by="管理员"),
            SubsidyRule(station_id=station2.id, rule_name="绿证收益", subsidy_type="green_certificate", rate_per_kwh=0.03, effective_date=today - timedelta(days=90), created_by="管理员", description="绿证交易市场收益"),
        ]
        db.add_all(subsidies)
        await db.flush()

        for i in range(30):
            d = today - timedelta(days=i)
            gen1 = 5000 * 4.5 * (1 - 0.01 * i % 10)
            cons1 = gen1 * 0.3
            grid1 = gen1 - cons1
            elec_rev1 = grid1 * 0.75
            sub_rev1 = gen1 * 0.13
            peak1 = 4500 - (i % 5) * 200
            rev1 = RevenueRecord(
                station_id=station1.id,
                record_date=d,
                generation_kwh=round(gen1, 2),
                consumption_kwh=round(cons1, 2),
                grid_feed_kwh=round(grid1, 2),
                electricity_revenue=round(elec_rev1, 2),
                subsidy_revenue=round(sub_rev1, 2),
                total_revenue=round(elec_rev1 + sub_rev1, 2),
                peak_load_kw=float(peak1),
            )

            gen2 = 8000 * 4.2 * (1 - 0.01 * i % 8)
            cons2 = gen2 * 0.25
            grid2 = gen2 - cons2
            elec_rev2 = grid2 * 0.70
            sub_rev2 = gen2 * 0.11
            peak2 = 7200 - (i % 4) * 300
            rev2 = RevenueRecord(
                station_id=station2.id,
                record_date=d,
                generation_kwh=round(gen2, 2),
                consumption_kwh=round(cons2, 2),
                grid_feed_kwh=round(grid2, 2),
                electricity_revenue=round(elec_rev2, 2),
                subsidy_revenue=round(sub_rev2, 2),
                total_revenue=round(elec_rev2 + sub_rev2, 2),
                peak_load_kw=float(peak2),
            )
            db.add_all([rev1, rev2])

        for i in range(96):
            t = datetime.combine(today, datetime.min.time()) + timedelta(minutes=15 * i)
            power1 = 5000 * max(0, min(1, (i - 20) / 30)) * (1 - 0.1 * (i % 5))
            ec1 = EnergyConsumption(
                station_id=station1.id,
                record_time=t,
                active_power_kw=round(power1, 2),
                reactive_power_kvar=round(power1 * 0.05, 2),
                irradiance_w_m2=round(max(0, 800 * min(1, (i - 20) / 30)), 2),
                temperature_c=round(25 + 10 * min(1, (i - 20) / 30), 1),
            )
            power2 = 8000 * max(0, min(1, (i - 22) / 28)) * (1 - 0.08 * (i % 4))
            ec2 = EnergyConsumption(
                station_id=station2.id,
                record_time=t,
                active_power_kw=round(power2, 2),
                reactive_power_kvar=round(power2 * 0.04, 2),
                irradiance_w_m2=round(max(0, 750 * min(1, (i - 22) / 28)), 2),
                temperature_c=round(23 + 12 * min(1, (i - 22) / 28), 1),
            )
            db.add_all([ec1, ec2])

        dicts = [
            Dictionary(dict_code="alarm_type", dict_key="overcurrent", dict_value="过流", label="告警类型-过流", sort_order=1),
            Dictionary(dict_code="alarm_type", dict_key="overvoltage", dict_value="过压", label="告警类型-过压", sort_order=2),
            Dictionary(dict_code="alarm_type", dict_key="overtemperature", dict_value="过温", label="告警类型-过温", sort_order=3),
            Dictionary(dict_code="alarm_type", dict_key="communication_fault", dict_value="通信故障", label="告警类型-通信故障", sort_order=4),
            Dictionary(dict_code="alarm_type", dict_key="insulation", dict_value="绝缘故障", label="告警类型-绝缘故障", sort_order=5),
            Dictionary(dict_code="alarm_type", dict_key="strategy_failure", dict_value="策略失效", label="告警类型-策略失效", sort_order=6),
            Dictionary(dict_code="device_type", dict_key="inverter", dict_value="逆变器", label="设备类型-逆变器", sort_order=1),
            Dictionary(dict_code="device_type", dict_key="panel", dict_value="光伏板", label="设备类型-光伏板", sort_order=2),
            Dictionary(dict_code="device_type", dict_key="meter", dict_value="电表", label="设备类型-电表", sort_order=3),
            Dictionary(dict_code="device_type", dict_key="transformer", dict_value="变压器", label="设备类型-变压器", sort_order=4),
            Dictionary(dict_code="period_type", dict_key="sharp_peak", dict_value="尖峰", label="时段-尖峰", sort_order=1),
            Dictionary(dict_code="period_type", dict_key="peak", dict_value="高峰", label="时段-高峰", sort_order=2),
            Dictionary(dict_code="period_type", dict_key="flat", dict_value="平段", label="时段-平段", sort_order=3),
            Dictionary(dict_code="period_type", dict_key="valley", dict_value="谷段", label="时段-谷段", sort_order=4),
            Dictionary(dict_code="subsidy_type", dict_key="national", dict_value="国家补贴", label="补贴-国家", sort_order=1),
            Dictionary(dict_code="subsidy_type", dict_key="provincial", dict_value="省级补贴", label="补贴-省级", sort_order=2),
            Dictionary(dict_code="subsidy_type", dict_key="local", dict_value="地方补贴", label="补贴-地方", sort_order=3),
            Dictionary(dict_code="subsidy_type", dict_key="green_certificate", dict_value="绿证收益", label="补贴-绿证", sort_order=4),
        ]
        db.add_all(dicts)
        await db.flush()

        reminders = [
            Reminder(station_id=station1.id, title="逆变器温度预警", content="2号逆变器持续高温运行，请尽快安排检修", reminder_type="alarm_threshold", severity="warning", target_role="field_worker", created_by="系统"),
            Reminder(station_id=station2.id, title="补贴政策即将到期", content="省级补贴政策将于下月到期，请及时更新规则", reminder_type="subsidy_expiry", severity="warning", target_role="admin", created_by="系统"),
            Reminder(title="月度巡检提醒", content="请安排本月光伏电站巡检工作", reminder_type="inspection", severity="info", target_role="operator", created_by="管理员"),
        ]
        db.add_all(reminders)

        await db.commit()
        print("Seed data created successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
