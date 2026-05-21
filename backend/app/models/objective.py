from typing import Optional
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class Objective(Base):
    __tablename__ = "objectives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending, in_progress, completed
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    target: Mapped[int] = mapped_column(Integer, default=0)
    current: Mapped[int] = mapped_column(Integer, default=0)
    target_visits: Mapped[int] = mapped_column(Integer, default=0)
    month: Mapped[int] = mapped_column(Integer, default=1)
    year: Mapped[int] = mapped_column(Integer, default=2024)

    user: Mapped["User"] = relationship("User", back_populates="objectives")
