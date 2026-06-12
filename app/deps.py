from typing import TypeVar, Type, Any, Optional, Dict
from fastapi import Request, HTTPException, Depends
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app import models

T = TypeVar("T", bound=BaseModel)


async def get_payload(request: Request, schema: Type[T]) -> T:
    content_type = request.headers.get("content-type", "")
    try:
        if "application/json" in content_type:
            body = await request.json()
            return schema.model_validate(body)
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form = await request.form()
            data: Dict[str, Any] = {}
            for key, value in form.multi_items():
                if value == "" or value is None:
                    continue
                if key in data:
                    if isinstance(data[key], list):
                        data[key].append(value)
                    else:
                        data[key] = [data[key], value]
                else:
                    data[key] = value
            return schema.model_validate(data)
        else:
            body = await request.json()
            return schema.model_validate(body)
    except ValidationError as e:
        errors = []
        for err in e.errors():
            field = ".".join(str(loc) for loc in err["loc"])
            errors.append(f"{field}: {err['msg']}")
        raise HTTPException(status_code=422, detail="; ".join(errors))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"请求解析失败: {str(e)}")


def make_payload_dep(schema: Type[T]):
    async def dep(request: Request) -> T:
        return await get_payload(request, schema)
    return Depends(dep)
