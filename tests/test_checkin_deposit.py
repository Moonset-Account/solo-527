import pytest
from datetime import datetime, timedelta
from app.models import (
    Vendor, Category, Booth, VendorApplication, BoothAssignment,
    Deposit, CheckinRecord,
    ApplicationStatus, BoothStatus, AssignmentStatus,
    DepositStatus, CheckinStatus
)


class TestCheckinAndDepositReview:
    """
    测试组3：现场签到与未签到触发保证金复核
    """

    def _setup_test_data(self, db_session):
        cat = Category(name="测试品类", code="TEST_CAT", color="#FF0000")
        db_session.add(cat)
        db_session.flush()

        vendor = Vendor(
            name="测试签到摊主",
            contact_person="测试联系人",
            phone="13800001111",
            status="approved"
        )
        db_session.add(vendor)
        db_session.flush()

        booth = Booth(
            booth_number="T01",
            zone="测试区",
            position_order=1,
            status=BoothStatus.AVAILABLE
        )
        db_session.add(booth)
        db_session.flush()

        event_date = datetime.now() + timedelta(days=7)
        event_date = event_date.replace(hour=9, minute=0, second=0, microsecond=0)

        app = VendorApplication(
            vendor_id=vendor.id,
            category_id=cat.id,
            event_date=event_date,
            status=ApplicationStatus.APPROVED
        )
        db_session.add(app)
        db_session.flush()

        assignment = BoothAssignment(
            booth_id=booth.id,
            vendor_id=vendor.id,
            application_id=app.id,
            event_date=event_date,
            status=AssignmentStatus.CONFIRMED
        )
        db_session.add(assignment)
        db_session.flush()

        deposit = Deposit(
            vendor_id=vendor.id,
            application_id=app.id,
            amount=500.00,
            status=DepositStatus.PAID,
            payment_method="微信支付",
            transaction_id="TXNTEST001",
            paid_at=datetime.utcnow()
        )
        db_session.add(deposit)
        db_session.flush()

        checkin = CheckinRecord(
            vendor_id=vendor.id,
            assignment_id=assignment.id,
            event_date=event_date,
            status=CheckinStatus.PENDING
        )
        db_session.add(checkin)
        db_session.commit()

        return {
            "vendor": vendor,
            "booth": booth,
            "application": app,
            "assignment": assignment,
            "deposit": deposit,
            "checkin": checkin,
            "event_date": event_date
        }

    def test_create_checkin_record(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)

        response = client.get(
            "/api/checkins/",
            headers=auth_headers
        )
        assert response.status_code == 200
        checkins = response.json()
        assert len(checkins) >= 1

        checkin_data = checkins[0]
        assert checkin_data["vendor_id"] == data["vendor"].id
        assert checkin_data["status"] == "pending"
        assert checkin_data["deposit_review_triggered"] == 0

    def test_successful_checkin(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)
        checkin_id = data["checkin"].id

        response = client.post(
            f"/api/checkins/{checkin_id}/checkin",
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "checked_in"
        assert result["checkin_time"] is not None
        assert result["checked_in_by"] is not None

        db_session.refresh(data["deposit"])
        assert data["deposit"].status == DepositStatus.PAID

    def test_no_show_triggers_deposit_review(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)
        checkin_id = data["checkin"].id

        response = client.put(
            f"/api/checkins/{checkin_id}/no-show",
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "no_show"

    def test_sales_backfill(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)
        checkin_id = data["checkin"].id

        client.post(
            f"/api/checkins/{checkin_id}/checkin",
            headers=auth_headers
        )

        response = client.put(
            f"/api/checkins/{checkin_id}/sales",
            json={
                "sales_amount": 2580.50,
                "sales_notes": "当日销售情况良好，手工艺品受欢迎"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["sales_amount"] == 2580.50
        assert result["sales_notes"] == "当日销售情况良好，手工艺品受欢迎"

    def test_create_deposit(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)

        response = client.post(
            "/api/deposits/",
            json={
                "vendor_id": data["vendor"].id,
                "application_id": data["application"].id,
                "amount": 500.00,
                "deposit_type": "standard"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["vendor_id"] == data["vendor"].id
        assert result["amount"] == 500.00
        assert result["status"] == "pending"

    def test_update_deposit_to_paid(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)

        new_deposit = Deposit(
            vendor_id=data["vendor"].id,
            amount=300.00,
            status=DepositStatus.PENDING
        )
        db_session.add(new_deposit)
        db_session.commit()
        db_session.refresh(new_deposit)

        response = client.put(
            f"/api/deposits/{new_deposit.id}",
            json={
                "status": "paid",
                "payment_method": "支付宝",
                "transaction_id": "ALIPAY00123"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "paid"
        assert result["payment_method"] == "支付宝"
        assert result["transaction_id"] == "ALIPAY00123"
        assert result["paid_at"] is not None

    def test_deposit_list_filter(self, client, auth_headers, db_session):
        data = self._setup_test_data(db_session)

        response = client.get(
            "/api/deposits/?status=paid",
            headers=auth_headers
        )
        assert response.status_code == 200
        deposits = response.json()
        assert len(deposits) >= 1
        for d in deposits:
            assert d["status"] == "paid"
