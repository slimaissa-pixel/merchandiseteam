from typing import Optional, Any
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String, index=True) # e.g. 'Out of Stock', 'Facing Change'
    status: Mapped[str] = mapped_column(String, default="pending", index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict) # Flexible JSON data
    
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    gms_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("gms.id"), nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("visits.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="events")
    gms: Mapped[Optional["GMS"]] = relationship("GMS", back_populates="events")
    visit: Mapped[Optional["Visit"]] = relationship("Visit", backref="events")

    @property
    def merchandiser_name(self) -> str:
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return "Unknown"
