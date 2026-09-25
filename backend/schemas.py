from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AppointmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    appointments: List[Appointment] = []

    class Config:
        from_attributes = True

class Slot(BaseModel):
    start: datetime
    end: datetime
    available: bool
