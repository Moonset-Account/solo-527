init python:

    import os

    class ResourceLoader:

        def __init__(self):
            self._registry = {}
            self._loaded_images = {}
            self._loaded_audio = {}
            self._loaded_scenes = set()
            self._register_defaults()

        def _file_exists(self, path):
            try:
                return renpy.loader.loadable(path)
            except:
                return os.path.isfile(os.path.join(config.gamedir, path))

        def _register_defaults(self):
            self._registry["lobby"] = {
                "images": [],
                "audio": [],
            }
            self._registry["stage"] = {
                "images": [],
                "audio": [],
            }
            self._registry["backstage"] = {
                "images": [],
                "audio": [],
            }
            self._registry["dressing_room"] = {
                "images": [],
                "audio": [],
            }
            self._registry["prop_room"] = {
                "images": [],
                "audio": [],
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
                    if self._file_exists(img_path):
                        try:
                            renpy.image(img_name, img_path)
                            self._loaded_images[img_name] = img_path
                        except:
                            pass
                    else:
                        self._loaded_images[img_name] = img_path
            for audio_path in resources.get("audio", []):
                if audio_path not in self._loaded_audio:
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
