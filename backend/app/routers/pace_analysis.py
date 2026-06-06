from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/pace-analysis", tags=["pace_analysis"])


def parse_pace_to_seconds(pace_str: str) -> float:
    if not pace_str:
        return 0
    parts = pace_str.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return 0


def seconds_to_pace(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes}:{secs:02d}"


@router.post("/{checkin_id}", response_model=schemas.PaceAnalysisResponse)
def analyze_pace(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    checkin = db.query(models.Checkin).filter(models.Checkin.id == checkin_id).first()
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin not found")

    runner_profile = db.query(models.RunnerProfile).filter(
        models.RunnerProfile.user_id == checkin.runner_id
    ).first()
    pace_zones = []
    if runner_profile:
        pace_zones = db.query(models.PaceZone).filter(
            models.PaceZone.runner_profile_id == runner_profile.id
        ).all()

    avg_pace_seconds = parse_pace_to_seconds(checkin.avg_pace) if checkin.avg_pace else 0

    zone_coverage = {}
    for zone in pace_zones:
        min_sec = parse_pace_to_seconds(zone.min_pace)
        max_sec = parse_pace_to_seconds(zone.max_pace)
        if max_sec <= avg_pace_seconds <= min_sec:
            zone_coverage[zone.zone_name] = 100.0
        else:
            zone_coverage[zone.zone_name] = 0.0

    if not zone_coverage and pace_zones:
        for zone in pace_zones:
            zone_coverage[zone.zone_name] = 0.0

    suggestions = []
    if avg_pace_seconds > 0:
        if checkin.perceived_effort and checkin.perceived_effort >= 8:
            suggestions.append("配速偏快，建议下次训练降低强度，注意恢复")
        elif checkin.perceived_effort and checkin.perceived_effort <= 3:
            suggestions.append("配速偏慢，可适当提高训练强度")
        else:
            suggestions.append("配速合理，继续保持当前训练节奏")

        if checkin.avg_heart_rate and checkin.avg_heart_rate > 170:
            suggestions.append("心率偏高，注意控制训练强度")

    intensity = "中等"
    if checkin.perceived_effort:
        if checkin.perceived_effort >= 8:
            intensity = "高强度"
        elif checkin.perceived_effort <= 4:
            intensity = "低强度"

    analysis = schemas.PaceAnalysisResponse(
        avg_pace=checkin.avg_pace or "0:00",
        pace_zones_coverage=zone_coverage,
        improvement_suggestions=suggestions,
        training_intensity=intensity
    )

    checkin.pace_analysis = analysis.model_dump()
    db.commit()

    return analysis


@router.get("/runner/{runner_id}", response_model=List[schemas.PaceAnalysisResponse])
def get_runner_pace_history(
    runner_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    checkins = db.query(models.Checkin).filter(
        models.Checkin.runner_id == runner_id,
        models.Checkin.pace_analysis.isnot(None)
    ).order_by(models.Checkin.checkin_date.desc()).limit(10).all()

    results = []
    for checkin in checkins:
        if checkin.pace_analysis:
            results.append(schemas.PaceAnalysisResponse(**checkin.pace_analysis))
    return results


@router.get("/my-history", response_model=List[schemas.PaceAnalysisResponse])
def get_my_pace_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    checkins = db.query(models.Checkin).filter(
        models.Checkin.runner_id == current_user.id,
        models.Checkin.pace_analysis.isnot(None)
    ).order_by(models.Checkin.checkin_date.desc()).limit(10).all()

    results = []
    for checkin in checkins:
        if checkin.pace_analysis:
            results.append(schemas.PaceAnalysisResponse(**checkin.pace_analysis))
    return results
