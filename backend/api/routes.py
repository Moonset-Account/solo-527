from flask import Blueprint, request, jsonify
from sqlalchemy import func, and_, case
from datetime import datetime, date, timedelta

from backend.db.database import SessionLocal
from backend.models.schema import (
    Athlete, HeartRate, Pace, StrengthTest, RecoveryScore,
    Injury, TrainingPlan, TrainingSession, TrainingExercise, TrainingLog, User,
)
from backend.config import COACH_ROLE, ATHLETE_ROLE

api_bp = Blueprint("api", __name__)


def _current_user():
    uid = request.headers.get("X-User-Id", "1")
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=int(uid)).first()
        return user
    finally:
        session.close()


def _athlete_filter(query, user, athlete_id=None):
    if user.role == ATHLETE_ROLE:
        query = query.filter(Athlete.id == user.athlete_id)
    if athlete_id:
        query = query.filter(Athlete.id == athlete_id)
    return query


@api_bp.route("/athletes", methods=["GET"])
def list_athletes():
    user = _current_user()
    session = SessionLocal()
    try:
        q = session.query(Athlete)
        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        team = request.args.get("team")
        if team:
            q = q.filter(Athlete.team == team)
        athletes = q.all()
        return jsonify([{
            "id": a.id, "name": a.name, "team": a.team,
            "position": a.position, "age": a.age,
            "weight_kg": a.weight_kg, "height_cm": a.height_cm,
        } for a in athletes])
    finally:
        session.close()


@api_bp.route("/teams", methods=["GET"])
def list_teams():
    session = SessionLocal()
    try:
        teams = session.query(Athlete.team).distinct().all()
        return jsonify([t[0] for t in teams])
    finally:
        session.close()


@api_bp.route("/load/aggregate", methods=["GET"])
def load_aggregate():
    user = _current_user()
    session = SessionLocal()
    try:
        dimension = request.args.get("dimension", "team")
        team = request.args.get("team")
        athlete_id = request.args.get("athlete_id", type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        session_type = request.args.get("session_type")

        q = session.query(
            Athlete.team,
            Athlete.id.label("athlete_id"),
            Athlete.name.label("athlete_name"),
            TrainingSession.session_date,
            TrainingSession.session_type,
            TrainingExercise.exercise_name,
            TrainingExercise.exercise_category,
            TrainingLog.actual_rpe,
            TrainingLog.actual_sets,
            TrainingLog.actual_reps,
            TrainingLog.actual_load_kg,
            TrainingLog.actual_duration_min,
            TrainingLog.completed,
        ).join(
            TrainingLog, TrainingLog.athlete_id == Athlete.id
        ).join(
            TrainingSession, TrainingLog.session_id == TrainingSession.id
        ).join(
            TrainingExercise, TrainingLog.exercise_id == TrainingExercise.id
        )

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if team:
            q = q.filter(Athlete.team == team)
        if athlete_id:
            q = q.filter(Athlete.id == athlete_id)
        if start_date:
            q = q.filter(TrainingSession.session_date >= start_date)
        if end_date:
            q = q.filter(TrainingSession.session_date <= end_date)
        if session_type:
            q = q.filter(TrainingSession.session_type == session_type)

        rows = q.all()

        result = []
        for r in rows:
            load = (r.actual_rpe or 0) * (r.actual_duration_min or 0) if r.actual_rpe and r.actual_duration_min else 0
            result.append({
                "team": r.team,
                "athlete_id": r.athlete_id,
                "athlete_name": r.athlete_name,
                "session_date": r.session_date.isoformat() if r.session_date else None,
                "session_type": r.session_type,
                "exercise_name": r.exercise_name,
                "exercise_category": r.exercise_category,
                "rpe": r.actual_rpe,
                "load": round(load, 1),
                "completed": r.completed,
            })

        return jsonify(result)
    finally:
        session.close()


@api_bp.route("/heartrate/aggregate", methods=["GET"])
def heartrate_aggregate():
    user = _current_user()
    session = SessionLocal()
    try:
        athlete_id = request.args.get("athlete_id", type=int)
        team = request.args.get("team")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        group_by = request.args.get("group_by", "day")

        q = session.query(
            Athlete.id.label("athlete_id"),
            Athlete.name.label("athlete_name"),
            Athlete.team,
            func.date(HeartRate.recorded_at).label("date"),
            func.avg(HeartRate.hr_bpm).label("avg_hr"),
            func.max(HeartRate.hr_bpm).label("max_hr"),
            func.min(HeartRate.hr_bpm).label("min_hr"),
            func.count(HeartRate.id).label("count"),
        ).join(HeartRate, HeartRate.athlete_id == Athlete.id)

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if athlete_id:
            q = q.filter(Athlete.id == athlete_id)
        if team:
            q = q.filter(Athlete.team == team)
        if start_date:
            q = q.filter(HeartRate.recorded_at >= start_date)
        if end_date:
            q = q.filter(HeartRate.recorded_at <= end_date + " 23:59:59")

        if group_by == "day":
            q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(HeartRate.recorded_at))
        elif group_by == "week":
            q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.strftime("%Y-W%W", HeartRate.recorded_at))
        else:
            q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(HeartRate.recorded_at))

        rows = q.all()
        return jsonify([{
            "athlete_id": r.athlete_id,
            "athlete_name": r.athlete_name,
            "team": r.team,
            "date": r.date,
            "avg_hr": round(r.avg_hr, 1) if r.avg_hr else None,
            "max_hr": r.max_hr,
            "min_hr": r.min_hr,
            "count": r.count,
        } for r in rows])
    finally:
        session.close()


