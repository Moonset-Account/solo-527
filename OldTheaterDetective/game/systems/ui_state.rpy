init python:

    class UIState:

        DIALOGUE = "对话"
        INVESTIGATION = "调查"
        EVIDENCE_BOARD = "证据板"
        TIMELINE = "时间线"
        SUSPICION_BOARD = "嫌疑板"
        TUTORIAL = "教程"
        PAUSED = "暂停"
        ENDING = "结局"

        OVERLAY_STATES = {
            "证据板",
            "时间线",
            "嫌疑板",
            "教程",
            "暂停",
        }

        def __init__(self):
            self._state_stack = [self.DIALOGUE]
            self._open_overlays = set()

        def push_state(self, state):
            if len(self._state_stack) > 0:
                current = self._state_stack[-1]
                if current in self.OVERLAY_STATES:
                    self._open_overlays.discard(current)
            self._state_stack.append(state)
            if state in self.OVERLAY_STATES:
                self._open_overlays.add(state)

        def pop_state(self):
            if len(self._state_stack) > 1:
                removed = self._state_stack.pop()
                if removed in self.OVERLAY_STATES:
                    self._open_overlays.discard(removed)
                return removed
            return None

        def current_state(self):
            if len(self._state_stack) > 0:
                return self._state_stack[-1]
            return self.DIALOGUE

        def is_overlay_open(self):
            return len(self._open_overlays) > 0

        def close_all_overlays(self):
            non_overlay_stack = []
            for state in self._state_stack:
                if state not in self.OVERLAY_STATES:
                    non_overlay_stack.append(state)
            if len(non_overlay_stack) == 0:
                non_overlay_stack = [self.DIALOGUE]
            self._state_stack = non_overlay_stack
            self._open_overlays.clear()
            self._close_overlay_screens()

        def _close_overlay_screens(self):
            renpy.hide_screen("evidence_board")
            renpy.hide_screen("timeline")
            renpy.hide_screen("suspicion_board")
            renpy.hide_screen("tutorial")
            renpy.hide_screen("pause_menu")

        def get_open_overlays(self):
            return set(self._open_overlays)

        def is_in_state(self, state):
            return state in self._state_stack

        def reset(self):
            self._state_stack = [self.DIALOGUE]
            self._open_overlays.clear()

    store.ui_state = UIState()
