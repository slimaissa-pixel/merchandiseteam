from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    size = Column(String)
    type = Column(String)
    url = Column(String)
    target = Column(String, default="all")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