@api_bp.route("/pace/aggregate", methods=["GET"])
def pace_aggregate():
    user = _current_user()
    session = SessionLocal()
    try:
        athlete_id = request.args.get("athlete_id", type=int)
        team = request.args.get("team")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        q = session.query(
            Athlete.id.label("athlete_id"),
            Athlete.name.label("athlete_name"),
            Athlete.team,
            func.date(Pace.recorded_at).label("date"),
            func.avg(Pace.pace_min_per_km).label("avg_pace"),
            func.min(Pace.pace_min_per_km).label("best_pace"),
            func.sum(Pace.distance_km).label("total_km"),
            func.count(Pace.id).label("count"),
        ).join(Pace, Pace.athlete_id == Athlete.id)

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if athlete_id:
            q = q.filter(Athlete.id == athlete_id)
        if team:
            q = q.filter(Athlete.team == team)
        if start_date:
            q = q.filter(Pace.recorded_at >= start_date)
        if end_date:
            q = q.filter(Pace.recorded_at <= end_date + " 23:59:59")

        q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(Pace.recorded_at))
        rows = q.all()

        return jsonify([{
            "athlete_id": r.athlete_id,
            "athlete_name": r.athlete_name,
            "team": r.team,
            "date": r.date,
            "avg_pace": round(r.avg_pace, 2) if r.avg_pace else None,
            "best_pace": round(r.best_pace, 2) if r.best_pace else None,
            "total_km": round(r.total_km, 1) if r.total_km else None,
            "count": r.count,
        } for r in rows])
    finally:
        session.close()


@api_bp.route("/strength/aggregate", methods=["GET"])
def strength_aggregate():
    user = _current_user()
    session = SessionLocal()
    try:
        athlete_id = request.args.get("athlete_id", type=int)
        team = request.args.get("team")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        exercise = request.args.get("exercise")

        q = session.query(StrengthTest).join(Athlete, StrengthTest.athlete_id == Athlete.id)

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if athlete_id:
            q = q.filter(StrengthTest.athlete_id == athlete_id)
        if team:
            q = q.filter(Athlete.team == team)
        if start_date:
            q = q.filter(StrengthTest.test_date >= start_date)
        if end_date:
            q = q.filter(StrengthTest.test_date <= end_date)
        if exercise:
            q = q.filter(StrengthTest.exercise_name == exercise)

        rows = q.all()
        result = []
        for r in rows:
            ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
            result.append({
                "id": r.id,
                "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "test_date": r.test_date.isoformat(),
                "exercise_name": r.exercise_name,
                "one_rm_kg": r.one_rm_kg,
                "max_reps": r.max_reps,
                "max_reps_load_kg": r.max_reps_load_kg,
                "velocity_ms": r.velocity_ms,
                "power_w": r.power_w,
                "is_anomaly": r.is_anomaly,
                "notes": r.notes,
            })
        return jsonify(result)
    finally:
        session.close()


