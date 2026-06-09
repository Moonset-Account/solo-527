extends Node

var _players: Dictionary = {}
var _master_bus_idx: int = 0
var _sfx_bus_idx: int = 0
var _music_bus_idx: int = 0
var _sound_enabled: bool = true

func _ready():
	_safe_setup_buses()
	AudioServer.set_bus_volume_db(_master_bus_idx, _volume_to_db(SaveManager.settings.get("master_volume", 0.8)))
	AudioServer.set_bus_volume_db(_sfx_bus_idx, _volume_to_db(SaveManager.settings.get("sfx_volume", 0.8)))
	AudioServer.set_bus_volume_db(_music_bus_idx, _volume_to_db(SaveManager.settings.get("music_volume", 0.6)))
	DebugLog.info("音频管理器初始化完成")

func _safe_setup_buses():
	_master_bus_idx = AudioServer.get_bus_index("Master")
	if _master_bus_idx == -1:
		_master_bus_idx = 0
	var sfx_idx = AudioServer.get_bus_index("SFX")
	if sfx_idx == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.get_bus_count() - 1, "SFX")
		_sfx_bus_idx = AudioServer.get_bus_count() - 1
	else:
		_sfx_bus_idx = sfx_idx
	var music_idx = AudioServer.get_bus_index("Music")
	if music_idx == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.get_bus_count() - 1, "Music")
		_music_bus_idx = AudioServer.get_bus_count() - 1
	else:
		_music_bus_idx = music_idx

func _volume_to_db(volume: float) -> float:
	if volume <= 0.0:
		return -80.0
	return linear_to_db(max(0.0001, volume))

func play_sfx(sound: String, pitch: float = 1.0, volume: float = 1.0):
	if not _sound_enabled:
		return
	var player = AudioStreamPlayer.new()
	if _sfx_bus_idx >= 0 and _sfx_bus_idx < AudioServer.get_bus_count():
		player.bus = "SFX"
	player.volume_db = _volume_to_db(volume)
	player.pitch_scale = clamp(pitch, 0.5, 2.0)
	add_child(player)
	var stream = load("res://assets/sfx/%s.wav" % sound)
	if stream:
		player.stream = stream
		player.play()
		player.finished.connect(func():
			if is_instance_valid(player):
				player.queue_free())
	else:
		player.queue_free()

func play_music(music_name: String, loop: bool = true, volume: float = 1.0):
	stop_music()
	if not _sound_enabled:
		return
	var player = AudioStreamPlayer.new()
	if _music_bus_idx >= 0 and _music_bus_idx < AudioServer.get_bus_count():
		player.bus = "Music"
	player.volume_db = _volume_to_db(volume)
	add_child(player)
	var stream = load("res://assets/music/%s.wav" % music_name)
	if stream:
		if stream is AudioStreamWAV:
			stream.loop_mode = AudioStreamWAV.LOOP_FORWARD if loop else AudioStreamWAV.LOOP_DISABLED
		player.stream = stream
		player.play()
		player.finished.connect(func():
			if not loop and is_instance_valid(player):
				player.queue_free())
		_players["music"] = player
	else:
		player.queue_free()

func stop_music():
	if _players.has("music") and is_instance_valid(_players["music"]):
		_players["music"].stop()
		_players["music"].queue_free()
		_players.erase("music")

func set_master_volume(volume: float):
	var v = clamp(volume, 0.0, 1.0)
	SaveManager.settings["master_volume"] = v
	AudioServer.set_bus_volume_db(_master_bus_idx, _volume_to_db(v))
	SaveManager.save_settings()

func set_sfx_volume(volume: float):
	var v = clamp(volume, 0.0, 1.0)
	SaveManager.settings["sfx_volume"] = v
	AudioServer.set_bus_volume_db(_sfx_bus_idx, _volume_to_db(v))
	SaveManager.save_settings()

func set_music_volume(volume: float):
	var v = clamp(volume, 0.0, 1.0)
	SaveManager.settings["music_volume"] = v
	AudioServer.set_bus_volume_db(_music_bus_idx, _volume_to_db(v))
	SaveManager.save_settings()

func set_fullscreen(enabled: bool):
	SaveManager.settings["fullscreen"] = enabled
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN if enabled else DisplayServer.WINDOW_MODE_WINDOWED)
	SaveManager.save_settings()
