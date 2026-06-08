init python:

    class InputMapper:

        def __init__(self):
            self._bindings = {}
            self._setup_defaults()
            self._apply_to_renpy()

        def _setup_defaults(self):
            self._bindings["e"] = "evidence_board"
            self._bindings["t"] = "timeline"
            self._bindings["s"] = "suspicion_board"
            self._bindings["h"] = "hint"
            self._bindings["m"] = "map"
            self._bindings["ESCAPE"] = "close_overlay"

        def _apply_to_renpy(self):
            config.keymap["evidence_board"] = ["e"]
            config.keymap["timeline"] = ["t"]
            config.keymap["suspicion_board"] = ["s"]
            config.keymap["hint"] = ["h"]
            config.keymap["map"] = ["m"]
            config.keymap["close_overlay"] = ["ESCAPE"]

            config.underlay.append(renpy.Keymap(
                evidence_board=renpy.curry(store._input_action_dispatch)("evidence_board"),
                timeline=renpy.curry(store._input_action_dispatch)("timeline"),
                suspicion_board=renpy.curry(store._input_action_dispatch)("suspicion_board"),
                hint=renpy.curry(store._input_action_dispatch)("hint"),
                map=renpy.curry(store._input_action_dispatch)("map"),
                close_overlay=renpy.curry(store._input_action_dispatch)("close_overlay"),
            ))

        def register(self, key, action):
            self._bindings[key] = action
            if action not in config.keymap:
                config.keymap[action] = [key]
            else:
                if key not in config.keymap[action]:
                    config.keymap[action].append(key)

        def unregister(self, key):
            if key in self._bindings:
                action = self._bindings[key]
                del self._bindings[key]
                if action in config.keymap:
                    if key in config.keymap[action]:
                        config.keymap[action].remove(key)
                    if len(config.keymap[action]) == 0:
                        del config.keymap[action]

        def get_action(self, key):
            return self._bindings.get(key, None)

        def get_all_bindings(self):
            return dict(self._bindings)

    def _input_action_dispatch(action):
        if action == "evidence_board":
            renpy.show_screen("evidence_board")
        elif action == "timeline":
            renpy.show_screen("timeline")
        elif action == "suspicion_board":
            renpy.show_screen("suspicion_board")
        elif action == "hint":
            renpy.show_screen("hint")
        elif action == "map":
            renpy.show_screen("map")
        elif action == "close_overlay":
            if store.ui_state and store.ui_state.is_overlay_open():
                store.ui_state.close_all_overlays()
            else:
                renpy.hide_screen("evidence_board")
                renpy.hide_screen("timeline")
                renpy.hide_screen("suspicion_board")
                renpy.hide_screen("hint")
                renpy.hide_screen("map")

    store._input_action_dispatch = _input_action_dispatch
    store.input_mapper = InputMapper()
