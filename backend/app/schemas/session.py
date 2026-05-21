from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CheckpointBase(BaseModel):
    lat: float
    lng: float
    note: Optional[str] = None
    image_url: Optional[str] = None

class CheckpointCreate(CheckpointBase):
    pass

class CheckpointResponse(CheckpointBase):
    id: int
    session_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class WorkSessionBase(BaseModel):
    merchandiser_id: int
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None

class WorkSessionCreate(WorkSessionBase):
    pass

class WorkSessionEnd(BaseModel):
    end_lat: Optional[float] = None
    end_lng: Optional[float] = None

class WorkSessionResponse(WorkSessionBase):
    id: int
    supervisor_id: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    end_lat: Optional[float] = None
    end_lng: Optional[float] = None
    checkpoints: List[CheckpointResponse] = []
    
    class Config:
        from_attributes = True

class SessionReportResponse(BaseModel):
    id: int
    session_id: int
    created_at: datetime
    report_data: Dict[str, Any]
    
    class Config:
        from_attributes = True
