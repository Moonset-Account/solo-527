from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_

from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.models import User, RoleEnum, KnowledgeBaseArticle, KnowledgeBaseCategory, KBVersionHistory
from app.schemas import (
    KBArticleCreate, KBArticleUpdate, KBArticleResponse,
    KBArticleDetailResponse, KBVersionResponse,
    KBCategoryCreate, KBCategoryResponse
)

router = APIRouter(prefix="/knowledge-base", tags=["知识库"])


@router.get("/categories", response_model=list[KBCategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KnowledgeBaseCategory).order_by(KnowledgeBaseCategory.name)
    )
    return result.scalars().all()


@router.post("/categories", response_model=KBCategoryResponse)
async def create_category(
    category_in: KBCategoryCreate,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    category = KnowledgeBaseCategory(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("/articles", response_model=dict)
async def list_articles(
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    is_published: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    query = select(KnowledgeBaseArticle).options(
        selectinload(KnowledgeBaseArticle.author),
        selectinload(KnowledgeBaseArticle.category)
    )

    conditions = []
    if category_id:
        conditions.append(KnowledgeBaseArticle.category_id == category_id)
    if keyword:
        conditions.append(or_(
            KnowledgeBaseArticle.title.ilike(f"%{keyword}%"),
            KnowledgeBaseArticle.content.ilike(f"%{keyword}%")
        ))

    if current_user.role in [RoleEnum.CUSTOMER, RoleEnum.AGENT]:
        if is_published is None:
            conditions.append(KnowledgeBaseArticle.is_published == True)
    elif is_published is not None:
        conditions.append(KnowledgeBaseArticle.is_published == is_published)

    if conditions:
        query = query.where(*conditions)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.order_by(KnowledgeBaseArticle.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    articles = result.scalars().all()

    return {
        "items": [KBArticleDetailResponse.model_validate(a) for a in articles],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/articles", response_model=KBArticleResponse)
async def create_article(
    article_in: KBArticleCreate,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR, RoleEnum.AGENT])),
    db: AsyncSession = Depends(get_db)
):
    article = KnowledgeBaseArticle(
        **article_in.model_dump(),
        author_id=current_user.id,
        version=1
    )
    db.add(article)
    await db.flush()

    version = KBVersionHistory(
        article_id=article.id,
        version=1,
        title=article.title,
        content=article.content,
        changed_by=current_user.id,
        change_summary="初始版本"
    )
    db.add(version)

    await db.commit()
    await db.refresh(article)
    return article


@router.get("/articles/{article_id}", response_model=KBArticleDetailResponse)
async def get_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(KnowledgeBaseArticle).options(
            selectinload(KnowledgeBaseArticle.author),
            selectinload(KnowledgeBaseArticle.category)
        ).where(KnowledgeBaseArticle.id == article_id)
    )
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if not article.is_published and current_user.role == RoleEnum.CUSTOMER:
        raise HTTPException(status_code=403, detail="Access denied")

    article.view_count += 1
    await db.commit()
    await db.refresh(article)

    return article


@router.put("/articles/{article_id}", response_model=KBArticleResponse)
async def update_article(
    article_id: int,
    article_in: KBArticleUpdate,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR, RoleEnum.AGENT])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KnowledgeBaseArticle).where(KnowledgeBaseArticle.id == article_id)
    )
    article = result.scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    new_version = article.version + 1
    old_title = article.title
    old_content = article.content

    version = KBVersionHistory(
        article_id=article.id,
        version=new_version,
        title=old_title,
        content=old_content,
        changed_by=current_user.id,
        change_summary=article_in.change_summary or "更新内容"
    )
    db.add(version)

    update_data = article_in.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(article, field, value)

    article.version = new_version

    await db.commit()
    await db.refresh(article)
    return article


@router.get("/articles/{article_id}/versions", response_model=list[KBVersionResponse])
async def get_article_versions(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KBVersionHistory).where(
            KBVersionHistory.article_id == article_id
        ).order_by(KBVersionHistory.version.desc())
    )
    return result.scalars().all()


@router.get("/articles/{article_id}/versions/{version_id}", response_model=KBVersionResponse)
async def get_article_version(
    article_id: int,
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KBVersionHistory).where(
            KBVersionHistory.id == version_id,
            KBVersionHistory.article_id == article_id
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/articles/{article_id}/helpful")
async def mark_helpful(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(KnowledgeBaseArticle).where(KnowledgeBaseArticle.id == article_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article.helpful_count += 1
    await db.commit()
    return {"message": "Marked as helpful", "helpful_count": article.helpful_count}
