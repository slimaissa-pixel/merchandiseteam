from typing import List, Optional
from sqlalchemy import Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class WorkSession(Base):
    __tablename__ = "work_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supervisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    merchandiser_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String, default="active")  # active, completed
    
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    start_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    start_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    end_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    supervisor: Mapped["User"] = relationship("User", foreign_keys=[supervisor_id])
    merchandiser: Mapped["User"] = relationship("User", foreign_keys=[merchandiser_id])
    
    checkpoints: Mapped[List["Checkpoint"]] = relationship("Checkpoint", back_populates="session", cascade="all, delete-orphan")
    report: Mapped[Optional["SessionReport"]] = relationship("SessionReport", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_sessions.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    session: Mapped["WorkSession"] = relationship("WorkSession", back_populates="checkpoints")


class SessionReport(Base):
    __tablename__ = "session_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("work_sessions.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    report_data: Mapped[dict] = mapped_column(JSON)

    session: Mapped["WorkSession"] = relationship("WorkSession", back_populates="report")
