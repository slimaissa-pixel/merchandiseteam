from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field

class EventBase(BaseModel):
    type: str = Field(..., description="The type of event (e.g., 'Facing Change', 'Out of Stock')")
    status: str = "pending"
    payload: Dict[str, Any] = Field(default_factory=dict, description="Flexible JSON data")
    gms_id: Optional[int] = None
    visit_id: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    status: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None

class EventInDBBase(EventBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    merchandiser_name: str

    class Config:
        from_attributes = True

class Event(EventInDBBase):
    pass
