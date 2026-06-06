import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app import models, auth


def seed_data():
    db = SessionLocal()

    try:
        if db.query(models.User).count() > 0:
            print("Database already has data, skipping seeding.")
            return

        admin = models.User(
            username="admin",
            email="admin@running.com",
            full_name="系统管理员",
            hashed_password=auth.get_password_hash("admin123"),
            role=models.UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)

        coach = models.User(
            username="coach",
            email="coach@running.com",
            full_name="李教练",
            phone="13800000001",
            hashed_password=auth.get_password_hash("coach123"),
            role=models.UserRole.COACH,
            is_active=True
        )
        db.add(coach)

        runner1 = models.User(
            username="runner1",
            email="runner1@running.com",
            full_name="张小明",
            phone="13800000002",
            hashed_password=auth.get_password_hash("runner123"),
            role=models.UserRole.RUNNER,
            is_active=True
        )
        db.add(runner1)

        runner2 = models.User(
            username="runner2",
            email="runner2@running.com",
            full_name="王小红",
            phone="13800000003",
            hashed_password=auth.get_password_hash("runner123"),
            role=models.UserRole.RUNNER,
            is_active=True
        )
        db.add(runner2)

        runner3 = models.User(
            username="runner3",
            email="runner3@running.com",
            full_name="刘大力",
            phone="13800000004",
            hashed_password=auth.get_password_hash("runner123"),
            role=models.UserRole.RUNNER,
            is_active=True
        )
        db.add(runner3)

        db.flush()

        profile1 = models.RunnerProfile(
            user_id=runner1.id,
            age=28,
            gender="男",
            weight=65.0,
            height=175.0,
            weekly_mileage=30.0,
            target_race="上海马拉松",
            target_date=datetime.now() + timedelta(days=90)
        )
        db.add(profile1)

        profile2 = models.RunnerProfile(
            user_id=runner2.id,
            age=25,
            gender="女",
            weight=55.0,
            height=165.0,
            weekly_mileage=25.0,
            target_race="北京马拉松",
            target_date=datetime.now() + timedelta(days=120)
        )
        db.add(profile2)

        db.flush()

        pace_zones1 = [
            models.PaceZone(runner_profile_id=profile1.id, zone_name="恢复跑", min_pace="7:00", max_pace="8:00", description="轻松恢复"),
            models.PaceZone(runner_profile_id=profile1.id, zone_name="有氧跑", min_pace="5:30", max_pace="6:30", description="基础耐力"),
            models.PaceZone(runner_profile_id=profile1.id, zone_name="马拉松配速", min_pace="4:45", max_pace="5:15", description="比赛配速"),
            models.PaceZone(runner_profile_id=profile1.id, zone_name="间歇跑", min_pace="4:00", max_pace="4:30", description="高强度训练"),
        ]
        db.add_all(pace_zones1)

        plan1 = models.TrainingPlan(
            title="周一轻松跑",
            description="恢复性慢跑，保持轻松的配速",
            plan_date=datetime.now() + timedelta(days=1),
            distance_km=8.0,
            target_pace="6:30",
            warm_up="10分钟慢跑",
            main_set="6公里轻松跑",
            cool_down="10分钟步行拉伸",
            created_by=coach.id,
            is_published=True
        )
        db.add(plan1)

        plan2 = models.TrainingPlan(
            title="周三间歇训练",
            description="高强度间歇训练，提升速度耐力",
            plan_date=datetime.now() + timedelta(days=3),
            distance_km=12.0,
            target_pace="4:30",
            warm_up="2公里热身",
            main_set="8组400米间歇，组间休息2分钟",
            cool_down="2公里放松跑",
            created_by=coach.id,
            is_published=True
        )
        db.add(plan2)

        plan3 = models.TrainingPlan(
            title="周日长距离",
            description="周末长距离拉练，积累跑量",
            plan_date=datetime.now() + timedelta(days=6),
            distance_km=18.0,
            target_pace="5:45",
            warm_up="15分钟热身",
            main_set="16公里 LSD 跑",
            cool_down="10分钟拉伸",
            created_by=coach.id,
            is_published=False
        )
        db.add(plan3)

        db.flush()

        checkin1 = models.Checkin(
            runner_id=runner1.id,
            training_plan_id=plan1.id,
            distance_km=8.2,
            duration_seconds=3200,
            avg_pace="6:29",
            avg_heart_rate=145,
            perceived_effort=5,
            notes="今天状态不错，跑的很轻松",
            location_alias="朝阳公园",
            track_points=[{"lat": 39.93, "lng": 116.47}, {"lat": 39.94, "lng": 116.48}],
            status=models.TaskStatus.PENDING_CONFIRM
        )
        db.add(checkin1)

        checkin2 = models.Checkin(
            runner_id=runner2.id,
            distance_km=5.0,
            duration_seconds=2100,
            avg_pace="7:00",
            avg_heart_rate=135,
            perceived_effort=4,
            notes="恢复跑",
            location_alias="奥森公园",
            status=models.TaskStatus.IN_PROGRESS
        )
        db.add(checkin2)

        checkin3 = models.Checkin(
            runner_id=runner3.id,
            distance_km=10.0,
            duration_seconds=3000,
            avg_pace="5:00",
            avg_heart_rate=175,
            perceived_effort=9,
            notes="配速可能不准，需要复核",
            location_alias="世纪公园",
            status=models.TaskStatus.EXCEPTION_REVIEW
        )
        db.add(checkin3)

        db.flush()

        activity1 = models.Activity(
            title="城市夜跑活动",
            description="每周四城市夜跑，欢迎所有跑友参加",
            activity_date=datetime.now() + timedelta(days=4),
            meeting_point="天安门广场东",
            max_participants=50,
            registration_deadline=datetime.now() + timedelta(days=3),
            created_by=coach.id,
            is_published=True
        )
        db.add(activity1)

        activity2 = models.Activity(
            title="半马测试赛",
            description="内部半程马拉松测试，检验训练成果",
            activity_date=datetime.now() + timedelta(days=14),
            meeting_point="奥林匹克公园",
            max_participants=30,
            registration_deadline=datetime.now() + timedelta(days=10),
            created_by=coach.id,
            is_published=True
        )
        db.add(activity2)

        db.flush()

        signup1 = models.ActivitySignup(
            activity_id=activity1.id,
            runner_id=runner1.id,
            emergency_contact="张三",
            emergency_phone="13900000001",
            status=models.TaskStatus.PENDING_CONFIRM
        )
        db.add(signup1)

        signup2 = models.ActivitySignup(
            activity_id=activity1.id,
            runner_id=runner2.id,
            emergency_contact="李四",
            emergency_phone="13900000002",
            status=models.TaskStatus.PENDING_CONFIRM
        )
        db.add(signup2)

        injury1 = models.InjuryNote(
            runner_id=runner3.id,
            reported_by=coach.id,
            injury_type="右膝外侧疼痛",
            injury_date=datetime.now() - timedelta(days=3),
            severity="moderate",
            notes="跑步时右膝外侧疼痛，休息后缓解，怀疑髂胫束综合征",
            treatment_notes="建议冰敷、减少跑量、加强臀部力量训练",
            expected_recovery_date=datetime.now() + timedelta(days=4),
            is_active=True,
            is_resolved=False
        )
        db.add(injury1)

        task1 = models.Task(
            title="审核新训练计划",
            task_type=models.TaskType.TRAINING_PLAN,
            status=models.TaskStatus.NEW,
            related_id=plan3.id,
            priority=1
        )
        db.add(task1)

        task2 = models.Task(
            title="待确认打卡: 张小明 - 8.2km",
            task_type=models.TaskType.CHECKIN,
            status=models.TaskStatus.PENDING_CONFIRM,
            related_id=checkin1.id,
            priority=2
        )
        db.add(task2)

        task3 = models.Task(
            title="活动报名待确认: 张小明 - 城市夜跑",
            task_type=models.TaskType.ACTIVITY_SIGNUP,
            status=models.TaskStatus.PENDING_CONFIRM,
            related_id=signup1.id,
            priority=1
        )
        db.add(task3)

        task4 = models.Task(
            title="异常打卡复核: 刘大力 - 10.0km",
            task_type=models.TaskType.CHECKIN,
            status=models.TaskStatus.EXCEPTION_REVIEW,
            related_id=checkin3.id,
            priority=3
        )
        db.add(task4)

        task5 = models.Task(
            title="伤病恢复评估: 刘大力",
            task_type=models.TaskType.INJURY_REPORT,
            status=models.TaskStatus.IN_PROGRESS,
            related_id=injury1.id,
            priority=2
        )
        db.add(task5)

        notification1 = models.Notification(
            user_id=coach.id,
            title="新打卡待审核",
            message="张小明提交了8.2公里打卡，请及时审核",
            notification_type="checkin",
            is_read=False,
            retry_count=0,
            max_retries=3
        )
        db.add(notification1)

        db.commit()
        print("Seed data created successfully!")
        print("Accounts:")
        print("  admin / admin123 (管理员)")
        print("  coach / coach123 (教练)")
        print("  runner1 / runner123 (跑友)")
        print("  runner2 / runner123 (跑友)")
        print("  runner3 / runner123 (跑友)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
