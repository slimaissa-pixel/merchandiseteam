from typing import List, Optional
from sqlalchemy import Boolean, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)

    role: Mapped[str] = mapped_column(String)  # admin, supervisor, merchandiser

    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    profile_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Expo push token for out-of-app push notifications
    expo_push_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    supervisor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    supervisor: Mapped[Optional["User"]] = relationship(
        "User", remote_side="[User.id]", back_populates="team"
    )
    team: Mapped[List["User"]] = relationship(
        "User", back_populates="supervisor"
    )
    # Standardizing relationships with cascades for automated cleanup
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint", back_populates="user", cascade="all, delete-orphan"
    )
    events: Mapped[List["Event"]] = relationship(
        "Event", back_populates="user", cascade="all, delete-orphan"
    )
    workdays: Mapped[List["Workday"]] = relationship(
        "Workday", back_populates="user", cascade="all, delete-orphan"
    )
    objectives: Mapped[List["Objective"]] = relationship(
        "Objective", back_populates="user", cascade="all, delete-orphan"
    )
    assignments: Mapped[List["GMSAssignment"]] = relationship(
        "GMSAssignment", back_populates="user", cascade="all, delete-orphan"
    )
    leave_requests: Mapped[List["LeaveRequest"]] = relationship(
        "LeaveRequest", 
        back_populates="user", 
        foreign_keys="[LeaveRequest.user_id]",
        cascade="all, delete-orphan"
    )
    reviewed_leaves: Mapped[List["LeaveRequest"]] = relationship(
        "LeaveRequest",
        back_populates="reviewer",
        foreign_keys="[LeaveRequest.reviewed_by]"
    )

    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String, nullable=True)
