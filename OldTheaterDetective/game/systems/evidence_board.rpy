init python:
    class EvidenceBoard:
        def __init__(self):
            self.evidence = {}
            self.connections = []
            self._register_default_evidence()

        def _register_default_evidence(self):
            default_evidence = [
                {"id": "missing_prop_crown", "name": "失踪的王冠道具", "description": "演出用王冠道具在排练期间神秘失踪，是本案的核心物品", "icon": "evidence_crown", "discovered": False, "location": "stage", "timestamp": "20:00"},
                {"id": "broken_lock", "name": "坏掉的锁", "description": "展示台的锁被专业手法撬开，非一般人所能做到", "icon": "evidence_lock", "discovered": False, "location": "stage", "timestamp": "20:05"},
                {"id": "director_alibi", "name": "导演的不在场证明", "description": "导演声称排练期间一直在观众席，但中间有约十分钟的去向不明", "icon": "evidence_alibi", "discovered": False, "location": "lobby", "timestamp": "20:15"},
                {"id": "actress_glove", "name": "女演员的手套", "description": "在化妆间发现的手套，上面沾有舞台粉末痕迹", "icon": "evidence_glove", "discovered": False, "location": "dressing_room", "timestamp": "20:30"},
                {"id": "stagehand_toolbox", "name": "舞台工人的工具箱", "description": "工具箱曾被道具主管借走，其中包含可撬锁的工具", "icon": "evidence_toolbox", "discovered": False, "location": "backstage", "timestamp": "18:30"},
                {"id": "props_master_ledger", "name": "道具主管的账本", "description": "账本记录了制作王冠复制品的条目，申请理由为'备用'", "icon": "evidence_ledger", "discovered": False, "location": "prop_room", "timestamp": "20:45"},
                {"id": "mysterious_note", "name": "神秘字条", "description": "在售票台抽屉中发现，上面写着'今晚行动'", "icon": "evidence_note", "discovered": False, "location": "lobby", "timestamp": "19:50"},
                {"id": "powder_trail", "name": "粉末痕迹", "description": "从道具室一直延伸到大厅的特殊保养粉末痕迹", "icon": "evidence_powder", "discovered": False, "location": "lobby", "timestamp": "19:55"},
                {"id": "hidden_compartment", "name": "暗格", "description": "后台通道尽头的隐藏暗格，最近被人打开过，里面已空", "icon": "evidence_compartment", "discovered": False, "location": "backstage", "timestamp": "20:10"},
                {"id": "duplicate_crown", "name": "复制品王冠", "description": "在道具室工作台上发现的王冠复制品，制作精良足以以假乱真", "icon": "evidence_duplicate", "discovered": False, "location": "prop_room", "timestamp": "21:00"}
            ]
            for e in default_evidence:
                self.evidence[e["id"]] = e

        def add_evidence(self, evidence_data):
            self.evidence[evidence_data["id"]] = evidence_data

        def remove_evidence(self, evid_id):
            if evid_id in self.evidence:
                del self.evidence[evid_id]
                self.connections = [c for c in self.connections if c["evidence_a"] != evid_id and c["evidence_b"] != evid_id]

        def connect_evidence(self, evid_a, evid_b, conn_type, desc):
            for c in self.connections:
                if (c["evidence_a"] == evid_a and c["evidence_b"] == evid_b) or (c["evidence_a"] == evid_b and c["evidence_b"] == evid_a):
                    return
            self.connections.append({"evidence_a": evid_a, "evidence_b": evid_b, "type": conn_type, "description": desc})

        def disconnect_evidence(self, evid_a, evid_b):
            self.connections = [c for c in self.connections if not ((c["evidence_a"] == evid_a and c["evidence_b"] == evid_b) or (c["evidence_a"] == evid_b and c["evidence_b"] == evid_a))]

        def discover(self, evid_id):
            if evid_id in self.evidence:
                self.evidence[evid_id]["discovered"] = True

        def get_discovered(self):
            return [e for e in self.evidence.values() if e["discovered"]]

        def get_connections_for(self, evid_id):
            return [c for c in self.connections if c["evidence_a"] == evid_id or c["evidence_b"] == evid_id]

        def check_contradictions(self):
            contradictions = []
            contradiction_pairs = [
                ("director_alibi", "powder_trail", "导演声称未离开观众席，但粉末痕迹显示有人从道具室经大厅往返"),
                ("actress_glove", "missing_prop_crown", "女演员手套上的粉末与王冠展示台附近一致，但她声称未接触王冠"),
                ("props_master_ledger", "duplicate_crown", "账本称复制品为'备用'申请，但复制品精良程度足以替代真品"),
                ("mysterious_note", "director_alibi", "字条内容'今晚行动'暗示有预谋，与导演声称毫不知情矛盾"),
                ("stagehand_toolbox", "broken_lock", "工具箱中有撬锁工具，锁被专业手法打开，两者存在关联可能"),
                ("hidden_compartment", "duplicate_crown", "暗格已空且近期被打开，复制品已制作完成，可能真品被藏在暗格后转移")
            ]
            for evid_a, evid_b, desc in contradiction_pairs:
                if self.is_evidence_discovered(evid_a) and self.is_evidence_discovered(evid_b):
                    contradictions.append({"evidence_a": evid_a, "evidence_b": evid_b, "description": desc})
            return contradictions

        def is_evidence_discovered(self, evid_id):
            return evid_id in self.evidence and self.evidence[evid_id]["discovered"]

    store.evidence_board = EvidenceBoard()
