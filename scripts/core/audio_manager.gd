extends Node

const SFX_POOL_SIZE: int = 8

var _sound_registry: Dictionary = {}
var _sfx_players: Array[AudioStreamPlayer2D] = []
var _music_player: AudioStreamPlayer
var _music_tween: Tween
var _current_sfx_index: int = 0

func _ready() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	add_child(_music_player)
	for i in SFX_POOL_SIZE:
		var player: AudioStreamPlayer2D = AudioStreamPlayer2D.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)

func register_sound(name: String, path: String) -> void:
	_sound_registry[name] = path

func register_sounds(sounds: Dictionary) -> void:
	for key in sounds:
		_sound_registry[key] = sounds[key]

func play_sfx(name: String, position: Vector2 = Vector2.ZERO) -> void:
	if not _sound_registry.has(name):
		push_warning("AudioManager: SFX '%s' not registered" % name)
		return
	var stream: AudioStream = load(_sound_registry[name])
	if not stream:
		return
	var player: AudioStreamPlayer2D = _sfx_players[_current_sfx_index]
	player.stream = stream
	player.position = position
	player.play()
	_current_sfx_index = (_current_sfx_index + 1) % SFX_POOL_SIZE

func play_music(name: String) -> void:
	if not _sound_registry.has(name):
		push_warning("AudioManager: Music '%s' not registered" % name)
		return
	var stream: AudioStream = load(_sound_registry[name])
	if not stream:
		return
	if _music_player.playing and _music_player.stream == stream:
		return
	if _music_player.playing:
		fade_out_music(1.0)
		await _music_tween.finished
	_music_player.stream = stream
	_music_player.volume_db = -40.0
	_music_player.play()
	fade_in_music(1.0)

func stop_music() -> void:
	_music_player.stop()

func fade_in_music(duration: float = 1.0) -> void:
	if _music_tween:
		_music_tween.kill()
	_music_tween = create_tween()
	_music_tween.tween_property(_music_player, "volume_db", 0.0, duration)

func fade_out_music(duration: float = 1.0) -> void:
	if _music_tween:
		_music_tween.kill()
	_music_tween = create_tween()
	_music_tween.tween_property(_music_player, "volume_db", -40.0, duration)
	_music_tween.tween_callback(_music_player.stop)

func set_bus_volume(bus: String, volume_db: float) -> void:
	var idx: int = AudioServer.get_bus_index(bus)
	if idx >= 0:
		AudioServer.set_bus_volume_db(idx, volume_db)
