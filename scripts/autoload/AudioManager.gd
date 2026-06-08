extends Node
## 音效管理器 - 背景音乐与音效播放控制

var _music_players: Dictionary = {}
var _sfx_pool: Array = []
const SFX_POOL_SIZE := 16

var _current_music: AudioStreamPlayer = null
var _music_fade_tween: Tween = null

var _sfx_cache: Dictionary = {}
var _music_cache: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_audio_buses()
	_create_sfx_pool()
	_connect_events()
	_preload_audio()

func _setup_audio_buses() -> void:
	if AudioServer.get_bus_count() < 2:
		AudioServer.set_bus_count(3)
	if AudioServer.get_bus_name(0) != "Master":
		AudioServer.set_bus_name(0, "Master")
	if AudioServer.get_bus_count() > 1 and AudioServer.get_bus_name(1) != "Music":
		AudioServer.set_bus_name(1, "Music")
		AudioServer.set_bus_send(1, "Master", 0)
	if AudioServer.get_bus_count() > 2 and AudioServer.get_bus_name(2) != "SFX":
		AudioServer.set_bus_name(2, "SFX")
		AudioServer.set_bus_send(2, "Master", 0)

func _create_sfx_pool() -> void:
	for i in SFX_POOL_SIZE:
		var player := AudioStreamPlayer.new()
		player.bus = "SFX"
		player.name = "SfxPool_%d" % i
		add_child(player)
		_sfx_pool.append(player)

func _connect_events() -> void:
	EventBus.sfx_play.connect(_on_sfx_play)
	EventBus.music_play.connect(_on_music_play)
	EventBus.game_paused.connect(_on_paused)
	EventBus.game_resumed.connect(_on_resumed)

func _preload_audio() -> void:
	_sfx_cache = {
		"scan_start": _create_tone(880, 0.05, 0.2),
		"scan_progress": _create_tone(660, 0.03, 0.15),
		"scan_complete": _create_tone_sequence([880, 1100, 1320], 0.1, 0.2),
		"scan_cancel": _create_tone(220, 0.15, 0.3, true),
		"fix_complete": _create_tone_sequence([523, 659, 784, 1047], 0.08, 0.25),
		"checkpoint": _create_tone_sequence([440, 554, 659], 0.15, 0.3),
		"caught": _create_tone_sequence([196, 175, 156, 131], 0.12, 0.4),
		"alert": _create_tone(880, 0.1, 0.35, true),
		"step": _create_noise(0.03, 0.08),
		"step_crouch": _create_noise(0.02, 0.04),
		"energy_low": _create_tone(330, 0.2, 0.2, true),
		"menu_move": _create_tone(520, 0.02, 0.15),
		"menu_confirm": _create_tone_sequence([523, 784], 0.05, 0.2),
		"menu_cancel": _create_tone_sequence([392, 330], 0.05, 0.2),
		"noise_alert": _create_tone(700, 0.08, 0.25),
		"detected": _create_tone_sequence([800, 1000], 0.1, 0.35),
	}
	_music_cache = {
		"menu": _create_ambient_music(220.0, 10.0),
		"tutorial": _create_ambient_music(261.63, 8.0),
		"level_level_01": _create_ambient_music(246.94, 12.0),
		"victory": _create_tone_sequence([523, 659, 784, 1047, 1319], 0.15, 0.3),
	}

