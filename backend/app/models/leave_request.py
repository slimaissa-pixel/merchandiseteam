from typing import Optional
from sqlalchemy import Integer, String, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base
from datetime import datetime, date

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    leave_type: Mapped[str] = mapped_column(String, nullable=False)       # annual, sick, personal, emergency
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")    # pending, approved, rejected
    admin_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="leave_requests")
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_leaves")

    @property
    def requester_name(self) -> str:
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return "Unknown"

    @property
    def requester_role(self) -> str:
        return self.user.role if self.user else ""
