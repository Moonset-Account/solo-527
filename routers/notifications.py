from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from auth_utils import get_current_active_user, require_role
from database import get_db
from datetime import datetime, timedelta
import asyncio

router = APIRouter()

MAX_RETRIES = 5
RETRY_INTERVAL_MINUTES = 5

async def simulate_send_notification(notification_id: int):
    import time
    time.sleep(0.5)
    import random
    return random.random() > 0.3

@router.get("/my")
async def get_my_notifications(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    offset = (page - 1) * page_size
    
    total = con.execute("""
        SELECT COUNT(*) FROM notifications WHERE user_id = ?
    """, [current_user["id"]]).fetchone()[0]
    
    notifications = con.execute("""
        SELECT id, project_id, notification_type, message, status, retry_count,
               created_at, sent_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, [current_user["id"], page_size, offset]).fetchall()
    
    con.close()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": n[0],
                "project_id": n[1],
                "notification_type": n[2],
                "message": n[3],
                "status": n[4],
                "retry_count": n[5],
                "created_at": str(n[6]),
                "sent_at": str(n[7]) if n[7] else None
            }
            for n in notifications
        ]
    }

@router.post("/retry/{notification_id}")
async def retry_notification(
    notification_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    con = get_db()
    notification = con.execute("""
        SELECT id, user_id, status, retry_count, max_retries, message
        FROM notifications WHERE id = ?
    """, [notification_id]).fetchone()
    
    if not notification:
        con.close()
        raise HTTPException(status_code=404, detail="通知不存在")
    
    if notification[1] != current_user["id"] and current_user["role"] != "admin":
        con.close()
        raise HTTPException(status_code=403, detail="无权操作此通知")
    
    if notification[2] == "sent":
        con.close()
        return {"message": "通知已发送成功，无需重试"}
    
    if notification[3] >= notification[4]:
        con.close()
        raise HTTPException(status_code=400, detail="已达最大重试次数")
    
    con.execute("""
        UPDATE notifications 
        SET status = 'retrying', next_retry_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, [notification_id])
    
    con.commit()
    con.close()
    
    success = await simulate_send_notification(notification_id)
    
    con = get_db()
    if success:
        con.execute("""
            UPDATE notifications 
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, [notification_id])
        message = "通知发送成功"
    else:
        con.execute("""
            UPDATE notifications 
            SET status = 'failed', retry_count = retry_count + 1,
                next_retry_at = ?
            WHERE id = ?
        """, [datetime.now() + timedelta(minutes=RETRY_INTERVAL_MINUTES), notification_id])
        message = "通知发送失败，已加入重试队列"
    
    con.commit()
    con.close()
    
    return {"message": message}

@router.get("/retry-queue")
async def get_retry_queue(
    current_user: dict = Depends(require_role(["admin"]))
):
    con = get_db()
    
    notifications = con.execute("""
        SELECT n.id, u.username, u.full_name, n.project_id, n.message, 
               n.status, n.retry_count, n.max_retries, n.next_retry_at, n.created_at
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.status IN ('pending', 'failed', 'retrying')
          AND n.retry_count < n.max_retries
        ORDER BY n.next_retry_at ASC
    """).fetchall()
    
    con.close()
    
    return [
        {
            "id": n[0],
            "username": n[1],
            "full_name": n[2],
            "project_id": n[3],
            "message": n[4],
            "status": n[5],
            "retry_count": n[6],
            "max_retries": n[7],
            "next_retry_at": str(n[8]) if n[8] else None,
            "created_at": str(n[9])
        }
        for n in notifications
    ]

@router.post("/process-retry-queue")
async def process_retry_queue(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(["admin"]))
):
    con = get_db()
    
    notifications = con.execute("""
        SELECT id FROM notifications
        WHERE status IN ('pending', 'failed', 'retrying')
          AND retry_count < max_retries
          AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
        LIMIT 10
    """).fetchall()
    
    con.close()
    
    ids = [n[0] for n in notifications]
    
    for nid in ids:
        background_tasks.add_task(process_single_notification, nid)
    
    return {"message": f"已处理 {len(ids)} 条通知", "notification_ids": ids}

async def process_single_notification(notification_id: int):
    con = get_db()
    notification = con.execute("""
        SELECT id, retry_count, max_retries FROM notifications WHERE id = ?
    """, [notification_id]).fetchone()
    
    if not notification:
        con.close()
        return
    
    success = await simulate_send_notification(notification_id)
    
    if success:
        con.execute("""
            UPDATE notifications 
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, [notification_id])
    else:
        new_retry_count = notification[1] + 1
        if new_retry_count >= notification[2]:
            new_status = "failed"
            next_retry = None
        else:
            new_status = "failed"
            next_retry = datetime.now() + timedelta(minutes=RETRY_INTERVAL_MINUTES * (new_retry_count + 1))
        
        con.execute("""
            UPDATE notifications 
            SET status = ?, retry_count = ?, next_retry_at = ?
            WHERE id = ?
        """, [new_status, new_retry_count, next_retry, notification_id])
    
    con.commit()
    con.close()
