init python:

    class EvidenceBoard:

        CONNECTION_CORROBORATE = "corroborate"
        CONNECTION_CONTRADICT = "contradict"
        CONNECTION_CAUSAL = "causal"
        CONNECTION_LOCATION = "location"

        def __init__(self):
            self.evidence = {}
            self.connections = []
            self.player_connections = []
            self.valid_connections = {}
            self._register_default_evidence()
            self._register_valid_connections()

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

        def _register_valid_connections(self):
            self.valid_connections = {
                frozenset(["broken_lock", "stagehand_toolbox"]): {
                    "type": self.CONNECTION_CAUSAL,
                    "title": "撬锁手法",
                    "description": "工具箱中的撬锁工具与展示台锁被专业手法打开吻合——借走工具箱的人有能力撬开那把锁。",
                    "insight": "谁借走了工具箱？道具主管王芝兰。"
                },
                frozenset(["powder_trail", "actress_glove"]): {
                    "type": self.CONNECTION_CORROBORATE,
                    "title": "粉末来源",
                    "description": "手套上的粉末和地面上的粉末痕迹同源——从道具室一路延伸到大厅，再被带到化妆间。",
                    "insight": "有人在道具室和大厅之间搬运了东西。"
                },
                frozenset(["powder_trail", "missing_prop_crown"]): {
                    "type": self.CONNECTION_LOCATION,
                    "title": "搬运路线",
                    "description": "粉末从道具室延伸到大厅，与王冠失踪的搬运路线一致——有人将重物从道具室经大厅运走。",
                    "insight": "粉末是搬运王冠时留下的。"
                },
                frozenset(["props_master_ledger", "duplicate_crown"]): {
                    "type": self.CONNECTION_CONTRADICT,
                    "title": "备用还是替代",
                    "description": "账本称复制品为'备用'，但复制品品质足以以假乱真——这不是备用，而是准备替换真品。",
                    "insight": "复制品的制作目的存疑。"
                },
                frozenset(["duplicate_crown", "hidden_compartment"]): {
                    "type": self.CONNECTION_CAUSAL,
                    "title": "藏匿与替换",
                    "description": "暗格已空且近期被打开，复制品已完成——真品可能曾藏在暗格中，用复制品替换后转移真品。",
                    "insight": "偷梁换柱的手法：复制品上台，真品藏暗格。"
                },
                frozenset(["hidden_compartment", "missing_prop_crown"]): {
                    "type": self.CONNECTION_LOCATION,
                    "title": "藏匿地点",
                    "description": "暗格正好可以容纳王冠，且近期被打开过——王冠可能曾被藏在此处。",
                    "insight": "暗格是临时藏匿点。"
                },
                frozenset(["mysterious_note", "broken_lock"]): {
                    "type": self.CONNECTION_CAUSAL,
                    "title": "预谋行动",
                    "description": "'今晚行动'的字条与专业撬锁手法都指向这是一起有预谋的犯罪，而非临时起意。",
                    "insight": "这不是冲动犯罪，而是精心策划的。"
                },
                frozenset(["mysterious_note", "props_master_ledger"]): {
                    "type": self.CONNECTION_CAUSAL,
                    "title": "行动与账目",
                    "description": "'今晚行动'的计划与账本上的'备用'申请——行动需要复制品作为替换，账目是掩护。",
                    "insight": "字条和账本是同一计划的两个环节。"
                },
                frozenset(["stagehand_toolbox", "props_master_ledger"]): {
                    "type": self.CONNECTION_CORROBORATE,
                    "title": "工具与计划",
                    "description": "道具主管借走了工具箱（含撬锁工具），同时在账本上申请了'备用'复制品——两者都是偷梁换柱计划的一部分。",
                    "insight": "王芝兰同时掌握了作案工具和作案手段。"
                },
                frozenset(["director_alibi", "mysterious_note"]): {
                    "type": self.CONNECTION_CONTRADICT,
                    "title": "导演的空白",
                    "description": "导演声称一直在观众席，但字条'今晚行动'暗示有预谋——导演十分钟的空白时间与行动时间窗口吻合。",
                    "insight": "导演是否知情？还是被用来转移注意力？"
                },
                frozenset(["actress_glove", "missing_prop_crown"]): {
                    "type": self.CONNECTION_CORROBORATE,
                    "title": "手套上的证据",
                    "description": "手套上的粉末来自舞台区域——林雪薇确实接触过展示台附近的物品，与她否认接触王冠的说法矛盾。",
                    "insight": "她可能只是取道具，也可能参与了搬运。"
                },
                frozenset(["broken_lock", "missing_prop_crown"]): {
                    "type": self.CONNECTION_CAUSAL,
                    "title": "锁与王冠",
                    "description": "展示台的锁被撬开，王冠从展示台消失——撬锁是王冠失窃的直接手段。",
                    "insight": "谁有能力撬锁，谁就是最大嫌疑人。"
                },
            }

        def add_evidence(self, evidence_data):
            self.evidence[evidence_data["id"]] = evidence_data

        def remove_evidence(self, evid_id):
            if evid_id in self.evidence:
                del self.evidence[evid_id]
                self.connections = [c for c in self.connections if c["evidence_a"] != evid_id and c["evidence_b"] != evid_id]
                self.player_connections = [c for c in self.player_connections if c["evidence_a"] != evid_id and c["evidence_b"] != evid_id]

        def connect_evidence(self, evid_a, evid_b, conn_type, desc):
            for c in self.connections:
                if (c["evidence_a"] == evid_a and c["evidence_b"] == evid_b) or (c["evidence_a"] == evid_b and c["evidence_b"] == evid_a):
                    return
            self.connections.append({"evidence_a": evid_a, "evidence_b": evid_b, "type": conn_type, "description": desc})

        def disconnect_evidence(self, evid_a, evid_b):
            self.connections = [c for c in self.connections if not ((c["evidence_a"] == evid_a and c["evidence_b"] == evid_b) or (c["evidence_a"] == evid_b and c["evidence_b"] == evid_a))]
            self.player_connections = [c for c in self.player_connections if not ((c["evidence_a"] == evid_a and c["evidence_b"] == evid_b) or (c["evidence_a"] == evid_b and c["evidence_b"] == evid_a))]

        def try_connect(self, evid_a, evid_b):
            key = frozenset([evid_a, evid_b])
            for pc in self.player_connections:
                if frozenset([pc["evidence_a"], pc["evidence_b"]]) == key:
                    return {"success": False, "reason": "already_connected"}
            if not self.is_evidence_discovered(evid_a) or not self.is_evidence_discovered(evid_b):
                return {"success": False, "reason": "not_discovered"}
            if evid_a == evid_b:
                return {"success": False, "reason": "same_evidence"}
            if key in self.valid_connections:
                conn = self.valid_connections[key]
                result = {
                    "success": True,
                    "type": conn["type"],
                    "title": conn["title"],
                    "description": conn["description"],
                    "insight": conn.get("insight", ""),
                    "evidence_a": evid_a,
                    "evidence_b": evid_b,
                }
                self.player_connections.append({
                    "evidence_a": evid_a,
                    "evidence_b": evid_b,
                    "type": conn["type"],
                    "title": conn["title"],
                    "description": conn["description"],
                    "insight": conn.get("insight", ""),
                })
                self.connections.append({
                    "evidence_a": evid_a,
                    "evidence_b": evid_b,
                    "type": conn["type"],
                    "description": conn["description"],
                })
                return result
            return {"success": False, "reason": "invalid_connection", "evidence_a": evid_a, "evidence_b": evid_b}

        def get_player_connections(self):
            return list(self.player_connections)

        def get_connectable_pairs(self):
            discovered = [e["id"] for e in self.get_discovered()]
            pairs = []
            for key, conn in self.valid_connections.items():
                ev_ids = list(key)
                if ev_ids[0] in discovered and ev_ids[1] in discovered:
                    already = any(frozenset([pc["evidence_a"], pc["evidence_b"]]) == key for pc in self.player_connections)
                    if not already:
                        pairs.append({"evidence_a": ev_ids[0], "evidence_b": ev_ids[1], "title": conn["title"]})
            return pairs

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
                    already_connected = any(
                        frozenset([pc["evidence_a"], pc["evidence_b"]]) == frozenset([evid_a, evid_b])
                        for pc in self.player_connections
                    )
                    contradictions.append({"evidence_a": evid_a, "evidence_b": evid_b, "description": desc, "player_connected": already_connected})
            return contradictions

        def is_evidence_discovered(self, evid_id):
            return evid_id in self.evidence and self.evidence[evid_id]["discovered"]

        def get_connection_count(self):
            return len(self.player_connections)

    store.evidence_board = EvidenceBoard()
