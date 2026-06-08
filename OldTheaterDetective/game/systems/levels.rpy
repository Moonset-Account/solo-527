init python:

    class LevelConfig:

        CHAPTER_PROLOGUE = "prologue"
        CHAPTER_CH1 = "ch1_scene_investigation"
        CHAPTER_CH2 = "ch2_suspect_interview"
        CHAPTER_CH3 = "ch3_cross_examination"
        CHAPTER_CH4 = "ch4_accusation"

        DIFFICULTY_EASY = "easy"
        DIFFICULTY_NORMAL = "normal"
        DIFFICULTY_HARD = "hard"

        def __init__(self):
            self.chapters = {}
            self.current_chapter = None
            self._chapter_order = []
            self._difficulty = self.DIFFICULTY_NORMAL
            self._register_chapters()

        def _register_chapters(self):
            self.chapters[self.CHAPTER_PROLOGUE] = {
                "id": self.CHAPTER_PROLOGUE,
                "title": "序幕：夜幕下的老剧院",
                "description": "接案、了解核心动作——调查道具失踪",
                "new_rules": ["scene_navigation", "evidence_collection"],
                "required_evidence_count": 0,
                "required_suspects_interrogated": 0,
                "hint_threshold": 2,
                "max_retries": 3,
                "tutorial_id": "tutorial_basics",
                "available_locations": ["lobby"],
                "unlock_condition": None,
                "difficulty_modifier": 0.8,
                "next_chapter": self.CHAPTER_CH1,
            }
            self.chapters[self.CHAPTER_CH1] = {
                "id": self.CHAPTER_CH1,
                "title": "第一章：现场的痕迹",
                "description": "深入各场景调查，收集物证，拼凑线索",
                "new_rules": ["timeline_viewing", "evidence_connections", "contradiction_detection"],
                "required_evidence_count": 4,
                "required_suspects_interrogated": 0,
                "hint_threshold": 3,
                "max_retries": 5,
                "tutorial_id": "tutorial_investigation",
                "available_locations": ["lobby", "stage", "backstage"],
                "unlock_condition": lambda: store.evidence_board.is_evidence_discovered("broken_lock"),
                "difficulty_modifier": 1.0,
                "next_chapter": self.CHAPTER_CH2,
            }
            self.chapters[self.CHAPTER_CH2] = {
                "id": self.CHAPTER_CH2,
                "title": "第二章：各执一词",
                "description": "访谈嫌疑人，发现证词矛盾，调整嫌疑度",
                "new_rules": ["suspect_interrogation", "suspicion_adjustment", "alibi_verification"],
                "required_evidence_count": 6,
                "required_suspects_interrogated": 3,
                "hint_threshold": 4,
                "max_retries": 5,
                "tutorial_id": "tutorial_interview",
                "available_locations": ["lobby", "stage", "backstage", "dressing_room", "prop_room"],
                "unlock_condition": lambda: len(store.evidence_board.get_discovered()) >= 4,
                "difficulty_modifier": 1.2,
                "next_chapter": self.CHAPTER_CH3,
            }
            self.chapters[self.CHAPTER_CH3] = {
                "id": self.CHAPTER_CH3,
                "title": "第三章：暗流涌动",
                "description": "交叉质证，揭示证词与证据之间的深层矛盾",
                "new_rules": ["cross_examination", "evidence_confrontation", "relationship_reveal"],
                "required_evidence_count": 8,
                "required_suspects_interrogated": 4,
                "hint_threshold": 5,
                "max_retries": 5,
                "tutorial_id": "tutorial_cross_examine",
                "available_locations": ["lobby", "stage", "backstage", "dressing_room", "prop_room"],
                "unlock_condition": lambda: sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"]) >= 3,
                "difficulty_modifier": 1.4,
                "next_chapter": self.CHAPTER_CH4,
            }
            self.chapters[self.CHAPTER_CH4] = {
                "id": self.CHAPTER_CH4,
                "title": "终章：真相大白",
                "description": "指认凶手，陈述推理，达成结局",
                "new_rules": ["accusation", "ending_evaluation"],
                "required_evidence_count": 8,
                "required_suspects_interrogated": 4,
                "hint_threshold": 6,
                "max_retries": 3,
                "tutorial_id": None,
                "available_locations": ["lobby", "stage", "backstage", "dressing_room", "prop_room"],
                "unlock_condition": lambda: (
                    len(store.evidence_board.get_discovered()) >= 8 and
                    sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"]) >= 4
                ),
                "difficulty_modifier": 1.0,
                "next_chapter": None,
            }
            self._chapter_order = [
                self.CHAPTER_PROLOGUE,
                self.CHAPTER_CH1,
                self.CHAPTER_CH2,
                self.CHAPTER_CH3,
                self.CHAPTER_CH4,
            ]

        def get_chapter(self, chapter_id):
            return self.chapters.get(chapter_id, None)

        def get_current_chapter_config(self):
            if self.current_chapter is None:
                return None
            return self.chapters.get(self.current_chapter, None)

        def can_advance_chapter(self, chapter_id):
            chapter = self.chapters.get(chapter_id, None)
            if chapter is None:
                return False
            next_id = chapter.get("next_chapter")
            if next_id is None:
                return False
            next_chapter = self.chapters.get(next_id)
            if next_chapter is None:
                return False
            unlock = next_chapter.get("unlock_condition")
            if unlock is None:
                return True
            try:
                return unlock()
            except:
                return False

        def advance_to_chapter(self, chapter_id):
            if chapter_id not in self.chapters:
                return False
            self.current_chapter = chapter_id
            config = self.chapters[chapter_id]
            for loc_id in config.get("available_locations", []):
                if loc_id not in store.scene_manager.scenes:
                    pass
            analytics_start("chapter_" + chapter_id)
            return True

        def get_available_locations(self):
            config = self.get_current_chapter_config()
            if config is None:
                return []
            return config.get("available_locations", [])

        def get_new_rules(self):
            config = self.get_current_chapter_config()
            if config is None:
                return []
            return config.get("new_rules", [])

        def get_hint_threshold(self):
            config = self.get_current_chapter_config()
            if config is None:
                return 3
            return config.get("hint_threshold", 3)

        def get_max_retries(self):
            config = self.get_current_chapter_config()
            if config is None:
                return 5
            base = config.get("max_retries", 5)
            if self._difficulty == self.DIFFICULTY_EASY:
                return base + 2
            elif self._difficulty == self.DIFFICULTY_HARD:
                return max(1, base - 2)
            return base

        def get_required_evidence(self):
            config = self.get_current_chapter_config()
            if config is None:
                return 0
            return config.get("required_evidence_count", 0)

        def get_required_interrogations(self):
            config = self.get_current_chapter_config()
            if config is None:
                return 0
            return config.get("required_suspects_interrogated", 0)

        def get_difficulty_modifier(self):
            config = self.get_current_chapter_config()
            if config is None:
                return 1.0
            base = config.get("difficulty_modifier", 1.0)
            if self._difficulty == self.DIFFICULTY_EASY:
                return base * 0.8
            elif self._difficulty == self.DIFFICULTY_HARD:
                return base * 1.3
            return base

        def set_difficulty(self, difficulty):
            if difficulty in (self.DIFFICULTY_EASY, self.DIFFICULTY_NORMAL, self.DIFFICULTY_HARD):
                self._difficulty = difficulty

        def get_difficulty(self):
            return self._difficulty

        def get_chapter_order(self):
            return list(self._chapter_order)

        def is_chapter_complete(self, chapter_id):
            chapter = self.chapters.get(chapter_id)
            if chapter is None:
                return False
            discovered = len(store.evidence_board.get_discovered())
            interrogated = sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"])
            req_evidence = chapter.get("required_evidence_count", 0)
            req_interrogated = chapter.get("required_suspects_interrogated", 0)
            if discovered < req_evidence:
                return False
            if interrogated < req_interrogated:
                return False
            return True

        def get_progress_summary(self):
            chapter = self.get_current_chapter_config()
            if chapter is None:
                return {}
            return {
                "chapter_id": chapter["id"],
                "chapter_title": chapter["title"],
                "evidence_discovered": len(store.evidence_board.get_discovered()),
                "evidence_required": chapter.get("required_evidence_count", 0),
                "suspects_interrogated": sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"]),
                "suspects_required": chapter.get("required_suspects_interrogated", 0),
                "difficulty": self._difficulty,
                "can_advance": self.can_advance_chapter(chapter["id"]),
                "available_locations": chapter.get("available_locations", []),
            }

    store.level_config = LevelConfig()
