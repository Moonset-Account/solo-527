extends Node

signal volume_changed(bus: String, value: float)

var _music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _music_volume_db: float = 0.0
var _sfx_volume_db: float = 0.0

const MAX_SFX_PLAYERS: int = 8
const SETTINGS_PATH: String = "user://audio_settings.json"
const MUSIC_BUS: String = "Music"
const SFX_BUS: String = "SFX"


func _ready() -> void:
	_ensure_bus(MUSIC_BUS)
	_ensure_bus(SFX_BUS)
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = MUSIC_BUS
	add_child(_music_player)

	for i in range(MAX_SFX_PLAYERS):
		var player := AudioStreamPlayer.new()
		player.bus = SFX_BUS
		add_child(player)
		_sfx_players.append(player)

	_load_settings()


func _ensure_bus(bus_name: String) -> void:
	var idx = AudioServer.get_bus_index(bus_name)
	if idx == -1:
		AudioServer.add_bus()
		idx = AudioServer.bus_count - 1
		AudioServer.set_bus_name(idx, bus_name)
		AudioServer.set_bus_volume_db(idx, 0.0)


func play_music(stream: AudioStream) -> void:
	if _music_player.playing and _music_player.stream == stream:
		return
	_music_player.stream = stream
	_music_player.play()


func stop_music() -> void:
	_music_player.stop()


func play_sfx(stream: AudioStream) -> void:
	for player in _sfx_players:
		if not player.playing:
			player.stream = stream
			player.play()
			return


func set_music_volume(db: float) -> void:
	_music_volume_db = db
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MUSIC_BUS), db)
	volume_changed.emit(MUSIC_BUS, db)
	_save_settings()


func set_sfx_volume(db: float) -> void:
	_sfx_volume_db = db
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(SFX_BUS), db)
	volume_changed.emit(SFX_BUS, db)
	_save_settings()


func get_music_volume() -> float:
	return _music_volume_db


func get_sfx_volume() -> float:
	return _sfx_volume_db


func _load_settings() -> void:
	if not FileAccess.file_exists(SETTINGS_PATH):
		return
	var file := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if file == null:
		return
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	if err != OK:
		return
	var data = json.data
	if data is Dictionary:
		_music_volume_db = data.get("music_volume_db", 0.0)
		_sfx_volume_db = data.get("sfx_volume_db", 0.0)
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index(MUSIC_BUS), _music_volume_db)
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index(SFX_BUS), _sfx_volume_db)


func _save_settings() -> void:
	var data := {
		"music_volume_db": _music_volume_db,
		"sfx_volume_db": _sfx_volume_db,
	}
	var file := FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify(data, "\t"))
