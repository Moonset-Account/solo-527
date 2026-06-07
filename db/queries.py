import pandas as pd
from db import execute_query
from db.demo_data import get_demo_data
from config import DEMO_MODE, TRANSITION_WINDOW_DAYS


class QueriesService:
    def __init__(self):
        self._data = get_demo_data() if DEMO_MODE else None

    def _get_data(self, table_name):
        if self._data is not None:
            return self._data.get(table_name, pd.DataFrame())
        return pd.DataFrame()

    def _query_to_df(self, sql, params=None):
        rows = execute_query(sql, params)
        return pd.DataFrame(rows) if rows else pd.DataFrame()

    def get_chapters(self):
        if self._data is not None:
            return self._get_data("chapters")
        return self._query_to_df("SELECT id, course_id, name, created_at FROM chapters ORDER BY id")

    def get_chapter_versions(self, chapter_id=None):
        if self._data is not None:
            df = self._get_data("chapter_versions")
            if chapter_id is not None:
                df = df[df["chapter_id"] == chapter_id]
            return df.sort_values("version_number") if not df.empty else df
        sql = "SELECT id, chapter_id, version_number, updated_at, change_description, is_current FROM chapter_versions"
        params = None
        if chapter_id is not None:
            sql += " WHERE chapter_id = %s"
            params = (chapter_id,)
        sql += " ORDER BY version_number"
        return self._query_to_df(sql, params)

    def get_chapter_sections(self, version_id=None):
        if self._data is not None:
            df = self._get_data("chapter_sections")
            if version_id is not None:
                df = df[df["chapter_version_id"] == version_id]
            return df.sort_values("section_order") if not df.empty else df
        sql = "SELECT id, chapter_version_id, section_order, section_name, parent_section_id FROM chapter_sections"
        params = None
        if version_id is not None:
            sql += " WHERE chapter_version_id = %s"
            params = (version_id,)
        sql += " ORDER BY section_order"
        return self._query_to_df(sql, params)

    def get_section_mappings(self, old_version_id=None, new_version_id=None):
        if self._data is not None:
            return self._get_data("section_mappings")
        sql = "SELECT id, old_section_id, new_section_id, mapping_type FROM section_mappings WHERE 1=1"
        params = []
        if old_version_id is not None:
            sql += " AND old_section_id IN (SELECT id FROM chapter_sections WHERE chapter_version_id = %s)"
            params.append(old_version_id)
        if new_version_id is not None:
            sql += " AND new_section_id IN (SELECT id FROM chapter_sections WHERE chapter_version_id = %s)"
            params.append(new_version_id)
        return self._query_to_df(sql, tuple(params) if params else None)

    def get_update_date(self, chapter_id):
        versions = self.get_chapter_versions(chapter_id)
        if versions.empty or len(versions) < 2:
            return None
        latest = versions[versions["is_current"] == True]
        if latest.empty:
            return None
        return pd.Timestamp(latest.iloc[0]["updated_at"])

    def get_section_ids_for_version(self, version_id):
        sections = self.get_chapter_sections(version_id)
        return sections["id"].tolist() if not sections.empty else []

    def _get_section_filter_sql(self, version_id, prefix=""):
        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            if sids:
                placeholders = ",".join(["%s"] * len(sids))
                return f" AND {prefix}section_id IN ({placeholders})", sids
            return " AND 1=0", []
        return "", []

    def _split_periods(self, df, update_date, time_col="time"):
        if df.empty or update_date is None:
            return df, pd.DataFrame(), pd.DataFrame()
        update_ts = pd.Timestamp(update_date)
        transition_end = update_ts + pd.Timedelta(days=TRANSITION_WINDOW_DAYS)

        before = df[df[time_col] < update_ts]
        transition = df[(df[time_col] >= update_ts) & (df[time_col] < transition_end)]
        after = df[df[time_col] >= transition_end]
        return before, transition, after

    def _apply_period_labels(self, before, transition, after):
        result_parts = []
        if not before.empty:
            c = before.copy()
            c["period"] = "更新前"
            result_parts.append(c)
        if not transition.empty:
            c = transition.copy()
            c["period"] = "过渡期"
            result_parts.append(c)
        if not after.empty:
            c = after.copy()
            c["period"] = "更新后"
            result_parts.append(c)
        return pd.concat(result_parts, ignore_index=True) if result_parts else pd.DataFrame()

    def _apply_period_column(self, df, update_date, time_col="date"):
        if df.empty or update_date is None:
            df["period"] = "未知"
            return df
        update_ts = pd.Timestamp(update_date)
        transition_end = update_ts + pd.Timedelta(days=TRANSITION_WINDOW_DAYS)
        df["period"] = df[time_col].apply(
            lambda d: "更新前" if d < update_ts
            else ("过渡期" if d < transition_end else "更新后")
        )
        return df

    def get_viewing_comparison(self, chapter_id, version_id=None):
        if self._data is not None:
            viewing = self._get_data("viewing_records")
        else:
            sec_filter, sec_params = self._get_section_filter_sql(version_id)
            sql = f"SELECT time, user_id, section_id, duration_seconds, completion_pct FROM viewing_records WHERE 1=1{sec_filter} ORDER BY time"
            viewing = self._query_to_df(sql, sec_params if sec_params else None)

        if viewing.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        if versions.empty:
            return pd.DataFrame()

        update_date = self.get_update_date(chapter_id)

        if self._data is not None and version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            viewing = viewing[viewing["section_id"].isin(sids)].copy()

        viewing["date"] = pd.to_datetime(viewing["time"]).dt.date

        daily = viewing.groupby("date").agg(
            avg_duration=("duration_seconds", "mean"),
            avg_completion=("completion_pct", "mean"),
            view_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")
        return self._apply_period_labels(before, transition, after)

    def get_quiz_comparison(self, chapter_id, version_id=None):
        if self._data is not None:
            quiz = self._get_data("quiz_records")
        else:
            sec_filter, sec_params = self._get_section_filter_sql(version_id)
            sql = f"SELECT time, user_id, section_id, quiz_id, score, total_questions, correct_answers FROM quiz_records WHERE 1=1{sec_filter} ORDER BY time"
            quiz = self._query_to_df(sql, sec_params if sec_params else None)

        if quiz.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        if versions.empty:
            return pd.DataFrame()

        update_date = self.get_update_date(chapter_id)

        if self._data is not None and version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            quiz = quiz[quiz["section_id"].isin(sids)].copy()

        quiz["date"] = pd.to_datetime(quiz["time"]).dt.date

        daily = quiz.groupby("date").agg(
            avg_score=("score", "mean"),
            quiz_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
            avg_correct=("correct_answers", "mean"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")
        return self._apply_period_labels(before, transition, after)

    def get_error_heatmap_data(self, chapter_id, version_id=None):
        if self._data is not None:
            errors = self._get_data("error_records")
        else:
            sec_filter, sec_params = self._get_section_filter_sql(version_id)
            sql = f"SELECT time, user_id, section_id, question_id, selected_answer, correct_answer FROM error_records WHERE 1=1{sec_filter} ORDER BY time"
            errors = self._query_to_df(sql, sec_params if sec_params else None)

        sections = self.get_chapter_sections()
        if errors.empty:
            return pd.DataFrame()

        if self._data is not None and version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            errors = errors[errors["section_id"].isin(sids)].copy()

        errors = errors.merge(
            sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
            on="section_id", how="left"
        )

        heatmap = errors.groupby(["section_name", "question_id"]).size().reset_index(
            name="error_count"
        )
        return heatmap

    def get_discussion_aggregation(self, chapter_id, version_id=None):
        if self._data is not None:
            discussions = self._get_data("discussion_records")
        else:
            sec_filter, sec_params = self._get_section_filter_sql(version_id)
            sql = f"SELECT time, user_id, section_id, content, topic_tags FROM discussion_records WHERE 1=1{sec_filter} ORDER BY time"
            discussions = self._query_to_df(sql, sec_params if sec_params else None)

        if discussions.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        update_date = self.get_update_date(chapter_id)

        if self._data is not None and version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            discussions = discussions[discussions["section_id"].isin(sids)].copy()

        discussions["date"] = pd.to_datetime(discussions["time"]).dt.date

        all_tags = []
        for _, row in discussions.iterrows():
            tags = row.get("topic_tags", [])
            if isinstance(tags, str):
                import ast
                try:
                    tags = ast.literal_eval(tags)
                except Exception:
                    tags = [tags]
            if isinstance(tags, (list, tuple)):
                for tag in tags:
                    all_tags.append({
                        "date": row["date"],
                        "tag": tag,
                        "section_id": row["section_id"],
                    })

        if not all_tags:
            return pd.DataFrame()

        tags_df = pd.DataFrame(all_tags)
        tags_df["date"] = pd.to_datetime(tags_df["date"])

        agg = tags_df.groupby(["date", "tag"]).size().reset_index(name="count")
        return self._apply_period_column(agg, update_date, "date")

    def get_refund_comparison(self, chapter_id, version_id=None):
        if self._data is not None:
            refunds = self._get_data("refund_requests")
        else:
            sql = "SELECT time, user_id, chapter_id, reason, category FROM refund_requests WHERE chapter_id = %s ORDER BY time"
            refunds = self._query_to_df(sql, (chapter_id,))

        if refunds.empty:
            return pd.DataFrame()

        update_date = self.get_update_date(chapter_id)
        chapter_refunds = refunds[refunds["chapter_id"] == chapter_id]

        chapter_refunds["date"] = pd.to_datetime(chapter_refunds["time"]).dt.date

        daily = chapter_refunds.groupby("date").agg(
            refund_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")
        result = self._apply_period_labels(before, transition, after)
        return result if not result.empty else daily

    def get_learning_path_data(self, chapter_id, version_id=None):
        if self._data is not None:
            events = self._get_data("learning_path_events")
        else:
            sec_filter, sec_params = self._get_section_filter_sql(version_id)
            sql = f"SELECT time, user_id, section_id, event_type, from_section_id, to_section_id FROM learning_path_events WHERE 1=1{sec_filter} ORDER BY time"
            events = self._query_to_df(sql, sec_params if sec_params else None)

        sections = self.get_chapter_sections()
        if events.empty:
            return pd.DataFrame(), pd.DataFrame()

        if self._data is not None and version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            events = events[events["section_id"].isin(sids)].copy()

        update_date = self.get_update_date(chapter_id)

        events["date"] = pd.to_datetime(events["time"]).dt.date

        event_agg = events.groupby(["date", "event_type"]).size().reset_index(name="count")
        event_agg["date"] = pd.to_datetime(event_agg["date"])
        event_agg = self._apply_period_column(event_agg, update_date, "date")

        transitions = events[
            events["from_section_id"].notna() & events["to_section_id"].notna()
        ].copy()

        if not transitions.empty and not sections.empty:
            trans = transitions.merge(
                sections[["id", "section_name"]].rename(
                    columns={"id": "from_section_id", "section_name": "from_name"}
                ),
                on="from_section_id", how="left"
            ).merge(
                sections[["id", "section_name"]].rename(
                    columns={"id": "to_section_id", "section_name": "to_name"}
                ),
                on="to_section_id", how="left"
            )
            flow = trans.groupby(["from_name", "to_name"]).size().reset_index(name="count")
            flow = flow.sort_values("count", ascending=False).head(20)
        else:
            flow = pd.DataFrame()

        return event_agg, flow

    def get_raw_learning_records(self, chapter_id, version_id=None, record_type="all",
                                 start_date=None, end_date=None, page=1, page_size=100):
        sections = self.get_chapter_sections()
        versions = self.get_chapter_versions(chapter_id)

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
        else:
            if not versions.empty:
                all_sids = []
                for _, v in versions.iterrows():
                    all_sids.extend(self.get_section_ids_for_version(v["id"]))
                sids = all_sids
            else:
                sids = []

        if not sids:
            return pd.DataFrame()

        sid_placeholders = ",".join(["%s"] * len(sids))
        dfs = []

        if record_type in ("all", "viewing"):
            if self._data is not None:
                v = self._get_data("viewing_records")
                if not v.empty and sids:
                    v = v[v["section_id"].isin(sids)].copy()
                    v["record_type"] = "观看"
                    dfs.append(v)
            else:
                sql = f"SELECT time, user_id, section_id, duration_seconds, completion_pct FROM viewing_records WHERE section_id IN ({sid_placeholders})"
                params = list(sids)
                if start_date:
                    sql += " AND time >= %s"
                    params.append(start_date)
                if end_date:
                    sql += " AND time <= %s"
                    params.append(end_date)
                v = self._query_to_df(sql, tuple(params))
                if not v.empty:
                    v["record_type"] = "观看"
                    dfs.append(v)

        if record_type in ("all", "quiz"):
            if self._data is not None:
                q = self._get_data("quiz_records")
                if not q.empty and sids:
                    q = q[q["section_id"].isin(sids)].copy()
                    q["record_type"] = "测验"
                    dfs.append(q)
            else:
                sql = f"SELECT time, user_id, section_id, quiz_id, score, total_questions, correct_answers FROM quiz_records WHERE section_id IN ({sid_placeholders})"
                params = list(sids)
                if start_date:
                    sql += " AND time >= %s"
                    params.append(start_date)
                if end_date:
                    sql += " AND time <= %s"
                    params.append(end_date)
                q = self._query_to_df(sql, tuple(params))
                if not q.empty:
                    q["record_type"] = "测验"
                    dfs.append(q)

        if record_type in ("all", "error"):
            if self._data is not None:
                e = self._get_data("error_records")
                if not e.empty and sids:
                    e = e[e["section_id"].isin(sids)].copy()
                    e["record_type"] = "错题"
                    dfs.append(e)
            else:
                sql = f"SELECT time, user_id, section_id, question_id, selected_answer, correct_answer FROM error_records WHERE section_id IN ({sid_placeholders})"
                params = list(sids)
                if start_date:
                    sql += " AND time >= %s"
                    params.append(start_date)
                if end_date:
                    sql += " AND time <= %s"
                    params.append(end_date)
                e = self._query_to_df(sql, tuple(params))
                if not e.empty:
                    e["record_type"] = "错题"
                    dfs.append(e)

        if not dfs:
            return pd.DataFrame()

        combined = pd.concat(dfs, ignore_index=True)
        combined["time"] = pd.to_datetime(combined["time"])

        if self._data is not None:
            if start_date is not None:
                combined = combined[combined["time"] >= pd.Timestamp(start_date)]
            if end_date is not None:
                combined = combined[combined["time"] <= pd.Timestamp(end_date)]

        if not sections.empty:
            combined = combined.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )

        combined = combined.sort_values("time", ascending=False)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        return combined.iloc[start_idx:end_idx]

    def get_mapping_info(self, chapter_id):
        versions = self.get_chapter_versions(chapter_id)
        if len(versions) < 2:
            return pd.DataFrame()

        old_vid = versions.iloc[0]["id"]
        new_vid = versions.iloc[-1]["id"]

        sections = self.get_chapter_sections()
        mappings = self.get_section_mappings(old_vid, new_vid)

        if mappings.empty:
            return pd.DataFrame()

        old_sections = sections[sections["chapter_version_id"] == old_vid]
        new_sections = sections[sections["chapter_version_id"] == new_vid]

        old_sids = set(old_sections["id"].tolist())
        new_sids = set(new_sections["id"].tolist())

        relevant = mappings[
            mappings["old_section_id"].isin(old_sids) &
            mappings["new_section_id"].isin(new_sids)
        ]

        result = relevant.merge(
            old_sections[["id", "section_name"]].rename(
                columns={"id": "old_section_id", "section_name": "旧小节名称"}
            ),
            on="old_section_id", how="left"
        ).merge(
            new_sections[["id", "section_name"]].rename(
                columns={"id": "new_section_id", "section_name": "新小节名称"}
            ),
            on="new_section_id", how="left"
        )

        mapping_type_map = {
            "direct": "直接对应",
            "split": "拆分",
            "merge": "合并",
            "unmapped": "无法映射",
        }
        result["映射类型"] = result["mapping_type"].map(mapping_type_map)

        return result[["旧小节名称", "新小节名称", "映射类型"]] if not result.empty else result

    def get_stable_period_stats(self, chapter_id):
        viewing = self.get_viewing_comparison(chapter_id)
        quiz = self.get_quiz_comparison(chapter_id)

        stats = {}
        for label, df in [("观看", viewing), ("测验", quiz)]:
            if df.empty:
                continue
            for period in ["更新前", "更新后"]:
                subset = df[df["period"] == period]
                if subset.empty:
                    continue
                numeric_cols = subset.select_dtypes(include="number").columns
                for col in numeric_cols:
                    key = f"{label}_{period}_{col}"
                    stats[key] = subset[col].mean()

        return stats
