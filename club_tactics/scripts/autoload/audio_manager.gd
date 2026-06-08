extends Node
class_name AudioManager

var _bgm_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _sfx_index: int = 0
var master_volume: float = 1.0
var bgm_volume: float = 0.7
var sfx_volume: float = 1.0

func _ready() -> void:
	_bgm_player = AudioStreamPlayer.new()
	add_child(_bgm_player)
	_bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)
	for i: int in range(8):
		var player: AudioStreamPlayer = AudioStreamPlayer.new()
		add_child(player)
		player.volume_db = linear_to_db(sfx_volume * master_volume)
		_sfx_players.append(player)

func play_bgm(stream: AudioStream, fade_time: float = 1.0) -> void:
	if _bgm_player.playing:
		var tween: Tween = create_tween()
		tween.tween_property(_bgm_player, "volume_db", -80.0, fade_time)
		await tween.finished
	_bgm_player.stream = stream
	_bgm_player.volume_db = -80.0
	_bgm_player.play()
	var tween_in: Tween = create_tween()
	tween_in.tween_property(_bgm_player, "volume_db", linear_to_db(bgm_volume * master_volume), fade_time)

func stop_bgm(fade_time: float = 1.0) -> void:
	if not _bgm_player.playing:
		return
	var tween: Tween = create_tween()
	tween.tween_property(_bgm_player, "volume_db", -80.0, fade_time)
	await tween.finished
	_bgm_player.stop()

func play_sfx(stream: AudioStream, volume_db: float = 0.0) -> void:
	var player: AudioStreamPlayer = _sfx_players[_sfx_index]
	player.stream = stream
	player.volume_db = volume_db + linear_to_db(sfx_volume * master_volume)
	player.play()
	_sfx_index = (_sfx_index + 1) % _sfx_players.size()

func set_master_volume(v: float) -> void:
	master_volume = clampf(v, 0.0, 1.0)
	_bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)
	for player: AudioStreamPlayer in _sfx_players:
		player.volume_db = linear_to_db(sfx_volume * master_volume)

func set_bgm_volume(v: float) -> void:
	bgm_volume = clampf(v, 0.0, 1.0)
	_bgm_player.volume_db = linear_to_db(bgm_volume * master_volume)

func set_sfx_volume(v: float) -> void:
	sfx_volume = clampf(v, 0.0, 1.0)
	for player: AudioStreamPlayer in _sfx_players:
		player.volume_db = linear_to_db(sfx_volume * master_volume)
