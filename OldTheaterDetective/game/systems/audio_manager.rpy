init python:

    class AudioManager:

        def __init__(self):
            self._bgm_registry = {}
            self._sfx_registry = {}
            self._current_bgm = None
            self._active_sfx = {}
            self._volumes = {
                "bgm": 1.0,
                "sfx": 1.0,
                "ambience": 1.0,
            }
            self._register_defaults()

        def _register_defaults(self):
            self._bgm_registry["lobby"] = "audio/bgm/theater_lobby.ogg"
            self._bgm_registry["stage"] = "audio/bgm/theater_stage.ogg"
            self._bgm_registry["backstage"] = "audio/bgm/theater_backstage.ogg"
            self._bgm_registry["dressing_room"] = "audio/bgm/theater_dressing.ogg"
            self._bgm_registry["prop_room"] = "audio/bgm/theater_prop_room.ogg"
            self._bgm_registry["investigation"] = "audio/bgm/investigation_tense.ogg"
            self._bgm_registry["reveal"] = "audio/bgm/reveal_dramatic.ogg"

            self._sfx_registry["door_open"] = "audio/sfx/door_open.ogg"
            self._sfx_registry["door_close"] = "audio/sfx/door_close.ogg"
            self._sfx_registry["footstep"] = "audio/sfx/footstep.ogg"
            self._sfx_registry["paper_rustle"] = "audio/sfx/paper_rustle.ogg"
            self._sfx_registry["clock_tick"] = "audio/sfx/clock_tick.ogg"
            self._sfx_registry["gasp"] = "audio/sfx/gasp.ogg"
            self._sfx_registry["thunder"] = "audio/sfx/thunder.ogg"

        def register_bgm(self, scene_id, track_path):
            self._bgm_registry[scene_id] = track_path

        def register_sfx(self, name, file_path):
            self._sfx_registry[name] = file_path

        def play_bgm(self, track, fade=1.0):
            if track in self._bgm_registry:
                track_path = self._bgm_registry[track]
            else:
                track_path = track
            renpy.music.play(track_path, fadein=fade, loop=True)
            self._current_bgm = track

        def stop_bgm(self, fade=1.0):
            renpy.music.stop(fadeout=fade)
            self._current_bgm = None

        def play_sfx(self, name, loop=False):
            if name not in self._sfx_registry:
                return
            file_path = self._sfx_registry[name]
            channel_name = "sfx_" + name
            if loop:
                renpy.sound.play(file_path, loop=True)
            else:
                renpy.sound.play(file_path, loop=False)
            self._active_sfx[name] = channel_name

        def stop_sfx(self, name):
            if name in self._active_sfx:
                renpy.sound.stop()
                del self._active_sfx[name]

        def set_volume(self, category, volume):
            volume = max(0.0, min(1.0, volume))
            if category == "bgm":
                self._volumes["bgm"] = volume
                renpy.music.set_volume(volume)
            elif category == "sfx":
                self._volumes["sfx"] = volume
                renpy.sound.set_volume(volume)
            elif category == "ambience":
                self._volumes["ambience"] = volume

        def get_current_bgm(self):
            return self._current_bgm

        def get_volume(self, category):
            return self._volumes.get(category, 1.0)

        def play_scene_bgm(self, scene_id, fade=1.0):
            if scene_id in self._bgm_registry:
                self.play_bgm(scene_id, fade=fade)

    store.audio_manager = AudioManager()
