from __future__ import annotations
from datetime import date, datetime
from pydantic import BaseModel

class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveReview(BaseModel):
    status: str           # approved | rejected
    admin_comment: str | None = None

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    status: str
    admin_comment: str | None = None
    user_id: int
    requester_name: str
    requester_role: str
    created_at: datetime

    class Config:
        from_attributes = True
