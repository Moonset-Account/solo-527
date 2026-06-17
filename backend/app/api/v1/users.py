from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserQuery,
    UserPasswordUpdate, RoleCreate, RoleUpdate, RoleResponse,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import UserService

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=ResponseModel[PageResult])
def list_users(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    role_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    query = UserQuery(page=page, page_size=page_size, keyword=keyword, status=status, role_id=role_id)
    result = UserService.get_users(db, query)
    items = [UserResponse.model_validate(u) for u in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("", response_model=ResponseModel[UserResponse])
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    if UserService.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="用户名已存在")
    if UserService.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="邮箱已存在")

    user = UserService.create_user(db, data, created_by=current_user.id)
    return ResponseModel(data=UserResponse.model_validate(user))


@router.get("/{user_id}", response_model=ResponseModel[UserResponse])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(data=UserResponse.model_validate(user))


@router.put("/{user_id}", response_model=ResponseModel[UserResponse])
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    user = UserService.update_user(db, user_id, data, updated_by=current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(data=UserResponse.model_validate(user))


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    if not UserService.delete_user(db, user_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="用户不存在")
    return ResponseModel(message="删除成功")


@router.put("/{user_id}/password")
def update_password(
    user_id: int,
    data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.id != user_id and "admin" not in [r.code for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="无权限修改他人密码")

    if not UserService.update_password(db, user_id, data.old_password, data.new_password):
        raise HTTPException(status_code=400, detail="原密码错误")
    return ResponseModel(message="密码修改成功")


@router.get("/roles/list", response_model=ResponseModel)
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    roles = UserService.get_roles(db)
    return ResponseModel(data=[RoleResponse.model_validate(r) for r in roles])


@router.post("/roles", response_model=ResponseModel[RoleResponse])
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    role = UserService.create_role(db, data, created_by=current_user.id)
    return ResponseModel(data=RoleResponse.model_validate(role))


@router.put("/roles/{role_id}", response_model=ResponseModel[RoleResponse])
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("user:manage")),
):
    role = UserService.update_role(db, role_id, data, updated_by=current_user.id)
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    return ResponseModel(data=RoleResponse.model_validate(role))
