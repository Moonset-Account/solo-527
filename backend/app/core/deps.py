from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, UserRole, LogAction, AuditLog

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证"
        )
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用"
        )
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SECURITY_OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user


def require_security_officer(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.SECURITY_OFFICER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要安全负责人权限"
        )
    return current_user


def log_audit(
    action: LogAction,
    description: str = None,
    resource_type: str = None,
    resource_id: int = None,
    details: dict = None
):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            request: Request = kwargs.get("request")
            db: Session = kwargs.get("db")
            current_user: User = kwargs.get("current_user")

            if not db or not current_user:
                for arg in args:
                    if isinstance(arg, Session):
                        db = arg
                    if isinstance(arg, User):
                        current_user = arg

            if not request and "request" in kwargs:
                request = kwargs["request"]

            result = await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)

            if db and current_user:
                ip = None
                user_agent = None
                if request:
                    ip = request.client.host if request.client else None
                    user_agent = request.headers.get("user-agent")

                audit_log = AuditLog(
                    user_id=current_user.id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    description=description,
                    ip_address=ip,
                    user_agent=user_agent,
                    details=details
                )
                db.add(audit_log)
                db.commit()

            return result
        return wrapper
    return decorator


def create_audit_log(
    db: Session,
    user: User,
    action: LogAction,
    description: str = None,
    resource_type: str = None,
    resource_id: int = None,
    details: dict = None,
    ip_address: str = None,
    user_agent: str = None
):
    audit_log = AuditLog(
        user_id=user.id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log
