from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user
from ... import crud, schemas, models
from ...services import logger

router = APIRouter()


@router.post("/sync")
def sync_offline_data(
    request: Request,
    sync_data: schemas.OfflineSyncData,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = crud.offline_sync.create_record(
        db,
        user_id=current_user.id,
        sync_type=sync_data.sync_type,
        data=sync_data.data,
        device_id=sync_data.device_id
    )
    
    try:
        if sync_data.sync_type == "batch_create":
            batch_data = sync_data.data
            batch_in = schemas.ReagentBatchCreate(**batch_data)
            crud.reagent_batch.create(db, obj_in=batch_in, created_by=current_user.id)
        elif sync_data.sync_type == "requisition_create":
            req_data = sync_data.data
            req_in = schemas.RequisitionCreate(**req_data)
            crud.requisition.create(db, obj_in=req_in, created_by=current_user.id)
        elif sync_data.sync_type == "inventory_update":
            item_data = sync_data.data
            item_in = schemas.InventoryCheckItemUpdate(**item_data)
            crud.inventory_check_item.update_item(
                db, item_id=item_data.get("item_id"), obj_in=item_in, checked_by=current_user.id
            )
        
        crud.offline_sync.mark_as_synced(db, record_id=record.id)
        logger.info(f"离线数据同步成功: {sync_data.sync_type} by {current_user.username}")
        
        return {"status": "success", "record_id": record.id}
    except Exception as e:
        crud.offline_sync.mark_as_failed(db, record_id=record.id, error_message=str(e))
        logger.error(f"离线数据同步失败: {e}")
        return {"status": "failed", "record_id": record.id, "error": str(e)}


@router.get("/pending")
def get_pending_syncs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.offline_sync.get_pending_by_user(db, user_id=current_user.id)


@router.post("/batch-sync")
def batch_sync_offline_data(
    request: Request,
    sync_items: List[schemas.OfflineSyncData],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = []
    for item in sync_items:
        record = crud.offline_sync.create_record(
            db,
            user_id=current_user.id,
            sync_type=item.sync_type,
            data=item.data,
            device_id=item.device_id
        )
        try:
            if item.sync_type == "batch_create":
                batch_data = item.data
                batch_in = schemas.ReagentBatchCreate(**batch_data)
                crud.reagent_batch.create(db, obj_in=batch_in, created_by=current_user.id)
            elif item.sync_type == "requisition_create":
                req_data = item.data
                req_in = schemas.RequisitionCreate(**req_data)
                crud.requisition.create(db, obj_in=req_in, created_by=current_user.id)
            
            crud.offline_sync.mark_as_synced(db, record_id=record.id)
            results.append({"sync_type": item.sync_type, "status": "success", "record_id": record.id})
        except Exception as e:
            crud.offline_sync.mark_as_failed(db, record_id=record.id, error_message=str(e))
            results.append({"sync_type": item.sync_type, "status": "failed", "record_id": record.id, "error": str(e)})
    
    return {"results": results, "total": len(results), "success": sum(1 for r in results if r["status"] == "success")}
