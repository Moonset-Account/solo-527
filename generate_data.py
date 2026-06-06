import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from config import Config
from database import init_db, get_session, Candidate, StageTransition, CandidateFeedback, SavedFilter

random.seed(42)
np.random.seed(42)


def generate_candidate_data(num_candidates=500):
    candidates = []
    transitions = []
    feedbacks = []

    start_date = datetime.now() - timedelta(days=365)

    for i in range(num_candidates):
        position = random.choice(Config.POSITIONS)
        department = random.choice(Config.DEPARTMENTS)
        channel = random.choice(Config.CHANNELS)
        recruiter = random.choice(Config.RECRUITERS)

        pos_weights = {
            "LinkedIn": 0.15,
            "猎聘": 0.18,
            "BOSS直聘": 0.22,
            "智联招聘": 0.12,
            "前程无忧": 0.10,
            "内部推荐": 0.15,
            "企业官网": 0.05,
            "校园招聘": 0.03,
        }

        application_offset = random.randint(0, 365)
        application_date = start_date + timedelta(days=application_offset)

        channel_stage_weights = {
            "内部推荐": [0.95, 0.92, 0.88, 0.82, 0.75, 0.68, 0.60],
            "LinkedIn": [0.90, 0.85, 0.78, 0.70, 0.62, 0.55, 0.48],
            "猎聘": [0.88, 0.82, 0.75, 0.68, 0.60, 0.52, 0.45],
            "BOSS直聘": [0.85, 0.78, 0.70, 0.62, 0.54, 0.46, 0.38],
            "智联招聘": [0.82, 0.75, 0.68, 0.60, 0.52, 0.44, 0.36],
            "前程无忧": [0.80, 0.72, 0.65, 0.57, 0.50, 0.42, 0.34],
            "企业官网": [0.78, 0.70, 0.62, 0.55, 0.48, 0.40, 0.32],
            "校园招聘": [0.75, 0.68, 0.60, 0.52, 0.45, 0.38, 0.30],
        }

        weights = channel_stage_weights.get(channel, [0.85, 0.78, 0.70, 0.62, 0.54, 0.46, 0.38])

        final_stage_idx = len(Config.STAGES) - 1
        for idx in range(len(weights) - 1, -1, -1):
            if random.random() < weights[idx]:
                final_stage_idx = idx + 1
                break

        final_stage = Config.STAGES[final_stage_idx]

        candidate = Candidate(
            name=f"候选人{i+1:04d}",
            email=f"candidate{i+1}@example.com",
            phone=f"138{random.randint(10000000, 99999999)}",
            position=position,
            department=department,
            channel=channel,
            recruiter=recruiter,
            current_stage=final_stage,
            application_date=application_date.date(),
        )
        candidates.append(candidate)

        current_date = application_date
        for stage_idx in range(final_stage_idx + 1):
            stage_name = Config.STAGES[stage_idx]

            base_durations = {
                "职位发布": 0,
                "简历投递": random.uniform(0, 2),
                "简历筛选": random.uniform(1, 5),
                "一面": random.uniform(3, 10),
                "二面": random.uniform(3, 10),
                "HR面": random.uniform(2, 7),
                "Offer发放": random.uniform(3, 14),
                "入职": random.uniform(7, 30),
            }

            duration = base_durations.get(stage_name, random.uniform(2, 7))
            duration = max(0.5, duration * random.gauss(1, 0.3))

            enter_date = current_date.date()
            exit_date = (current_date + timedelta(days=duration)).date()

            interviewer = None
            if stage_name in ["一面", "二面", "HR面"]:
                interviewer = random.choice(Config.INTERVIEWERS)

            result = "通过"
            if stage_idx == final_stage_idx and stage_name != "入职":
                if random.random() < 0.3:
                    result = "拒绝"
                else:
                    result = "进行中"
                    exit_date = None

            transition = StageTransition(
                stage_name=stage_name,
                stage_order=stage_idx,
                enter_date=enter_date,
                exit_date=exit_date,
                interviewer=interviewer,
                duration_days=round(duration, 1) if exit_date else None,
                result=result,
            )
            transitions.append((i, transition))

            if exit_date:
                current_date = current_date + timedelta(days=duration)

        if final_stage in ["Offer发放", "入职"]:
            if random.random() < 0.6:
                base_rating = {
                    "内部推荐": 4.5,
                    "LinkedIn": 4.2,
                    "猎聘": 4.0,
                    "BOSS直聘": 3.8,
                    "智联招聘": 3.7,
                    "前程无忧": 3.6,
                    "企业官网": 3.9,
                    "校园招聘": 4.1,
                }.get(channel, 3.8)

                feedback = CandidateFeedback(
                    overall_rating=round(min(5, max(1, base_rating + random.gauss(0, 0.5))), 1),
                    interview_experience=round(min(5, max(1, base_rating + random.gauss(0, 0.6))), 1),
                    communication_rating=round(min(5, max(1, base_rating + random.gauss(0, 0.4))), 1),
                    process_speed_rating=round(min(5, max(1, base_rating - 0.3 + random.gauss(0, 0.7))), 1),
                    comments="" if random.random() < 0.5 else f"候选人对招聘流程的反馈信息{i}",
                    feedback_date=(current_date + timedelta(days=random.randint(1, 14))).date(),
                )
                feedbacks.append((i, feedback))

    return candidates, transitions, feedbacks


def insert_mock_data():
    session = get_session()

    try:
        candidates, transitions, feedbacks = generate_candidate_data(600)

        for idx, candidate in enumerate(candidates):
            session.add(candidate)
            session.flush()

            for cand_idx, transition in transitions:
                if cand_idx == idx:
                    transition.candidate_id = candidate.id
                    session.add(transition)

            for cand_idx, feedback in feedbacks:
                if cand_idx == idx:
                    feedback.candidate_id = candidate.id
                    session.add(feedback)

        default_filters = [
            {
                "name": "全部候选人",
                "filter_config": '{"positions":[],"departments":[],"recruiters":[],"channels":[],"stages":[],"date_range":null}',
            },
            {
                "name": "技术部招聘",
                "filter_config": '{"positions":[],"departments":["技术部"],"recruiters":[],"channels":[],"stages":[],"date_range":null}',
            },
            {
                "name": "进行中候选人",
                "filter_config": '{"positions":[],"departments":[],"recruiters":[],"channels":[],"stages":["简历筛选","一面","二面","HR面"],"date_range":null}',
            },
        ]

        for filt in default_filters:
            saved = SavedFilter(
                name=filt["name"],
                filter_config=filt["filter_config"],
                created_by="system",
            )
            session.add(saved)

        session.commit()
        print(f"成功插入 {len(candidates)} 条候选人数据")
        print(f"成功插入 {len(transitions)} 条阶段流转数据")
        print(f"成功插入 {len(feedbacks)} 条候选人反馈数据")
        print(f"成功插入 {len(default_filters)} 个默认筛选组合")

    except Exception as e:
        session.rollback()
        print(f"插入数据时出错: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    init_db()
    insert_mock_data()
