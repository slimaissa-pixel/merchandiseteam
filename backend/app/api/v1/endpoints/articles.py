from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.api.dependencies.deps import get_db, get_current_user
from app.models.article import Article
from app.models.gms import GMS
from app.models.user import User
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse

router = APIRouter()

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Article.category).filter(Article.category != None).distinct().all()
    return [c[0] for c in categories if c[0]]

@router.get("/", response_model=List[ArticleResponse])
def list_articles(
    gms_id: int | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Article)
    if gms_id:
        query = query.filter(Article.gms_list.any(GMS.id == gms_id))
    if category:
        query = query.filter(Article.category == category)
    return query.offset(skip).limit(limit).all()

@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/", response_model=ArticleResponse)
def create_article(
    payload: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if current_user.role not in ["admin", "supervisor"]:
            raise HTTPException(status_code=403, detail="Only admins and supervisors can create articles")
        
        # Extract gms_ids
        data = payload.model_dump()
        gms_ids = data.pop("gms_ids", [])
        
        article = Article(**data)
        
        if gms_ids:
            gms_list = db.query(GMS).filter(GMS.id.in_(gms_ids)).all()
            article.gms_list = gms_list

        db.add(article)
        db.commit()
        db.refresh(article)
        return article
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    data = payload.model_dump(exclude_unset=True)
    if "gms_ids" in data:
        gms_ids = data.pop("gms_ids")
        if gms_ids is not None:
            gms_list = db.query(GMS).filter(GMS.id.in_(gms_ids)).all()
            article.gms_list = gms_list
            
    for key, value in data.items():
        setattr(article, key, value)
        
    db.commit()
    db.refresh(article)
    return article

@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete articles")
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"ok": True}

@router.post("/import/csv")
def import_articles_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can import articles")

    import csv, io
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    created, skipped, errors = 0, 0, []
    for i, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        if not name:
            errors.append(f"Row {i}: missing 'name'")
            skipped += 1
            continue
        try:
            article = Article(
                name=name,
                reference=row.get("reference") or None,
                category=row.get("category") or None,
                brand=row.get("brand") or None,
                unit=row.get("unit") or None,
                description=row.get("description") or None,
                barcode=row.get("barcode") or None,
                price=float(row["price"]) if row.get("price") else None,
                stock_alert_threshold=int(row["stock_alert_threshold"]) if row.get("stock_alert_threshold") else 0,
                is_active=True,
            )
            
            gms_id_str = row.get("gms_ids") or row.get("gms_id")
            if gms_id_str:
                gms_ids = [int(g.strip()) for g in gms_id_str.split(",") if g.strip().isdigit()]
                if gms_ids:
                    gms_list = db.query(GMS).filter(GMS.id.in_(gms_ids)).all()
                    article.gms_list = gms_list

            db.add(article)
            created += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1

    db.commit()
    return {"created": created, "skipped": skipped, "errors": errors}
