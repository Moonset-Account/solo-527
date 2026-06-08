init python:

    import time

    class SaveExt:

        def __init__(self):
            self._auto_save_prefix = "auto_"
            self._last_scene = None
            self._save_meta = {}

        def _slot_name(self, slot_suffix):
            return str(slot_suffix)

        def _collect_save_data(self):
            data = {
                "timestamp": time.time(),
                "scene": self._last_scene,
                "analytics": dict(persistent.analytics) if hasattr(persistent, "analytics") and persistent.analytics else {},
            }
            return data

        def auto_save(self, slot_suffix="default"):
            slot = self._auto_save_prefix + self._slot_name(slot_suffix)
            self._save_meta[slot] = self._collect_save_data()
            renpy.save(slot)

        def load_save(self, slot_suffix="default"):
            slot = self._slot_name(slot_suffix)
            if renpy.can_load(slot):
                renpy.load(slot)
                return True
            return False

        def get_save_info(self, slot):
            slot_name = self._slot_name(slot)
            info = {
                "exists": renpy.can_load(slot_name),
                "slot": slot_name,
            }
            if slot_name in self._save_meta:
                info.update(self._save_meta[slot_name])
            new_info = renpy.slot_json(slot_name)
            if new_info:
                info.update(new_info)
            return info

        def delete_save(self, slot):
            slot_name = self._slot_name(slot)
            if renpy.can_load(slot_name):
                renpy.unlink_save(slot_name)
                if slot_name in self._save_meta:
                    del self._save_meta[slot_name]

        def get_all_saves(self):
            saves = []
            slots = renpy.list_slots()
            for slot in slots:
                info = self.get_save_info(slot)
                saves.append(info)
            return saves

        def on_scene_transition(self, new_scene):
            if self._last_scene is not None:
                self.auto_save(self._last_scene)
            self._last_scene = new_scene

    store.save_ext = SaveExt()

    config.autosave_on_choice = True

    def _saveext_scene_callback(layer, new_scene, old_scene):
        store.save_ext.on_scene_transition(new_scene)

    config.scene_callbacks = [_saveext_scene_callback]
