from typing import Optional, List
from pydantic import BaseModel

class GMSBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    city: str
    type: str
    supervisor_id: Optional[int] = None
    opening_hours: Optional[str] = None
    surface_area: Optional[float] = None

class GMSCreate(GMSBase):
    pass

class GMSResponse(GMSBase):
    id: int
    visit_order: Optional[int] = None

    class Config:
        from_attributes = True

class GMSWithDistance(GMSResponse):
    distance_km: float

from datetime import datetime

class UserMin(BaseModel):
    id: int
    first_name: str
    last_name: str
    profile_image: Optional[str] = None
    class Config: from_attributes = True

class GMSMin(BaseModel):
    id: int
    name: str
    address: str
    class Config: from_attributes = True

class GMSAssignmentCreate(BaseModel):
    user_id: int
    gms_id: int
    visit_order: int = 0
    scheduled_date: Optional[datetime] = None
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None

class GMSAssignmentResponse(GMSAssignmentCreate):
    id: int
    assigned_at: datetime
    user: Optional[UserMin] = None
    gms: Optional[GMSMin] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    class Config:
        from_attributes = True
