import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def generate_demo_data():
    np.random.seed(42)
    now = datetime(2026, 5, 1)
    update_date = datetime(2026, 3, 15)

    chapters = [
        {"id": 1, "course_id": 101, "name": "Python 基础入门"},
        {"id": 2, "course_id": 101, "name": "数据结构与算法"},
        {"id": 3, "course_id": 102, "name": "机器学习导论"},
    ]

    chapter_versions = [
        {"id": 1, "chapter_id": 1, "version_number": 1,
         "updated_at": datetime(2026, 1, 1), "change_description": "初始版本",
         "is_current": False},
        {"id": 2, "chapter_id": 1, "version_number": 2,
         "updated_at": update_date,
         "change_description": "重构章节结构，增加实战案例",
         "is_current": True},
        {"id": 3, "chapter_id": 2, "version_number": 1,
         "updated_at": datetime(2026, 1, 10), "change_description": "初始版本",
         "is_current": True},
        {"id": 4, "chapter_id": 3, "version_number": 1,
         "updated_at": datetime(2026, 2, 1), "change_description": "初始版本",
         "is_current": False},
        {"id": 5, "chapter_id": 3, "version_number": 2,
         "updated_at": datetime(2026, 4, 1),
         "change_description": "更新算法案例，增加交互练习",
         "is_current": True},
    ]

    chapter_sections_v1_ch1 = [
        {"id": 1, "chapter_version_id": 1, "section_order": 1, "section_name": "变量与类型", "parent_section_id": None},
        {"id": 2, "chapter_version_id": 1, "section_order": 2, "section_name": "控制流", "parent_section_id": None},
        {"id": 3, "chapter_version_id": 1, "section_order": 3, "section_name": "函数基础", "parent_section_id": None},
        {"id": 4, "chapter_version_id": 1, "section_order": 4, "section_name": "模块与包", "parent_section_id": None},
    ]

    chapter_sections_v2_ch1 = [
        {"id": 5, "chapter_version_id": 2, "section_order": 1, "section_name": "变量与数据类型", "parent_section_id": None},
        {"id": 6, "chapter_version_id": 2, "section_order": 2, "section_name": "条件判断", "parent_section_id": None},
        {"id": 7, "chapter_version_id": 2, "section_order": 3, "section_name": "循环结构", "parent_section_id": None},
        {"id": 8, "chapter_version_id": 2, "section_order": 4, "section_name": "函数与作用域", "parent_section_id": None},
        {"id": 9, "chapter_version_id": 2, "section_order": 5, "section_name": "实战案例：数据处理脚本", "parent_section_id": None},
    ]

    chapter_sections_v1_ch2 = [
        {"id": 10, "chapter_version_id": 3, "section_order": 1, "section_name": "数组与链表", "parent_section_id": None},
        {"id": 11, "chapter_version_id": 3, "section_order": 2, "section_name": "栈与队列", "parent_section_id": None},
    ]

    chapter_sections_v1_ch3 = [
        {"id": 12, "chapter_version_id": 4, "section_order": 1, "section_name": "线性回归", "parent_section_id": None},
        {"id": 13, "chapter_version_id": 4, "section_order": 2, "section_name": "分类算法", "parent_section_id": None},
    ]

    chapter_sections_v2_ch3 = [
        {"id": 14, "chapter_version_id": 5, "section_order": 1, "section_name": "回归分析基础", "parent_section_id": None},
        {"id": 15, "chapter_version_id": 5, "section_order": 2, "section_name": "分类算法详解", "parent_section_id": None},
        {"id": 16, "chapter_version_id": 5, "section_order": 3, "section_name": "交互练习：模型调参", "parent_section_id": None},
    ]

    all_sections = (
        chapter_sections_v1_ch1 + chapter_sections_v2_ch1 +
        chapter_sections_v1_ch2 +
        chapter_sections_v1_ch3 + chapter_sections_v2_ch3
    )

    section_mappings = [
        {"id": 1, "old_section_id": 1, "new_section_id": 5, "mapping_type": "direct"},
        {"id": 2, "old_section_id": 2, "new_section_id": 6, "mapping_type": "split"},
        {"id": 3, "old_section_id": 2, "new_section_id": 7, "mapping_type": "split"},
        {"id": 4, "old_section_id": 3, "new_section_id": 8, "mapping_type": "direct"},
        {"id": 5, "old_section_id": 4, "new_section_id": 9, "mapping_type": "unmapped"},
        {"id": 6, "old_section_id": 12, "new_section_id": 14, "mapping_type": "direct"},
        {"id": 7, "old_section_id": 13, "new_section_id": 15, "mapping_type": "direct"},
    ]

    users = list(range(1001, 1101))

    def _generate_viewing(section_ids, start, end, daily_base=20, mean_dur=300, mean_comp=0.6,
                          post_effect=(1.0, 0.0)):
        rows = []
        n_days = (end - start).days
        for d in range(n_days):
            day = start + timedelta(days=d)
            n_users = int(daily_base * (0.8 + 0.4 * np.random.random()))
            for _ in range(n_users):
                uid = np.random.choice(users)
                sid = np.random.choice(section_ids)
                dur_mult, comp_delta = post_effect
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(8, 22))),
                    "user_id": uid,
                    "section_id": sid,
                    "duration_seconds": max(10, np.random.normal(mean_dur * dur_mult, 60)),
                    "completion_pct": min(1.0, max(0.0, np.random.normal(mean_comp + comp_delta, 0.15))),
                })
        return pd.DataFrame(rows)

    v1_sids = [s["id"] for s in chapter_sections_v1_ch1]
    v2_sids = [s["id"] for s in chapter_sections_v2_ch1]
    ch2_sids = [s["id"] for s in chapter_sections_v1_ch2]
    ch3_v1_sids = [s["id"] for s in chapter_sections_v1_ch3]
    ch3_v2_sids = [s["id"] for s in chapter_sections_v2_ch3]

    viewing_dfs = [
        _generate_viewing(v1_sids, datetime(2026, 1, 5), update_date, daily_base=18,
                          mean_dur=280, mean_comp=0.55),
        _generate_viewing(v2_sids, update_date + timedelta(days=3), now, daily_base=25,
                          mean_dur=340, mean_comp=0.65, post_effect=(1.15, 0.08)),
        _generate_viewing(ch2_sids, datetime(2026, 1, 15), now, daily_base=12,
                          mean_dur=310, mean_comp=0.60),
        _generate_viewing(ch3_v1_sids, datetime(2026, 2, 5), datetime(2026, 4, 1),
                          daily_base=14, mean_dur=290, mean_comp=0.50),
        _generate_viewing(ch3_v2_sids, datetime(2026, 4, 4), now, daily_base=18,
                          mean_dur=350, mean_comp=0.62, post_effect=(1.1, 0.07)),
    ]
    viewing_df = pd.concat(viewing_dfs, ignore_index=True)

    def _generate_quiz(section_ids, start, end, daily_base=8, mean_score=0.65,
                       post_effect=0.0):
        rows = []
        n_days = (end - start).days
        for d in range(n_days):
            day = start + timedelta(days=d)
            n = int(daily_base * (0.7 + 0.6 * np.random.random()))
            for _ in range(n):
                uid = np.random.choice(users)
                sid = np.random.choice(section_ids)
                qid = np.random.randint(1, 6)
                total = np.random.choice([5, 10])
                score = min(1.0, max(0.0, np.random.normal(mean_score + post_effect, 0.12)))
                correct = int(round(score * total))
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(8, 22))),
                    "user_id": uid,
                    "section_id": sid,
                    "quiz_id": qid,
                    "score": score,
                    "total_questions": total,
                    "correct_answers": correct,
                })
        return pd.DataFrame(rows)

    quiz_dfs = [
        _generate_quiz(v1_sids, datetime(2026, 1, 8), update_date, mean_score=0.60),
        _generate_quiz(v2_sids, update_date + timedelta(days=3), now, mean_score=0.60,
                       post_effect=0.08),
        _generate_quiz(ch2_sids, datetime(2026, 1, 18), now, mean_score=0.62),
        _generate_quiz(ch3_v1_sids, datetime(2026, 2, 8), datetime(2026, 4, 1), mean_score=0.58),
        _generate_quiz(ch3_v2_sids, datetime(2026, 4, 4), now, mean_score=0.58, post_effect=0.07),
    ]
    quiz_df = pd.concat(quiz_dfs, ignore_index=True)

    def _generate_errors(section_ids, start, end, daily_base=5):
        rows = []
        n_days = (end - start).days
        choices = ["A", "B", "C", "D"]
        for d in range(n_days):
            day = start + timedelta(days=d)
            n = int(daily_base * (0.5 + np.random.random()))
            for _ in range(n):
                uid = np.random.choice(users)
                sid = np.random.choice(section_ids)
                qid = np.random.randint(1, 11)
                correct = np.random.choice(choices)
                selected = np.random.choice([c for c in choices if c != correct])
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(8, 22))),
                    "user_id": uid,
                    "section_id": sid,
                    "question_id": qid,
                    "selected_answer": selected,
                    "correct_answer": correct,
                })
        return pd.DataFrame(rows)

    error_dfs = [
        _generate_errors(v1_sids, datetime(2026, 1, 10), update_date, daily_base=6),
        _generate_errors(v2_sids, update_date + timedelta(days=3), now, daily_base=7),
        _generate_errors(ch2_sids, datetime(2026, 1, 20), now, daily_base=4),
        _generate_errors(ch3_v1_sids, datetime(2026, 2, 10), datetime(2026, 4, 1), daily_base=5),
        _generate_errors(ch3_v2_sids, datetime(2026, 4, 5), now, daily_base=5),
    ]
    error_df = pd.concat(error_dfs, ignore_index=True)

    topic_pool = ["概念理解", "代码调试", "性能优化", "思路讨论", "学习建议", "资源推荐", "作业求助"]
    section_topic_map = {}
    for sid in [s["id"] for s in all_sections]:
        section_topic_map[sid] = list(np.random.choice(topic_pool, size=np.random.randint(2, 5),
                                                       replace=False))

    def _generate_discussions(section_ids, start, end, daily_base=3):
        rows = []
        n_days = (end - start).days
        for d in range(n_days):
            day = start + timedelta(days=d)
            n = int(daily_base * (0.3 + 0.7 * np.random.random()))
            for _ in range(n):
                uid = np.random.choice(users)
                sid = np.random.choice(section_ids)
                tags = section_topic_map.get(sid, ["概念理解"])
                n_tags = min(len(tags), np.random.randint(1, 3))
                chosen = list(np.random.choice(tags, size=n_tags, replace=False))
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(8, 23))),
                    "user_id": uid,
                    "section_id": sid,
                    "content": f"讨论内容示例 #{np.random.randint(1000, 9999)}",
                    "topic_tags": chosen,
                })
        return pd.DataFrame(rows)

    discussion_dfs = [
        _generate_discussions(v1_sids, datetime(2026, 1, 10), update_date, daily_base=3),
        _generate_discussions(v2_sids, update_date + timedelta(days=3), now, daily_base=5),
        _generate_discussions(ch2_sids, datetime(2026, 1, 20), now, daily_base=2),
        _generate_discussions(ch3_v1_sids, datetime(2026, 2, 10), datetime(2026, 4, 1), daily_base=3),
        _generate_discussions(ch3_v2_sids, datetime(2026, 4, 5), now, daily_base=4),
    ]
    discussion_df = pd.concat(discussion_dfs, ignore_index=True)

    refund_categories = ["内容过时", "难度过高", "结构混乱", "缺少练习", "技术问题", "个人原因"]

    def _generate_refunds(chapter_ids, start, end, daily_base=1, post_mult=1.0):
        rows = []
        n_days = (end - start).days
        for d in range(n_days):
            day = start + timedelta(days=d)
            n = max(0, int(daily_base * post_mult * (0.3 + 0.7 * np.random.random())))
            for _ in range(n):
                uid = np.random.choice(users)
                cid = np.random.choice(chapter_ids)
                cat = np.random.choice(refund_categories)
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(9, 21))),
                    "user_id": uid,
                    "chapter_id": cid,
                    "reason": f"{cat} - 具体原因描述",
                    "category": cat,
                })
        return pd.DataFrame(rows)

    refund_dfs = [
        _generate_refunds([1], datetime(2026, 1, 15), update_date, daily_base=1.5),
        _generate_refunds([1], update_date + timedelta(days=3), now, daily_base=1.5,
                          post_mult=0.6),
        _generate_refunds([2], datetime(2026, 1, 20), now, daily_base=0.5),
        _generate_refunds([3], datetime(2026, 2, 15), datetime(2026, 4, 1), daily_base=1.0),
        _generate_refunds([3], datetime(2026, 4, 5), now, daily_base=1.0, post_mult=0.7),
    ]
    refund_df = pd.concat(refund_dfs, ignore_index=True)

    event_types = ["enter", "complete", "skip", "revisit"]

    def _generate_path_events(section_ids, start, end, daily_base=10):
        rows = []
        n_days = (end - start).days
        for d in range(n_days):
            day = start + timedelta(days=d)
            n = int(daily_base * (0.6 + 0.8 * np.random.random()))
            for _ in range(n):
                uid = np.random.choice(users)
                sid = np.random.choice(section_ids)
                etype = np.random.choice(event_types, p=[0.35, 0.30, 0.15, 0.20])
                from_sid = np.random.choice(section_ids) if etype in ("complete", "skip") else None
                to_sid = sid if etype in ("enter", "revisit") else None
                rows.append({
                    "time": day + timedelta(hours=int(np.random.uniform(8, 23))),
                    "user_id": uid,
                    "section_id": sid,
                    "event_type": etype,
                    "from_section_id": from_sid,
                    "to_section_id": to_sid,
                })
        return pd.DataFrame(rows)

    path_dfs = [
        _generate_path_events(v1_sids, datetime(2026, 1, 5), update_date),
        _generate_path_events(v2_sids, update_date + timedelta(days=3), now, daily_base=14),
        _generate_path_events(ch2_sids, datetime(2026, 1, 15), now, daily_base=6),
        _generate_path_events(ch3_v1_sids, datetime(2026, 2, 5), datetime(2026, 4, 1), daily_base=8),
        _generate_path_events(ch3_v2_sids, datetime(2026, 4, 5), now, daily_base=10),
    ]
    path_df = pd.concat(path_dfs, ignore_index=True)

    return {
        "chapters": pd.DataFrame(chapters),
        "chapter_versions": pd.DataFrame(chapter_versions),
        "chapter_sections": pd.DataFrame(all_sections),
        "section_mappings": pd.DataFrame(section_mappings),
        "viewing_records": viewing_df,
        "quiz_records": quiz_df,
        "error_records": error_df,
        "discussion_records": discussion_df,
        "refund_requests": refund_df,
        "learning_path_events": path_df,
    }


_demo_cache = None


def get_demo_data():
    global _demo_cache
    if _demo_cache is None:
        _demo_cache = generate_demo_data()
    return _demo_cache
