import pytest
from datetime import datetime, timedelta


class TestVendorApplication:
    """
    测试组1：摊主报名与审核流程
    """

    def test_create_vendor(self, client, auth_headers, db_session):
        response = client.post(
            "/api/vendors/",
            json={
                "name": "测试陶艺工坊",
                "contact_person": "张三",
                "phone": "13900000001",
                "email": "test@pottery.com",
                "description": "专业手工陶艺制作"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "测试陶艺工坊"
        assert data["contact_person"] == "张三"
        assert data["status"] == "pending"
        assert "id" in data

    def test_create_category_and_application(self, client, auth_headers, db_session):
        client.post(
            "/api/categories/",
            json={
                "name": "测试陶艺",
                "code": "TEST_CERAMIC",
                "description": "测试用陶艺品类"
            },
            headers=auth_headers
        )

        vendor_resp = client.post(
            "/api/vendors/",
            json={
                "name": "报名测试摊主",
                "contact_person": "李四",
                "phone": "13900000002"
            },
            headers=auth_headers
        )
        vendor_id = vendor_resp.json()["id"]

        categories_resp = client.get("/api/categories/")
        category_id = categories_resp.json()[0]["id"]

        event_date = (datetime.now() + timedelta(days=7)).isoformat()
        app_resp = client.post(
            "/api/vendors/applications/",
            json={
                "vendor_id": vendor_id,
                "category_id": category_id,
                "event_date": event_date,
                "product_description": "测试产品描述"
            },
            headers=auth_headers
        )
        assert app_resp.status_code == 200
        app_data = app_resp.json()
        assert app_data["vendor_id"] == vendor_id
        assert app_data["category_id"] == category_id
        assert app_data["status"] == "new"
        assert "id" in app_data

    def test_review_application_approved(self, client, auth_headers, db_session):
        client.post(
            "/api/categories/",
            json={"name": "测试皮具", "code": "TEST_LEATHER"},
            headers=auth_headers
        )

        vendor_resp = client.post(
            "/api/vendors/",
            json={"name": "审核测试摊主", "contact_person": "王五", "phone": "13900000003"},
            headers=auth_headers
        )
        vendor_id = vendor_resp.json()["id"]

        categories_resp = client.get("/api/categories/")
        category_id = categories_resp.json()[0]["id"]

        event_date = (datetime.now() + timedelta(days=7)).isoformat()
        app_resp = client.post(
            "/api/vendors/applications/",
            json={
                "vendor_id": vendor_id,
                "category_id": category_id,
                "event_date": event_date
            }
        )
        app_id = app_resp.json()["id"]

        review_resp = client.put(
            f"/api/vendors/applications/{app_id}/review?status=approved&review_notes=符合条件，通过审核",
            headers=auth_headers
        )
        assert review_resp.status_code == 200
        review_data = review_resp.json()
        assert review_data["status"] == "approved"
        assert review_data["review_notes"] == "符合条件，通过审核"
        assert review_data["reviewed_by"] is not None

    def test_list_applications_filter_by_status(self, client, auth_headers, db_session):
        client.post(
            "/api/categories/",
            json={"name": "测试品类1", "code": "TEST_CAT1"},
            headers=auth_headers
        )

        vendor_resp = client.post(
            "/api/vendors/",
            json={"name": "列表测试摊主", "contact_person": "赵六", "phone": "13900000004"},
            headers=auth_headers
        )
        vendor_id = vendor_resp.json()["id"]
        category_id = client.get("/api/categories/").json()[0]["id"]
        event_date = (datetime.now() + timedelta(days=7)).isoformat()

        for i in range(3):
            client.post(
                "/api/vendors/applications/",
                json={
                    "vendor_id": vendor_id,
                    "category_id": category_id,
                    "event_date": event_date
                }
            )

        all_resp = client.get("/api/vendors/applications/", headers=auth_headers)
        assert len(all_resp.json()) == 3

        new_resp = client.get(
            "/api/vendors/applications/?status=new",
            headers=auth_headers
        )
        assert len(new_resp.json()) == 3
