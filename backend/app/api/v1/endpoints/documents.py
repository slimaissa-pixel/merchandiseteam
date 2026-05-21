from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import deps
from app.models.document import Document
from app.models.user import User
from app.schemas.document import Document as DocumentSchema, DocumentCreate, DocumentUpdate

router = APIRouter()

@router.get("/", response_model=List[DocumentSchema])
def read_documents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve documents.
    """
    query = db.query(Document)
    
    # If not admin, filter by target role
    if current_user.role != "admin":
        from sqlalchemy import or_
        
        role = current_user.role
        uid = f"user:{current_user.id}"
        
        query = query.filter(
            or_(
                Document.target == "all",
                Document.target == role,
                Document.target.like(f"%,{role},%"),
                Document.target.like(f"{role},%"),
                Document.target.like(f"%,{role}"),
                Document.target == uid,
                Document.target.like(f"%,{uid},%"),
                Document.target.like(f"{uid},%"),
                Document.target.like(f"%,{uid}")
            )
        )
        
    documents = query.offset(skip).limit(limit).all()
    return documents

@router.post("/", response_model=DocumentSchema)
def create_document(
    *,
    db: Session = Depends(deps.get_db),
    document_in: DocumentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new document.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    document = Document(
        name=document_in.name,
        category=document_in.category,
        size=document_in.size,
        type=document_in.type,
        url=document_in.url,
        target=document_in.target
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    if document_in.send_notification:
        from app.models.notification import Notification
        
        targets = [t.strip() for t in (document.target or "").split(",") if t.strip()]
        target_users = {} # uid -> user_role
        
        if "all" in targets:
            users = db.query(User).all()
            for u in users:
                target_users[u.id] = u.role
        else:
            if "merchandiser" in targets:
                users = db.query(User).filter(User.role == "merchandiser").all()
                for u in users:
                    target_users[u.id] = u.role
            if "supervisor" in targets:
                users = db.query(User).filter(User.role == "supervisor").all()
                for u in users:
                    target_users[u.id] = u.role
            
            for t in targets:
                if t.startswith("user:"):
                    try:
                        uid = int(t.split(":")[1])
                        u = db.query(User).filter(User.id == uid).first()
                        if u:
                            target_users[u.id] = u.role
                    except:
                        pass
                        
        for uid, role in target_users.items():
            if uid == current_user.id:
                continue
                
            action_link = f"/{role}/documents"
            
            notif = Notification(
                user_id=uid,
                title="New Document Available",
                message=f"A new document '{document.name}' has been shared with you.",
                type="info",
                icon="document-text",
                action_link=action_link
            )
            db.add(notif)
            
        db.commit()

    return document

@router.delete("/{id}", response_model=DocumentSchema)
def delete_document(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a document.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(document)
    db.commit()
    return document
