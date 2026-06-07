import pandas as pd
from db.demo_data import get_demo_data
from config import DEMO_MODE, TRANSITION_WINDOW_DAYS


class QueriesService:
    def __init__(self):
        self._data = get_demo_data() if DEMO_MODE else None

    def _get_data(self, table_name):
        if self._data is None:
            return pd.DataFrame()
        return self._data.get(table_name, pd.DataFrame())

    def get_chapters(self):
        return self._get_data("chapters")

    def get_chapter_versions(self, chapter_id=None):
        df = self._get_data("chapter_versions")
        if chapter_id is not None:
            df = df[df["chapter_id"] == chapter_id]
        return df.sort_values("version_number") if not df.empty else df

    def get_chapter_sections(self, version_id=None):
        df = self._get_data("chapter_sections")
        if version_id is not None:
            df = df[df["chapter_version_id"] == version_id]
        return df.sort_values("section_order") if not df.empty else df

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

    def _split_periods(self, df, update_date, time_col="time"):
        if df.empty or update_date is None:
            return df, pd.DataFrame(), pd.DataFrame()
        update_ts = pd.Timestamp(update_date)
        transition_end = update_ts + pd.Timedelta(days=TRANSITION_WINDOW_DAYS)

        before = df[df[time_col] < update_ts]
        transition = df[(df[time_col] >= update_ts) & (df[time_col] < transition_end)]
        after = df[df[time_col] >= transition_end]
        return before, transition, after

    def get_viewing_comparison(self, chapter_id, version_id=None):
        viewing = self._get_data("viewing_records")
        if viewing.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        if versions.empty:
            return pd.DataFrame()

        update_date = self.get_update_date(chapter_id)

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            viewing = viewing[viewing["section_id"].isin(sids)]

        viewing["date"] = pd.to_datetime(viewing["time"]).dt.date

        daily = viewing.groupby("date").agg(
            avg_duration=("duration_seconds", "mean"),
            avg_completion=("completion_pct", "mean"),
            view_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")

        result_parts = []
        if not before.empty:
            before_c = before.copy()
            before_c["period"] = "更新前"
            result_parts.append(before_c)
        if not transition.empty:
            trans_c = transition.copy()
            trans_c["period"] = "过渡期"
            result_parts.append(trans_c)
        if not after.empty:
            after_c = after.copy()
            after_c["period"] = "更新后"
            result_parts.append(after_c)

        return pd.concat(result_parts, ignore_index=True) if result_parts else pd.DataFrame()

    def get_quiz_comparison(self, chapter_id, version_id=None):
        quiz = self._get_data("quiz_records")
        if quiz.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        if versions.empty:
            return pd.DataFrame()

        update_date = self.get_update_date(chapter_id)

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            quiz = quiz[quiz["section_id"].isin(sids)]

        quiz["date"] = pd.to_datetime(quiz["time"]).dt.date

        daily = quiz.groupby("date").agg(
            avg_score=("score", "mean"),
            quiz_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
            avg_correct=("correct_answers", "mean"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")

        result_parts = []
        if not before.empty:
            before_c = before.copy()
            before_c["period"] = "更新前"
            result_parts.append(before_c)
        if not transition.empty:
            trans_c = transition.copy()
            trans_c["period"] = "过渡期"
            result_parts.append(trans_c)
        if not after.empty:
            after_c = after.copy()
            after_c["period"] = "更新后"
            result_parts.append(after_c)

        return pd.concat(result_parts, ignore_index=True) if result_parts else pd.DataFrame()

    def get_error_heatmap_data(self, chapter_id, version_id=None):
        errors = self._get_data("error_records")
        sections = self._get_data("chapter_sections")
        if errors.empty:
            return pd.DataFrame()

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            errors = errors[errors["section_id"].isin(sids)]

        errors = errors.merge(
            sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
            on="section_id", how="left"
        )

        heatmap = errors.groupby(["section_name", "question_id"]).size().reset_index(
            name="error_count"
        )
        return heatmap

    def get_discussion_aggregation(self, chapter_id, version_id=None):
        discussions = self._get_data("discussion_records")
        if discussions.empty:
            return pd.DataFrame()

        versions = self.get_chapter_versions(chapter_id)
        update_date = self.get_update_date(chapter_id)

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            discussions = discussions[discussions["section_id"].isin(sids)]

        discussions["date"] = pd.to_datetime(discussions["time"]).dt.date

        all_tags = []
        for _, row in discussions.iterrows():
            tags = row.get("topic_tags", [])
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

        if update_date is not None:
            update_ts = pd.Timestamp(update_date)
            agg["period"] = agg["date"].apply(
                lambda d: "更新前" if d < update_ts
                else ("过渡期" if d < update_ts + pd.Timedelta(days=TRANSITION_WINDOW_DAYS)
                      else "更新后")
            )
        else:
            agg["period"] = "未知"

        return agg

    def get_refund_comparison(self, chapter_id, version_id=None):
        refunds = self._get_data("refund_requests")
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

        category_daily = chapter_refunds.groupby(["date", "category"]).size().reset_index(
            name="count"
        )
        category_daily["date"] = pd.to_datetime(category_daily["date"])

        before, transition, after = self._split_periods(daily, update_date, "date")

        result_parts = []
        if not before.empty:
            before_c = before.copy()
            before_c["period"] = "更新前"
            result_parts.append(before_c)
        if not transition.empty:
            trans_c = transition.copy()
            trans_c["period"] = "过渡期"
            result_parts.append(trans_c)
        if not after.empty:
            after_c = after.copy()
            after_c["period"] = "更新后"
            result_parts.append(after_c)

        result = pd.concat(result_parts, ignore_index=True) if result_parts else pd.DataFrame()
        return result if not result.empty else category_daily

    def get_learning_path_data(self, chapter_id, version_id=None):
        events = self._get_data("learning_path_events")
        sections = self._get_data("chapter_sections")
        if events.empty:
            return pd.DataFrame()

        if version_id is not None:
            sids = self.get_section_ids_for_version(version_id)
            events = events[events["section_id"].isin(sids)]

        update_date = self.get_update_date(chapter_id)

        events["date"] = pd.to_datetime(events["time"]).dt.date

        event_agg = events.groupby(["date", "event_type"]).size().reset_index(name="count")
        event_agg["date"] = pd.to_datetime(event_agg["date"])

        if update_date is not None:
            update_ts = pd.Timestamp(update_date)
            event_agg["period"] = event_agg["date"].apply(
                lambda d: "更新前" if d < update_ts
                else ("过渡期" if d < update_ts + pd.Timedelta(days=TRANSITION_WINDOW_DAYS)
                      else "更新后")
            )
        else:
            event_agg["period"] = "未知"

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
        sections = self._get_data("chapter_sections")
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

        dfs = []

        if record_type in ("all", "viewing"):
            v = self._get_data("viewing_records")
            if not v.empty and sids:
                v = v[v["section_id"].isin(sids)].copy()
                v["record_type"] = "观看"
                dfs.append(v)

        if record_type in ("all", "quiz"):
            q = self._get_data("quiz_records")
            if not q.empty and sids:
                q = q[q["section_id"].isin(sids)].copy()
                q["record_type"] = "测验"
                dfs.append(q)

        if record_type in ("all", "error"):
            e = self._get_data("error_records")
            if not e.empty and sids:
                e = e[e["section_id"].isin(sids)].copy()
                e["record_type"] = "错题"
                dfs.append(e)

        if not dfs:
            return pd.DataFrame()

        combined = pd.concat(dfs, ignore_index=True)
        combined["time"] = pd.to_datetime(combined["time"])

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

        sections = self._get_data("chapter_sections")
        mappings = self._get_data("section_mappings")

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
