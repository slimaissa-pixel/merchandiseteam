from typing import Optional
from sqlalchemy import Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class GMSAssignment(Base):
    __tablename__ = "gms_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    gms_id: Mapped[int] = mapped_column(Integer, ForeignKey("gms.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # New scheduling fields
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, default="scheduled") # scheduled, completed, cancelled
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    visit_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rule_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("schedule_rules.id", ondelete="CASCADE"), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="assignments")
    gms: Mapped["GMS"] = relationship("GMS", back_populates="assignments")