func _create_tone(freq: float, duration: float, volume: float, dissonant: bool = false) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	for i in total_samples:
		var t := float(i) / sample_rate
		var envelope: float = 1.0
		var attack := 0.01
		var release := 0.02
		if t < attack:
			envelope = t / attack
		elif t > duration - release:
			envelope = (duration - t) / release
		var sample_val: float
		if dissonant:
			sample_val = sin(2.0 * PI * freq * t) * 0.5 + sin(2.0 * PI * freq * 1.5 * t) * 0.3
		else:
			sample_val = sin(2.0 * PI * freq * t)
		sample_val *= envelope * volume
		var sample_i16 := int(clamp(sample_val, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample_i16 & 0xFF
		data[i * 2 + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = data
	return stream

func _create_tone_sequence(frequencies: Array, note_duration: float, volume: float) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_duration := len(frequencies) * note_duration
	var total_samples := int(sample_rate * total_duration)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	for n in len(frequencies):
		var freq: float = frequencies[n]
		for i in int(sample_rate * note_duration):
			var global_i := n * int(sample_rate * note_duration) + i
			if global_i * 2 >= data.size():
				break
			var t := float(i) / sample_rate
			var envelope: float = 1.0
			var attack := 0.01
			var release := 0.03
			if t < attack:
				envelope = t / attack
			elif t > note_duration - release:
				envelope = (note_duration - t) / release
			var sample_val := sin(2.0 * PI * freq * t) * envelope * volume
			var sample_i16 := int(clamp(sample_val, -1.0, 1.0) * 32767.0)
			data[global_i * 2] = sample_i16 & 0xFF
			data[global_i * 2 + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = data
	return stream

func _create_noise(duration: float, volume: float) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	var rand := RandomNumberGenerator.new()
	rand.seed = Time.get_unix_time_from_system()
	for i in total_samples:
		var t := float(i) / sample_rate
		var envelope: float = 1.0
		if t < 0.005:
			envelope = t / 0.005
		elif t > duration - 0.005:
			envelope = (duration - t) / 0.005
		var sample_val := (rand.randf() * 2.0 - 1.0) * envelope * volume
		var sample_i16 := int(clamp(sample_val, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample_i16 & 0xFF
		data[i * 2 + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = data
	return stream

func _create_ambient_music(base_freq: float, duration: float) -> AudioStreamWAV:
	var sample_rate := 44100
	var total_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(total_samples * 2)
	var frequencies := [base_freq, base_freq * 1.25, base_freq * 1.5, base_freq * 2.0]
	for i in total_samples:
		var t := float(i) / sample_rate
		var slow_lfo := sin(2.0 * PI * 0.1 * t)
		var envelope := 0.5 + 0.3 * sin(2.0 * PI * 0.05 * t)
		var sample_val: float = 0.0
		for freq in frequencies:
			var detune := 1.0 + slow_lfo * 0.005
			sample_val += sin(2.0 * PI * freq * detune * t) * 0.08
		sample_val *= envelope
		var sample_i16 := int(clamp(sample_val, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample_i16 & 0xFF
		data[i * 2 + 1] = (sample_i16 >> 8) & 0xFF
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = false
	stream.data = data
	return stream

func play_sfx(sound_name: String, volume_db: float = 0.0) -> void:
	if not _sfx_cache.has(sound_name):
		push_warning("未找到音效：%s" % sound_name)
		return
	var player: AudioStreamPlayer = _get_free_sfx_player()
	if player:
		player.stream = _sfx_cache[sound_name]
		player.volume_db = volume_db
		player.play()

func play_music(track_name: String, fade_duration: float = 1.0) -> void:
	var music_key := track_name
	if not _music_cache.has(music_key):
		music_key = "menu"
	if _current_music and _current_music.stream == _music_cache.get(music_key, null):
		if not _current_music.playing:
			_current_music.play()
		return
	if _music_fade_tween:
		_music_fade_tween.kill()
		_music_fade_tween = null
	if _current_music:
		var old_music := _current_music
		_music_fade_tween = create_tween()
		_music_fade_tween.tween_property(old_music, "volume_db", -60.0, fade_duration)
		_music_fade_tween.tween_callback(old_music.stop.bind())
	if not _music_players.has("current"):
		var mp := AudioStreamPlayer.new()
		mp.bus = "Music"
		mp.name = "MusicPlayer_Current"
		add_child(mp)
		_music_players["current"] = mp
	_current_music = _music_players["current"]
	_current_music.stream = _music_cache[music_key]
	_current_music.volume_db = -60.0
	_current_music.play()
	var tween := create_tween()
	tween.tween_property(_current_music, "volume_db", linear_to_db_for_volume(SaveManager.get_setting("music_volume")), fade_duration)

func stop_music(fade_duration: float = 1.0) -> void:
	if _current_music and _current_music.playing:
		if _music_fade_tween:
			_music_fade_tween.kill()
		_music_fade_tween = create_tween()
		_music_fade_tween.tween_property(_current_music, "volume_db", -60.0, fade_duration)
		_music_fade_tween.tween_callback(_current_music.stop.bind())

func _get_free_sfx_player() -> AudioStreamPlayer:
	for player in _sfx_pool:
		if not player.playing:
			return player
	var new_player := AudioStreamPlayer.new()
	new_player.bus = "SFX"
	new_player.name = "SfxPool_Dyn_%d" % _sfx_pool.size()
	add_child(new_player)
	_sfx_pool.append(new_player)
	return new_player

func linear_to_db_for_volume(linear: float) -> float:
	if linear <= 0.0:
		return -80.0
	return 20.0 * log(linear) / log(10.0)

func _on_sfx_play(sound: String) -> void:
	play_sfx(sound)

func _on_music_play(track: String) -> void:
	play_music(track)

func _on_paused() -> void:
	if _current_music:
		var tween := create_tween()
		tween.tween_property(_current_music, "volume_db", -40.0, 0.3)

func _on_resumed() -> void:
	if _current_music:
		var tween := create_tween()
		tween.tween_property(_current_music, "volume_db", linear_to_db_for_volume(SaveManager.get_setting("music_volume")), 0.3)
