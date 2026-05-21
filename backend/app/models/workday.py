from typing import List, Optional
from sqlalchemy import Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class Workday(Base):
    __tablename__ = "workdays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String, default="active")  # active, completed
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    start_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    start_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    current_activity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    battery_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_mock_location: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="workdays")
    visits: Mapped[List["Visit"]] = relationship(
        "Visit", back_populates="workday", cascade="all, delete-orphan"
    )
    location_logs: Mapped[List["LocationLog"]] = relationship(
        "LocationLog", back_populates="workday", cascade="all, delete-orphan"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="workday"
    )
