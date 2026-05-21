from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str
    phone: Optional[str] = None
    status: str = "active"
    is_active: bool = True
    profile_image: Optional[str] = None
    address: Optional[str] = None
    tags: Optional[str] = None
    supervisor_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    profile_image: Optional[str] = None
    address: Optional[str] = None
    tags: Optional[str] = None
    supervisor_id: Optional[int] = None
    expo_push_token: Optional[str] = None

class UserResponse(UserBase):
    id: int
    expo_push_token: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
