init python:
    class EndingSystem:
        def __init__(self):
            self.key_choices = []
            self.unlocked_endings = []
            self.current_ending = None
            self.endings = {
                "true_ending": {
                    "id": "true_ending",
                    "title": "真相",
                    "description": "找出真凶并完整还原案件",
                    "conditions": lambda: (
                        len(store.evidence_board.get_discovered()) >= 8 and
                        store.suspicion_system.suspects.get("props_master", {}).get("suspicion_level", 0) >= 70 and
                        store.suspicion_system.suspects.get("props_master", {}).get("interrogated", False) and
                        store.evidence_board.is_evidence_discovered("duplicate_crown") and
                        store.evidence_board.is_evidence_discovered("hidden_compartment") and
                        store.evidence_board.is_evidence_discovered("props_master_ledger") and
                        any(c.get("weight", 0) > 0 for c in store.ending_system.key_choices if "accuse_props_master" in c.get("choice_id", ""))
                    )
                },
                "good_ending": {
                    "id": "good_ending",
                    "title": "正义",
                    "description": "正确指认凶手但遗漏部分证据",
                    "conditions": lambda: (
                        store.suspicion_system.suspects.get("props_master", {}).get("suspicion_level", 0) >= 60 and
                        store.suspicion_system.suspects.get("props_master", {}).get("interrogated", False) and
                        store.evidence_board.is_evidence_discovered("props_master_ledger") and
                        not store.ending_system.endings["true_ending"]["conditions"]()
                    )
                },
                "neutral_ending": {
                    "id": "neutral_ending",
                    "title": "妥协",
                    "description": "找到道具但未查明真相",
                    "conditions": lambda: (
                        store.evidence_board.is_evidence_discovered("duplicate_crown") or
                        store.evidence_board.is_evidence_discovered("missing_prop_crown")
                    ) and not (
                        store.suspicion_system.suspects.get("props_master", {}).get("suspicion_level", 0) >= 60 and
                        store.suspicion_system.suspects.get("props_master", {}).get("interrogated", False)
                    )
                },
                "bad_ending": {
                    "id": "bad_ending",
                    "title": "误判",
                    "description": "指认错误嫌疑人",
                    "conditions": lambda: (
                        any(
                            sid != "props_master" and
                            store.suspicion_system.suspects.get(sid, {}).get("suspicion_level", 0) >= 70 and
                            any(c.get("choice_id", "").startswith("accuse_{0}".format(sid)) for c in store.ending_system.key_choices)
                            for sid in store.suspicion_system.suspects
                        )
                    )
                },
                "secret_ending": {
                    "id": "secret_ending",
                    "title": "暗线",
                    "description": "发现隐藏的暗格和复制品，揭示更深阴谋",
                    "conditions": lambda: (
                        store.evidence_board.is_evidence_discovered("hidden_compartment") and
                        store.evidence_board.is_evidence_discovered("duplicate_crown") and
                        store.evidence_board.is_evidence_discovered("mysterious_note") and
                        len(store.evidence_board.check_contradictions()) >= 3 and
                        store.suspicion_system.suspects.get("director", {}).get("suspicion_level", 0) >= 50
                    )
                }
            }

        def record_key_choice(self, choice_id, choice_text, weight):
            self.key_choices.append({
                "choice_id": choice_id,
                "timestamp": renpy.time.time() if hasattr(renpy, 'time') else 0,
                "choice_text": choice_text,
                "weight": weight
            })

        def evaluate_endings(self):
            self.unlocked_endings = []
            for eid, ending in self.endings.items():
                if ending["conditions"]():
                    self.unlocked_endings.append(eid)
            if self.unlocked_endings:
                priority = ["secret_ending", "true_ending", "good_ending", "neutral_ending", "bad_ending"]
                for p in priority:
                    if p in self.unlocked_endings:
                        self.current_ending = p
                        break
            return self.unlocked_endings

        def get_current_ending(self):
            if self.current_ending is None:
                self.evaluate_endings()
            return self.current_ending

        def get_unlocked_endings(self):
            return self.unlocked_endings

        def get_ending_summary(self):
            ending = self.get_current_ending()
            if ending is None:
                return {"title": "未定", "description": "尚未达成任何结局条件"}
            e = self.endings[ending]
            return {
                "id": e["id"],
                "title": e["title"],
                "description": e["description"],
                "evidence_discovered": len(store.evidence_board.get_discovered()),
                "total_evidence": len(store.evidence_board.evidence),
                "key_choices_made": len(self.key_choices),
                "suspects_interrogated": sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"]),
                "contradictions_found": len(store.evidence_board.check_contradictions())
            }

        def reset(self):
            self.key_choices = []
            self.unlocked_endings = []
            self.current_ending = None

    store.ending_system = EndingSystem()
