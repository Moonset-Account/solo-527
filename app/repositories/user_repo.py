from app.repositories.base import BaseRepository
from app.models import User
from app.schemas import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self):
        super().__init__(User)

    def get_by_username(self, db, username: str):
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db, email: str):
        return db.query(User).filter(User.email == email).first()

    def get_by_role(self, db, role: str, skip: int = 0, limit: int = 100):
        return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
