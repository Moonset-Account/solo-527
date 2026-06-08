init python:

    class TutorialSystem:

        def __init__(self):
            self.tutorials = {}
            self.active_tutorial = None
            self._step_index = 0
            self._completed = set()
            self._skipped = set()
            self._register_defaults()

        def _register_defaults(self):
            self.tutorials["tutorial_basics"] = {
                "id": "tutorial_basics",
                "title": "基础操作",
                "trigger_chapter": LevelConfig.CHAPTER_PROLOGUE,
                "steps": [
                    {"text": "欢迎来到老剧院侦探故事！你将扮演一名侦探，调查首演前的道具失踪事件。", "highlight": None, "action": None},
                    {"text": "点击场景中的热点区域可以调查物品和发现线索。线索会自动记录到证据板。", "highlight": "investigation_area", "action": None},
                    {"text": "按 E 键或点击侧栏图标可以随时打开证据板，查看已收集的所有证据。", "highlight": "evidence_button", "action": "open_evidence"},
                    {"text": "与场景中的人物对话时，注意选择不同的问题——有些选项需要先收集到特定证据才会出现。", "highlight": None, "action": None},
                    {"text": "如果你不确定下一步该做什么，按 H 键或点击提示按钮获取指引。", "highlight": "hint_button", "action": None},
                ]
            }
            self.tutorials["tutorial_investigation"] = {
                "id": "tutorial_investigation",
                "title": "深入调查",
                "trigger_chapter": LevelConfig.CHAPTER_CH1,
                "steps": [
                    {"text": "调查进入新阶段！现在你可以在多个场景之间自由移动。", "highlight": None, "action": None},
                    {"text": "按 T 键打开时间线，查看所有事件的时间排序，寻找时间上的矛盾。", "highlight": "timeline_button", "action": "open_timeline"},
                    {"text": "在证据板上，你可以将两件证据连接起来——如果它们之间存在关联，系统会确认你的推理。", "highlight": "evidence_connect", "action": None},
                    {"text": "当证据之间存在矛盾时，时间线和证据板上会出现特殊标记。注意这些矛盾！", "highlight": None, "action": None},
                ]
            }
            self.tutorials["tutorial_interview"] = {
                "id": "tutorial_interview",
                "title": "访谈技巧",
                "trigger_chapter": LevelConfig.CHAPTER_CH2,
                "steps": [
                    {"text": "现在你可以正式审讯嫌疑人了。选择提问的角度会影响嫌疑度。", "highlight": None, "action": None},
                    {"text": "按 S 键打开嫌疑板，查看每位嫌疑人的嫌疑程度、不在场证明和人际关系。", "highlight": "suspicion_button", "action": "open_suspicion"},
                    {"text": "如果某位嫌疑人已经接受过审讯，你可以在嫌疑板上用新发现的证据质疑他们的证词。", "highlight": None, "action": None},
                    {"text": "证词之间的矛盾会自动降低可信度——注意对比不同嫌疑人的说法。", "highlight": None, "action": None},
                ]
            }
            self.tutorials["tutorial_cross_examine"] = {
                "id": "tutorial_cross_examine",
                "title": "交叉质证",
                "trigger_chapter": LevelConfig.CHAPTER_CH3,
                "steps": [
                    {"text": "交叉质证阶段！现在你可以用证据直接对质嫌疑人。", "highlight": None, "action": None},
                    {"text": "选择正确的证据对质正确的嫌疑人，可以大幅提升该嫌疑人的嫌疑度或排除其嫌疑。", "highlight": None, "action": None},
                    {"text": "错误的对质不会惩罚你，但会消耗一次机会。每章的质证次数有限，请谨慎使用。", "highlight": None, "action": None},
                    {"text": "人际关系网络中隐藏着关键线索——嫌疑人之间的关系可能就是破案的关键。", "highlight": None, "action": None},
                ]
            }

        def register_tutorial(self, tutorial_data):
            self.tutorials[tutorial_data["id"]] = tutorial_data

        def start_tutorial(self, tutorial_id):
            if tutorial_id not in self.tutorials:
                return False
            if tutorial_id in self._completed:
                return False
            self.active_tutorial = tutorial_id
            self._step_index = 0
            return True

        def should_trigger(self, chapter_id):
            for tid, tutorial in self.tutorials.items():
                if tutorial["trigger_chapter"] == chapter_id and tid not in self._completed and tid not in self._skipped:
                    return tid
            return None

        def get_current_step(self):
            if self.active_tutorial is None:
                return None
            tutorial = self.tutorials.get(self.active_tutorial)
            if tutorial is None:
                return None
            steps = tutorial.get("steps", [])
            if self._step_index >= len(steps):
                return None
            step = steps[self._step_index]
            step["step_number"] = self._step_index + 1
            step["total_steps"] = len(steps)
            step["tutorial_title"] = tutorial["title"]
            return step

        def advance_step(self):
            if self.active_tutorial is None:
                return False
            tutorial = self.tutorials.get(self.active_tutorial)
            if tutorial is None:
                return False
            steps = tutorial.get("steps", [])
            self._step_index += 1
            if self._step_index >= len(steps):
                self._completed.add(self.active_tutorial)
                self.active_tutorial = None
                self._step_index = 0
                return False
            return True

        def skip_tutorial(self):
            if self.active_tutorial is None:
                return
            self._skipped.add(self.active_tutorial)
            analytics_record_tutorial_skip(self.active_tutorial)
            self.active_tutorial = None
            self._step_index = 0

        def is_tutorial_active(self):
            return self.active_tutorial is not None

        def is_tutorial_completed(self, tutorial_id):
            return tutorial_id in self._completed

        def is_tutorial_skipped(self, tutorial_id):
            return tutorial_id in self._skipped

        def get_completed_tutorials(self):
            return list(self._completed)

        def get_skipped_tutorials(self):
            return list(self._skipped)

        def reset_tutorials(self):
            self._completed.clear()
            self._skipped.clear()
            self.active_tutorial = None
            self._step_index = 0

    store.tutorial_system = TutorialSystem()
