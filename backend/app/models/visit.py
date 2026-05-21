from typing import List, Optional
from sqlalchemy import Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workday_id: Mapped[int] = mapped_column(Integer, ForeignKey("workdays.id"))
    gms_id: Mapped[int] = mapped_column(Integer, ForeignKey("gms.id"))
    status: Mapped[str] = mapped_column(String, default="in_progress")  # in_progress, completed
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    start_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    start_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_auto_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    proof_before: Mapped[bool] = mapped_column(default=False)
    proof_after: Mapped[bool] = mapped_column(default=False)

    workday: Mapped["Workday"] = relationship("Workday", back_populates="visits")
    gms: Mapped["GMS"] = relationship("GMS", back_populates="visits")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="visit")
