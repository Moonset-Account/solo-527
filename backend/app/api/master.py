from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models import Team, HazardType, InspectionPoint
from ..schemas import TeamResponse, HazardTypeResponse, InspectionPointResponse

router = APIRouter(prefix="/api/master", tags=["master"])


@router.get("/teams", response_model=List[TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).filter(Team.is_active == True).order_by(Team.name).all()
    return teams


@router.get("/hazard-types", response_model=List[HazardTypeResponse])
def get_hazard_types(db: Session = Depends(get_db)):
    types = db.query(HazardType).filter(HazardType.is_active == True).order_by(HazardType.name).all()
    return types


@router.get("/inspection-points", response_model=List[InspectionPointResponse])
def get_inspection_points(db: Session = Depends(get_db)):
    points = db.query(InspectionPoint).filter(InspectionPoint.is_active == True).order_by(InspectionPoint.floor, InspectionPoint.name).all()
    return points


@router.get("/floors", response_model=List[int])
def get_floors(db: Session = Depends(get_db)):
    points = db.query(InspectionPoint.floor).distinct().filter(InspectionPoint.is_active == True).order_by(InspectionPoint.floor).all()
    return [p[0] for p in points]
