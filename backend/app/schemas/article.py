from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class ArticleBase(BaseModel):
    name: str
    reference: str | None = None
    category: str | None = None
    brand: str | None = None
    unit: str | None = None
    description: str | None = None
    is_active: bool = True
    barcode: str | None = None
    price: float | None = None
    image_url: str | None = None
    stock_alert_threshold: int = 0

class ArticleCreate(ArticleBase):
    gms_ids: List[int] = []

class ArticleUpdate(BaseModel):
    name: str | None = None
    reference: str | None = None
    category: str | None = None
    brand: str | None = None
    unit: str | None = None
    description: str | None = None
    is_active: bool | None = None
    barcode: str | None = None
    price: float | None = None
    image_url: str | None = None
    stock_alert_threshold: int | None = None
    gms_ids: List[int] | None = None

class GMSBasicResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ArticleResponse(ArticleBase):
    id: int
    created_at: datetime
    gms_list: List[GMSBasicResponse] = []

    class Config:
        from_attributes = True
