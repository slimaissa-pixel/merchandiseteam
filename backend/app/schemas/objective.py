from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ObjectiveBase(BaseModel):
    user_id: int
    title: str = "Monthly Visits"
    target: int = 0
    current: int = 0
    target_visits: int = 0
    month: int = 1
    year: int = 2024

class ObjectiveCreate(ObjectiveBase):
    pass

class ObjectiveResponse(ObjectiveBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
