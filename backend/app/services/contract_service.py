from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Contract
from app.schemas.schemas import ContractCreate, ContractUpdate, PaginatedResponse
from app.services.base import model_to_dict


async def get_contracts(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
) -> PaginatedResponse:
    query = select(Contract)
    count_query = select(func.count()).select_from(Contract)
    if status:
        query = query.where(Contract.status == status)
        count_query = count_query.where(Contract.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    contracts = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(c) for c in contracts], total=total, page=page, page_size=page_size
    )


async def get_contract(db: AsyncSession, contract_id: int) -> Optional[Contract]:
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    return result.scalar_one_or_none()


async def create_contract(db: AsyncSession, data: ContractCreate) -> Contract:
    contract = Contract(**data.model_dump())
    db.add(contract)
    await db.flush()
    return contract


async def update_contract(
    db: AsyncSession, contract: Contract, data: ContractUpdate
) -> Contract:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)
    await db.flush()
    return contract


async def delete_contract(db: AsyncSession, contract: Contract) -> None:
    await db.delete(contract)
    await db.flush()
