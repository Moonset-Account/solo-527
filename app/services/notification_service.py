import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.config import settings


class NotificationService:
    @staticmethod
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
        reraise=True
    )
    async def send_webhook_notification(payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.NOTIFICATION_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def send_deposit_review_notification(vendor_name: str, reason: str) -> dict:
        payload = {
            "type": "deposit_review",
            "vendor_name": vendor_name,
            "reason": reason,
            "message": f"摊主 {vendor_name} 保证金需要复核：{reason}"
        }
        try:
            return await NotificationService.send_webhook_notification(payload)
        except Exception as e:
            return {"error": f"通知发送失败（已重试5次）：{str(e)}"}

    @staticmethod
    async def send_lottery_result_notification(vendor_name: str, booth_number: str) -> dict:
        payload = {
            "type": "lottery_result",
            "vendor_name": vendor_name,
            "booth_number": booth_number,
            "message": f"摊主 {vendor_name} 抽签结果：摊位 {booth_number}"
        }
        try:
            return await NotificationService.send_webhook_notification(payload)
        except Exception as e:
            return {"error": f"通知发送失败（已重试5次）：{str(e)}"}
