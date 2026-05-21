from typing import Optional, List
from sqlalchemy import Integer, String, Date, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import date, datetime

class ScheduleRule(Base):
    __tablename__ = "schedule_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    gms_id: Mapped[int] = mapped_column(Integer, ForeignKey("gms.id", ondelete="CASCADE"))
    
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    frequency: Mapped[str] = mapped_column(String, default="weekly") # "weekly", "bi-weekly"
    days_of_week: Mapped[List[int]] = mapped_column(JSON, default=list) # [0, 1, 2] for Mon, Tue, Wed
    
    status: Mapped[str] = mapped_column(String, default="active") # active, paused, cancelled
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    gms: Mapped["GMS"] = relationship("GMS", foreign_keys=[gms_id])
