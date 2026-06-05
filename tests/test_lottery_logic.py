import pytest
from datetime import datetime, timedelta
from app.models import (
    Vendor, Category, Booth, VendorApplication,
    ApplicationStatus, BoothStatus, BoothAssignment
)
from app.services.lottery_service import LotteryService


class TestLotteryLogic:
    """
    测试组2：摊位抽签逻辑 - 同品类摊位不能连续相邻
    """

    def _setup_test_data(self, db_session):
        cat1 = Category(name="陶艺", code="CAT1", color="#FF0000")
        cat2 = Category(name="皮具", code="CAT2", color="#00FF00")
        cat3 = Category(name="布艺", code="CAT3", color="#0000FF")
        db_session.add_all([cat1, cat2, cat3])
        db_session.flush()

        for i in range(1, 9):
            booth = Booth(
                booth_number=f"A{i:02d}",
                zone="A区",
                position_order=i,
                status=BoothStatus.AVAILABLE
            )
            db_session.add(booth)
        db_session.flush()

        vendors_data = [
            ("陶艺摊主1", cat1),
            ("陶艺摊主2", cat1),
            ("皮具摊主1", cat2),
            ("皮具摊主2", cat2),
            ("布艺摊主1", cat3),
            ("布艺摊主2", cat3),
            ("陶艺摊主3", cat1),
            ("皮具摊主3", cat2),
        ]

        event_date = datetime.now() + timedelta(days=7)
        event_date = event_date.replace(hour=9, minute=0, second=0, microsecond=0)

        for name, category in vendors_data:
            vendor = Vendor(name=name, contact_person=f"{name}联系人", phone=f"138{hash(name) % 100000000:08d}")
            db_session.add(vendor)
            db_session.flush()

            app = VendorApplication(
                vendor_id=vendor.id,
                category_id=category.id,
                event_date=event_date,
                status=ApplicationStatus.APPROVED
            )
            db_session.add(app)

        db_session.commit()
        return event_date

    def test_lottery_assigns_all_booths(self, db_session):
        event_date = self._setup_test_data(db_session)

        service = LotteryService(db_session)
        result = service.run_lottery(event_date)

        assert result.success is True
        assert result.total_applications == 8
        assert result.total_booths == 8
        assert result.assigned_count == 8
        assert len(result.assignments) == 8

    def test_same_category_not_adjacent_in_first_round(self, db_session):
        event_date = self._setup_test_data(db_session)

        service = LotteryService(db_session)
        result = service.run_lottery(event_date)

        booths = db_session.query(Booth).order_by(Booth.position_order).all()
        booth_map = {b.id: b for b in booths}

        assignments = db_session.query(BoothAssignment).filter(
            BoothAssignment.event_date == event_date
        ).all()

        assignment_by_booth = {}
        for a in assignments:
            assignment_by_booth[a.booth_id] = a

        booth_positions = sorted(booths, key=lambda b: b.position_order)

        adjacent_conflicts = 0
        for i in range(len(booth_positions) - 1):
            current_booth = booth_positions[i]
            next_booth = booth_positions[i + 1]

            if current_booth.id in assignment_by_booth and next_booth.id in assignment_by_booth:
                current_app = db_session.query(VendorApplication).filter(
                    VendorApplication.id == assignment_by_booth[current_booth.id].application_id
                ).first()
                next_app = db_session.query(VendorApplication).filter(
                    VendorApplication.id == assignment_by_booth[next_booth.id].application_id
                ).first()

                if current_app and next_app:
                    if current_app.category_id == next_app.category_id:
                        if (assignment_by_booth[current_booth.id].lottery_round == 1 and
                            assignment_by_booth[next_booth.id].lottery_round == 1):
                            adjacent_conflicts += 1

        assert adjacent_conflicts == 0, "第一轮分配中不应有同品类相邻的情况"

    def test_lottery_result_structure(self, db_session):
        event_date = self._setup_test_data(db_session)

        service = LotteryService(db_session)
        result = service.run_lottery(event_date)

        assert hasattr(result, 'success')
        assert hasattr(result, 'message')
        assert hasattr(result, 'assignments')
        assert hasattr(result, 'total_applications')
        assert hasattr(result, 'total_booths')
        assert hasattr(result, 'assigned_count')

        for assignment in result.assignments:
            assert hasattr(assignment, 'booth_id')
            assert hasattr(assignment, 'vendor_id')
            assert hasattr(assignment, 'application_id')
            assert hasattr(assignment, 'status')
            assert hasattr(assignment, 'lottery_round')

    def test_lottery_with_zone_filter(self, db_session):
        event_date = self._setup_test_data(db_session)

        for i in range(1, 5):
            booth = Booth(
                booth_number=f"B{i:02d}",
                zone="B区",
                position_order=i,
                status=BoothStatus.AVAILABLE
            )
            db_session.add(booth)
        db_session.commit()

        service = LotteryService(db_session)
        result = service.run_lottery(event_date, zone="B区")

        assert result.success is True
        assert result.total_booths == 4
        for assignment in result.assignments:
            booth = db_session.query(Booth).filter(Booth.id == assignment.booth_id).first()
            assert booth.zone == "B区"
