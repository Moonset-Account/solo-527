extends Node
## 音频管理器 - 处理BGM/SFX播放，按设置调节音量

var _music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
const MAX_SFX_PLAYERS := 8

var _sfx_cache: Dictionary = {}
var _music_cache: Dictionary = {}

func _ready() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	add_child(_music_player)
	for i in MAX_SFX_PLAYERS:
		var p: AudioStreamPlayer = AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_sfx_players.append(p)
	_connect_events()

func _connect_events() -> void:
	GameEvents.sfx_requested.connect(_on_sfx_requested)

func _on_sfx_requested(sfx_name: String, volume_db: float = 0.0) -> void:
	play_sfx(sfx_name, volume_db)

func play_sfx(sfx_name: String, volume_db: float = 0.0) -> void:
	var stream: AudioStream = _get_sfx_stream(sfx_name)
	if stream == null:
		return
	var player: AudioStreamPlayer = _get_idle_sfx_player()
	if player:
		player.stream = stream
		player.volume_db = volume_db
		player.play()

func play_music(music_name: String, fade_time: float = 1.0) -> void:
	var stream: AudioStream = _get_music_stream(music_name)
	if stream == null:
		return
	create_tween().tween_property(_music_player, "volume_db", -80.0, fade_time).finished.connect(func():
		_music_player.stream = stream
		_music_player.play()
		var target_db: float = 0.0
		create_tween().tween_property(_music_player, "volume_db", target_db, fade_time)
	)

func stop_music(fade_time: float = 1.0) -> void:
	create_tween().tween_property(_music_player, "volume_db", -80.0, fade_time).finished.connect(func():
		_music_player.stop()
	)

func _get_idle_sfx_player() -> AudioStreamPlayer:
	for p in _sfx_players:
		if not p.playing:
			return p
	return _sfx_players[0]

func _get_sfx_stream(name: String) -> AudioStream:
	if name in _sfx_cache:
		return _sfx_cache[name]
	var path: String = "res://assets/audio/sfx/%s.ogg" % name
	if ResourceLoader.exists(path):
		_sfx_cache[name] = load(path)
		return _sfx_cache[name]
	return _generate_placeholder_sfx(name)

func _get_music_stream(name: String) -> AudioStream:
	if name in _music_cache:
		return _music_cache[name]
	var path: String = "res://assets/audio/music/%s.ogg" % name
	if ResourceLoader.exists(path):
		_music_cache[name] = load(path)
		return _music_cache[name]
	return null

func _generate_placeholder_sfx(name: String) -> AudioStream:
	var sr: int = 44100
	var dur: float = 0.15
	var samples: int = int(sr * dur)
	var data: PackedVector2Array = PackedVector2Array()
	data.resize(samples)
	var freq: float = 440.0
	match name:
		"card_play": freq = 660.0
		"budget_gain": freq = 880.0
		"budget_spend": freq = 220.0
		"exhibit_complete": freq = 1046.0
		"turn_start": freq = 523.0
		"turn_end": freq = 392.0
		"battle_win": freq = 784.0
		"battle_lose": freq = 196.0
		_: freq = 440.0
	for i in samples:
		var t: float = float(i) / float(sr)
		var env: float = pow(1.0 - t / dur, 2.0)
		var s: float = sin(2.0 * PI * freq * t) * env * 0.3
		data[i] = Vector2(s, s)
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sr
	wav.stereo = true
	var pcm: PackedByteArray = PackedByteArray()
	for v in data:
		for ch in [v.x, v.y]:
			var val: int = int(clamp(ch, -1.0, 1.0) * 32767.0)
			pcm.append(val & 0xFF)
			pcm.append((val >> 8) & 0xFF)
	wav.data = pcm
	_sfx_cache[name] = wav
	return wav