@api_bp.route("/recovery/aggregate", methods=["GET"])
def recovery_aggregate():
    user = _current_user()
    session = SessionLocal()
    try:
        athlete_id = request.args.get("athlete_id", type=int)
        team = request.args.get("team")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        q = session.query(RecoveryScore).join(Athlete, RecoveryScore.athlete_id == Athlete.id)

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if athlete_id:
            q = q.filter(RecoveryScore.athlete_id == athlete_id)
        if team:
            q = q.filter(Athlete.team == team)
        if start_date:
            q = q.filter(RecoveryScore.score_date >= start_date)
        if end_date:
            q = q.filter(RecoveryScore.score_date <= end_date)

        rows = q.order_by(RecoveryScore.score_date).all()
        result = []
        for r in rows:
            ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
            result.append({
                "id": r.id,
                "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "score_date": r.score_date.isoformat(),
                "overall_score": r.overall_score,
                "sleep_score": r.sleep_score,
                "fatigue_score": r.fatigue_score,
                "stress_score": r.stress_score,
                "soreness_score": r.soreness_score,
                "hrv_ms": r.hrv_ms,
                "is_anomaly": r.is_anomaly,
                "notes": r.notes,
            })
        return jsonify(result)
    finally:
        session.close()


@api_bp.route("/injuries", methods=["GET"])
def list_injuries():
    user = _current_user()
    session = SessionLocal()
    try:
        athlete_id = request.args.get("athlete_id", type=int)
        team = request.args.get("team")

        q = session.query(Injury).join(Athlete, Injury.athlete_id == Athlete.id)

        if user.role == ATHLETE_ROLE:
            q = q.filter(Athlete.id == user.athlete_id)
        if athlete_id:
            q = q.filter(Injury.athlete_id == athlete_id)
        if team:
            q = q.filter(Athlete.team == team)

        rows = q.order_by(Injury.injury_date.desc()).all()
        result = []
        for r in rows:
            ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
            item = {
                "id": r.id,
                "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "injury_date": r.injury_date.isoformat(),
                "body_part": r.body_part,
                "injury_type": r.injury_type,
                "severity": r.severity,
                "status": r.status,
                "return_date": r.return_date.isoformat() if r.return_date else None,
                "athlete_notes": r.athlete_notes,
            }
            if user.role == COACH_ROLE:
                item["coach_notes"] = r.coach_notes
            result.append(item)
        return jsonify(result)
    finally:
        session.close()


@api_bp.route("/drilldown/<path:dimension>", methods=["GET"])
def drilldown(dimension):
    user = _current_user()
    session = SessionLocal()
    try:
        filters = {}
        for key in ["team", "athlete_id", "session_date", "exercise_name", "session_type", "start_date", "end_date"]:
            val = request.args.get(key)
            if val:
                filters[key] = val

        if dimension == "team":
            q = session.query(Athlete.team, func.count(Athlete.id).label("count")).group_by(Athlete.team)
            if user.role == ATHLETE_ROLE:
                q = q.filter(Athlete.id == user.athlete_id)
            rows = q.all()
            return jsonify([{"team": r.team, "athlete_count": r.count} for r in rows])

        elif dimension == "athlete":
            q = session.query(Athlete)
            if user.role == ATHLETE_ROLE:
                q = q.filter(Athlete.id == user.athlete_id)
            if filters.get("team"):
                q = q.filter(Athlete.team == filters["team"])
            rows = q.all()
            return jsonify([{"id": a.id, "name": a.name, "team": a.team, "position": a.position} for a in rows])

        elif dimension == "session":
            q = session.query(TrainingSession)
            if filters.get("start_date"):
                q = q.filter(TrainingSession.session_date >= filters["start_date"])
            if filters.get("end_date"):
                q = q.filter(TrainingSession.session_date <= filters["end_date"])
            if filters.get("session_type"):
                q = q.filter(TrainingSession.session_type == filters["session_type"])
            rows = q.order_by(TrainingSession.session_date.desc()).limit(100).all()
            return jsonify([{
                "id": s.id, "session_date": s.session_date.isoformat(),
                "session_type": s.session_type, "intensity_zone": s.intensity_zone,
            } for s in rows])

        elif dimension == "exercise":
            q = session.query(TrainingExercise)
            if filters.get("session_id"):
                q = q.filter(TrainingExercise.session_id == filters["session_id"])
            rows = q.all()
            return jsonify([{
                "id": e.id, "exercise_name": e.exercise_name,
                "exercise_category": e.exercise_category,
                "sets": e.sets, "reps": e.reps, "load_kg": e.load_kg,
                "duration_min": e.duration_min, "rpe": e.rpe,
            } for e in rows])

        elif dimension == "metric":
            metric_type = request.args.get("metric_type", "heartrate")
            if metric_type == "heartrate":
                return _drilldown_heartrate(session, user, filters)
            elif metric_type == "pace":
                return _drilldown_pace(session, user, filters)
            elif metric_type == "strength":
                return _drilldown_strength(session, user, filters)
            elif metric_type == "recovery":
                return _drilldown_recovery(session, user, filters)
            return jsonify([])
        else:
            return jsonify({"error": "Unknown dimension"}), 400
    finally:
        session.close()


