from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas
from database import engine, get_db
from slots import generate_slots

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Appointment System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Appointment System API"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = models.User(email=user.email, name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.post("/users/{user_id}/appointments/", response_model=schemas.Appointment)
def create_appointment_for_user(
    user_id: int, appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)
):
    if not db.get(models.User, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if appointment.end_time <= appointment.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")
    conflict = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.start_time < appointment.end_time,
            models.Appointment.end_time > appointment.start_time,
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Time slot already booked")
    db_appointment = models.Appointment(**appointment.model_dump(), user_id=user_id)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


@app.get("/appointments/", response_model=List[schemas.Appointment])
def read_appointments(
    user_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    query = db.query(models.Appointment)
    if user_id is not None:
        query = query.filter(models.Appointment.user_id == user_id)
    return query.offset(skip).limit(limit).all()


@app.get("/slots/", response_model=List[schemas.Slot])
def list_slots(
    day: date = Query(..., description="YYYY-MM-DD"),
    duration_minutes: int = Query(60, ge=15, le=480),
    db: Session = Depends(get_db),
):
    booked = [
        (a.start_time, a.end_time)
        for a in db.query(models.Appointment).all()
    ]
    return [
        schemas.Slot(start=start, end=end, available=available)
        for start, end, available in generate_slots(day, duration_minutes, booked)
    ]
