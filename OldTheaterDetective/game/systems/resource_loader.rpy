init python:

    class ResourceLoader:

        def __init__(self):
            self._registry = {}
            self._loaded_images = {}
            self._loaded_audio = {}
            self._loaded_scenes = set()
            self._register_defaults()

        def _register_defaults(self):
            self._registry["lobby"] = {
                "images": [
                    ("bg_lobby", "images/scenes/lobby/bg.jpg"),
                    ("lobby_chandelier", "images/scenes/lobby/chandelier.png"),
                    ("lobby_desk", "images/scenes/lobby/desk.png"),
                    ("lobby_seats", "images/scenes/lobby/seats.png"),
                ],
                "audio": [
                    "audio/bgm/theater_lobby.ogg",
                    "audio/sfx/clock_tick.ogg",
                ],
            }
            self._registry["stage"] = {
                "images": [
                    ("bg_stage", "images/scenes/stage/bg.jpg"),
                    ("stage_curtain", "images/scenes/stage/curtain.png"),
                    ("stage_props", "images/scenes/stage/props.png"),
                    ("stage_lights", "images/scenes/stage/lights.png"),
                ],
                "audio": [
                    "audio/bgm/theater_stage.ogg",
                    "audio/sfx/footstep.ogg",
                ],
            }
            self._registry["backstage"] = {
                "images": [
                    ("bg_backstage", "images/scenes/backstage/bg.jpg"),
                    ("backstage_shelves", "images/scenes/backstage/shelves.png"),
                    ("backstage_costumes", "images/scenes/backstage/costumes.png"),
                    ("backstage_trunk", "images/scenes/backstage/trunk.png"),
                ],
                "audio": [
                    "audio/bgm/theater_backstage.ogg",
                    "audio/sfx/door_open.ogg",
                    "audio/sfx/door_close.ogg",
                ],
            }
            self._registry["dressing_room"] = {
                "images": [
                    ("bg_dressing_room", "images/scenes/dressing_room/bg.jpg"),
                    ("dressing_mirror", "images/scenes/dressing_room/mirror.png"),
                    ("dressing_table", "images/scenes/dressing_room/table.png"),
                    ("dressing_costumes", "images/scenes/dressing_room/costumes.png"),
                ],
                "audio": [
                    "audio/bgm/theater_dressing.ogg",
                    "audio/sfx/paper_rustle.ogg",
                ],
            }
            self._registry["prop_room"] = {
                "images": [
                    ("bg_prop_room", "images/scenes/prop_room/bg.jpg"),
                    ("prop_shelf", "images/scenes/prop_room/shelf.png"),
                    ("prop_cabinet", "images/scenes/prop_room/cabinet.png"),
                    ("prop_missing_spot", "images/scenes/prop_room/missing_spot.png"),
                ],
                "audio": [
                    "audio/bgm/theater_prop_room.ogg",
                    "audio/sfx/paper_rustle.ogg",
                    "audio/sfx/footstep.ogg",
                ],
            }

        def register_scene(self, scene_id, image_list, audio_list):
            self._registry[scene_id] = {
                "images": image_list,
                "audio": audio_list,
            }

        def preload(self, scene_id):
            if scene_id not in self._registry:
                return
            resources = self._registry[scene_id]
            for img_name, img_path in resources.get("images", []):
                if img_name not in self._loaded_images:
                    renpy.image(img_name, img_path)
                    self._loaded_images[img_name] = img_path
            for audio_path in resources.get("audio", []):
                if audio_path not in self._loaded_audio:
                    renpy.music.register_channel(audio_path, mixer="music", loop=True)
                    self._loaded_audio[audio_path] = True
            self._loaded_scenes.add(scene_id)

        def release(self, scene_id):
            if scene_id not in self._registry:
                return
            resources = self._registry[scene_id]
            for img_name, img_path in resources.get("images", []):
                if img_name in self._loaded_images:
                    del self._loaded_images[img_name]
            for audio_path in resources.get("audio", []):
                if audio_path in self._loaded_audio:
                    del self._loaded_audio[audio_path]
            self._loaded_scenes.discard(scene_id)

        def get_image(self, name):
            if name in self._loaded_images:
                return self._loaded_images[name]
            return None

        def get_audio(self, name):
            for scene_id in self._loaded_scenes:
                resources = self._registry.get(scene_id, {})
                for audio_path in resources.get("audio", []):
                    if name in audio_path:
                        return audio_path
            return None

        def is_scene_loaded(self, scene_id):
            return scene_id in self._loaded_scenes

    store.resource_loader = ResourceLoader()
