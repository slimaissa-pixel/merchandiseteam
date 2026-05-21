from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, AliasChoices

class ReportBase(BaseModel):
    name: str
    notes: str | None = None
    type: str = "Before/After"
    status: str = "pending"
    rejection_reason: str | None = None
    visits_planned: int = 0
    visits_completed: int = 0
    before_image: str | None = None
    after_image: str | None = None
    gms_id: int | None = None
    visit_id: int | None = None
    workday_id: int | None = None
    report_metadata: dict | None = Field(None, validation_alias=AliasChoices("report_metadata", "metadata"), serialization_alias="metadata")

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    user_id: int
    merchandiser_name: str
    requester_role: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class TimelineEvent(BaseModel):
    id: int | str
    type: str
    timestamp: datetime
    title: str
    description: str | None = None
    payload: dict | None = None
    status: str | None = None

class ImageGalleryItem(BaseModel):
    url: str
    category: str
    timestamp: datetime
    metadata: dict | None = None

class VisitFullReport(BaseModel):
    visit_id: int
    merchandiser: dict
    store: dict
    start_time: datetime
    end_time: datetime | None = None
    duration_minutes: int | None = None
    status: str
    
    # Timeline & Events
    timeline: List[TimelineEvent]
    
    # Categorized Data
    gallery: List[ImageGalleryItem]
    anomalies: List[dict]
    before_after: List[dict]
    ai_analysis: List[dict]
    
    # Metrics
    compliance_score: float
    task_completion_rate: float
    performance_summary: str | None = None

    class Config:
        from_attributes = True
