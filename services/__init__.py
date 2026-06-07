import pandas as pd
from db.demo_data import get_demo_data
from config import DEMO_MODE


class ChapterMappingService:
    def __init__(self):
        self._data = get_demo_data() if DEMO_MODE else None

    def get_section_mapping(self, old_version_id, new_version_id):
        if self._data is None:
            return pd.DataFrame(), []

        sections = self._data["chapter_sections"]
        mappings = self._data["section_mappings"]

        old_sections = sections[sections["chapter_version_id"] == old_version_id]
        new_sections = sections[sections["chapter_version_id"] == new_version_id]

        old_sids = set(old_sections["id"].tolist())
        new_sids = set(new_sections["id"].tolist())

        relevant = mappings[
            mappings["old_section_id"].isin(old_sids) &
            mappings["new_section_id"].isin(new_sids)
        ]

        result = relevant.merge(
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

        unmapped_old = old_sections[~old_sections["id"].isin(relevant["old_section_id"])]
        unmapped_new = new_sections[~new_sections["id"].isin(relevant["new_section_id"])]

        unmapped_records = []
        for _, row in unmapped_old.iterrows():
            unmapped_records.append({
                "section_id": row["id"],
                "section_name": row["section_name"],
                "version": "old",
                "direction": "unmapped_out",
                "reason": "旧章节小节无法映射到新结构",
            })
        for _, row in unmapped_new.iterrows():
            unmapped_records.append({
                "section_id": row["id"],
                "section_name": row["section_name"],
                "version": "new",
                "direction": "unmapped_in",
                "reason": "新章节小节无旧结构对应",
            })

        return result, unmapped_records

    def map_records_to_new_structure(self, records_df, old_version_id, new_version_id,
                                     section_col="section_id"):
        if records_df.empty:
            return records_df, pd.DataFrame()

        if self._data is None:
            return records_df, pd.DataFrame()

        sections = self._data["chapter_sections"]
        mappings = self._data["section_mappings"]

        old_sections = sections[sections["chapter_version_id"] == old_version_id]
        old_sids = set(old_sections["id"].tolist())

        old_records = records_df[records_df[section_col].isin(old_sids)].copy()

        if old_records.empty:
            return records_df, pd.DataFrame()

        mapping_dict = {}
        for _, m in mappings[mappings["old_section_id"].isin(old_sids)].iterrows():
            mapping_dict.setdefault(m["old_section_id"], []).append({
                "new_section_id": m["new_section_id"],
                "mapping_type": m["mapping_type"],
            })

        mapped_rows = []
        unmapped_rows = []

        for _, row in old_records.iterrows():
            sid = row[section_col]
            if sid in mapping_dict:
                for target in mapping_dict[sid]:
                    new_row = row.copy()
                    new_row["original_section_id"] = sid
                    new_row[section_col] = target["new_section_id"]
                    new_row["mapping_type"] = target["mapping_type"]
                    mapped_rows.append(new_row)
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
            combined = records_df

        return combined, unmapped_df
