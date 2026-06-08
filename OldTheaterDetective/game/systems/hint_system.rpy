init python:

    class HintSystem:

        def __init__(self):
            self.hints = {}
            self._hint_history = []
            self._current_chapter_hints_given = 0
            self._register_defaults()

        def _register_defaults(self):
            self.hints["prologue"] = [
                {"id": "prologue_h1", "priority": 1, "condition": lambda: not store.evidence_board.is_evidence_discovered("powder_trail"), "text": "大厅地面上的粉末痕迹值得仔细看看，也许能采集一些样本。", "action": "go_lobby"},
                {"id": "prologue_h2", "priority": 2, "condition": lambda: not store.evidence_board.is_evidence_discovered("mysterious_note"), "text": "大厅售票台的抽屉没有上锁，也许里面有什么东西。", "action": "go_lobby"},
                {"id": "prologue_h3", "priority": 3, "condition": lambda: not store.evidence_board.is_evidence_discovered("broken_lock"), "text": "舞台上的展示台锁被撬开了，这是一个重要线索！去舞台看看。", "action": "go_stage"},
            ]
            self.hints["ch1_scene_investigation"] = [
                {"id": "ch1_h1", "priority": 1, "condition": lambda: not store.evidence_board.is_evidence_discovered("broken_lock"), "text": "舞台展示台的锁是关键线索，先去舞台检查展示台。", "action": "go_stage"},
                {"id": "ch1_h2", "priority": 2, "condition": lambda: not store.evidence_board.is_evidence_discovered("powder_trail"), "text": "大厅地面的粉末痕迹似乎来自道具室，去大厅采集样本。", "action": "go_lobby"},
                {"id": "ch1_h3", "priority": 3, "condition": lambda: not store.evidence_board.is_evidence_discovered("mysterious_note"), "text": "售票台的抽屉里有重要发现，去大厅检查。", "action": "go_lobby"},
                {"id": "ch1_h4", "priority": 4, "condition": lambda: not store.evidence_board.is_evidence_discovered("hidden_compartment"), "text": "后台通道的尽头似乎有什么东西，去看看。", "action": "go_backstage"},
                {"id": "ch1_h5", "priority": 5, "condition": lambda: not store.evidence_board.is_evidence_discovered("stagehand_toolbox"), "text": "后台有工具箱的线索，去后台调查。", "action": "go_backstage"},
                {"id": "ch1_h6", "priority": 6, "condition": lambda: True, "text": "按 T 键查看时间线，也许能发现时间上的矛盾。", "action": "open_timeline"},
            ]
            self.hints["ch2_suspect_interview"] = [
                {"id": "ch2_h1", "priority": 1, "condition": lambda: not store.suspicion_system.suspects.get("director", {}).get("interrogated", False), "text": "先去审讯导演·陈明远，了解案发当晚的情况。", "action": "interview_director"},
                {"id": "ch2_h2", "priority": 2, "condition": lambda: not store.suspicion_system.suspects.get("actress", {}).get("interrogated", False), "text": "女主角的手套是个疑点，去审讯林雪薇。", "action": "interview_actress"},
                {"id": "ch2_h3", "priority": 3, "condition": lambda: not store.suspicion_system.suspects.get("stagehand", {}).get("interrogated", False), "text": "后台的配电箱和暗格都指向舞台工人，去审讯赵大勇。", "action": "interview_stagehand"},
                {"id": "ch2_h4", "priority": 4, "condition": lambda: not store.suspicion_system.suspects.get("props_master", {}).get("interrogated", False), "text": "账本和复制品都和道具主管有关，去审讯王芝兰。", "action": "interview_props_master"},
                {"id": "ch2_h5", "priority": 5, "condition": lambda: store.suspicion_system.suspects.get("actress", {}).get("interrogated", False) and store.evidence_board.is_evidence_discovered("actress_glove"), "text": "用女演员手套上的粉末证据质疑林雪薇的说法，按 S 键查看嫌疑板。", "action": "open_suspicion"},
                {"id": "ch2_h6", "priority": 6, "condition": lambda: True, "text": "按 S 键查看嫌疑板，对比各位嫌疑人的嫌疑度和证词。", "action": "open_suspicion"},
            ]
            self.hints["ch3_cross_examination"] = [
                {"id": "ch3_h1", "priority": 1, "condition": lambda: store.evidence_board.is_evidence_discovered("props_master_ledger") and not any(c.get("choice_id", "").startswith("confront_props") for c in store.ending_system.key_choices), "text": "用账本证据对质道具主管——账本上的'备用'记录非常可疑。", "action": "confront_props_master"},
                {"id": "ch3_h2", "priority": 2, "condition": lambda: store.evidence_board.is_evidence_discovered("actress_glove") and store.evidence_board.is_evidence_discovered("powder_trail"), "text": "手套上的粉末和地面的粉末有关联，用这两件证据质疑女演员的证词。", "action": "confront_actress"},
                {"id": "ch3_h3", "priority": 3, "condition": lambda: store.evidence_board.is_evidence_discovered("mysterious_note") and not any(c.get("choice_id", "").startswith("confront_director") for c in store.ending_system.key_choices), "text": "字条'今晚行动'暗示有预谋，用这个证据质问导演。", "action": "confront_director"},
                {"id": "ch3_h4", "priority": 4, "condition": lambda: store.evidence_board.is_evidence_discovered("hidden_compartment") and store.evidence_board.is_evidence_discovered("duplicate_crown"), "text": "暗格已空而复制品已完成——真品是否曾藏在暗格里？", "action": "open_evidence"},
                {"id": "ch3_h5", "priority": 5, "condition": lambda: True, "text": "查看人际关系——道具主管和舞台工人之间的经济纠纷可能是动机。", "action": "open_suspicion"},
            ]
            self.hints["ch4_accusation"] = [
                {"id": "ch4_h1", "priority": 1, "condition": lambda: store.suspicion_system.suspects.get("props_master", {}).get("suspicion_level", 0) >= 50, "text": "道具主管的嫌疑度最高——制作复制品、可疑账目、借走工具箱，这些证据都指向她。", "action": "accuse_props_master"},
                {"id": "ch4_h2", "priority": 2, "condition": lambda: store.suspicion_system.suspects.get("director", {}).get("suspicion_level", 0) >= 50, "text": "导演也有重大嫌疑——他命令制作复制品，且有时间上的空白。", "action": "review_director"},
                {"id": "ch4_h3", "priority": 3, "condition": lambda: True, "text": "在做出最终指认之前，再检查一遍证据板和时间线，确保推理完整。", "action": "open_evidence"},
            ]

        def register_hint(self, chapter_id, hint_data):
            if chapter_id not in self.hints:
                self.hints[chapter_id] = []
            self.hints[chapter_id].append(hint_data)

        def get_available_hints(self):
            chapter_id = store.level_config.current_chapter
            if chapter_id is None:
                return []
            chapter_hints = self.hints.get(chapter_id, [])
            available = []
            for hint in chapter_hints:
                cond = hint.get("condition")
                if cond is None or (callable(cond) and cond()):
                    if hint["id"] not in [h["id"] for h in self._hint_history]:
                        available.append(hint)
            available.sort(key=lambda h: h.get("priority", 99))
            return available

        def get_next_hint(self):
            available = self.get_available_hints()
            if not available:
                return None
            hint = available[0]
            self._hint_history.append(hint)
            self._current_chapter_hints_given += 1
            return hint

        def should_auto_hint(self):
            threshold = store.level_config.get_hint_threshold()
            return self._current_chapter_hints_given < threshold

        def get_auto_hint_if_needed(self):
            if self.should_auto_hint():
                return self.get_next_hint()
            return None

        def mark_hint_shown(self, hint_id):
            if hint_id not in [h["id"] for h in self._hint_history]:
                for chapter_hints in self.hints.values():
                    for hint in chapter_hints:
                        if hint["id"] == hint_id:
                            self._hint_history.append(hint)
                            self._current_chapter_hints_given += 1
                            return

        def get_hints_given_count(self):
            return len(self._hint_history)

        def reset_chapter_hints(self):
            self._current_chapter_hints_given = 0

        def reset_all(self):
            self._hint_history = []
            self._current_chapter_hints_given = 0

    store.hint_system = HintSystem()
