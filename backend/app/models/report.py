from typing import Optional
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String, default="Before/After")
    status: Mapped[str] = mapped_column(String, default="pending")
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    visits_planned: Mapped[int] = mapped_column(Integer, default=0)
    visits_completed: Mapped[int] = mapped_column(Integer, default=0)
    
    before_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    after_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    gms_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("gms.id"), nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("visits.id"), nullable=True)
    workday_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("workdays.id"), nullable=True)
    report_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True) 
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="reports")
    gms: Mapped[Optional["GMS"]] = relationship("GMS", back_populates="reports")
    visit: Mapped[Optional["Visit"]] = relationship("Visit", back_populates="reports")
    workday: Mapped[Optional["Workday"]] = relationship("Workday", back_populates="reports")

    @property
    def merchandiser_name(self) -> str:
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return "Unknown"

    @property
    def requester_role(self) -> Optional[str]:
        if self.user:
            return self.user.role
        return None
