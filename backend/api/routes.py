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


def _build_load_base(session):
    return session.query(
        Athlete.team,
        Athlete.id.label("athlete_id"),
        Athlete.name.label("athlete_name"),
        TrainingPlan.name.label("program_name"),
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
    ).join(
        TrainingPlan, TrainingSession.plan_id == TrainingPlan.id
    )


def _apply_load_filters(q, user, team, athlete_id, program, start_date,
                        end_date, session_type, exercise_name):
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if team:
        q = q.filter(Athlete.team == team)
    if athlete_id:
        q = q.filter(Athlete.id == athlete_id)
    if program:
        q = q.filter(TrainingPlan.name == program)
    if start_date:
        q = q.filter(TrainingSession.session_date >= start_date)
    if end_date:
        q = q.filter(TrainingSession.session_date <= end_date)
    if session_type:
        q = q.filter(TrainingSession.session_type == session_type)
    if exercise_name:
        q = q.filter(TrainingExercise.exercise_name == exercise_name)
    return q


def _aggregate_rows(rows, key_fn, bucket_fn):
    buckets = {}
    for r in rows:
        key = key_fn(r)
        if key not in buckets:
            buckets[key] = bucket_fn(r)
        b = buckets[key]
        load = (r.actual_rpe or 0) * (r.actual_duration_min or 0) if r.actual_rpe and r.actual_duration_min else 0
        b["total_load"] += load
        if r.actual_rpe:
            b["total_rpe"] += r.actual_rpe
            b["rpe_count"] += 1
        b["session_count"] += 1
    result = []
    for v in buckets.values():
        v["total_load"] = round(v["total_load"], 1)
        v["avg_rpe"] = round(v["total_rpe"] / v["rpe_count"], 1) if v["rpe_count"] else None
        del v["total_rpe"]
        del v["rpe_count"]
        result.append(v)
    return result


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
        group_by = request.args.get("group_by", "team")
        team = request.args.get("team")
        athlete_id = request.args.get("athlete_id", type=int)
        program = request.args.get("program")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        session_type = request.args.get("session_type")
        exercise_name = request.args.get("exercise_name")
        anomaly_only = request.args.get("anomaly_only", "false").lower() == "true"

        if group_by == "metric":
            return _aggregate_metric(session, user, team, athlete_id, program,
                                     start_date, end_date, session_type,
                                     exercise_name, anomaly_only)

        q = _build_load_base(session)
        q = _apply_load_filters(q, user, team, athlete_id, program, start_date,
                                end_date, session_type, exercise_name)
        rows = q.all()

        if group_by == "team":
            return jsonify(_aggregate_rows(
                rows,
                key_fn=lambda r: r.team,
                bucket_fn=lambda r: {"team": r.team, "total_load": 0.0, "total_rpe": 0, "rpe_count": 0, "session_count": 0},
            ))
        elif group_by == "athlete":
            return jsonify(_aggregate_rows(
                rows,
                key_fn=lambda r: r.athlete_id,
                bucket_fn=lambda r: {"athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
                                     "team": r.team, "total_load": 0.0, "total_rpe": 0, "rpe_count": 0, "session_count": 0},
            ))
        elif group_by == "program":
            return jsonify(_aggregate_rows(
                rows,
                key_fn=lambda r: r.program_name,
                bucket_fn=lambda r: {"program": r.program_name, "total_load": 0.0, "total_rpe": 0, "rpe_count": 0, "session_count": 0},
            ))
        elif group_by == "training_day":
            return jsonify(_aggregate_rows(
                rows,
                key_fn=lambda r: r.session_date.isoformat() if r.session_date else "unknown",
                bucket_fn=lambda r: {"training_day": r.session_date.isoformat() if r.session_date else "unknown",
                                     "total_load": 0.0, "total_rpe": 0, "rpe_count": 0, "session_count": 0},
            ))
        elif group_by == "exercise":
            return jsonify(_aggregate_rows(
                rows,
                key_fn=lambda r: r.exercise_name,
                bucket_fn=lambda r: {"exercise_name": r.exercise_name, "exercise_category": r.exercise_category,
                                     "total_load": 0.0, "total_rpe": 0, "rpe_count": 0, "session_count": 0},
            ))

        return jsonify({"error": "Invalid group_by"}), 400
    finally:
        session.close()


def _apply_metric_scope(q, user, athlete_id, team):
    if user.role == ATHLETE_ROLE:
        q = q.filter(Athlete.id == user.athlete_id)
    if athlete_id:
        q = q.filter(Athlete.id == athlete_id)
    if team:
        q = q.filter(Athlete.team == team)
    return q


