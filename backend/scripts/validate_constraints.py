#!/usr/bin/env python3
"""
民宿保洁和维修派单系统 - 数据约束和业务流程验证脚本
验证核心业务规则：
1. 保洁完成前不能开放下一位客人入住
2. 任务状态流转约束
3. 房态锁定规则
4. 资源调度逻辑
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.core.exceptions import BusinessException
from app.models import (
    User, UserRole,
    Property, PropertyStatus,
    RoomStatus, RoomStatusType,
    CleaningTask, CleaningTaskStatus,
    MaintenanceOrder, MaintenanceOrderStatus,
)
from app.services.task_service import TaskService


def test_room_status_lock_rule():
    """验证：保洁完成前不能开放下一位客人入住"""
    print("\n" + "="*60)
    print("测试1: 房态锁定规则 - 保洁完成前不能开放入住")
    print("="*60)

    db = SessionLocal()
    try:
        prop = db.query(Property).first()
        if not prop:
            prop = Property(
                name="测试房源-验证",
                community="测试小区",
                room_number="999",
                status=PropertyStatus.ACTIVE
            )
            db.add(prop)
            db.commit()
            db.refresh(prop)

        today = datetime.now().date()

        rs = db.query(RoomStatus).filter(
            RoomStatus.property_id == prop.id,
            RoomStatus.date == today
        ).first()
        if not rs:
            rs = RoomStatus(
                property_id=prop.id,
                date=today,
                status=RoomStatusType.CHECKED_OUT
            )
            db.add(rs)
            db.commit()
            db.refresh(rs)

        task = None
        existing_task = db.query(CleaningTask).filter(
            CleaningTask.property_id == prop.id
        ).first()
        if not existing_task:
            cleaner = db.query(User).filter(User.role == UserRole.CLEANER).first()
            if not cleaner:
                cleaner = User(
                    username="test_cleaner",
                    full_name="测试保洁员",
                    role=UserRole.CLEANER,
                    hashed_password=get_password_hash("test123")
                )
                db.add(cleaner)
                db.commit()
                db.refresh(cleaner)

            task_no = TaskService.generate_task_no()
            task = CleaningTask(
                task_no=task_no,
                property_id=prop.id,
                cleaner_id=cleaner.id,
                created_by=1,
                status=CleaningTaskStatus.IN_PROGRESS,
                scheduled_time=datetime.now(),
                deadline_time=datetime.now() + timedelta(hours=4)
            )
            db.add(task)
            rs.status = RoomStatusType.CLEANING
            rs.current_cleaning_task_id = task.id
            db.commit()
            db.refresh(task)
            db.refresh(rs)
        else:
            task = existing_task

        print(f"房源: {prop.name}")
        print(f"当前房态: {rs.status}")
        print(f"保洁任务状态: {task.status}")

        can_check_in = TaskService.can_check_in(db, prop.id, today)
        print(f"能否入住: {can_check_in}")
        assert can_check_in == False, "保洁进行中时应该不能入住！"
        print("✓ 验证通过: 保洁进行中时无法入住")

        task.status = CleaningTaskStatus.SUBMITTED
        rs.status = RoomStatusType.CLEANING_COMPLETED
        db.commit()

        can_check_in = TaskService.can_check_in(db, prop.id, today)
        print(f"保洁提交后房态: {rs.status}, 能否入住: {can_check_in}")
        assert can_check_in == False, "保洁提交未验收时应该不能入住！"
        print("✓ 验证通过: 保洁未验收时无法入住")

        task.status = CleaningTaskStatus.APPROVED
        task.completed_at = datetime.now()
        rs.status = RoomStatusType.AVAILABLE
        rs.current_cleaning_task_id = None
        db.commit()

        can_check_in = TaskService.can_check_in(db, prop.id, today)
        print(f"保洁验收后房态: {rs.status}, 能否入住: {can_check_in}")
        assert can_check_in == True, "保洁验收通过后应该可以入住！"
        print("✓ 验证通过: 保洁验收通过后可以入住")

        print("\n测试1通过: 房态锁定规则验证成功 ✓")
        return True

    except AssertionError as e:
        print(f"✗ 验证失败: {e}")
        return False
    except Exception as e:
        print(f"✗ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_task_status_transition():
    """验证：任务状态流转约束"""
    print("\n" + "="*60)
    print("测试2: 任务状态流转约束")
    print("="*60)

    db = SessionLocal()
    try:
        cleaner = db.query(User).filter(User.role == UserRole.CLEANER).first()
        manager = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.MANAGER])).first()
        prop = db.query(Property).first()

        if not cleaner:
            cleaner = User(username="tc2", full_name="测试保洁2", role=UserRole.CLEANER, hashed_password=get_password_hash("123"))
            db.add(cleaner)
            db.commit()
            db.refresh(cleaner)
        if not manager:
            manager = User(username="tm2", full_name="测试经理", role=UserRole.MANAGER, hashed_password=get_password_hash("123"))
            db.add(manager)
            db.commit()
            db.refresh(manager)
        if not prop:
            prop = Property(name="测试房源2", community="测试小区", room_number="888", status=PropertyStatus.ACTIVE)
            db.add(prop)
            db.commit()
            db.refresh(prop)

        task_no = TaskService.generate_task_no()
        task = CleaningTask(
            task_no=task_no,
            property_id=prop.id,
            created_by=manager.id,
            status=CleaningTaskStatus.PENDING,
            scheduled_time=datetime.now(),
            deadline_time=datetime.now() + timedelta(hours=4)
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        print(f"创建任务: {task.task_no}, 状态: {task.status}")

        task = TaskService.assign_cleaning_task(db, task.id, cleaner.id, manager.id)
        print(f"分配后状态: {task.status}")
        assert task.status == CleaningTaskStatus.ASSIGNED
        print("✓ PENDING -> ASSIGNED 流转正确")

        task = TaskService.start_cleaning_task(db, task.id, cleaner.id)
        print(f"开始后状态: {task.status}")
        assert task.status == CleaningTaskStatus.IN_PROGRESS
        print("✓ ASSIGNED -> IN_PROGRESS 流转正确")

        task = TaskService.submit_cleaning_task(db, task.id, cleaner.id, "打扫完成")
        print(f"提交后状态: {task.status}")
        assert task.status == CleaningTaskStatus.SUBMITTED
        print("✓ IN_PROGRESS -> SUBMITTED 流转正确")

        task = TaskService.approve_cleaning_task(db, task.id, manager.id, "验收通过")
        print(f"验收后状态: {task.status}")
        assert task.status == CleaningTaskStatus.APPROVED
        print("✓ SUBMITTED -> APPROVED 流转正确")

        print("\n测试2通过: 任务状态流转约束验证成功 ✓")
        return True

    except AssertionError as e:
        print(f"✗ 验证失败: {e}")
        return False
    except Exception as e:
        print(f"✗ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_invalid_transition_should_fail():
    """验证：非法状态流转应该被拒绝"""
    print("\n" + "="*60)
    print("测试3: 非法状态流转应该被拒绝")
    print("="*60)

    db = SessionLocal()
    try:
        cleaner = db.query(User).filter(User.role == UserRole.CLEANER).first()
        manager = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.MANAGER])).first()
        prop = db.query(Property).first()

        task_no = TaskService.generate_task_no()
        task = CleaningTask(
            task_no=task_no,
            property_id=prop.id,
            created_by=manager.id,
            cleaner_id=cleaner.id,
            status=CleaningTaskStatus.APPROVED,
            scheduled_time=datetime.now(),
            deadline_time=datetime.now() + timedelta(hours=4)
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        print(f"任务状态: {task.status} (已完成)")

        try:
            TaskService.start_cleaning_task(db, task.id, cleaner.id)
            print("✗ 验证失败: 已完成的任务不应该能开始")
            return False
        except BusinessException as e:
            print(f"✓ 验证通过: {e.message}")

        try:
            TaskService.submit_cleaning_task(db, task.id, cleaner.id)
            print("✗ 验证失败: 已完成的任务不应该能提交")
            return False
        except BusinessException as e:
            print(f"✓ 验证通过: {e.message}")

        print("\n测试3通过: 非法状态流转验证成功 ✓")
        return True

    except Exception as e:
        print(f"✗ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_resource_availability():
    """验证：资源空闲/忙碌检测"""
    print("\n" + "="*60)
    print("测试4: 资源空闲/忙碌检测")
    print("="*60)

    db = SessionLocal()
    try:
        available_cleaners = TaskService.get_available_cleaners(db)
        print(f"空闲保洁员数量: {len(available_cleaners)}")
        for c in available_cleaners:
            print(f"  - {c.full_name}")

        available_techs = TaskService.get_available_technicians(db)
        print(f"空闲维修工数量: {len(available_techs)}")
        for t in available_techs:
            print(f"  - {t.full_name}")

        print("\n测试4通过: 资源空闲检测验证成功 ✓")
        return True

    except Exception as e:
        print(f"✗ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_overdue_check():
    """验证：超时检查功能"""
    print("\n" + "="*60)
    print("测试5: 超时检查功能")
    print("="*60)

    db = SessionLocal()
    try:
        prop = db.query(Property).first()
        cleaner = db.query(User).filter(User.role == UserRole.CLEANER).first()
        manager = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.MANAGER])).first()

        task_no = TaskService.generate_task_no()
        task = CleaningTask(
            task_no=task_no,
            property_id=prop.id,
            cleaner_id=cleaner.id,
            created_by=manager.id,
            status=CleaningTaskStatus.IN_PROGRESS,
            scheduled_time=datetime.now() - timedelta(hours=5),
            deadline_time=datetime.now() - timedelta(hours=1),
            is_overdue=0
        )
        db.add(task)
        db.commit()

        print(f"创建超时任务: {task.task_no}, 截止时间已过1小时")
        print(f"当前超时标记: {task.is_overdue}")

        result = TaskService.check_and_update_overdue(db)
        print(f"超时检查结果: {result}")

        db.refresh(task)
        print(f"检查后超时标记: {task.is_overdue}")
        assert task.is_overdue == 1, "超时任务应该被标记"
        print("✓ 验证通过: 超时任务被正确标记")

        print("\n测试5通过: 超时检查功能验证成功 ✓")
        return True

    except AssertionError as e:
        print(f"✗ 验证失败: {e}")
        return False
    except Exception as e:
        print(f"✗ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def main():
    print("="*60)
    print("民宿保洁和维修派单系统 - 数据约束验证")
    print("="*60)

    Base.metadata.create_all(bind=engine)

    results = []
    results.append(("房态锁定规则", test_room_status_lock_rule()))
    results.append(("任务状态流转", test_task_status_transition()))
    results.append(("非法流转拒绝", test_invalid_transition_should_fail()))
    results.append(("资源空闲检测", test_resource_availability()))
    results.append(("超时检查功能", test_overdue_check()))

    print("\n" + "="*60)
    print("验证结果汇总")
    print("="*60)

    passed = 0
    failed = 0
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1

    print(f"\n总计: {passed} 通过, {failed} 失败")

    if failed == 0:
        print("\n🎉 所有验证通过！系统核心数据约束和业务流程验证成功！")
    else:
        print(f"\n⚠️  有 {failed} 项验证失败，请检查。")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
