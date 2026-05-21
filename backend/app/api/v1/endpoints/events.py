from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import deps
from app.models.event import Event
from app.models.user import User
from app.schemas.event import Event as EventSchema, EventCreate, EventUpdate

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
def read_events(
    db: Session = Depends(deps.get_db),
    type: str | None = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve events.
    """
    query = db.query(Event)
    
    if type:
        query = query.filter(Event.type == type)
        
    if current_user.role == "merchandiser":
        query = query.filter(Event.user_id == current_user.id)
        
    events = query.offset(skip).limit(limit).all()
    return events

@router.post("/", response_model=EventSchema)
def create_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: EventCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new event.

    Photo URLs in the payload must be persistent server paths (e.g. /static/events/...).
    blob: URLs are client-local object URLs that expire with the browser session and
    will NOT be accepted — upload via POST /api/upload first.
    """
    # Guard: reject any blob: URLs that leaked through from the client
    payload = event_in.payload or {}
    for key, value in payload.items():
        if isinstance(value, str) and value.startswith("blob:"):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Field '{key}' contains a blob: URL which is a browser-local "
                    "object URL and cannot be persisted. Upload the image via "
                    "POST /api/upload first and use the returned 'url' value."
                )
            )
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and item.startswith("blob:"):
                    raise HTTPException(
                        status_code=422,
                        detail=(
                            f"Field '{key}' contains a blob: URL. Upload images via "
                            "POST /api/upload and use the returned 'url' values."
                        )
                    )

    event = Event(
        type=event_in.type,
        status=event_in.status,
        payload=payload,
        gms_id=event_in.gms_id,
        visit_id=event_in.visit_id,
        user_id=current_user.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{id}/status", response_model=EventSchema)
def update_event_status(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    status: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an event.
    """
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = status
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
