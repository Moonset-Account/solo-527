import pandas as pd
from db import execute_query
from db.demo_data import get_demo_data
from config import DEMO_MODE


class ChapterMappingService:
    def __init__(self):
        self._data = get_demo_data() if DEMO_MODE else None

    def _query_to_df(self, sql, params=None):
        rows = execute_query(sql, params)
        return pd.DataFrame(rows) if rows else pd.DataFrame()

    def _get_sections(self):
        if self._data is not None:
            return self._data["chapter_sections"]
        return self._query_to_df(
            "SELECT id, chapter_version_id, section_order, section_name, parent_section_id FROM chapter_sections ORDER BY section_order"
        )

    def _get_mappings(self, old_version_id, new_version_id):
        if self._data is not None:
            mappings = self._data["section_mappings"]
            old_sids = set(self._data["chapter_sections"][
                self._data["chapter_sections"]["chapter_version_id"] == old_version_id
            ]["id"].tolist())
            new_sids = set(self._data["chapter_sections"][
                self._data["chapter_sections"]["chapter_version_id"] == new_version_id
            ]["id"].tolist())
            return mappings[
                mappings["old_section_id"].isin(old_sids) &
                mappings["new_section_id"].isin(new_sids)
            ]
        sql = """SELECT id, old_section_id, new_section_id, mapping_type FROM section_mappings
                 WHERE old_section_id IN (SELECT id FROM chapter_sections WHERE chapter_version_id = %s)
                   AND new_section_id IN (SELECT id FROM chapter_sections WHERE chapter_version_id = %s)"""
        return self._query_to_df(sql, (old_version_id, new_version_id))

    def get_section_mapping(self, old_version_id, new_version_id):
        sections = self._get_sections()
        if sections.empty:
            return pd.DataFrame(), []

        mappings = self._get_mappings(old_version_id, new_version_id)

        old_sections = sections[sections["chapter_version_id"] == old_version_id]
        new_sections = sections[sections["chapter_version_id"] == new_version_id]

        old_sids = set(old_sections["id"].tolist())
        new_sids = set(new_sections["id"].tolist())

        if mappings.empty:
            result = pd.DataFrame()
        else:
            result = mappings.merge(
                old_sections[["id", "section_name"]].rename(
                    columns={"id": "old_section_id", "section_name": "old_section_name"}
                ),
                on="old_section_id", how="left"
            ).merge(
                new_sections[["id", "section_name"]].rename(
                    columns={"id": "new_section_id", "section_name": "new_section_name"}
                ),
                on="new_section_id", how="left"
            )

        mapped_old = set(mappings[mappings["mapping_type"] != "unmapped"]["old_section_id"].tolist()) if not mappings.empty else set()
        mapped_new = set(mappings[mappings["mapping_type"] != "unmapped"]["new_section_id"].tolist()) if not mappings.empty else set()

        unmapped_old_from_table = set()
        unmapped_new_from_table = set()
        if not mappings.empty:
            unmapped_entries = mappings[mappings["mapping_type"] == "unmapped"]
            unmapped_old_from_table = set(unmapped_entries["old_section_id"].tolist())
            unmapped_new_from_table = set(unmapped_entries["new_section_id"].tolist())

        no_entry_old = old_sections[~old_sections["id"].isin(set(mappings["old_section_id"].tolist()) if not mappings.empty else set())]
        no_entry_new = new_sections[~new_sections["id"].isin(set(mappings["new_section_id"].tolist()) if not mappings.empty else set())]

        unmapped_records = []
        for _, row in no_entry_old.iterrows():
            unmapped_records.append({
                "section_id": row["id"],
                "section_name": row["section_name"],
                "version": "old",
                "direction": "unmapped_out",
                "reason": "旧章节小节无映射条目",
            })
        for _, row in no_entry_new.iterrows():
            unmapped_records.append({
                "section_id": row["id"],
                "section_name": row["section_name"],
                "version": "new",
                "direction": "unmapped_in",
                "reason": "新章节小节无旧结构对应",
            })

        if not mappings.empty:
            for _, m_row in mappings[mappings["mapping_type"] == "unmapped"].iterrows():
                if m_row["old_section_id"] in old_sids:
                    old_name = old_sections[old_sections["id"] == m_row["old_section_id"]]
                    name = old_name.iloc[0]["section_name"] if not old_name.empty else "未知"
                    unmapped_records.append({
                        "section_id": m_row["old_section_id"],
                        "section_name": name,
                        "version": "old",
                        "direction": "unmapped_out",
                        "reason": "旧章节小节明确标记为无法映射",
                    })
                if m_row["new_section_id"] in new_sids:
                    new_name = new_sections[new_sections["id"] == m_row["new_section_id"]]
                    name = new_name.iloc[0]["section_name"] if not new_name.empty else "未知"
                    unmapped_records.append({
                        "section_id": m_row["new_section_id"],
                        "section_name": name,
                        "version": "new",
                        "direction": "unmapped_in",
                        "reason": "新章节小节明确标记为无法映射",
                    })

        return result, unmapped_records

    def map_records_to_new_structure(self, records_df, old_version_id, new_version_id,
                                     section_col="section_id"):
        if records_df.empty:
            return pd.DataFrame(), pd.DataFrame()

        sections = self._get_sections()
        if sections.empty:
            return records_df, pd.DataFrame()

        mappings = self._get_mappings(old_version_id, new_version_id)
        if mappings.empty:
            old_sections = sections[sections["chapter_version_id"] == old_version_id]
            old_sids = set(old_sections["id"].tolist())
            unmapped_df = records_df[records_df[section_col].isin(old_sids)].copy()
            if not unmapped_df.empty:
                unmapped_df["mapping_type"] = "unmapped"
            return records_df, unmapped_df

        old_sections = sections[sections["chapter_version_id"] == old_version_id]
        old_sids = set(old_sections["id"].tolist())

        old_records = records_df[records_df[section_col].isin(old_sids)].copy()

        if old_records.empty:
            return records_df, pd.DataFrame()

        mapping_dict = {}
        for _, m in mappings.iterrows():
            mapping_dict.setdefault(m["old_section_id"], []).append({
                "new_section_id": m["new_section_id"],
                "mapping_type": m["mapping_type"],
            })

        mapped_rows = []
        unmapped_rows = []

        for _, row in old_records.iterrows():
            sid = row[section_col]
            if sid in mapping_dict:
                targets = mapping_dict[sid]
                has_valid = any(t["mapping_type"] != "unmapped" for t in targets)
                if has_valid:
                    for target in targets:
                        if target["mapping_type"] != "unmapped":
                            new_row = row.copy()
                            new_row["original_section_id"] = sid
                            new_row[section_col] = target["new_section_id"]
                            new_row["mapping_type"] = target["mapping_type"]
                            mapped_rows.append(new_row)
                else:
                    row_copy = row.copy()
                    row_copy["mapping_type"] = "unmapped"
                    unmapped_rows.append(row_copy)
            else:
                row_copy = row.copy()
                row_copy["mapping_type"] = "unmapped"
                unmapped_rows.append(row_copy)

        mapped_df = pd.DataFrame(mapped_rows) if mapped_rows else pd.DataFrame()
        unmapped_df = pd.DataFrame(unmapped_rows) if unmapped_rows else pd.DataFrame()

        new_sections = sections[sections["chapter_version_id"] == new_version_id]
        new_sids = set(new_sections["id"].tolist())
        new_records = records_df[records_df[section_col].isin(new_sids)].copy()

        if not new_records.empty and not mapped_df.empty:
            combined = pd.concat([mapped_df, new_records], ignore_index=True)
        elif not mapped_df.empty:
            combined = mapped_df
        elif not new_records.empty:
            combined = new_records
        else:
            combined = pd.DataFrame()

        return combined, unmapped_df
