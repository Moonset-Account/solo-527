from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schemas import TeamResponse, HazardTypeResponse, InspectionPointResponse
from app.models.models import Team, HazardType, InspectionPoint

router = APIRouter(prefix="/master", tags=["主数据"])


@router.get("/teams", response_model=list[TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    if not teams:
        default_teams = [
            Team(id="team-1", name="土建一班", leader="王队长", phone="13800138010"),
            Team(id="team-2", name="土建二班", leader="李队长", phone="13800138011"),
            Team(id="team-3", name="水电班组", leader="张班长", phone="13800138012"),
            Team(id="team-4", name="架子班组", leader="刘班长", phone="13800138013"),
            Team(id="team-5", name="消防班组", leader="陈班长", phone="13800138014"),
            Team(id="team-6", name="机电班组", leader="赵班长", phone="13800138015"),
        ]
        for team in default_teams:
            db.add(team)
        db.commit()
        teams = default_teams
    return teams


@router.get("/hazard-types", response_model=list[HazardTypeResponse])
def get_hazard_types(db: Session = Depends(get_db)):
    types = db.query(HazardType).all()
    if not types:
        default_types = [
            HazardType(id="type-1", name="临边防护缺失", code="edge_protection", level="high"),
            HazardType(id="type-2", name="脚手架隐患", code="scaffold", level="critical"),
            HazardType(id="type-3", name="临时用电不规范", code="electricity", level="high"),
            HazardType(id="type-4", name="消防设施不足", code="fire_fighting", level="medium"),
            HazardType(id="type-5", name="高空坠物风险", code="falling_object", level="critical"),
            HazardType(id="type-6", name="机械防护缺失", code="machine_protection", level="medium"),
            HazardType(id="type-7", name="安全帽未佩戴", code="helmet", level="low"),
            HazardType(id="type-8", name="安全网破损", code="safety_net", level="high"),
        ]
        for t in default_types:
            db.add(t)
        db.commit()
        types = default_types
    return types


@router.get("/inspection-points", response_model=list[InspectionPointResponse])
def get_inspection_points(db: Session = Depends(get_db)):
    points = db.query(InspectionPoint).all()
    if not points:
        default_points = [
            InspectionPoint(id="point-1", name="1层东楼梯口", floor=1, area="东区"),
            InspectionPoint(id="point-2", name="2层南侧临边", floor=2, area="南区"),
            InspectionPoint(id="point-3", name="3层脚手架", floor=3, area="北区"),
            InspectionPoint(id="point-4", name="4层电箱区域", floor=4, area="西区"),
            InspectionPoint(id="point-5", name="5层电梯井口", floor=5, area="中区"),
            InspectionPoint(id="point-6", name="地下室消防通道", floor=-1, area="地下室"),
            InspectionPoint(id="point-7", name="屋面设备层", floor=6, area="屋面"),
            InspectionPoint(id="point-8", name="1层材料堆放区", floor=1, area="材料区"),
            InspectionPoint(id="point-9", name="2层模板支撑", floor=2, area="北区"),
            InspectionPoint(id="point-10", name="3层钢筋加工区", floor=3, area="材料区"),
            InspectionPoint(id="point-11", name="4层塔吊附墙", floor=4, area="东区"),
            InspectionPoint(id="point-12", name="5层外架卸料平台", floor=5, area="南区"),
        ]
        for p in default_points:
            db.add(p)
        db.commit()
        points = default_points
    return points


@router.get("/floors")
def get_floors():
    return [-1, 1, 2, 3, 4, 5, 6]
