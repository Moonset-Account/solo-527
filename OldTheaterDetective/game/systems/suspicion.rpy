init python:
    class SuspicionSystem:
        def __init__(self):
            self.suspects = {}
            self.relationships = {}
            self._register_default_suspects()
            self._register_default_relationships()

        def _register_default_suspects(self):
            default_suspects = [
                {"id": "director", "name": "导演·陈明远", "title": "剧院导演", "suspicion_level": 30, "alibi_verified": False, "interrogated": False, "evidence_against": [], "evidence_for": []},
                {"id": "actress", "name": "女主角·林雪薇", "title": "主演女演员", "suspicion_level": 20, "alibi_verified": False, "interrogated": False, "evidence_against": [], "evidence_for": []},
                {"id": "stagehand", "name": "舞台工人·赵大勇", "title": "舞台技术工人", "suspicion_level": 40, "alibi_verified": False, "interrogated": False, "evidence_against": [], "evidence_for": []},
                {"id": "props_master", "name": "道具主管·王芝兰", "title": "道具部门主管", "suspicion_level": 50, "alibi_verified": False, "interrogated": False, "evidence_against": [], "evidence_for": []}
            ]
            for s in default_suspects:
                self.suspects[s["id"]] = s

        def _register_default_relationships(self):
            default_relationships = [
                (("director", "actress"), {"type": "师生", "description": "关系亲密"}),
                (("director", "stagehand"), {"type": "雇佣", "description": "常有争执"}),
                (("actress", "props_master"), {"type": "同事", "description": "表面友好"}),
                (("stagehand", "props_master"), {"type": "前任同事", "description": "有经济纠纷"}),
                (("director", "props_master"), {"type": "上下级", "description": "互不信任"})
            ]
            for pair, rel in default_relationships:
                key = (pair[0], pair[1])
                self.relationships[key] = rel

        def add_suspect(self, data):
            self.suspects[data["id"]] = data

        def add_relationship(self, a_id, b_id, rel_type, desc):
            key = (a_id, b_id)
            self.relationships[key] = {"type": rel_type, "description": desc}

        def adjust_suspicion(self, suspect_id, amount, reason):
            if suspect_id not in self.suspects:
                return
            suspect = self.suspects[suspect_id]
            suspect["suspicion_level"] = max(0, min(100, suspect["suspicion_level"] + amount))

        def set_suspicion(self, suspect_id, value):
            if suspect_id not in self.suspects:
                return
            self.suspects[suspect_id]["suspicion_level"] = max(0, min(100, value))

        def verify_alibi(self, suspect_id):
            if suspect_id not in self.suspects:
                return
            self.suspects[suspect_id]["alibi_verified"] = True

        def mark_interrogated(self, suspect_id):
            if suspect_id not in self.suspects:
                return
            self.suspects[suspect_id]["interrogated"] = True

        def add_evidence_against(self, suspect_id, evid_id):
            if suspect_id not in self.suspects:
                return
            if evid_id not in self.suspects[suspect_id]["evidence_against"]:
                self.suspects[suspect_id]["evidence_against"].append(evid_id)

        def add_evidence_for(self, suspect_id, evid_id):
            if suspect_id not in self.suspects:
                return
            if evid_id not in self.suspects[suspect_id]["evidence_for"]:
                self.suspects[suspect_id]["evidence_for"].append(evid_id)

        def get_suspects_sorted(self):
            return sorted(self.suspects.values(), key=lambda s: s["suspicion_level"], reverse=True)

        def get_relationships_for(self, suspect_id):
            result = []
            for (a, b), rel in self.relationships.items():
                if a == suspect_id or b == suspect_id:
                    other = b if a == suspect_id else a
                    result.append({"suspect_id": other, "type": rel["type"], "description": rel["description"]})
            return result

        def get_most_suspicious(self):
            if not self.suspects:
                return None
            return max(self.suspects.values(), key=lambda s: s["suspicion_level"])

        def calculate_ending_suspicion(self):
            result = {}
            for sid, suspect in self.suspects.items():
                result[sid] = {
                    "name": suspect["name"],
                    "suspicion_level": suspect["suspicion_level"],
                    "alibi_verified": suspect["alibi_verified"],
                    "interrogated": suspect["interrogated"],
                    "evidence_against_count": len(suspect["evidence_against"]),
                    "evidence_for_count": len(suspect["evidence_for"])
                }
            return result

    store.suspicion_system = SuspicionSystem()
