init python:
    class SceneManager:
        def __init__(self):
            self.scene_stack = []
            self.scenes = {}
            self._register_default_scenes()

        def _register_default_scenes(self):
            self.scenes["lobby"] = {
                "id": "lobby",
                "background": "bg_lobby",
                "characters_present": [],
                "available_interactions": [],
                "bgm_track": "lobby"
            }
            self.scenes["stage"] = {
                "id": "stage",
                "background": "bg_stage",
                "characters_present": [],
                "available_interactions": [],
                "bgm_track": "stage"
            }
            self.scenes["backstage"] = {
                "id": "backstage",
                "background": "bg_backstage",
                "characters_present": [],
                "available_interactions": [],
                "bgm_track": "backstage"
            }
            self.scenes["dressing_room"] = {
                "id": "dressing_room",
                "background": "bg_dressing_room",
                "characters_present": [],
                "available_interactions": [],
                "bgm_track": "dressing_room"
            }
            self.scenes["prop_room"] = {
                "id": "prop_room",
                "background": "bg_prop_room",
                "characters_present": [],
                "available_interactions": [],
                "bgm_track": "prop_room"
            }

        def push_scene(self, scene_id, transition=None):
            if scene_id not in self.scenes:
                return
            scene = self.scenes[scene_id]
            resource_loader.preload(scene["id"])
            audio_manager.play_scene_bgm(scene["bgm_track"])
            save_ext.auto_save()
            if transition:
                renpy.scene()
                renpy.show(scene["background"])
                renpy.with_statement(transition)
            else:
                renpy.scene()
                renpy.show(scene["background"])
            self.scene_stack.append(scene_id)

        def pop_scene(self):
            if not self.scene_stack:
                return
            popped_id = self.scene_stack.pop()
            resource_loader.release(self.scenes[popped_id]["id"])
            if self.scene_stack:
                current_id = self.scene_stack[-1]
                scene = self.scenes[current_id]
                renpy.scene()
                renpy.show(scene["background"])
                audio_manager.play_scene_bgm(scene["bgm_track"])

        def switch_scene(self, scene_id, transition=None):
            if scene_id not in self.scenes:
                return
            if self.scene_stack:
                old_id = self.scene_stack[-1]
                resource_loader.release(self.scenes[old_id]["id"])
                self.scene_stack.pop()
            scene = self.scenes[scene_id]
            resource_loader.preload(scene["id"])
            audio_manager.play_scene_bgm(scene["bgm_track"])
            save_ext.auto_save()
            if transition:
                renpy.scene()
                renpy.show(scene["background"])
                renpy.with_statement(transition)
            else:
                renpy.scene()
                renpy.show(scene["background"])
            self.scene_stack.append(scene_id)

        def current_scene(self):
            if not self.scene_stack:
                return None
            return self.scenes.get(self.scene_stack[-1], None)

    store.scene_manager = SceneManager()
