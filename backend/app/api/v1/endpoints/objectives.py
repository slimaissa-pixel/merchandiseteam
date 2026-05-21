from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.objective import Objective
from app.models.user import User
from app.schemas.objective import ObjectiveCreate, ObjectiveResponse
from app.api.dependencies.deps import get_db, get_current_user

router = APIRouter()

@router.get("/", response_model=List[ObjectiveResponse])
def read_objectives(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"Fetching objectives for user: {current_user.email} ({current_user.role})", flush=True)
    try:
        if current_user.role == 'merchandiser':
            objs = db.query(Objective).filter(Objective.user_id == current_user.id).all()
        else:
            objs = db.query(Objective).all()
        
        print(f"Found {len(objs)} objectives", flush=True)
        return objs
    except Exception as e:
        print(f"Error fetching objectives: {e}", flush=True)
        raise e

@router.post("/", response_model=ObjectiveResponse)
def create_objective(
    objective: ObjectiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create objectives")
    
    db_obj = Objective(**objective.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{obj_id}")
def delete_objective(
    obj_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete objectives")
    
    db_obj = db.query(Objective).filter(Objective.id == obj_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    db.delete(db_obj)
    db.commit()
    return {"message": "Objective deleted"}