def _drilldown_heartrate(db, user, filters):
    q = db.query(HeartRate).join(Athlete, HeartRate.athlete_id == Athlete.id)
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if filters.get("athlete_id"):
        q = q.filter(HeartRate.athlete_id == int(filters["athlete_id"]))
    if filters.get("start_date"):
        q = q.filter(HeartRate.recorded_at >= filters["start_date"])
    if filters.get("end_date"):
        q = q.filter(HeartRate.recorded_at <= filters["end_date"] + " 23:59:59")
    if request.args.get("anomaly_only") == "true":
        q = q.filter(HeartRate.is_anomaly == True)
    rows = q.order_by(HeartRate.recorded_at.desc()).limit(500).all()
    result = []
    for r in rows:
        ath = db.query(Athlete).filter_by(id=r.athlete_id).first()
        result.append({
            "id": r.id, "athlete_name": ath.name if ath else None,
            "recorded_at": r.recorded_at.isoformat(),
            "hr_bpm": r.hr_bpm, "hr_zone": r.hr_zone,
            "activity": r.activity, "is_anomaly": r.is_anomaly,
            "notes": r.notes,
        })
    return jsonify(result)


def _drilldown_pace(db, user, filters):
    q = db.query(Pace).join(Athlete, Pace.athlete_id == Athlete.id)
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if filters.get("athlete_id"):
        q = q.filter(Pace.athlete_id == int(filters["athlete_id"]))
    if filters.get("start_date"):
        q = q.filter(Pace.recorded_at >= filters["start_date"])
    if filters.get("end_date"):
        q = q.filter(Pace.recorded_at <= filters["end_date"] + " 23:59:59")
    if request.args.get("anomaly_only") == "true":
        q = q.filter(Pace.is_anomaly == True)
    rows = q.order_by(Pace.recorded_at.desc()).limit(500).all()
    result = []
    for r in rows:
        ath = db.query(Athlete).filter_by(id=r.athlete_id).first()
        result.append({
            "id": r.id, "athlete_name": ath.name if ath else None,
            "recorded_at": r.recorded_at.isoformat(),
            "pace_min_per_km": r.pace_min_per_km,
            "distance_km": r.distance_km, "duration_min": r.duration_min,
            "activity": r.activity, "is_anomaly": r.is_anomaly,
            "notes": r.notes,
        })
    return jsonify(result)


def _drilldown_strength(db, user, filters):
    q = db.query(StrengthTest).join(Athlete, StrengthTest.athlete_id == Athlete.id)
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if filters.get("athlete_id"):
        q = q.filter(StrengthTest.athlete_id == int(filters["athlete_id"]))
    if filters.get("start_date"):
        q = q.filter(StrengthTest.test_date >= filters["start_date"])
    if filters.get("end_date"):
        q = q.filter(StrengthTest.test_date <= filters["end_date"])
    rows = q.all()
    result = []
    for r in rows:
        ath = db.query(Athlete).filter_by(id=r.athlete_id).first()
        result.append({
            "id": r.id, "athlete_name": ath.name if ath else None,
            "test_date": r.test_date.isoformat(),
            "exercise_name": r.exercise_name, "one_rm_kg": r.one_rm_kg,
            "max_reps": r.max_reps, "velocity_ms": r.velocity_ms,
            "power_w": r.power_w, "is_anomaly": r.is_anomaly, "notes": r.notes,
        })
    return jsonify(result)


def _drilldown_recovery(db, user, filters):
    q = db.query(RecoveryScore).join(Athlete, RecoveryScore.athlete_id == Athlete.id)
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if filters.get("athlete_id"):
        q = q.filter(RecoveryScore.athlete_id == int(filters["athlete_id"]))
    if filters.get("start_date"):
        q = q.filter(RecoveryScore.score_date >= filters["start_date"])
    if filters.get("end_date"):
        q = q.filter(RecoveryScore.score_date <= filters["end_date"])
    rows = q.order_by(RecoveryScore.score_date).all()
    result = []
    for r in rows:
        ath = db.query(Athlete).filter_by(id=r.athlete_id).first()
        result.append({
            "id": r.id, "athlete_name": ath.name if ath else None,
            "score_date": r.score_date.isoformat(),
            "overall_score": r.overall_score, "sleep_score": r.sleep_score,
            "fatigue_score": r.fatigue_score, "stress_score": r.stress_score,
            "soreness_score": r.soreness_score, "hrv_ms": r.hrv_ms,
            "is_anomaly": r.is_anomaly, "notes": r.notes,
        })
    return jsonify(result)


