from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ComplaintBase(BaseModel):
    type: str
    description: str
    photo_url: str | None = None
    gms_id: int | None = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintResolve(BaseModel):
    status: str           # in_review | resolved
    admin_response: str | None = None

class ComplaintResponse(ComplaintBase):
    id: int
    status: str
    admin_response: str | None = None
    user_id: int
    requester_name: str
    requester_role: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        data = {
            "id": obj.id,
            "type": obj.type,
            "description": obj.description,
            "photo_url": obj.photo_url,
            "gms_id": obj.gms_id,
            "status": obj.status,
            "admin_response": obj.admin_response,
            "user_id": obj.user_id,
            "requester_name": f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "Unknown",
            "requester_role": obj.user.role if obj.user else None,
            "created_at": obj.created_at,
        }
        return cls(**data)
