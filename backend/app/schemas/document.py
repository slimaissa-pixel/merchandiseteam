from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    name: str
    category: str
    size: str
    type: str
    url: str
    target: Optional[str] = "all"

class DocumentCreate(DocumentBase):
    send_notification: Optional[bool] = True

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    type: Optional[str] = None
    url: Optional[str] = None

class Document(DocumentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
