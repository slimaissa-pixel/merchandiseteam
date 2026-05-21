from typing import Optional
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

COMPLAINT_TYPES = ["store_issue", "colleague", "equipment", "route", "other"]

class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)             # store_issue, colleague, …
    description: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open")          # open, in_review, resolved
    admin_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    gms_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("gms.id"),  nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="complaints")
    gms: Mapped[Optional["GMS"]] = relationship("GMS", back_populates="complaints")