@api_bp.route("/record/<record_type>/<int:record_id>", methods=["GET"])
def get_record_detail(record_type, record_id):
    user = _current_user()
    session = SessionLocal()
    try:
        result = {}
        if record_type == "heartrate":
            r = session.query(HeartRate).filter_by(id=record_id).first()
            if r:
                ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
                if user.role == ATHLETE_ROLE and user.athlete_id != r.athlete_id:
                    return jsonify({"error": "Permission denied"}), 403
                result = {
                    "id": r.id, "athlete_name": ath.name if ath else None,
                    "recorded_at": r.recorded_at.isoformat(),
                    "hr_bpm": r.hr_bpm, "hr_zone": r.hr_zone,
                    "activity": r.activity, "is_anomaly": r.is_anomaly,
                    "notes": r.notes,
                }
        elif record_type == "pace":
            r = session.query(Pace).filter_by(id=record_id).first()
            if r:
                ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
                if user.role == ATHLETE_ROLE and user.athlete_id != r.athlete_id:
                    return jsonify({"error": "Permission denied"}), 403
                result = {
                    "id": r.id, "athlete_name": ath.name if ath else None,
                    "recorded_at": r.recorded_at.isoformat(),
                    "pace_min_per_km": r.pace_min_per_km,
                    "distance_km": r.distance_km, "duration_min": r.duration_min,
                    "activity": r.activity, "is_anomaly": r.is_anomaly,
                    "notes": r.notes,
                }
        elif record_type == "strength":
            r = session.query(StrengthTest).filter_by(id=record_id).first()
            if r:
                ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
                if user.role == ATHLETE_ROLE and user.athlete_id != r.athlete_id:
                    return jsonify({"error": "Permission denied"}), 403
                result = {
                    "id": r.id, "athlete_name": ath.name if ath else None,
                    "test_date": r.test_date.isoformat(),
                    "exercise_name": r.exercise_name, "one_rm_kg": r.one_rm_kg,
                    "max_reps": r.max_reps, "max_reps_load_kg": r.max_reps_load_kg,
                    "velocity_ms": r.velocity_ms, "power_w": r.power_w,
                    "is_anomaly": r.is_anomaly, "notes": r.notes,
                }
        elif record_type == "recovery":
            r = session.query(RecoveryScore).filter_by(id=record_id).first()
            if r:
                ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
                if user.role == ATHLETE_ROLE and user.athlete_id != r.athlete_id:
                    return jsonify({"error": "Permission denied"}), 403
                result = {
                    "id": r.id, "athlete_name": ath.name if ath else None,
                    "score_date": r.score_date.isoformat(),
                    "overall_score": r.overall_score, "sleep_score": r.sleep_score,
                    "fatigue_score": r.fatigue_score, "stress_score": r.stress_score,
                    "soreness_score": r.soreness_score, "hrv_ms": r.hrv_ms,
                    "is_anomaly": r.is_anomaly, "notes": r.notes,
                }
        elif record_type == "injury":
            r = session.query(Injury).filter_by(id=record_id).first()
            if r:
                ath = session.query(Athlete).filter_by(id=r.athlete_id).first()
                if user.role == ATHLETE_ROLE and user.athlete_id != r.athlete_id:
                    return jsonify({"error": "Permission denied"}), 403
                result = {
                    "id": r.id, "athlete_name": ath.name if ath else None,
                    "injury_date": r.injury_date.isoformat(),
                    "body_part": r.body_part, "injury_type": r.injury_type,
                    "severity": r.severity, "status": r.status,
                    "athlete_notes": r.athlete_notes,
                    "return_date": r.return_date.isoformat() if r.return_date else None,
                }
                if user.role == COACH_ROLE:
                    result["coach_notes"] = r.coach_notes

        if not result:
            return jsonify({"error": "Record not found"}), 404
        return jsonify(result)
    finally:
        session.close()


@api_bp.route("/session_types", methods=["GET"])
def list_session_types():
    session = SessionLocal()
    try:
        types = session.query(TrainingSession.session_type).distinct().all()
        return jsonify([t[0] for t in types if t[0]])
    finally:
        session.close()


@api_bp.route("/exercise_names", methods=["GET"])
def list_exercise_names():
    session = SessionLocal()
    try:
        names = session.query(TrainingExercise.exercise_name).distinct().all()
        return jsonify([n[0] for n in names if n[0]])
    finally:
        session.close()
