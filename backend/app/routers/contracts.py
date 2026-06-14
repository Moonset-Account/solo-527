from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    ContractCreate,
    ContractResponse,
    ContractUpdate,
    PaginatedResponse,
)
from app.services.auth_service import get_current_user
from app.services.contract_service import (
    get_contracts,
    get_contract,
    create_contract,
    update_contract,
    delete_contract,
)

router = APIRouter(prefix="/api/contracts", tags=["合同管理"])


@router.get("", response_model=PaginatedResponse)
async def list_contracts(
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_contracts(db, page=page, page_size=page_size, status=status)


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_new_contract(
    data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_contract(db, data)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract_detail(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_existing_contract(
    contract_id: int,
    data: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    return await update_contract(db, contract, data)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = await get_contract(db, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    await delete_contract(db, contract)