def _aggregate_metric(db, user, team, athlete_id, program, start_date,
                      end_date, session_type, exercise_name, anomaly_only):
    metric_type = request.args.get("metric_type", "heartrate")

    if metric_type == "heartrate":
        q = db.query(
            HeartRate.id,
            HeartRate.athlete_id,
            Athlete.name.label("athlete_name"),
            Athlete.team,
            HeartRate.recorded_at,
            HeartRate.hr_bpm,
            HeartRate.hr_zone,
            HeartRate.activity,
            HeartRate.is_anomaly,
            HeartRate.notes,
        ).join(Athlete, HeartRate.athlete_id == Athlete.id)

        q = _apply_metric_scope(q, user, athlete_id, team)
        if start_date:
            q = q.filter(HeartRate.recorded_at >= start_date)
        if end_date:
            q = q.filter(HeartRate.recorded_at <= end_date + " 23:59:59")
        if anomaly_only:
            q = q.filter(HeartRate.is_anomaly == True)
        rows = q.order_by(HeartRate.recorded_at.desc()).limit(500).all()
        return jsonify([{
            "id": r.id, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "team": r.team, "recorded_at": r.recorded_at.isoformat(),
            "hr_bpm": r.hr_bpm, "hr_zone": r.hr_zone,
            "activity": r.activity, "is_anomaly": r.is_anomaly, "notes": r.notes,
        } for r in rows])

    elif metric_type == "pace":
        q = db.query(
            Pace.id,
            Pace.athlete_id,
            Athlete.name.label("athlete_name"),
            Athlete.team,
            Pace.recorded_at,
            Pace.pace_min_per_km,
            Pace.distance_km,
            Pace.duration_min,
            Pace.activity,
            Pace.is_anomaly,
            Pace.notes,
        ).join(Athlete, Pace.athlete_id == Athlete.id)

        q = _apply_metric_scope(q, user, athlete_id, team)
        if start_date:
            q = q.filter(Pace.recorded_at >= start_date)
        if end_date:
            q = q.filter(Pace.recorded_at <= end_date + " 23:59:59")
        if anomaly_only:
            q = q.filter(Pace.is_anomaly == True)
        rows = q.order_by(Pace.recorded_at.desc()).limit(500).all()
        return jsonify([{
            "id": r.id, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "team": r.team, "recorded_at": r.recorded_at.isoformat(),
            "pace_min_per_km": r.pace_min_per_km, "distance_km": r.distance_km,
            "duration_min": r.duration_min, "activity": r.activity,
            "is_anomaly": r.is_anomaly, "notes": r.notes,
        } for r in rows])

    elif metric_type == "strength":
        q = db.query(
            StrengthTest.id,
            StrengthTest.athlete_id,
            Athlete.name.label("athlete_name"),
            Athlete.team,
            StrengthTest.test_date,
            StrengthTest.exercise_name,
            StrengthTest.one_rm_kg,
            StrengthTest.max_reps,
            StrengthTest.max_reps_load_kg,
            StrengthTest.velocity_ms,
            StrengthTest.power_w,
            StrengthTest.is_anomaly,
            StrengthTest.notes,
        ).join(Athlete, StrengthTest.athlete_id == Athlete.id)

        q = _apply_metric_scope(q, user, athlete_id, team)
        if start_date:
            q = q.filter(StrengthTest.test_date >= start_date)
        if end_date:
            q = q.filter(StrengthTest.test_date <= end_date)
        if anomaly_only:
            q = q.filter(StrengthTest.is_anomaly == True)
        if exercise_name:
            q = q.filter(StrengthTest.exercise_name == exercise_name)
        rows = q.order_by(StrengthTest.test_date.desc()).all()
        return jsonify([{
            "id": r.id, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "team": r.team, "test_date": r.test_date.isoformat(),
            "exercise_name": r.exercise_name, "one_rm_kg": r.one_rm_kg,
            "max_reps": r.max_reps, "max_reps_load_kg": r.max_reps_load_kg,
            "velocity_ms": r.velocity_ms, "power_w": r.power_w,
            "is_anomaly": r.is_anomaly, "notes": r.notes,
        } for r in rows])

    elif metric_type == "recovery":
        q = db.query(
            RecoveryScore.id,
            RecoveryScore.athlete_id,
            Athlete.name.label("athlete_name"),
            Athlete.team,
            RecoveryScore.score_date,
            RecoveryScore.overall_score,
            RecoveryScore.sleep_score,
            RecoveryScore.fatigue_score,
            RecoveryScore.stress_score,
            RecoveryScore.soreness_score,
            RecoveryScore.hrv_ms,
            RecoveryScore.is_anomaly,
            RecoveryScore.notes,
        ).join(Athlete, RecoveryScore.athlete_id == Athlete.id)

        q = _apply_metric_scope(q, user, athlete_id, team)
        if start_date:
            q = q.filter(RecoveryScore.score_date >= start_date)
        if end_date:
            q = q.filter(RecoveryScore.score_date <= end_date)
        if anomaly_only:
            q = q.filter(RecoveryScore.is_anomaly == True)
        rows = q.order_by(RecoveryScore.score_date).all()
        return jsonify([{
            "id": r.id, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "team": r.team, "score_date": r.score_date.isoformat(),
            "overall_score": r.overall_score, "sleep_score": r.sleep_score,
            "fatigue_score": r.fatigue_score, "stress_score": r.stress_score,
            "soreness_score": r.soreness_score, "hrv_ms": r.hrv_ms,
            "is_anomaly": r.is_anomaly, "notes": r.notes,
        } for r in rows])

    return jsonify([])


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
