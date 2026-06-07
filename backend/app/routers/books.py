from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models import Book
from ..schemas import Book as BookSchema, BookCreate, BookUpdate

router = APIRouter(prefix="/books", tags=["书籍管理"])


@router.get("/", response_model=List[BookSchema])
def get_books(
    skip: int = 0,
    limit: int = 100,
    isbn: Optional[str] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Book)
    if isbn:
        query = query.filter(Book.isbn.contains(isbn))
    if title:
        query = query.filter(Book.title.contains(title))
    return query.offset(skip).limit(limit).all()


@router.get("/{book_id}", response_model=BookSchema)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    return book


@router.get("/isbn/{isbn}", response_model=BookSchema)
def get_book_by_isbn(isbn: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    return book


@router.post("/", response_model=BookSchema)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    existing = db.query(Book).filter(Book.isbn == book.isbn).first()
    if existing:
        raise HTTPException(status_code=400, detail="ISBN已存在")
    
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


@router.put("/{book_id}", response_model=BookSchema)
def update_book(book_id: int, book_update: BookUpdate, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    update_data = book_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
    
    db.commit()
    db.refresh(db_book)
    return db_book


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    db.delete(db_book)
    db.commit()
    return {"message": "删除成功"}
