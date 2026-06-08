extends Node

var _music_player: AudioStreamPlayer = null
var _sfx_players: Array[AudioStreamPlayer] = []
var _max_sfx_players: int = 8
var _music_volume: float = 0.8
var _sfx_volume: float = 1.0
var _music_fade_duration: float = 1.0

func _ready() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	add_child(_music_player)
	for i in _max_sfx_players:
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		_sfx_players.append(player)

func play_music(stream: AudioStream, fade: bool = true) -> void:
	if _music_player.playing and _music_player.stream == stream:
		return
	if fade and _music_player.playing:
		var tween = create_tween()
		tween.tween_property(_music_player, "volume_db", -80.0, _music_fade_duration)
		tween.tween_callback(func(): _start_music(stream))
		tween.tween_property(_music_player, "volume_db", linear_to_db(_music_volume), _music_fade_duration)
	else:
		_start_music(stream)

func _start_music(stream: AudioStream) -> void:
	_music_player.stream = stream
	_music_player.volume_db = linear_to_db(_music_volume)
	_music_player.play()

func stop_music(fade: bool = true) -> void:
	if fade:
		var tween = create_tween()
		tween.tween_property(_music_player, "volume_db", -80.0, _music_fade_duration)
		tween.tween_callback(_music_player.stop)
	else:
		_music_player.stop()

func play_sfx(stream: AudioStream) -> void:
	for player in _sfx_players:
		if not player.playing:
			player.stream = stream
			player.volume_db = linear_to_db(_sfx_volume)
			player.play()
			return
	var player = _sfx_players[0]
	player.stream = stream
	player.volume_db = linear_to_db(_sfx_volume)
	player.play()

func set_music_volume(volume: float) -> void:
	_music_volume = clampf(volume, 0.0, 1.0)
	_music_player.volume_db = linear_to_db(_music_volume)

func set_sfx_volume(volume: float) -> void:
	_sfx_volume = clampf(volume, 0.0, 1.0)
	for player in _sfx_players:
		if player.playing:
			player.volume_db = linear_to_db(_sfx_volume)

func get_music_volume() -> float:
	return _music_volume

func get_sfx_volume() -> float:
	return _sfx_volume
